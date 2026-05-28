"use client";

import Image from "next/image";
import { useState } from "react";
import "./search.scss";

type SearchOption = {
  label: string;
  value: string;
  icon: string;
};

const moodOptions: SearchOption[] = [
  { label: "힐링", value: "chill", icon: "/images/header/menu/mood-chill.svg" },
  { label: "다크", value: "dark", icon: "/images/header/menu/mood-dark.svg" },
  { label: "감성적", value: "emotional", icon: "/images/header/menu/mood-emotional.svg" },
  { label: "신나는", value: "exciting", icon: "/images/header/menu/mood-exciting.svg" },
  { label: "웃긴", value: "funny", icon: "/images/header/menu/mood-funny.svg" },
  { label: "로맨틱", value: "romantic", icon: "/images/header/menu/mood-romantic.svg" },
  { label: "무서운", value: "scary", icon: "/images/header/menu/mood-scary.svg" },
  { label: "생각나는", value: "thoughtful", icon: "/images/header/menu/mood-thoughtful.svg" },
];

const genreOptions: SearchOption[] = [
  { label: "액션", value: "action", icon: "/images/header/menu/genre-action.svg" },
  { label: "애니메이션", value: "animation", icon: "/images/header/menu/genre-animation.svg" },
  { label: "코미디", value: "comedy", icon: "/images/header/menu/genre-comedy.svg" },
  { label: "다큐멘터리", value: "documentary", icon: "/images/header/menu/genre-documentary.svg" },
  { label: "드라마", value: "drama", icon: "/images/header/menu/genre-drama.svg" },
  { label: "판타지", value: "fantasy", icon: "/images/header/menu/genre-fantasy.svg" },
  { label: "공포", value: "horror", icon: "/images/header/menu/genre-horror.svg" },
  { label: "미스터리", value: "mystery", icon: "/images/header/menu/genre-mystery.svg" },
  { label: "로맨스", value: "romance", icon: "/images/header/menu/genre-romance.svg" },
  { label: "SF", value: "scifi", icon: "/images/header/menu/genre-scifi.svg" },
  { label: "스릴러", value: "thriller", icon: "/images/header/menu/genre-thriller.svg" },
  { label: "전쟁", value: "war", icon: "/images/header/menu/genre-war.svg" },
];

const recentSearches = ["오펜하이머", "봉준호", "스릴러 한국영화", "로맨틱 코미디"];
const recommendedSearches = ["파묘", "서울의 봄", "듄: 파트2", "웡카", "노량", "쿵푸팬더4", "패스트", "아가일"];
const creators = ["송강호", "전도연", "이병헌", "박찬욱", "봉준호", "놀란", "스필버그", "타란티노"];

export default function SearchPage() {
  const [activeMoods, setActiveMoods] = useState<string[]>(["exciting"]);
  const [activeGenres, setActiveGenres] = useState<string[]>(["thriller"]);

  const toggleOption = (
    value: string,
    selectedValues: string[],
    setSelectedValues: (values: string[]) => void,
  ) => {
    setSelectedValues(
      selectedValues.includes(value)
        ? selectedValues.filter((selectedValue) => selectedValue !== value)
        : [...selectedValues, value],
    );
  };

  return (
    <section className="search-page">
      <div className="search-page__inner">
        <div className="search-page__field">
          <Image src="/images/header/search.svg" alt="" width={22} height={22} />
          <input type="search" placeholder="제목, 배우, 감독 검색..." aria-label="검색어 입력" />
        </div>

        <div className="search-page__top-grid">
          <section className="search-block search-block--recent">
            <div className="search-block__header">
              <h2>최근 검색어</h2>
              <button type="button">모두 삭제</button>
            </div>

            <ul className="recent-list">
              {recentSearches.map((keyword) => (
                <li key={keyword}>
                  <button type="button">
                    <span>{keyword}</span>
                    <span aria-hidden="true">x</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="search-block">
            <div className="search-block__header">
              <h2>추천 검색어</h2>
              <span>실시간 인기</span>
            </div>

            <div className="keyword-cloud">
              {recommendedSearches.map((keyword, index) => (
                <button className={index === 0 ? "active" : ""} type="button" key={keyword}>
                  {keyword}
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="finder-section">
          <div className="finder-section__header">
            <h2>무드로 찾기</h2>
            <p>오늘 보고 싶은 감정에 맞춰 골라보세요.</p>
          </div>

          <div className="option-grid option-grid--mood">
            {moodOptions.map((option) => {
              const isActive = activeMoods.includes(option.value);

              return (
                <button
                  className={isActive ? "option-card active" : "option-card"}
                  type="button"
                  key={option.value}
                  onClick={() => toggleOption(option.value, activeMoods, setActiveMoods)}
                >
                  <span className="option-card__icon">
                    <Image src={option.icon} alt="" width={42} height={42} />
                  </span>
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="finder-section">
          <div className="finder-section__header">
            <h2>장르로 찾기</h2>
            <p>자주 찾는 장르 아이콘만 먼저 담았어요.</p>
          </div>

          <div className="option-grid option-grid--genre">
            {genreOptions.map((option) => {
              const isActive = activeGenres.includes(option.value);

              return (
                <button
                  className={isActive ? "option-card active" : "option-card"}
                  type="button"
                  key={option.value}
                  onClick={() => toggleOption(option.value, activeGenres, setActiveGenres)}
                >
                  <span className="option-card__icon">
                    <Image src={option.icon} alt="" width={42} height={42} />
                  </span>
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="creator-section">
          <div className="search-block__header">
            <h2>배우 · 감독으로 찾기</h2>
            <button type="button">전체보기 →</button>
          </div>

          <div className="creator-list">
            {creators.map((creator) => (
              <button type="button" key={creator}>
                <span aria-hidden="true">{creator.slice(0, 1)}</span>
                <strong>{creator}</strong>
              </button>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
