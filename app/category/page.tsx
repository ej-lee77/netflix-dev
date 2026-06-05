"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import PosterCard from "@/components/common/PosterCard";
import "../scss/category.scss";

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const DISCOVER_FETCH_BATCH_SIZE = 5;
const LOAD_ITEMS_PER_BATCH = 90;

type MainTab = "movie" | "tv" | "animation";
type FilterTab = "genre" | "country" | "mood" | "curation";
type VisibleFilterTab = "genreMood" | "country" | "curation";
type SortType = "popularity.desc" | "vote_average.desc" | "release_date.desc";

type FilterOption = {
  id: string;
  label: string;
  subLabel?: string;
  query: Record<string, string>;
  tvQuery?: Record<string, string>;
};

type MediaItem = {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type: "movie" | "tv";
};

type SelectedFilterOption = FilterOption & {
  group: FilterTab;
};

type SelectedFilterKey = {
  group: FilterTab;
  id: string;
};

const getOptionQuery = (option: FilterOption, mediaType: "movie" | "tv") =>
  mediaType === "tv" && option.tvQuery ? option.tvQuery : option.query;

const mainTabs: Array<{ id: MainTab; label: string; title: string }> = [
  { id: "movie", label: "영화", title: "MOVIES" },
  { id: "tv", label: "시리즈", title: "SERIES" },
  { id: "animation", label: "애니메이션", title: "ANIMATION" },
];

const selectionTabs: FilterTab[] = ["genre", "mood", "country", "curation"];

const filterTabs: Array<{ id: VisibleFilterTab; label: string }> = [
  { id: "genreMood", label: "장르/무드별" },
  { id: "country", label: "국가별" },
  { id: "curation", label: "큐레이션" },
];

const filters: Record<FilterTab, FilterOption[]> = {
  genre: [
    {
      id: "action",
      label: "액션",
      query: { with_genres: "28" },
      tvQuery: { with_genres: "10759" },
    },
    {
      id: "animation",
      label: "애니메이션",
      query: { with_genres: "16" },
      tvQuery: { with_genres: "16" },
    },
    { id: "comedy", label: "코미디", query: { with_genres: "35" } },
    {
      id: "documentary",
      label: "다큐멘터리",
      query: { with_genres: "99" },
      tvQuery: { with_genres: "99" },
    },
    { id: "drama", label: "드라마", query: { with_genres: "18" } },
    {
      id: "fantasy",
      label: "판타지",
      query: { with_genres: "14" },
      tvQuery: { with_genres: "10765" },
    },
    {
      id: "horror",
      label: "공포",
      query: { with_genres: "27" },
      tvQuery: { with_genres: "9648" },
    },
    {
      id: "mystery",
      label: "미스터리",
      query: { with_genres: "9648" },
      tvQuery: { with_genres: "9648" },
    },
    { id: "romance", label: "로맨스", query: { with_genres: "10749" } },
    {
      id: "scifi",
      label: "SF",
      query: { with_genres: "878" },
      tvQuery: { with_genres: "10765" },
    },
    {
      id: "thriller",
      label: "스릴러",
      query: { with_genres: "53" },
      tvQuery: { with_genres: "9648" },
    },
    {
      id: "war",
      label: "전쟁",
      query: { with_genres: "10752" },
      tvQuery: { with_genres: "10768" },
    },
  ],
  country: [
    { id: "kr", label: "한국", query: { with_origin_country: "KR" } },
    { id: "us", label: "미국", query: { with_origin_country: "US" } },
    { id: "jp", label: "일본", query: { with_origin_country: "JP" } },
    { id: "uk", label: "영국", query: { with_origin_country: "GB" } },
    { id: "fr", label: "프랑스", query: { with_origin_country: "FR" } },
    { id: "es", label: "스페인", query: { with_origin_country: "ES" } },
    { id: "de", label: "독일", query: { with_origin_country: "DE" } },
    { id: "in", label: "인도", query: { with_origin_country: "IN" } },
    { id: "cn", label: "중국", query: { with_origin_country: "CN" } },
    { id: "tw", label: "대만", query: { with_origin_country: "TW" } },
  ],
  mood: [
    {
      id: "chill",
      label: "잔잔한",
      query: { with_genres: "18,10749" },
      tvQuery: { with_genres: "18" },
    },
    {
      id: "dark",
      label: "어두운",
      query: { with_genres: "53,9648" },
      tvQuery: { with_genres: "80,9648" },
    },
    { id: "emotional", label: "감성적인", query: { with_genres: "18,10749" } },
    {
      id: "exciting",
      label: "신나는",
      query: { with_genres: "28,12" },
      tvQuery: { with_genres: "10759,10765" },
    },
    { id: "funny", label: "유쾌한", query: { with_genres: "35" } },
    {
      id: "romantic",
      label: "낭만적인",
      query: { with_genres: "10749,35" },
      tvQuery: { with_genres: "10749" },
    },
    {
      id: "scary",
      label: "무서운",
      query: { with_genres: "27" },
      tvQuery: { with_genres: "9648" },
    },
    { id: "thoughtful", label: "심오한", query: { with_genres: "18,99" } },
  ],
  curation: [
    {
      id: "weekend",
      label: "주말에 보기 좋은",
      subLabel: "긴 시간 몰입",
      query: { "vote_count.gte": "300" },
    },
    {
      id: "shortcoms",
      label: "짧고 재밌는",
      subLabel: "1시간 안팎",
      query: { "with_runtime.lte": "70" },
    },
    {
      id: "binge",
      label: "정주행 추천",
      subLabel: "멈출 수 없는 시리즈",
      query: { "vote_count.gte": "500" },
    },
    {
      id: "underrated",
      label: "숨겨진 명작",
      subLabel: "보석 같은 작품",
      query: { "vote_average.gte": "7.5", "vote_count.gte": "120" },
    },
    {
      id: "award",
      label: "수상작",
      subLabel: "검증된 작품",
      query: { "vote_average.gte": "7.2", "vote_count.gte": "500" },
    },
    {
      id: "trending",
      label: "지금 화제작",
      subLabel: "많이 보는 작품",
      query: { "vote_count.gte": "700" },
    },
  ],
};

const defaultSelection: Record<FilterTab, string[]> = {
  genre: [],
  country: [],
  mood: [],
  curation: [],
};

export default function CategoryPage() {
  const [mainTab, setMainTab] = useState<MainTab>("movie");
  const [filterTab, setFilterTab] = useState<VisibleFilterTab>("genreMood");
  const [selected, setSelected] = useState(defaultSelection);
  const [selectedOrder, setSelectedOrder] = useState<SelectedFilterKey[]>([]);
  const [sort, setSort] = useState<SortType>("popularity.desc");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const mediaType: "movie" | "tv" = mainTab === "tv" ? "tv" : "movie";
  const currentOptions = filterTab === "genreMood" ? [] : filters[filterTab];
  const selectedOptions = useMemo<SelectedFilterOption[]>(
    () =>
      selectedOrder.flatMap(({ group, id }) => {
        if (!selected[group].includes(id)) return [];
        const option = filters[group].find(
          (filterOption) => filterOption.id === id,
        );
        return option ? [{ ...option, group }] : [];
      }),
    [selected, selectedOrder],
  );
  const genreMoodOptions = useMemo(
    () =>
      selectedOptions.filter(
        (option) => option.group === "genre" || option.group === "mood",
      ),
    [selectedOptions],
  );
  const countryOptions = useMemo(
    () => selectedOptions.filter((option) => option.group === "country"),
    [selectedOptions],
  );
  const curationOptions = useMemo(
    () => selectedOptions.filter((option) => option.group === "curation"),
    [selectedOptions],
  );

  const toggleOption = (tabId: FilterTab, optionId: string) => {
    setSelected((prev) => {
      // 국가는 단일 선택(중복 불가) — 라디오처럼 동작
      if (tabId === "country") {
        const isOn = prev.country.includes(optionId);
        return { ...prev, country: isOn ? [] : [optionId] };
      }
      const next = new Set(prev[tabId]);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      return { ...prev, [tabId]: Array.from(next) };
    });
    setSelectedOrder((prev) => {
      if (tabId === "country") {
        const isOn = prev.some(
          (option) => option.group === "country" && option.id === optionId,
        );
        const withoutCountry = prev.filter(
          (option) => option.group !== "country",
        );
        return isOn
          ? withoutCountry
          : [...withoutCountry, { group: tabId, id: optionId }];
      }
      const exists = prev.some(
        (option) => option.group === tabId && option.id === optionId,
      );
      if (exists)
        return prev.filter(
          (option) => option.group !== tabId || option.id !== optionId,
        );
      return [...prev, { group: tabId, id: optionId }];
    });
  };

  const clearAll = () => {
    setSelected({ genre: [], country: [], mood: [], curation: [] });
    setSelectedOrder([]);
  };

  const createBaseParams = (page: number) => {
    const params = new URLSearchParams({
      api_key: TMDB_KEY ?? "",
      language: "ko-KR",
      page: String(page),
      sort_by: sort,
      include_adult: "false",
      // 넷플릭스 제공 콘텐츠만 노출
      with_watch_providers: "8",
      watch_region: "KR",
    });

    if (mainTab === "animation") {
      params.set("with_genres", "16");
    }

    return params;
  };

  const applyStrictFilters = (
    params: URLSearchParams,
    curation?: SelectedFilterOption,
  ) => {
    const genreIds = genreMoodOptions.flatMap((option) => {
      const genreValue = getOptionQuery(option, mediaType).with_genres;
      return genreValue ? genreValue.split(",") : [];
    });

    if (genreIds.length > 0) {
      const uniqueGenreIds = Array.from(new Set(genreIds));
      const genreQuery = uniqueGenreIds.join(",");
      params.set(
        "with_genres",
        params.has("with_genres")
          ? `${params.get("with_genres")},${genreQuery}`
          : genreQuery,
      );
    }

    if (countryOptions.length > 0) {
      const countryCodes = countryOptions
        .map((option) => getOptionQuery(option, mediaType).with_origin_country)
        .filter(Boolean);
      params.set(
        "with_origin_country",
        Array.from(new Set(countryCodes)).join("|"),
      );
    }

    if (curation) {
      Object.entries(getOptionQuery(curation, mediaType)).forEach(
        ([key, value]) => {
          params.set(key, value);
        },
      );
    }
  };

  const normalizeResults = (results: any[]): MediaItem[] =>
    (results || []).map((item: any) => ({
      id: item.id,
      title: item.title || item.name,
      poster_path: item.poster_path,
      vote_average: item.vote_average,
      release_date: item.release_date,
      first_air_date: item.first_air_date,
      media_type: mediaType,
    }));

  const fetchDiscoverPage = async (
    page: number,
    signal: AbortSignal,
    curation?: SelectedFilterOption,
  ) => {
    const params = createBaseParams(page);
    applyStrictFilters(params, curation);

    const res = await fetch(
      `https://api.themoviedb.org/3/discover/${mediaType}?${params}`,
      {
        signal,
      },
    );
    return res.json();
  };

  const fetchDiscoverBatch = async (
    startPage: number,
    signal: AbortSignal,
    curation?: SelectedFilterOption,
  ) => {
    const firstPageData = await fetchDiscoverPage(startPage, signal, curation);
    const queryTotalPages = Number(firstPageData.total_pages) || 1;
    const endPage = Math.min(
      queryTotalPages,
      startPage + DISCOVER_FETCH_BATCH_SIZE - 1,
    );
    const items = normalizeResults(firstPageData.results);
    const queryTotalResults =
      Number(firstPageData.total_results) || items.length;

    if (startPage < endPage) {
      const pageNumbers = Array.from(
        { length: endPage - startPage },
        (_, index) => startPage + index + 1,
      );
      const batchResults = await Promise.all(
        pageNumbers.map((pageNumber) =>
          fetchDiscoverPage(pageNumber, signal, curation),
        ),
      );
      items.push(
        ...batchResults.flatMap((data) => normalizeResults(data.results)),
      );
    }

    return {
      items: items.slice(0, LOAD_ITEMS_PER_BATCH),
      totalPages: queryTotalPages,
      totalResults: queryTotalResults,
      nextPage: endPage + 1,
    };
  };

  // 큐레이션 다중선택을 AND로: 같은 키는 가장 엄격한 임계값으로 병합(.gte=최댓값, .lte=최솟값)
  const buildMergedCuration = (
    options: SelectedFilterOption[],
  ): SelectedFilterOption => {
    const merged: Record<string, string> = {};
    options.forEach((opt) => {
      Object.entries(getOptionQuery(opt, mediaType)).forEach(
        ([key, value]) => {
          if (key.endsWith(".gte")) {
            merged[key] =
              merged[key] !== undefined
                ? String(Math.max(Number(merged[key]), Number(value)))
                : value;
          } else if (key.endsWith(".lte")) {
            merged[key] =
              merged[key] !== undefined
                ? String(Math.min(Number(merged[key]), Number(value)))
                : value;
          } else {
            merged[key] = value;
          }
        },
      );
    });
    return { id: "__merged_curation__", label: "", query: merged, group: "curation" };
  };

  const fetchCategoryBatch = async (
    startPage: number,
    signal: AbortSignal,
    reset = false,
  ) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      // 큐레이션을 AND로 병합해 단일 요청 (예전: 옵션별 따로 요청 후 합집합)
      const mergedCuration =
        curationOptions.length > 0
          ? buildMergedCuration(curationOptions)
          : undefined;
      const response = await fetchDiscoverBatch(
        startPage,
        signal,
        mergedCuration,
      );

      const merged = new Map<number, MediaItem>();
      if (!reset) items.forEach((item) => merged.set(item.id, item));
      response.items.forEach((item) => {
        if (!merged.has(item.id)) merged.set(item.id, item);
      });

      setItems(Array.from(merged.values()));
      setTotalPages(response.totalPages);
      setTotalResults(response.totalResults);
      setNextPage(response.nextPage);
    } catch (error) {
      if (!signal.aborted && reset) setItems([]);
    } finally {
      if (!signal.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    setItems([]);
    setNextPage(1);
    setTotalPages(1);
    setTotalResults(0);

    fetchCategoryBatch(1, controller.signal, true);
    return () => controller.abort();
  }, [mainTab, mediaType, selectedOptions, sort]);

  const handleLoadMore = () => {
    const controller = new AbortController();
    fetchCategoryBatch(nextPage, controller.signal);
  };

  return (
    <div className="category-catalog-page">
      <div className="category-shell">
        <div className="category-topbar">
          <h1>큐레이션</h1>
        </div>

        <div className="category-content">
          <div className="main-tabs" aria-label="콘텐츠 유형">
            {mainTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={mainTab === tab.id ? "active" : ""}
                onClick={() => setMainTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="filter-row">
            <div className="filter-chips" aria-label="분류">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={filterTab === tab.id ? "chip active" : "chip"}
                  onClick={() => setFilterTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="selected-row">
            <div className="selected-chips">
              {selectedOptions.map((option) => (
                <button
                  key={`${option.group}-${option.id}`}
                  type="button"
                  onClick={() => toggleOption(option.group, option.id)}
                >
                  {option.label} ×
                </button>
              ))}
            </div>
            <button type="button" className="clear-btn" onClick={clearAll}>
              모두 지우기
            </button>
          </div>

          <div className="option-panel">
            <div className="panel-head">
              <strong>
                {filterTabs
                  .find((tab) => tab.id === filterTab)
                  ?.label.replace("별", "")}
              </strong>
            </div>
            {filterTab === "genreMood" ? (
              <div className="option-sections">
                <div className="option-section">
                  <h3>장르</h3>
                  <div className="option-grid">
                    {filters.genre.map((option) => (
                      <label key={option.id} className="check-option">
                        <input
                          type="checkbox"
                          checked={selected.genre.includes(option.id)}
                          onChange={() => toggleOption("genre", option.id)}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="option-section">
                  <h3>무드</h3>
                  <div className="option-grid">
                    {filters.mood.map((option) => (
                      <label key={option.id} className="check-option">
                        <input
                          type="checkbox"
                          checked={selected.mood.includes(option.id)}
                          onChange={() => toggleOption("mood", option.id)}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="option-grid">
                {currentOptions.map((option) => (
                  <label key={option.id} className="check-option">
                    <input
                      type="checkbox"
                      checked={selected[filterTab].includes(option.id)}
                      onChange={() => toggleOption(filterTab, option.id)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <section className="result-section">
            <div className="section-head result-head">
              <h2>전체 작품</h2>
              <div className="result-tools">
                <span>{totalResults.toLocaleString()}편</span>
                <select
                  className="sort-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortType)}
                >
                  <option value="popularity.desc">인기순</option>
                  <option value="vote_average.desc">평점순</option>
                  <option value="release_date.desc">최신순</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="state-text">작품을 불러오는 중...</div>
            ) : items.length > 0 ? (
              <>
                <div className="poster-grid">
                  {items.map((item) => (
                    <PosterCard
                      key={item.id}
                      id={item.id}
                      mediaType={item.media_type}
                      title={item.title}
                      posterPath={item.poster_path}
                      voteAverage={item.vote_average}
                      year={(item.release_date || item.first_air_date || "").slice(0, 4)}
                    />
                  ))}
                </div>
                {nextPage <= totalPages && (
                  <div className="load-more-wrap">
                    <button
                      type="button"
                      className="load-more-btn"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? "불러오는 중..." : "더보기"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="state-text">조건에 맞는 작품이 없습니다.</div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}