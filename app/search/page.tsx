"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMovieStore } from "@/store/useMovieStore";
import "../scss/search.scss";

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type: "movie" | "tv" | "person";
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  overview?: string;
}

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

// 추천 검색어 (인기 키워드)
const recommendKeywords = [
  "넷플릭스 오리지널",
  "한국 드라마",
  "스릴러",
  "로맨틱 코미디",
  "공포",
  "애니메이션",
  "다큐멘터리",
  "SF",
];

export default function SearchPage() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "movie" | "tv" | "person">("all");

  const { popMovies, onFetchPopular, tvs, onFetchTvs } = useMovieStore();

  useEffect(() => {
    // localStorage에서 최근 검색어 가져오기
    const saved = localStorage.getItem("recentSearches");
    if (saved) setRecents(JSON.parse(saved));

    if (popMovies.length === 0) onFetchPopular();
    if (tvs.length === 0) onFetchTvs();
  }, []);

  // 검색 실행
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&language=ko-KR&query=${encodeURIComponent(query)}&page=1`
      );
      const data = await res.json();
      setResults(data.results || []);

      // 최근 검색어 저장
      const updatedRecents = [query, ...recents.filter((r) => r !== query)].slice(0, 8);
      setRecents(updatedRecents);
      localStorage.setItem("recentSearches", JSON.stringify(updatedRecents));
    } catch (err) {
      console.error("검색 오류", err);
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(keyword);
  };

  const handleKeywordClick = (kw: string) => {
    setKeyword(kw);
    handleSearch(kw);
  };

  const handleRemoveRecent = (kw: string) => {
    const updated = recents.filter((r) => r !== kw);
    setRecents(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  // 필터링된 결과
  const filteredResults =
    activeFilter === "all"
      ? results.filter((r) => r.media_type !== "person")
      : results.filter((r) => r.media_type === activeFilter);

  return (
    <div className="search-page">
      <div className="inner">
        {/* 검색 바 */}
        <form className="search-bar" onSubmit={handleSubmit}>
          <Image src="/images/header/search.svg" alt="검색" width={24} height={24} />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="영화·시리즈·인물 검색"
            autoFocus
          />
          {keyword && (
            <button type="button" className="clear-btn" onClick={() => { setKeyword(""); setResults([]); }}>
              ×
            </button>
          )}
        </form>

        {/* 검색 결과가 있으면 결과 영역만 보여줌 */}
        {results.length > 0 ? (
          <div className="search-results">
            <div className="filter-tabs">
              <button
                className={activeFilter === "all" ? "active" : ""}
                onClick={() => setActiveFilter("all")}
              >
                전체
              </button>
              <button
                className={activeFilter === "movie" ? "active" : ""}
                onClick={() => setActiveFilter("movie")}
              >
                영화
              </button>
              <button
                className={activeFilter === "tv" ? "active" : ""}
                onClick={() => setActiveFilter("tv")}
              >
                시리즈
              </button>
            </div>

            <div className="result-grid">
              {filteredResults.map((item) => (
                <Link
                  key={`${item.media_type}-${item.id}`}
                  href={`/detail/${item.media_type}/${item.id}`}
                  className="result-card"
                >
                  <div className="poster">
                    {item.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                        alt={item.title || item.name}
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                  <div className="meta">
                    <span className="type-badge">{item.media_type === "movie" ? "영화" : "시리즈"}</span>
                    <h3>{item.title || item.name}</h3>
                    <p className="date">{(item.release_date || item.first_air_date)?.slice(0, 4)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* 최근 검색어 */}
            {recents.length > 0 && (
              <div className="search-block">
                <h2 className="block-title">최근 검색어</h2>
                <div className="keyword-chips">
                  {recents.map((kw) => (
                    <span key={kw} className="chip">
                      <button onClick={() => handleKeywordClick(kw)}>{kw}</button>
                      <button className="remove" onClick={() => handleRemoveRecent(kw)}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 추천 검색어 */}
            <div className="search-block">
              <h2 className="block-title">추천 검색어</h2>
              <div className="keyword-chips">
                {recommendKeywords.map((kw) => (
                  <button key={kw} className="chip outline" onClick={() => handleKeywordClick(kw)}>
                    {kw}
                  </button>
                ))}
              </div>
            </div>

            {/* 인기 작품 추천 */}
            <div className="search-block">
              <h2 className="block-title">지금 인기있는 작품</h2>
              <div className="popular-grid">
                {popMovies.slice(0, 12).map((m) => (
                  <Link key={m.id} href={`/detail/movie/${m.id}`} className="popular-card">
                    {m.poster_path && (
                      <img src={`https://image.tmdb.org/t/p/w300${m.poster_path}`} alt={m.title} />
                    )}
                    <p>{m.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {loading && <div className="loading">검색 중...</div>}
      </div>
    </div>
  );
}
