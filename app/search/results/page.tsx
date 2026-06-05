"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  allSearchOptions,
  getSearchOptionLabels,
  getSearchOptionQuery,
} from "@/lib/searchOptions";
import {
  fetchTrendingMedia,
  type TrendingMediaItem,
} from "@/lib/trendingContent";
import TrendingVideoSection from "@/components/search/TrendingVideoSection";
import "../search.scss";

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";

type MediaType = "movie" | "tv";
type MediaTypeFilter = "all" | MediaType;
type SearchSortType = "popularity" | "title" | "rating";

type MediaItem = {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type: MediaType;
  popularity: number;
};

type TmdbMediaCandidate = {
  id?: number;
  media_type?: string;
  title?: string;
  name?: string;
  poster_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  popularity?: number;
  adult?: boolean;
};

type TmdbPersonResult = {
  id?: number;
  known_for?: TmdbMediaCandidate[];
};

type TmdbPersonCredit = TmdbMediaCandidate & {
  job?: string;
};

type TmdbListResponse<T> = {
  results?: T[];
};

type TmdbPersonCreditsResponse = {
  cast?: TmdbMediaCandidate[];
  crew?: TmdbPersonCredit[];
};

const SEARCH_SORT_OPTIONS: { key: SearchSortType; label: string }[] = [
  { key: "popularity", label: "인기순" },
  { key: "title", label: "제목순" },
  { key: "rating", label: "평점순" },
];

const parseParamList = (value: string | null) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

const isMediaType = (value: string | undefined): value is MediaType =>
  value === "movie" || value === "tv";

const normalizeMediaItem = (
  item: TmdbMediaCandidate,
  fallbackMediaType?: MediaType,
): MediaItem | null => {
  const mediaType = isMediaType(item.media_type)
    ? item.media_type
    : fallbackMediaType;
  const title = item.title || item.name;

  if (!item.id || !mediaType || !title || item.adult) return null;

  return {
    id: item.id,
    title,
    poster_path: item.poster_path ?? null,
    vote_average: item.vote_average ?? 0,
    release_date: item.release_date,
    first_air_date: item.first_air_date,
    media_type: mediaType,
    popularity: item.popularity ?? 0,
  };
};

const uniqueAndSortItems = (items: MediaItem[]) => {
  const itemMap = new Map<string, MediaItem>();

  items.forEach((item) => {
    const key = `${item.media_type}-${item.id}`;
    const prev = itemMap.get(key);

    if (!prev || item.popularity > prev.popularity) {
      itemMap.set(key, item);
    }
  });

  return Array.from(itemMap.values()).sort(
    (a, b) => b.popularity - a.popularity,
  );
};

const mergeKeywordFirst = (
  keywordItems: MediaItem[],
  taggedItems: MediaItem[],
) => {
  const seenKeys = new Set<string>();
  const mergedItems: MediaItem[] = [];

  [...keywordItems, ...taggedItems].forEach((item) => {
    const key = `${item.media_type}-${item.id}`;
    if (seenKeys.has(key)) return;

    seenKeys.add(key);
    mergedItems.push(item);
  });

  return mergedItems;
};

const collectGenreIds = (
  mediaType: MediaType,
  selectedGenres: string[],
  selectedMoods: string[],
) => {
  const selectedValues = new Set([...selectedGenres, ...selectedMoods]);
  const genreIds = new Set<string>();

  allSearchOptions
    .filter((option) => selectedValues.has(option.value))
    .forEach((option) => {
      const genreValue = getSearchOptionQuery(option, mediaType).with_genres;
      genreValue?.split(",").forEach((genreId) => {
        const trimmedGenreId = genreId.trim();
        if (trimmedGenreId) genreIds.add(trimmedGenreId);
      });
    });

  return Array.from(genreIds);
};

const fetchJson = async <T,>(url: string, signal: AbortSignal): Promise<T> => {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("TMDB 요청에 실패했습니다.");
  return response.json() as Promise<T>;
};

const fetchKeywordResults = async (
  keyword: string,
  typeFilter: MediaTypeFilter,
  signal: AbortSignal,
) => {
  if (!TMDB_KEY || !keyword) return [];

  const baseParams = new URLSearchParams({
    api_key: TMDB_KEY,
    language: "ko-KR",
    query: keyword,
    include_adult: "false",
    page: "1",
  });

  const [multiData, personData] = await Promise.all([
    fetchJson<TmdbListResponse<TmdbMediaCandidate>>(
      `${TMDB_BASE}/search/multi?${baseParams.toString()}`,
      signal,
    ),
    fetchJson<TmdbListResponse<TmdbPersonResult>>(
      `${TMDB_BASE}/search/person?${baseParams.toString()}`,
      signal,
    ),
  ]);

  const directItems = (multiData.results ?? [])
    .map((item) => normalizeMediaItem(item))
    .filter((item): item is MediaItem => Boolean(item));

  const knownForItems = (personData.results ?? [])
    .flatMap((person) => person.known_for ?? [])
    .map((item) => normalizeMediaItem(item))
    .filter((item): item is MediaItem => Boolean(item));

  const creditRequests = (personData.results ?? [])
    .slice(0, 4)
    .flatMap((person) => {
      if (!person.id) return [];

      const params = new URLSearchParams({
        api_key: TMDB_KEY,
        language: "ko-KR",
      });

      return [
        fetchJson<TmdbPersonCreditsResponse>(
          `${TMDB_BASE}/person/${person.id}/combined_credits?${params.toString()}`,
          signal,
        ),
      ];
    });

  const creditsData = await Promise.all(creditRequests);
  const creditItems = creditsData
    .flatMap((credits) => [
      ...(credits.cast ?? []),
      ...(credits.crew ?? []).filter((item) =>
        ["Director", "Creator", "Writer"].includes(item.job ?? ""),
      ),
    ])
    .map((item) => normalizeMediaItem(item))
    .filter((item): item is MediaItem => Boolean(item));

  return uniqueAndSortItems([
    ...directItems,
    ...knownForItems,
    ...creditItems,
  ]).filter((item) => typeFilter === "all" || item.media_type === typeFilter);
};

const fetchTaggedResults = async (
  selectedGenres: string[],
  selectedMoods: string[],
  typeFilter: MediaTypeFilter,
  signal: AbortSignal,
) => {
  if (
    !TMDB_KEY ||
    (selectedGenres.length === 0 && selectedMoods.length === 0)
  ) {
    return [];
  }

  const mediaTypes: MediaType[] =
    typeFilter === "all" ? ["movie", "tv"] : [typeFilter];

  const requests = mediaTypes.flatMap((mediaType) => {
    const genreIds = collectGenreIds(mediaType, selectedGenres, selectedMoods);
    if (genreIds.length === 0) return [];

    const params = new URLSearchParams({
      api_key: TMDB_KEY,
      language: "ko-KR",
      include_adult: "false",
      page: "1",
      sort_by: "popularity.desc",
      with_genres: genreIds.join(","),
      "vote_count.gte": "30",
    });

    return fetchJson<TmdbListResponse<TmdbMediaCandidate>>(
      `${TMDB_BASE}/discover/${mediaType}?${params.toString()}`,
      signal,
    ).then((data) =>
      (data.results ?? [])
        .map((item) => normalizeMediaItem(item, mediaType))
        .filter((item): item is MediaItem => Boolean(item)),
    );
  });

  const results = await Promise.all(requests);
  return uniqueAndSortItems(results.flat());
};

export default function SearchResultsPage() {
  return (
    <Suspense fallback={null}>
      <SearchResultsContent />
    </Suspense>
  );
}

function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keyword = searchParams.get("q")?.trim() ?? "";
  const selectedGenres = useMemo(
    () => parseParamList(searchParams.get("genres")),
    [searchParams],
  );
  const selectedMoods = useMemo(
    () => parseParamList(searchParams.get("moods")),
    [searchParams],
  );
  const typeParam = searchParams.get("type") ?? undefined;

  const typeFilter: MediaTypeFilter = isMediaType(typeParam)
    ? typeParam
    : "all";

  const [items, setItems] = useState<MediaItem[]>([]);
  const [popularItems, setPopularItems] = useState<TrendingMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sort, setSort] = useState<SearchSortType>("popularity");
  const [sortOpen, setSortOpen] = useState(false);

  const selectedLabels = [
    ...getSearchOptionLabels("genre", selectedGenres),
    ...getSearchOptionLabels("mood", selectedMoods),
  ];
  const hasQuery =
    keyword.length > 0 || selectedGenres.length > 0 || selectedMoods.length > 0;
  const currentSortLabel =
    SEARCH_SORT_OPTIONS.find((option) => option.key === sort)?.label ??
    SEARCH_SORT_OPTIONS[0].label;
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title, "ko-KR");
      if (sort === "rating") return b.vote_average - a.vote_average;
      return b.popularity - a.popularity;
    });
  }, [items, sort]);

  useEffect(() => {
    if (!hasQuery) {
      const timeoutId = window.setTimeout(() => {
        setItems([]);
        setErrorMessage("");
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    const controller = new AbortController();
    const loadingTimeoutId = window.setTimeout(() => {
      setLoading(true);
      setErrorMessage("");
    }, 0);

    Promise.all([
      fetchKeywordResults(keyword, typeFilter, controller.signal),
      fetchTaggedResults(
        selectedGenres,
        selectedMoods,
        typeFilter,
        controller.signal,
      ),
    ])
      .then(([keywordItems, taggedItems]) => {
        setItems(mergeKeywordFirst(keywordItems, taggedItems).slice(0, 72));
      })
      .catch((error: Error) => {
        if (error.name === "AbortError") return;
        setItems([]);
        setErrorMessage(
          "검색 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      window.clearTimeout(loadingTimeoutId);
      controller.abort();
    };
  }, [hasQuery, keyword, selectedGenres, selectedMoods, typeFilter]);

  useEffect(() => {
    const controller = new AbortController();

    fetchTrendingMedia(typeFilter, controller.signal, 6)
      .then(setPopularItems)
      .catch((error: Error) => {
        if (error.name !== "AbortError") setPopularItems([]);
      });

    return () => controller.abort();
  }, [typeFilter]);

  const changeTypeFilter = (nextType: MediaTypeFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextType === "all") params.delete("type");
    else params.set("type", nextType);
    router.push(`/search/results?${params.toString()}`);
  };

  return (
    <main className="search-results-page">
      <section className="search-results-hero">
        <div className="inner">
          <p>검색 결과</p>
          <div className="search-result-query-line">
            {keyword && <strong>{keyword}</strong>}
            {selectedLabels.length > 0 && (
              <div className="search-result-chips">
                {selectedLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            )}
            {!keyword && selectedLabels.length === 0 && <strong>검색</strong>}
          </div>
        </div>
      </section>

      <section className="search-results-content inner">
        <div className="type-filter" aria-label="콘텐츠 유형">
          <button
            type="button"
            className={typeFilter === "all" ? "active" : ""}
            onClick={() => changeTypeFilter("all")}
          >
            전체
          </button>
          <button
            type="button"
            className={typeFilter === "movie" ? "active" : ""}
            onClick={() => changeTypeFilter("movie")}
          >
            영화
          </button>
          <button
            type="button"
            className={typeFilter === "tv" ? "active" : ""}
            onClick={() => changeTypeFilter("tv")}
          >
            시리즈
          </button>
        </div>

        {loading ? (
          <div className="loading">검색 중...</div>
        ) : errorMessage ? (
          <div className="empty">{errorMessage}</div>
        ) : sortedItems.length > 0 ? (
          <>
            <div className="search-results-summary">
              <div className="search-results-count">
                {sortedItems.length.toLocaleString()}개 작품
              </div>
              <div className="search-results-sort">
                <button
                  type="button"
                  className="sort-btn"
                  onClick={() => setSortOpen((isOpen) => !isOpen)}
                >
                  {currentSortLabel}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className={`sort-arrow${sortOpen ? " is-open" : ""}`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {sortOpen && (
                  <ul className="sort-menu">
                    {SEARCH_SORT_OPTIONS.map((option) => (
                      <li key={option.key}>
                        <button
                          type="button"
                          className={`sort-option${sort === option.key ? " is-selected" : ""}`}
                          onClick={() => {
                            setSort(option.key);
                            setSortOpen(false);
                          }}
                        >
                          {option.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="poster-grid">
              {sortedItems.map((item) => (
                <Link
                  key={`${item.media_type}-${item.id}`}
                  href={`/detail/${item.media_type}/${item.id}`}
                  className="poster-card"
                >
                  <div className="poster">
                    {item.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                        alt={item.title}
                        width={228}
                        height={342}
                      />
                    ) : (
                      <div className="no-image">이미지 없음</div>
                    )}
                    <span className="rating">
                      ★ {item.vote_average.toFixed(1)}
                    </span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="year">
                    {(item.release_date || item.first_air_date)?.slice(0, 4)}
                  </p>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="empty">
              {hasQuery
                ? "검색 결과가 없어요."
                : "검색어 또는 태그를 선택해 주세요."}
            </div>
            <TrendingVideoSection
              items={popularItems}
              title="지금 많이 찾는 추천 영상"
              variant="results"
            />
          </>
        )}
      </section>
    </main>
  );
}
