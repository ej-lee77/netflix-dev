import { create } from 'zustand';
import { collection, query, where, orderBy, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { ReviewDocument, CommunityStore } from '@/types/community';
import { useAuthStore } from './useAuthStore';

export const useCommunityStore = create<CommunityStore>((set) => ({
  reviews: [],

  fetchUserReviews: async () => {
    // 1. 상태 스토어에서 정보 추출
    const { user, currentProfile } = useAuthStore.getState();
    
    // 유저 로그인이 안 되어 있거나 프로필이 선택되지 않았다면 중단
    if (!user?.userId || !currentProfile) return;

    try {
      // 2. profileId를 키로 사용하여 해당 유저의 리뷰만 조회
      // 방식 A: 독립된 컬렉션에서 쿼리 (추천)
      const q = query(
        collection(db, "reviews"),
        where("profileId", "==", currentProfile.id), // 프로필 ID 기준
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ 
        reviewId: doc.id, 
        ...doc.data() 
      } as ReviewDocument));
      
      set({ reviews: data });
    } catch (error) {
      console.error("리뷰 로딩 실패:", error);
    }
  },

  addReview: async (newReviewData: Omit<ReviewDocument, "reviewId" | "profileId" | "createdAt">) => {
    const { currentProfile } = useAuthStore.getState();
    if (!currentProfile) return;

    // 1. 서버에 저장할 데이터 객체 생성
    const newReview: ReviewDocument = {
      ...newReviewData,
      reviewId: "temp-id", // 서버에서 생성되기 전 임시 ID
      profileId: currentProfile.id,
      createdAt: new Date().toISOString(),
    };

    try {
      // 2. 파이어베이스에 추가 (docRef를 받아 실제 문서 ID 확보)
      const docRef = await addDoc(collection(db, "reviews"), newReview);
      
      // 실제 서버에서 생성된 ID로 업데이트
      const savedReview = { ...newReview, reviewId: docRef.id };

      // 3. 서버 호출 없이 상태(reviews) 배열에 바로 추가
      // (기존 리뷰들 앞에 새 리뷰를 붙임)
      set((state) => ({
        reviews: [savedReview, ...state.reviews]
      }));

    } catch (error) {
      console.error("리뷰 작성 에러:", error);
    }
  }
}));