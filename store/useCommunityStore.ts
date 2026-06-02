import { create } from 'zustand';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { ReviewDocument, ReviewStore } from '@/types/community';

export const useCommunityStore = create<ReviewStore>((set) => ({
  reviews: [],
  movieMap: {},
  
  fetchUserReviews: async (userId: string) => {
    // 1. 리뷰 데이터 페칭
    const q = query(
      collection(db, "reviews"),
      where("userId", "==", userId),
      where("isDelete", "==", false),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map(doc => ({ reviewId: doc.id, ...doc.data() } as ReviewDocument));
    
    // 2. 관련 영화 데이터 페칭 (배치 처리)
    const uniqueIds = [...new Set(reviews.map(r => r.videoId))];
    const moviePromises = uniqueIds.map(id => fetchMovieDataById(id)); // 별도 API 호출 함수
    const movies = await Promise.all(moviePromises);
    
    const movieMap = movies.reduce((acc, m) => ({ ...acc, [m.id]: m }), {});
    
    set({ reviews, movieMap });
  }
}));