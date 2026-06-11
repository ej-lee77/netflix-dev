import { create } from 'zustand';
import { collection, getDocs, arrayUnion, doc, getDoc, writeBatch, runTransaction, type Transaction } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { ReviewDocument, CommunityStore } from '@/types/community';
import { useAuthStore } from './useAuthStore';
import { BadgeList } from '@/types/auth';

export const getReviewCreatedBadge = (currentBadges: BadgeList): BadgeList => {
  const updatedEarnedBadges = [...currentBadges.earnedBadges];
  let newEquipped = currentBadges.equippedBadges;

  // 첫 리뷰 등록 뱃지 체크
  if (!updatedEarnedBadges.some(b => b.id === "social_reviewer")) {
    updatedEarnedBadges.push({
      id: "social_reviewer",
      progress: 1,
      isComplete: true
    });
    if (!newEquipped) newEquipped = "social_reviewer";
  }

  return {
    earnedBadges: updatedEarnedBadges,
    equippedBadges: newEquipped
  };
};


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
        const reviewList = (data.reviews || []) as ReviewDocument[];
        
        // 최신순으로 정렬 후 상태 업데이트
        const sortedReviews = reviewList.sort((a, b) => 
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

  fetchAllReviews: async () => {
    try {
      const snapshot = await getDocs(collection(db, "videoReviews"));
      const reviewMap = new Map<string, ReviewDocument>();

      snapshot.docs.forEach((reviewDoc) => {
        const data = reviewDoc.data();
        const reviewList = Array.isArray(data.reviews) ? data.reviews : [];

        reviewList.forEach((review: ReviewDocument) => {
          if (!review?.reviewId || !review?.videoId) return;
          reviewMap.set(`${review.videoId}#${review.reviewId}`, review);
        });
      });

      const sortedReviews = Array.from(reviewMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      set({ reviews: sortedReviews });
    } catch (error) {
      console.error("전체 리뷰 수집 에러:", error);
      set({ reviews: [] });
    }
  },

  fetchVideoReviews: async (videoId: string) => {
    try {
      // videoId를 문서 ID로 가지는 문서를 직접 조회
      const docRef = doc(db, "videoReviews", videoId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const reviewList = (data.reviews || []) as ReviewDocument[];
        
        // 클라이언트 측에서 최신순 정렬 (배열은 쿼리로 정렬 불가)
        const sortedReviews = reviewList.sort((a, b) => 
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

  fetchUserReviewsById: async (targetUserId: string) => {
    if (!targetUserId) return null;

    try {
      const docRef = doc(db, "userReviews", targetUserId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const reviewList = data.reviews || [];
        
        // 최신순으로 정렬
        const sortedReviews = reviewList.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        return sortedReviews;
      } else {
        // 데이터가 없을 경우 빈 배열 반환
        return [];
      }
    } catch (error) {
      console.error(`${targetUserId} 유저 리뷰 페칭 에러:`, error);
      return null;
    }
  },

  addReview: async (newReviewData) => {
      const { user, currentProfile } = useAuthStore.getState();
      if (!user?.userId || !currentProfile) return;

      // 1. 유저 데이터 및 프로필 가져오기 (뱃지 업데이트를 위해 필요)
      const userDocRef = doc(db, "users", user.userId);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) return;

      const userData = userDocSnap.data();
      const profiles = userData.profile || [];
      const profileIndex = profiles.findIndex((p:any) => p.id === currentProfile.id);
      if (profileIndex === -1) return;

      // 2. 뱃지 업데이트
      const updatedProfiles = [...profiles];
      const targetProfile = { ...updatedProfiles[profileIndex] };
      
      targetProfile.badges = getReviewCreatedBadge(
          targetProfile.badges || { earnedBadges: [], equippedBadges: "" }
      );
      updatedProfiles[profileIndex] = targetProfile;

      // 3. 리뷰 데이터 구성
      const newReview = {
        reviewId: crypto.randomUUID(),
        ...newReviewData,
        userId: user.userId,
        profileId: currentProfile.id,
        nickname: currentProfile.nickname,
        createdAt: new Date().toISOString(),
        likesCount: 0,
        reportsCount: 0,
      };// 기존 리뷰 생성 로직 동일

      // 4. Batch 작업 구성
      const batch = writeBatch(db);
      
      // 유저 리뷰 추가
      const userReviewDocRef = doc(db, "userReviews", user.userId);
      batch.set(userReviewDocRef, { reviews: arrayUnion(newReview) }, { merge: true });
      
      // 비디오 리뷰 추가
      const videoDocRef = doc(db, "videoReviews", newReviewData.videoId);
      batch.set(videoDocRef, { reviews: arrayUnion(newReview) }, { merge: true });
      
      // 유저 프로필(뱃지 정보) 업데이트
      batch.update(userDocRef, { profile: updatedProfiles });

      useAuthStore.getState().onInitAuth();

      try {
          await batch.commit();
          set((state) => ({ reviews: [newReview, ...state.reviews] }));
      } catch (error) {
          console.error("저장 실패:", error);
      }
  },
  updateReview: async (reviewId, videoId, data) => {
    const { user } = useAuthStore.getState();
    if (!user?.userId) return;

    const userDocRef = doc(db, "userReviews", user.userId);
    const videoDocRef = doc(db, "videoReviews", videoId);
    const updatedAt = new Date().toISOString();

    try {
      const [userDoc, videoDoc] = await Promise.all([
        getDoc(userDocRef),
        getDoc(videoDocRef),
      ]);

      const updateArray = (arr: ReviewDocument[] = []) =>
        arr.map((review) =>
          review.reviewId === reviewId
            ? { ...review, ...data, updatedAt }
            : review,
        );

      const batch = writeBatch(db);
      if (userDoc.exists()) {
        batch.update(userDocRef, { reviews: updateArray(userDoc.data().reviews) });
      }
      if (videoDoc.exists()) {
        batch.update(videoDocRef, { reviews: updateArray(videoDoc.data().reviews) });
      }

      await batch.commit();
      set((state) => ({ reviews: updateArray(state.reviews) }));
    } catch (error) {
      console.error("리뷰 수정 실패:", error);
      throw error;
    }
  },
  deleteReview: async (reviewId, videoId) => {
    const { user } = useAuthStore.getState();
    if (!user?.userId) return;

    const userDocRef = doc(db, "userReviews", user.userId);
    const videoDocRef = doc(db, "videoReviews", videoId);

    try {
      const [userDoc, videoDoc] = await Promise.all([
        getDoc(userDocRef),
        getDoc(videoDocRef),
      ]);

      const removeFromArray = (arr: ReviewDocument[] = []) =>
        arr.filter((review) => review.reviewId !== reviewId);

      const batch = writeBatch(db);
      if (userDoc.exists()) {
        batch.update(userDocRef, { reviews: removeFromArray(userDoc.data().reviews) });
      }
      if (videoDoc.exists()) {
        batch.update(videoDocRef, { reviews: removeFromArray(videoDoc.data().reviews) });
      }

      await batch.commit();
      set((state) => ({ reviews: removeFromArray(state.reviews) }));
    } catch (error) {
      console.error("리뷰 삭제 실패:", error);
      throw error;
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
      const updateArray = (arr: ReviewDocument[] = []) => arr.map((r) => 
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
    const { user, currentProfile } = useAuthStore.getState();
    if (!user?.userId || !currentProfile) return;

    const videoDocRef = doc(db, "videoReviews", videoId);
    const userDocRef = doc(db, "userReviews", user?.userId);

    try {
      await runTransaction(db, async (transaction: Transaction) => {
        // 1. 문서 가져오기
        const videoDoc = await transaction.get(videoDocRef);
        const userDoc = await transaction.get(userDocRef);

        if (!videoDoc.exists()) throw "Video review document does not exist!";
        
        const currentReviews = [...((videoDoc.data().reviews || []) as ReviewDocument[])];
        const rIndex = currentReviews.findIndex((r) => r.reviewId === reviewId);
        if (rIndex === -1) throw "Review not found!";

        // 2. 좋아요 수 계산 (최솟값 0 보장)
        const newLikesCount = Math.max(0, (currentReviews[rIndex].likesCount || 0) + (isLiked ? -1 : 1));

        // 3. videoReviews 데이터 업데이트
        currentReviews[rIndex] = { ...currentReviews[rIndex], likesCount: newLikesCount };
        transaction.update(videoDocRef, { reviews: currentReviews });

        // 4. userReviews 데이터 업데이트 (작성자의 문서도 동일하게 반영)
        if (userDoc.exists()) {
          const userReviews = [...((userDoc.data().reviews || []) as ReviewDocument[])];
          const urIndex = userReviews.findIndex((r) => r.reviewId === reviewId);
          
          if (urIndex !== -1) {
            userReviews[urIndex] = { ...userReviews[urIndex], likesCount: newLikesCount };
            transaction.update(userDocRef, { reviews: userReviews });
          }
        }

        // 5. [중요] 상태 업데이트는 트랜잭션 외부에서 수행
        set({ reviews: currentReviews });
      });
    } catch (error) {
      console.error("좋아요 카운트 업데이트 트랜잭션 실패:", error);
    }
  }
}));
