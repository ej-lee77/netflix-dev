"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import { auth } from "@/firebase/firebase";
import { getItemKey, getMediaType, usePlayListStore } from "@/store/usePlayListStore";
import "./wishlistButton.scss";

// 위시리스트가 한 페이지 세션에서 한 번만 로드되도록 하는 가드
let wishlistLoadedOnce = false;

type MediaType = "movie" | "tv";

interface WishlistButtonProps {
  // TMDB 형태의 미디어 객체 (id, title|name, poster_path, vote_average, genre_ids 등)
  item: any;
  // 일부 데이터는 TV인데 title 필드에 이름이 들어있어 자동 판별이 틀어짐.
  // 정확한 타입을 알면 넘겨주면 그 값으로 저장됨(상세페이지 키와 일치).
  mediaType?: MediaType;
  className?: string;
  // 클릭 가능한 카드 내부에 있을 때 카드 클릭으로 전파되는 것 방지
  stopPropagation?: boolean;
}

// 명시 타입이 주어지면 getMediaType(=title 유무로 판별)이 그 타입을 반환하도록
// item 을 정규화해서, 저장 키(type-id)가 상세페이지와 항상 일치하게 만든다.
function normalizeForType(item: any, mediaType?: MediaType) {
  if (!mediaType) return item;
  if (mediaType === "movie") {
    return { ...item, title: item.title ?? item.name ?? "" };
  }
  // tv: getMediaType 은 'title' 키가 없을 때만 'tv' 를 반환
  const { title, ...rest } = item;
  return { ...rest, name: item.name ?? item.title ?? "" };
}

// 상세페이지의 하트(위시리스트) 버튼과 동일한 스토어·동작을 쓰는 공통 컴포넌트
export default function WishlistButton({
  item,
  mediaType,
  className,
  stopPropagation,
}: WishlistButtonProps) {
  const { onAddMyList, onRemoveMyList, onLoadMyList, myList } =
    usePlayListStore();
  const { user } = useAuthStore();
  const router = useRouter();

  // 홈 등에서는 위시리스트를 따로 로드하지 않으므로, 최초 1회 로드해 하트 상태를 맞춤
  useEffect(() => {
    if (!wishlistLoadedOnce) {
      wishlistLoadedOnce = true;
      onLoadMyList();
    }
  }, [onLoadMyList]);

  const effectiveType: MediaType = mediaType ?? getMediaType(item);
  const key = getItemKey({ id: item.id, mediaType: effectiveType });
  const wished = myList.includes(key);

  const handleClick = async (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    e.preventDefault();

    // 로그인 전이면 찜 대신 로그인 페이지로 이동
    const uid = user?.userId ?? auth.currentUser?.uid ?? null;
    if (!uid) {
      router.push("/login");
      return;
    }

    const normalized = normalizeForType(item, mediaType);
    if (wished) {
      await onRemoveMyList(item.id, effectiveType);
    } else {
      await onAddMyList(normalized);
    }
  };

  return (
    <button
      type="button"
      className={`wishlist-heart-btn ${wished ? "is-wished" : ""} ${className ?? ""}`}
      onClick={handleClick}
      aria-pressed={wished}
      aria-label="위시리스트에 추가"
      title="위시리스트"
    >
      {wished ? "♥" : "♡"}
    </button>
  );
}
