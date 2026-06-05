import { create } from 'zustand';
import { collection, query, where, orderBy, getDocs, setDoc,  arrayUnion, doc, getDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { ReviewDocument, CommunityStore } from '@/types/community';
import { useAuthStore } from './useAuthStore';
import { UserDocument } from '@/types/auth';

export const useCommunityStore = create<CommunityStore>((set) => ({
  reviews: [],

  fetchUserReviews: async () => {
    const { user } = useAuthStore.getState();
    if (!user?.userId) return;

    try {
      const docRef = doc(db, "userReviews", user.userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const reviewList = data.reviews || [];
        
        // 최신순으로 정렬 후 상태 업데이트
        const sortedReviews = reviewList.sort((a : any, b : any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        set({ reviews: sortedReviews });
      } else {
        set({ reviews: [] });
      }
    } catch (error) {
      console.error("유저 리뷰 페칭 에러:", error);
    }
  },

  fetchVideoReviews: async (videoId: string) => {
    try {
      // videoId를 문서 ID로 가지는 문서를 직접 조회
      const docRef = doc(db, "videoReviews", videoId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const reviewList = data.reviews || [];
        
        // 클라이언트 측에서 최신순 정렬 (배열은 쿼리로 정렬 불가)
        const sortedReviews = reviewList.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        set({ reviews: sortedReviews });
      } else {
        // 리뷰가 없는 경우 빈 배열로 상태 초기화
        set({ reviews: [] });
      }
    } catch (error) {
      console.error("영상 리뷰 페칭 에러:", error);
    }
  },

  addReview: async (newReviewData) => {
    const { user, currentProfile } = useAuthStore.getState();
    if (!user?.userId || !currentProfile) return;

    const newReview = {
      reviewId: crypto.randomUUID(),
      ...newReviewData,
      profileId: currentProfile.id,
      nickname: currentProfile.nickname,
      createdAt: new Date().toISOString(),
      likesCount: 0,
      reportsCount: 0,
    };

    console.log(newReview);

    const batch = writeBatch(db);

    // 1. 유저별 리뷰 문서 업데이트
    const userDocRef = doc(db, "userReviews", user.userId);
    batch.set(userDocRef, { reviews: arrayUnion(newReview) }, { merge: true });

    // 2. 비디오별 리뷰 문서 업데이트
    const videoDocRef = doc(db, "videoReviews", newReviewData.videoId);
    batch.set(videoDocRef, { reviews: arrayUnion(newReview) }, { merge: true });

    try {
      await batch.commit(); // 두 작업을 한 번에 처리
      
      // 상태 갱신
      set((state) => ({
        reviews: [newReview, ...state.reviews]
      }));
    } catch (error) {
      console.error("동시 저장 실패:", error);
    }
  },
  reportReview: async (reviewId: string, videoId: string) => {
    const { user } = useAuthStore.getState();
    if (!user?.userId) return;

    try {
      const userDocRef = doc(db, "userReviews", user.userId);
      const videoDocRef = doc(db, "videoReviews", videoId);

      const batch = writeBatch(db);

      // 1. 문서 데이터 가져오기
      const [userDoc, videoDoc] = await Promise.all([
        getDoc(userDocRef),
        getDoc(videoDocRef)
      ]);

      // 2. 각 문서의 리뷰 배열 수정 로직
      const updateArray = (arr: any[]) => arr.map(r => 
        r.reviewId === reviewId 
          ? { ...r, reportsCount: (r.reportsCount || 0) + 1 } 
          : r
      );

      // 3. 배치 작업 추가
      if (userDoc.exists()) {
        batch.update(userDocRef, { reviews: updateArray(userDoc.data().reviews) });
      }
      if (videoDoc.exists()) {
        batch.update(videoDocRef, { reviews: updateArray(videoDoc.data().reviews) });
      }

      // 4. 커밋
      await batch.commit();

      // 5. 상태 동기화 (전역 상태의 reviews 배열도 업데이트)
      set((state) => ({
        reviews: updateArray(state.reviews)
      }));

    } catch (error) {
      console.error("신고 처리 중 에러 발생:", error);
      throw error; // 컴포넌트에서 catch하여 알림창 띄우기용
    }
  },
  updateReviewLikeCount: async (videoId: string, reviewId: string, isLiked: boolean) => {
    const reviewDocRef = doc(db, "videoReviews", videoId);
    
    try {
      // 1. 문서 가져오기
      const docSnap = await getDoc(reviewDocRef);
      if (!docSnap.exists()) return;
      
      const data = docSnap.data();
      const currentReviews = [...(data.reviews || [])]; // 불변성 유지를 위해 복사
      
      // 2. 해당 리뷰 인덱스 찾기
      const rIndex = currentReviews.findIndex((r: any) => r.reviewId === reviewId);
      if (rIndex === -1) return;
      
      // 3. 좋아요 수 업데이트 (좋아요 취소 시 -1, 좋아요 시 +1)
      const newLikesCount = (currentReviews[rIndex].likesCount || 0) + (isLiked ? -1 : 1);
    
      // Math.max(0, newLikesCount)를 사용하여 결과값이 최소 0이 되도록 보장합니다.
      currentReviews[rIndex] = {
        ...currentReviews[rIndex],
        likesCount: Math.max(0, newLikesCount) 
      };
      
      // 4. Firestore 업데이트
      await updateDoc(reviewDocRef, { reviews: currentReviews });
      
      // 5. [중요] Zustand 스토어 상태(reviews) 업데이트 -> UI 즉시 반영
      set({ reviews: currentReviews });
      
    } catch (error) {
      console.error("리뷰 카운트 업데이트 실패:", error);
    }
  }
}));