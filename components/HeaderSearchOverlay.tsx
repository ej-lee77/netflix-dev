"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  addRecentSearch,
  clearRecentSearches,
  genreOptions,
  loadRecentSearches,
  moodOptions,
  removeRecentSearch,
} from "@/lib/searchOptions";
import {
  fetchTrendingMedia,
  type TrendingMediaItem,
} from "@/lib/trendingContent";
import TrendingVideoSection from "./search/TrendingVideoSection";
import "./scss/searchOverlay.scss";

const recommendedSearches = [
  "파묘",
  "서울의 봄",
  "듄: 파트2",
  "웡카",
  "노량",
  "쿵푸팬더4",
];
const creators = ["송강호", "전도연", "이병헌", "박찬욱", "봉준호", "놀란"];

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HeaderSearchOverlay({
  isOpen,
  onClose,
}: SearchOverlayProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeMoods, setActiveMoods] = useState<string[]>([]);
  const [activeGenres, setActiveGenres] = useState<string[]>([]);
  const [trendingItems, setTrendingItems] = useState<TrendingMediaItem[]>([]);
  const activeTags = [
    ...genreOptions.filter((option) => activeGenres.includes(option.value)),
    ...moodOptions.filter((option) => activeMoods.includes(option.value)),
  ];

  const [isAnimate, setIsAnimate] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const controller = new AbortController();
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";

      const timer = setTimeout(() => {
        setRecentSearches(loadRecentSearches());
        setIsAnimate(true);
      }, 10);

      fetchTrendingMedia("all", controller.signal, 5)
        .then(setTrendingItems)
        .catch((error: Error) => {
          if (error.name !== "AbortError") setTrendingItems([]);
        });

      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    } else {
      document.body.style.overflow = "";
      const timer = window.setTimeout(() => {
        setIsAnimate(false);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const goToResults = (nextKeyword = keyword) => {
    const params = new URLSearchParams();
    const trimmedKeyword = nextKeyword.trim();

    if (trimmedKeyword) params.set("q", trimmedKeyword);
    if (activeGenres.length > 0) params.set("genres", activeGenres.join(","));
    if (activeMoods.length > 0) params.set("moods", activeMoods.join(","));

    if (params.toString()) {
      if (trimmedKeyword) {
        setRecentSearches(addRecentSearch(trimmedKeyword, recentSearches));
      }
      router.push(`/search/results?${params.toString()}`);
      onClose();
    }
  };

  const handleRemoveRecentSearch = (
    event: React.MouseEvent,
    targetKeyword: string,
  ) => {
    event.stopPropagation();
    setRecentSearches(removeRecentSearch(targetKeyword, recentSearches));
  };

  const handleClearRecentSearches = () => {
    setRecentSearches(clearRecentSearches());
  };

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
            <Image
              src="/images/header/search.svg"
              alt="search"
              width={20}
              height={20}
            />
            <input
              ref={inputRef}
              type="search"
              placeholder="제목, 배우, 감독 검색..."
              aria-label="검색어 입력"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  goToResults();
                }
              }}
            />
            <button
              type="button"
              className="close-btn"
              onClick={onClose}
              aria-label="닫기"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          {activeTags.length > 0 && (
            <div className="search-overlay__selected-row">
              <div
                className="search-overlay__selected-tags"
                aria-label="선택한 검색 태그"
              >
                {activeTags.map((option) => (
                  <button
                    type="button"
                    key={`${option.group}-${option.value}`}
                    onClick={() => {
                      if (option.group === "genre") {
                        setActiveGenres(
                          activeGenres.filter(
                            (value) => value !== option.value,
                          ),
                        );
                      } else {
                        setActiveMoods(
                          activeMoods.filter((value) => value !== option.value),
                        );
                      }
                    }}
                  >
                    <span>{option.label}</span>
                    <em aria-hidden="true">×</em>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="search-overlay__tag-submit"
                onClick={() => goToResults()}
              >
                선택한 태그로 검색
              </button>
            </div>
          )}

          {/* 2. 최근 / 추천 검색어 */}
          <div className="search-overlay__top-row">
            <section className="overlay-block overlay-block--recent">
              <div className="overlay-block__header">
                <h3>최근 검색어</h3>
                {recentSearches.length > 0 && (
                  <button type="button" onClick={handleClearRecentSearches}>
                    모두 삭제
                  </button>
                )}
              </div>
              {recentSearches.length > 0 ? (
                <ul className="horizontal-tags horizontal-tags--recent">
                  {recentSearches.map((keyword) => (
                    <li key={keyword}>
                      <button
                        type="button"
                        className="tag-item tag-item--keyword"
                        onClick={() => goToResults(keyword)}
                      >
                        <span>{keyword}</span>
                      </button>
                      <button
                        type="button"
                        className="tag-remove-btn"
                        aria-label={`${keyword} 최근 검색어 삭제`}
                        onClick={(event) =>
                          handleRemoveRecentSearch(event, keyword)
                        }
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="overlay-recent-empty">
                  최근 검색어가 없어요.
                </div>
              )}
            </section>

            <section className="overlay-block overlay-block--recommend">
              <h3>추천 검색어</h3>
              <div className="horizontal-tags">
                {recommendedSearches.map((keyword, index) => (
                  <button
                    className={`tag-item ${index === 0 ? "active" : ""}`}
                    type="button"
                    key={keyword}
                    onClick={() => goToResults(keyword)}
                  >
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
                    onClick={() =>
                      toggleOption(option.value, activeMoods, setActiveMoods)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && isActive) {
                        event.preventDefault();
                        goToResults();
                      }
                    }}
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
                    onClick={() =>
                      toggleOption(option.value, activeGenres, setActiveGenres)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && isActive) {
                        event.preventDefault();
                        goToResults();
                      }
                    }}
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
                <button
                  type="button"
                  className="creator-item"
                  key={creator}
                  onClick={() => goToResults(creator)}
                >
                  <span className="avatar" aria-hidden="true">
                    {creator.slice(0, 1)}
                  </span>
                  <strong>{creator}</strong>
                </button>
              ))}
            </div>
          </section>

          <TrendingVideoSection
            items={trendingItems}
            title="지금 많이 찾는 추천 영상"
            variant="overlay"
            onSelect={onClose}
          />
        </div>
      </div>
    </div>
  );
}
