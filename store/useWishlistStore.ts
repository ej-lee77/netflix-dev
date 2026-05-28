import { create } from "zustand";
import type { WishItem, WishlistState } from "@/types/wishlist";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useAuthStore } from "./useAuthStore";

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

// 현재 로그인 uid
function getUid(): string | null {
  if (auth.currentUser?.uid) return auth.currentUser.uid;
  return useAuthStore.getState().user?.uid ?? null;
}

// 장르 분류 (16=애니메이션)
function resolveGenre(
  genreIds: number[],
  mediaType: "movie" | "tv"
): "movie" | "drama" | "animation" {
  if (genreIds.includes(16)) return "animation";
  return mediaType === "movie" ? "movie" : "drama";
}

// ID로 TMDB 상세 조회 → movie 먼저, 실패하면 tv 시도
async function fetchWishItemById(id: string): Promise<WishItem | null> {
  // 1) movie 시도
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}&language=ko-KR`
    );
    if (res.ok) {
      const data = await res.json();
      const genreIds: number[] = data.genres?.map((g: { id: number }) => g.id) ?? [];
      return {
        id: Number(id),
        title: data.title ?? data.original_title ?? "",
        poster_path: data.poster_path ?? "",
        mediaType: "movie",
        genre: resolveGenre(genreIds, "movie"),
        vote_average: data.vote_average ?? 0,
        addedAt: "",
      };
    }
  } catch {
    // 넘어가서 tv 시도
  }

  // 2) tv 시도
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_KEY}&language=ko-KR`
    );
    if (res.ok) {
      const data = await res.json();
      const genreIds: number[] = data.genres?.map((g: { id: number }) => g.id) ?? [];
      return {
        id: Number(id),
        title: data.name ?? data.original_name ?? "",
        poster_path: data.poster_path ?? "",
        mediaType: "tv",
        genre: resolveGenre(genreIds, "tv"),
        vote_average: data.vote_average ?? 0,
        addedAt: "",
      };
    }
  } catch {
    // 둘 다 실패
  }

  return null;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlist: [],      // 화면 표시용 객체 배열 (API로 채움)
  wishlistIds: [],   // Firestore에 저장되는 ID 문자열 배열 (팀 표준)

  // ── 찜 추가 ──────────────────────────────────────────────────────────────
  onAddWish: async (item) => {
    const uid = getUid();
    const idStr = String(item.id);
    console.log("[찜 시도] uid =", uid, "| id =", idStr);
    if (!uid) {
      console.warn("[찜] 로그인이 필요합니다 (uid 없음)");
      return;
    }

    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);

      // 기존 movies.wishlist (ID 배열) 가져오기
      const prevIds: string[] = userDoc.exists()
        ? userDoc.data()?.movies?.wishlist ?? []
        : [];

      // 이미 있으면 무시
      if (prevIds.includes(idStr)) return;

      // 맨 앞에 추가 (최신순)
      const newIds = [idStr, ...prevIds];

      // Firestore에 ID 배열만 저장 (movies.wishlist)
      if (userDoc.exists()) {
        await updateDoc(userDocRef, { "movies.wishlist": newIds });
      } else {
        await setDoc(userDocRef, { movies: { wishlist: newIds } }, { merge: true });
      }

      // 화면용 객체도 즉시 갱신 (방금 추가한 작품을 맨 앞에)
      const mediaType: "movie" | "tv" = "title" in item ? "movie" : "tv";
      const genreIds: number[] =
        (item as any).genre_ids ??
        (item as any).genres?.map((g: { id: number }) => g.id) ??
        [];
      const newItem: WishItem = {
        id: item.id,
        title: "title" in item ? item.title : (item as any).name,
        poster_path: item.poster_path ?? "",
        mediaType,
        genre: resolveGenre(genreIds, mediaType),
        vote_average: item.vote_average ?? 0,
        addedAt: "",
      };

      set({
        wishlistIds: newIds,
        wishlist: [newItem, ...get().wishlist.filter((w) => w.id !== item.id)],
      });
      console.log("[찜 추가 성공] 현재 찜 개수:", newIds.length);
    } catch (err) {
      console.error("[찜 추가 실패] Firestore 쓰기 오류:", err);
    }
  },

  // ── 찜 해제 ──────────────────────────────────────────────────────────────
  onRemoveWish: async (id) => {
    const uid = getUid();
    if (!uid) return;
    const idStr = String(id);

    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const prevIds: string[] = userDoc.data()?.movies?.wishlist ?? [];
        const newIds = prevIds.filter((x) => x !== idStr);

        await updateDoc(userDocRef, { "movies.wishlist": newIds });

        set({
          wishlistIds: newIds,
          wishlist: get().wishlist.filter((w) => w.id !== id),
        });
      }
    } catch (err) {
      console.error("[찜 해제 실패]:", err);
    }
  },

  // ── 찜 목록 불러오기 (ID → TMDB API로 정보 채움) ─────────────────────────
  onLoadWishlist: async () => {
    const uid = getUid();
    if (!uid) {
      set({ wishlist: [], wishlistIds: [] });
      return;
    }

    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        set({ wishlist: [], wishlistIds: [] });
        return;
      }

      const ids: string[] = userDoc.data()?.movies?.wishlist ?? [];
      set({ wishlistIds: ids });

      if (ids.length === 0) {
        set({ wishlist: [] });
        return;
      }

      // 각 ID를 TMDB에서 조회 (movie→tv 순). 병렬 처리.
      const results = await Promise.all(ids.map((id) => fetchWishItemById(id)));
      // null(조회 실패) 제외, 원래 순서 유지
      const items = results.filter((r): r is WishItem => r !== null);

      set({ wishlist: items });
    } catch (err) {
      console.error("[찜 목록 불러오기 실패]:", err);
    }
  },

  // ── 찜 여부 확인 (ID 배열 기준) ──────────────────────────────────────────
  isWished: (id) => {
    return get().wishlistIds.includes(String(id));
  },
}));
