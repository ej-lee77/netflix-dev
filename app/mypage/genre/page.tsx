"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { customMenus } from "@/data/mainMenu";
import "../../scss/selectGenre.scss";
import { DEFAULT_PROFILE_SETTINGS, useAuthStore } from "@/store/useAuthStore";

// --- 메타데이터 없이 오직 path 기준으로만 데이터 분리 ---
const genreOptions = customMenus
  .filter((menu) => menu.path.startsWith("/genre/"))
  .map((menu) => ({
    ...menu,
    slug: menu.path.replace("/genre/", ""), // 'action', 'comedy' 등 상태 관리에 쓸 key 추출
  }));

export default function SelectGenre() {
  // 현재 프로필의 settings 에서 불러오고, 저장도 여기에 함
  const currentProfile = useAuthStore((s) => s.currentProfile);
  const onUpdateProfile = useAuthStore((s) => s.onUpdateProfile);

  // 제외 장르 슬러그 목록만 관리 (선호 장르 / 무드 기능 제거)
  const [excludedGenres, setExcludedGenres] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 프로필이 로드/전환되면 저장된 제외 장르를 불러옴
  useEffect(() => {
    setExcludedGenres(currentProfile?.settings?.excludedGenres ?? []);
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProfile?.id]);

  // 제외 장르 토글
  const toggleGenre = (slug: string) => {
    setSaved(false);
    setExcludedGenres((prev) =>
      prev.includes(slug) ? prev.filter((g) => g !== slug) : [...prev, slug],
    );
  };

  // 초기화 (제외 장르 비우기)
  const handleReset = () => {
    setExcludedGenres([]);
    setSaved(false);
  };

  // 프로필 settings 에 저장 — 제외 장르만 갱신, 나머지 설정은 그대로 유지
  const handleSave = async () => {
    if (!currentProfile) return;
    setSaving(true);
    setSaved(false);
    try {
      await onUpdateProfile({
        ...currentProfile,
        settings: {
          ...currentProfile.settings,
          maturityRating:
            currentProfile.settings?.maturityRating ?? DEFAULT_PROFILE_SETTINGS.maturityRating,
          subtitles: currentProfile.settings?.subtitles ?? DEFAULT_PROFILE_SETTINGS.subtitles,
          playback: currentProfile.settings?.playback ?? DEFAULT_PROFILE_SETTINGS.playback,
          hiddenWatchingVideos: currentProfile.settings?.hiddenWatchingVideos ?? [],
          favoriteGenres: currentProfile.settings?.favoriteGenres ?? [],
          favoriteMoods: currentProfile.settings?.favoriteMoods ?? [],
          excludedMoods: currentProfile.settings?.excludedMoods ?? [],
          excludedGenres,
        },
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="menu-custom-page">
      <div className="menu-custom-page__inner">
        <div className="menu-custom-page__hero">
          <h1>장르 관리</h1>
          <p>추천에서 제외할 장르를 설정할 수 있어요</p>
        </div>

        {/* 제외 장르 설정 섹션 */}
        <section className="custom-panel">
          <div className="custom-panel__header">
            <h2>🎭 제외 장르</h2>
            <p>선택한 장르는 홈·추천·탐색 등 모든 목록에서 숨겨져요</p>
          </div>

          <div className="genre-tabs" role="tablist" aria-label="제외 장르">
            <button className="active" type="button">
              제외 장르 ({excludedGenres.length})
            </button>
          </div>

          <div className="genre-grid">
            {genreOptions.map((genre) => {
              const isSelected = excludedGenres.includes(genre.slug);

              return (
                <button
                  className={isSelected ? "genre-button active" : "genre-button"}
                  type="button"
                  key={genre.slug}
                  onClick={() => toggleGenre(genre.slug)}
                >
                  {/* 메인메뉴의 이미지를 그대로 출력 */}
                  <Image src={genre.imgUrl} alt="" width={22} height={22} />
                  {/* 메인메뉴의 타이틀("액션", "애니메이션" 등)을 그대로 출력 */}
                  <span>{genre.title}</span>
                  {isSelected ? <strong aria-hidden="true">×</strong> : null}
                </button>
              );
            })}
          </div>
        </section>

        {/* 저장 바 */}
        <section className="save-panel">
          <p>{saved ? "설정이 저장되었어요." : "변경한 제외 장르 설정을 저장합니다."}</p>
          <button type="button" onClick={handleSave} disabled={saving || !currentProfile}>
            {saving ? "저장 중..." : "저장하기"}
          </button>
        </section>

        {/* 초기화 판넬 */}
        <section className="reset-panel">
          <p>설정을 초기 상태로 되돌리고 싶으신가요?</p>
          <button type="button" onClick={handleReset}>기본값 복원</button>
        </section>
      </div>
    </section>
  );
}
