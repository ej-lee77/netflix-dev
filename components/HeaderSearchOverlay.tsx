"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { customMenus } from "@/data/mainMenu"; // 1. 메인 메뉴 데이터 임포트
import "./scss/searchOverlay.scss";

// 2. customMenus 데이터를 기반으로 검색 옵션 동적 가공
const genreOptions = customMenus
  .filter((menu) => menu.path.startsWith("/genre/"))
  .map((menu) => ({
    label: menu.title,                             // "액션", "애니메이션" 등
    value: menu.path.replace("/genre/", ""),       // "action", "animation" 등 slug 추출
    icon: menu.imgUrl,                             // 이미지 경로 그대로 매핑
  }));

const moodOptions = customMenus
  .filter((menu) => menu.path.startsWith("/mood/"))
  .map((menu) => ({
    label: menu.title,                             // "잔잔한", "어두운" 등
    value: menu.path.replace("/mood/", ""),       // "chill", "dark" 등 slug 추출
    icon: menu.imgUrl,                             // 이미지 경로 그대로 매핑
  }));

const recentSearches = ["오펜하이머", "봉준호", "스릴러 한국영화", "로맨틱 코미디"];
const recommendedSearches = ["파묘", "서울의 봄", "듄: 파트2", "웡카", "노량", "쿵푸팬더4"];
const creators = ["송강호", "전도연", "이병헌", "박찬욱", "봉준호", "놀란"];

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HeaderSearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [activeMoods, setActiveMoods] = useState<string[]>(["exciting"]);
  const [activeGenres, setActiveGenres] = useState<string[]>(["thriller"]);
  
  // 💡 새로고침 방지용 애니메이션 트리거 상태 추가
  const [isAnimate, setIsAnimate] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
      
      // 💡 브라우저가 오버레이 돔(DOM)을 인식한 직후에 애니메이션 클래스를 붙여 
      //    새로고침 없이도 즉시 백드롭 필터(블러) 렌더링을 시작하게 만듭니다.
      const timer = setTimeout(() => {
        setIsAnimate(true);
      }, 10);
      
      return () => clearTimeout(timer);
    } else {
      setIsAnimate(false);
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
    <div className={`search-overlay ${isAnimate ? "show" : ""}`}>
      <div className="search-overlay__backdrop" onClick={onClose} />
      
      <div className="search-overlay__content">
        <div className="search-overlay__inner">
          
          {/* 1. 검색 인풋 바 */}
          <div className="search-overlay__field">
            <Image src="/images/header/search.svg" alt="search" width={20} height={20} />
            <input 
              ref={inputRef}
              type="search" 
              placeholder="제목, 배우, 감독 검색..." 
              aria-label="검색어 입력" 
            />
            <button type="button" className="close-btn" onClick={onClose} aria-label="닫기">
              <span aria-hidden="true">×</span>
            </button>
          </div>

          {/* 2. 최근 / 추천 검색어 */}
          <div className="search-overlay__top-row">
            <section className="overlay-block overlay-block--recent">
              <h3>최근 검색어</h3>
              <ul className="horizontal-tags">
                {recentSearches.map((keyword) => (
                  <li key={keyword}>
                    <button type="button" className="tag-item">
                      <span>{keyword}</span>
                      <em aria-hidden="true">×</em>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="overlay-block overlay-block--recommend">
              <h3>추천 검색어</h3>
              <div className="horizontal-tags">
                {recommendedSearches.map((keyword, index) => (
                  <button className={`tag-item ${index === 0 ? "active" : ""}`} type="button" key={keyword}>
                    {keyword}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* 3. 무드로 찾기 (mainMenu 데이터 반영) */}
          <section className="overlay-finder">
            <h3>무드로 찾기</h3>
            <div className="scroll-row">
              {moodOptions.map((option) => {
                const isActive = activeMoods.includes(option.value);
                return (
                  <button
                    className={isActive ? "slim-card active" : "slim-card"}
                    type="button"
                    key={option.value}
                    onClick={() => toggleOption(option.value, activeMoods, setActiveMoods)}
                  >
                    <Image src={option.icon} alt="" width={24} height={24} />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 4. 장르로 찾기 (mainMenu 데이터 반영) */}
          <section className="overlay-finder">
            <h3>장르로 찾기</h3>
            <div className="scroll-row">
              {genreOptions.map((option) => {
                const isActive = activeGenres.includes(option.value);
                return (
                  <button
                    className={isActive ? "slim-card active" : "slim-card"}
                    type="button"
                    key={option.value}
                    onClick={() => toggleOption(option.value, activeGenres, setActiveGenres)}
                  >
                    <Image src={option.icon} alt="" width={24} height={24} />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 5. 인물로 찾기 */}
          <section className="overlay-finder overlay-finder--creator">
            <h3>배우 · 감독으로 찾기</h3>
            <div className="scroll-row scroll-row--creator">
              {creators.map((creator) => (
                <button type="button" className="creator-item" key={creator}>
                  <span className="avatar" aria-hidden="true">{creator.slice(0, 1)}</span>
                  <strong>{creator}</strong>
                </button>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}