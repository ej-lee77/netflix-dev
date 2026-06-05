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
  toggleReviewLike: async (reviewId: string, videoId: string) => {
    // 1. Auth 스토어에서 현재 정보를 가져옴
    const { user, currentProfile } = useAuthStore.getState();
    if (!user?.userId || !currentProfile) return;

    const reviewKey = `${videoId}-${reviewId}`;
    const userDocRef = doc(db, "users", user.userId);

    try {
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) return;

      const userData = userDocSnap.data() as UserDocument;
      const profileIndex = userData.profile.findIndex((p) => p.id === currentProfile.id);
      if (profileIndex === -1) return;

      // 2. 데이터 수정 (불변성 유지)
      const updatedProfiles = [...userData.profile];
      const targetCommunity = updatedProfiles[profileIndex].community;
      
      // 주의: 인터페이스 구조에 맞춰 reviews 또는 likedReviewKeys 사용
      const isLiked = targetCommunity.reviews.includes(reviewKey);

      if (isLiked) {
        targetCommunity.reviews = targetCommunity.reviews.filter((k) => k !== reviewKey);
      } else {
        targetCommunity.reviews.push(reviewKey);
      }

      // 3. Firestore 업데이트
      await updateDoc(userDocRef, {
        profile: updatedProfiles
      });

      // 4. Auth 스토어 업데이트 (여기가 핵심!)
      // useAuthStore의 액션을 사용하여 상태를 동기화합니다.
      useAuthStore.getState().onInitAuth();

    } catch (error) {
      console.error("좋아요 토글 실패:", error);
    }
  }
}));