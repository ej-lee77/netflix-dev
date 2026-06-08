// 관람등급(maturityRating)에 따른 콘텐츠 필터 헬퍼
// - 프로필 settings.maturityRating ("전체관람가"|"12+"|"15+"|"19+") 을 허용 최대 레벨로 변환
// - 각 작품의 TMDB KR 등급(certifications 맵, `${mediaType}-${id}`)을 레벨로 변환해 비교
// - 등급 미상(아직 못 불러온 경우 포함)은 행이 비는 것을 막기 위해 일단 표시한다.

import { useAuthStore } from "@/store/useAuthStore";
import type { MaturityRating } from "@/types/auth";
import { useEffect, useMemo } from "react";
import { useMovieStore } from "@/store/useMovieStore";

// TMDB KR 등급 문자열 → 숫자 레벨
export function certToLevel(cert?: string): number {
  if (!cert) return -1; // 미상
  const c = cert.toString().trim().toLowerCase().replace(/\s/g, "");
  if (c === "all" || c === "g" || c.includes("전체")) return 0;
  if (c.includes("청소년관람불가") || c.includes("restricted") || c === "r" || c.startsWith("19")) return 19;
  if (c.startsWith("15")) return 15;
  if (c.startsWith("12")) return 12;
  if (c.startsWith("7")) return 7;
  const n = parseInt(c, 10);
  return Number.isNaN(n) ? -1 : n;
}

// 프로필 등급 → 허용 최대 레벨
export function ratingCeiling(rating?: MaturityRating): number {
  switch (rating) {
    case "전체관람가":
      return 0;
    case "12+":
      return 12;
    case "15+":
      return 15;
    case "19+":
      return 19;
    default:
      return 19; // 설정이 없으면 제한 없음
  }
}

// 현재 프로필의 허용 최대 레벨
export function useMaturityCeiling(): number {
  const rating = useAuthStore((s) => s.currentProfile?.settings?.maturityRating);
  return ratingCeiling(rating);
}

// items 를 등급으로 필터링. getKey 로 certifications 맵 키(`${mediaType}-${id}`)를 만든다.
export function filterByMaturity<T>(
  items: T[],
  ceiling: number,
  certifications: Record<string, string>,
  getKey: (item: T) => string,
): T[] {
  if (ceiling >= 19) return items; // 19+ 프로필은 전체 허용
  return items.filter((item) => {
    const level = certToLevel(certifications[getKey(item)]);
    if (level < 0) return true; // 등급 미상은 표시 유지
    return level <= ceiling;
  });
}

// 리스트에 대해 등급(certification) 을 미리 로드하고 필터링까지 해주는 훅.
// hover 전에도 등급 필터가 동작하도록 현재 목록의 등급을 선반입한다.
export function useMaturityFiltered<T extends { id: number }>(
  items: T[],
  getMediaType: (item: T) => "movie" | "tv",
): T[] {
  const ceiling = useMaturityCeiling();
  const certifications = useMovieStore((s) => s.certifications);
  const onFetchCertification = useMovieStore((s) => s.onFetchCertification);

  useEffect(() => {
    if (ceiling >= 19) return;
    items.forEach((it) => onFetchCertification(it.id, getMediaType(it)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, ceiling]);

  return useMemo(
    () => filterByMaturity(items, ceiling, certifications, (it) => `${getMediaType(it)}-${it.id}`),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, ceiling, certifications],
  );
}

// 커뮤니티/커넥트 모드 노출 여부.
// - 프로필 isCommunity 플래그(기본 true)를 기본 게이트로 사용
// - 관람등급 12세 이하(전체관람가·12+) 프로필은 자동으로 비활성화
export function useCommunityEnabled(): boolean {
  const isCommunity = useAuthStore((s) => s.currentProfile?.isCommunity);
  const ceiling = useMaturityCeiling();
  return (isCommunity ?? true) && ceiling > 12;
}
