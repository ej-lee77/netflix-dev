import type { Movie, TV } from "./movie";

export interface WishItem {
  id: number;
  title: string;
  poster_path: string;
  mediaType: "movie" | "tv";
  genre: "movie" | "drama" | "animation";
  vote_average: number;
  addedAt: string; // ISO 문자열 (찜한 시각)
}

export interface WishlistState {
  wishlist: WishItem[];
  // 찜 추가
  onAddWish: (item: Movie | TV) => Promise<void>;
  // 찜 해제
  onRemoveWish: (id: number) => Promise<void>;
  // 찜 목록 불러오기
  onLoadWishlist: () => Promise<void>;
  // 특정 작품이 찜되어 있는지 확인
  isWished: (id: number) => boolean;
}
