"use client";

import Image from "next/image";
import { type CSSProperties, useState } from "react";
import { customMenus } from "@/data/mainMenu";
import "./menuCustom.scss";

type HomeSection = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
};

type SliderSetting = {
  id: string;
  title: string;
  leftLabel: string;
  rightLabel: string;
  valueLabel: string;
  value: number;
};

const initialSections: HomeSection[] = [
  { id: "mood", title: "오늘의 무드 추천", description: "기분에 맞춘 작품 추천", enabled: true },
  { id: "watching", title: "최근 시청 이어보기", description: "시청 중인 작품 빠른 진입", enabled: true },
  { id: "friends", title: "친구들의 활동", description: "팔로우 친구들의 리뷰·시청", enabled: true },
  { id: "popular", title: "이번 주 인기 작품", description: "트렌딩 콘텐츠", enabled: true },
  { id: "editor", title: "에디터 픽 큐레이션", description: "전문가 추천 모음", enabled: false },
  { id: "upcoming", title: "공개 예정 작품", description: "곧 출시될 콘텐츠", enabled: true },
];

const initialSliders: SliderSetting[] = [
  {
    id: "taste",
    title: "취향 일치도",
    leftLabel: "새로운 발견",
    rightLabel: "익숙한 취향",
    valueLabel: "강함",
    value: 82,
  },
  {
    id: "friends",
    title: "친구 활동 반영도",
    leftLabel: "개인 추천만",
    rightLabel: "친구 활동 우선",
    valueLabel: "중간",
    value: 52,
  },
  {
    id: "newness",
    title: "신작 노출",
    leftLabel: "거의 안 보임",
    rightLabel: "가장 많이",
    valueLabel: "자주",
    value: 72,
  },
];

const genreMeta: Record<string, { label: string; emoji: string }> = {
  action: { label: "액션", emoji: "💥" },
  animation: { label: "애니메이션", emoji: "⭐" },
  comedy: { label: "코미디", emoji: "🙂" },
  documentary: { label: "다큐멘터리", emoji: "🎥" },
  drama: { label: "드라마", emoji: "🎭" },
  fantasy: { label: "판타지", emoji: "🪄" },
  horror: { label: "공포", emoji: "💀" },
  mystery: { label: "미스터리", emoji: "🔎" },
  romance: { label: "로맨스", emoji: "♡" },
  scifi: { label: "SF", emoji: "🪐" },
  thriller: { label: "스릴러", emoji: "!" },
  war: { label: "전쟁", emoji: "⚔" },
};

const genreOptions = customMenus
  .filter((menu) => menu.path.startsWith("/genre/"))
  .map((menu) => {
    const slug = menu.path.replace("/genre/", "");
    const meta = genreMeta[slug] ?? { label: slug, emoji: "•" };

    return {
      ...menu,
      slug,
      label: meta.label,
      emoji: meta.emoji,
    };
  });

export default function MenuCustomPage() {
  const [sections, setSections] = useState(initialSections);
  const [sliders, setSliders] = useState(initialSliders);
  const [activeTab, setActiveTab] = useState<"favorite" | "exclude">("favorite");
  const [favoriteGenres, setFavoriteGenres] = useState(["thriller", "mystery", "scifi", "drama", "romance"]);
  const [excludedGenres, setExcludedGenres] = useState(["horror", "war", "documentary"]);

  const toggleSection = (id: string) => {
    setSections((currentSections) =>
      currentSections.map((section) =>
        section.id === id ? { ...section, enabled: !section.enabled } : section,
      ),
    );
  };

  const updateSlider = (id: string, value: number) => {
    setSliders((currentSliders) =>
      currentSliders.map((slider) => (slider.id === id ? { ...slider, value } : slider)),
    );
  };

  const toggleGenre = (slug: string) => {
    const selectedGenres = activeTab === "favorite" ? favoriteGenres : excludedGenres;
    const setSelectedGenres = activeTab === "favorite" ? setFavoriteGenres : setExcludedGenres;

    setSelectedGenres(
      selectedGenres.includes(slug)
        ? selectedGenres.filter((genre) => genre !== slug)
        : [...selectedGenres, slug],
    );
  };

  return (
    <section className="menu-custom-page">
      <div className="menu-custom-page__inner">
        <div className="menu-custom-page__hero">
          <h1>메뉴 커스텀</h1>
          <p>홈 화면에 표시할 섹션과 추천 강도를 직접 설정할 수 있어요</p>
        </div>

        <section className="custom-panel">
          <div className="custom-panel__header">
            <h2>홈 섹션 표시 <span>(드래그로 순서 변경)</span></h2>
            <p>홈 화면에 어떤 섹션을 보여줄지, 어떤 순서로 정렬할지 선택하세요</p>
          </div>

          <div className="section-list">
            {sections.map((section) => (
              <article className="section-item" key={section.id}>
                <button className="section-item__handle" type="button" aria-label={`${section.title} 순서 변경`}>
                  ⋮⋮
                </button>

                <div>
                  <h3>{section.title}</h3>
                  <p>{section.description}</p>
                </div>

                <button
                  className={section.enabled ? "switch active" : "switch"}
                  type="button"
                  aria-pressed={section.enabled}
                  onClick={() => toggleSection(section.id)}
                >
                  <span />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="custom-panel">
          <div className="custom-panel__header">
            <h2>추천 알고리즘 조정</h2>
            <p>취향 학습 강도를 직접 조절하세요. 강할수록 익숙한 작품 위주, 약할수록 새로운 발견이 많아져요</p>
          </div>

          <div className="slider-list">
            {sliders.map((slider) => (
              <article className="slider-card" key={slider.id}>
                <div className="slider-card__top">
                  <h3>{slider.title}</h3>
                  <strong>{slider.valueLabel}</strong>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={slider.value}
                  onChange={(event) => updateSlider(slider.id, Number(event.target.value))}
                  style={{ "--range-value": `${slider.value}%` } as CSSProperties}
                  aria-label={slider.title}
                />

                <div className="slider-card__labels">
                  <span>{slider.leftLabel}</span>
                  <span>{slider.rightLabel}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="custom-panel">
          <div className="custom-panel__header">
            <h2>장르 설정</h2>
            <p>선호하는 장르와 추천에서 제외할 장르를 설정하세요</p>
          </div>

          <div className="genre-tabs" role="tablist" aria-label="장르 설정">
            <button
              className={activeTab === "favorite" ? "active" : ""}
              type="button"
              onClick={() => setActiveTab("favorite")}
            >
              선호 장르 ({favoriteGenres.length})
            </button>
            <button
              className={activeTab === "exclude" ? "active" : ""}
              type="button"
              onClick={() => setActiveTab("exclude")}
            >
              제외 장르 ({excludedGenres.length})
            </button>
          </div>

          <div className="genre-grid">
            {genreOptions.map((genre) => {
              const isSelected =
                activeTab === "favorite"
                  ? favoriteGenres.includes(genre.slug)
                  : excludedGenres.includes(genre.slug);

              return (
                <button
                  className={isSelected ? "genre-button active" : "genre-button"}
                  type="button"
                  key={genre.slug}
                  onClick={() => toggleGenre(genre.slug)}
                >
                  <Image src={genre.imgUrl} alt="" width={22} height={22} />
                  <span>{genre.label}</span>
                  <em aria-hidden="true">{genre.emoji}</em>
                  {activeTab === "exclude" && isSelected ? <strong aria-hidden="true">×</strong> : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="reset-panel">
          <p>설정을 초기 상태로 되돌리고 싶으신가요?</p>
          <button type="button">기본값 복원</button>
        </section>
      </div>
    </section>
  );
}
