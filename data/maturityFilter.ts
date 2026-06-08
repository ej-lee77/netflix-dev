// 관람등급(maturityRating)에 따른 콘텐츠 필터 헬퍼
// - 프로필 settings.maturityRating ("전체관람가"|"12+"|"15+"|"19+") 을 허용 최대 레벨로 변환
// - 각 작품의 TMDB KR 등급(certifications 맵, `${mediaType}-${id}`)을 레벨로 변환해 비교
// - 등급 미상(아직 못 불러온 경우 포함)은 행이 비는 것을 막기 위해 일단 표시한다.

import { useAuthStore } from "@/store/useAuthStore";
import type { MaturityRating } from "@/types/auth";

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
