import { create } from "zustand";
import type { WishItem, WishlistState } from "@/types/wishlist";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

// 장르 ID로 분류 (16=애니메이션)
function resolveGenre(item: any, mediaType: "movie" | "tv"): "movie" | "drama" | "animation" {
  if (item.genre_ids?.includes(16)) return "animation";
  return mediaType === "movie" ? "movie" : "drama";
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlist: [],

  // ── 찜 추가 ──────────────────────────────────────────────────────────────
  onAddWish: async (item) => {
    const user = auth.currentUser;
    if (!user) {
      console.log("[찜] 로그인이 필요합니다");
      return;
    }

    try {
      const mediaType: "movie" | "tv" = "title" in item ? "movie" : "tv";
      const wishItem: WishItem = {
        id: item.id,
        title: "title" in item ? item.title : item.name,
        poster_path: item.poster_path,
        mediaType,
        genre: resolveGenre(item, mediaType),
        vote_average: item.vote_average,
        addedAt: new Date().toISOString(),
      };

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      const prevWishlist: WishItem[] = userDoc.exists()
        ? userDoc.data()?.wishlist || []
        : [];

      // 이미 있으면 추가 안 함 (중복 방지)
      if (prevWishlist.some((w) => w.id === item.id)) return;

      // 최신순으로 맨 앞에 추가
      const newWishlist = [wishItem, ...prevWishlist];

      if (userDoc.exists()) {
        await updateDoc(userDocRef, { wishlist: newWishlist });
      } else {
        // 문서가 없으면 새로 생성
        await setDoc(userDocRef, { wishlist: newWishlist }, { merge: true });
      }

      set({ wishlist: newWishlist });
    } catch (err) {
      console.log("찜 추가 에러", err);
    }
  },

  // ── 찜 해제 ──────────────────────────────────────────────────────────────
  onRemoveWish: async (id) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const prevWishlist: WishItem[] = userDoc.data()?.wishlist || [];
        const newWishlist = prevWishlist.filter((w) => w.id !== id);

        await updateDoc(userDocRef, { wishlist: newWishlist });
        set({ wishlist: newWishlist });
      }
    } catch (err) {
      console.log("찜 해제 에러", err);
    }
  },

  // ── 찜 목록 불러오기 ─────────────────────────────────────────────────────
  onLoadWishlist: async () => {
    const user = auth.currentUser;
    if (!user) {
      set({ wishlist: [] });
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const wishlist: WishItem[] = userDoc.data()?.wishlist || [];
        set({ wishlist });
      } else {
        set({ wishlist: [] });
      }
    } catch (err) {
      console.log("찜 목록 불러오기 오류", err);
    }
  },

  // ── 찜 여부 확인 ─────────────────────────────────────────────────────────
  isWished: (id) => {
    return get().wishlist.some((w) => w.id === id);
  },
}));