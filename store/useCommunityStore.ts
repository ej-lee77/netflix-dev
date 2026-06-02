import { create } from 'zustand';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { ReviewDocument, CommunityStore } from '@/types/community';

export const useCommunityStore = create<CommunityStore>((set) => ({
  reviews: [],
  
  fetchUserReviews: async (userId: string) => {
    try {
      const q = query(
        collection(db, "reviews"),
        where("userId", "==", userId),
        where("isDelete", "==", false),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ 
        reviewId: doc.id, 
        ...doc.data() 
      } as ReviewDocument));
      
      set({ reviews: data });
    } catch (error) {
      console.error("리뷰 페칭 에러:", error);
    }
  }
}));