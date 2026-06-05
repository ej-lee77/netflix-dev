"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, notFound } from "next/navigation";
import { customMenus } from "@/data/mainMenu";
import "../../scss/category.scss";
import PosterCard from "@/components/common/PosterCard";
import CustomSelect from "@/components/common/CustomSelect";
import { filterHidden } from "@/data/hiddenContent";

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

// 무드별 히어로 고정 작품 (해당 무드일 때 결과 첫 번째 대신 이 작품을 히어로로)
const PINNED_HERO_IDS: Record<string, number> = {
  chill: 77338,
};

// 무드 → TMDB 장르 조합 (무드는 TMDB에 직접 없으므로 장르 조합 활용)
const moodMap: Record<string, {
  name: string;
  description: string;
  movieGenres: string;  // 콤마로 구분된 장르 ID
  tvGenres: string;
  sortBy: string;
}> = {
  chill: {
    name: "잔잔한",
    description: "조용히 마음을 어루만지는 잔잔한 작품들",
    movieGenres: "18,10749",  // 드라마, 로맨스
    tvGenres: "18,10749",
    sortBy: "vote_average.desc",
  },
  dark: {
    name: "어두운",
    description: "묵직하고 어두운 분위기의 작품들",
    movieGenres: "53,9648,80",  // 스릴러, 미스터리, 범죄
    tvGenres: "80,9648",
    sortBy: "popularity.desc",
  },
  emotional: {
    name: "감성적인",
    description: "마음 깊이 스며드는 감성 작품",
    movieGenres: "18,10749,10751",  // 드라마, 로맨스, 가족
    tvGenres: "18,10751",
    sortBy: "vote_average.desc",
  },
  exciting: {
    name: "신나는",
    description: "에너지 가득한 신나는 작품들",
    movieGenres: "28,12,878",  // 액션, 어드벤처, SF
    tvGenres: "10759,10765",
    sortBy: "popularity.desc",
  },
  funny: {
    name: "유쾌한",
    description: "마음 가볍게 웃을 수 있는 유쾌한 작품",
    movieGenres: "35,10751",  // 코미디, 가족
    tvGenres: "35,10751",
    sortBy: "popularity.desc",
  },
  romantic: {
    name: "낭만적인",
    description: "심장이 두근거리는 낭만적인 작품들",
    movieGenres: "10749,35",  // 로맨스, 코미디
    tvGenres: "10749",
    sortBy: "vote_average.desc",
  },
  scary: {
    name: "무서운",
    description: "오싹한 공포와 스릴이 가득한 작품",
    movieGenres: "27,53",  // 공포, 스릴러
    tvGenres: "9648",
    sortBy: "popularity.desc",
  },
  thoughtful: {
    name: "심오한",
    description: "깊은 여운을 남기는 작품들",
    movieGenres: "18,99,36",  // 드라마, 다큐, 역사
    tvGenres: "18,99",
    sortBy: "vote_average.desc",
  },
};

interface MediaItem {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  media_type: "movie" | "tv";
}

export default function MoodPage() {
  const params = useParams();
  const moodName = params.name as string;

  const [type, setType] = useState<"movie" | "tv" | "animation">("movie");
  const [sort, setSort] = useState<string>("popularity.desc");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pinnedHero, setPinnedHero] = useState<MediaItem | null>(null);

  const info = moodMap[moodName];
  const menuItem = customMenus.find((m) => m.path === `/mood/${moodName}`);

  if (!info) {
    notFound();
  }

  useEffect(() => {
    if (!info) return;
    setLoading(true);

    const fetchMood = async () => {
      const endpoint = type === "tv" ? "tv" : "movie";
      const rawGenres =
        type === "animation" ? "16" : type === "tv" ? info.tvGenres : info.movieGenres;
      // 무드 장르는 "이 중 하나라도" 해당하면 노출(OR). 콤마(AND)는 결과가 거의 없어 탭이 비는 문제 방지
      const genres = rawGenres.replace(/,/g, "|");
      // TV에는 release_date 정렬이 없어 first_air_date로 보정
      const sortBy =
        endpoint === "tv" && sort === "release_date.desc" ? "first_air_date.desc" : sort;
      const res = await fetch(
        `https://api.themoviedb.org/3/discover/${endpoint}?api_key=${TMDB_KEY}&language=ko-KR&with_genres=${genres}&sort_by=${sortBy}&page=1&vote_count.gte=20&with_watch_providers=8&watch_region=KR`
      );
      const data = await res.json();
      const list = (data.results || []).map((item: any) => ({
        id: item.id,
        title: item.title || item.name,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        overview: item.overview,
        vote_average: item.vote_average,
        release_date: item.release_date,
        first_air_date: item.first_air_date,
        genre_ids: item.genre_ids ?? [],
        media_type: endpoint,
      }));
      setItems(filterHidden(list));
      setLoading(false);
    };

    fetchMood();
  }, [type, moodName, info, sort]);

  // 무드별 히어로 고정 작품 로드 (영화 → 실패 시 시리즈 순으로 시도)
  useEffect(() => {
    const heroId = PINNED_HERO_IDS[moodName];
    if (!heroId) {
      setPinnedHero(null);
      return;
    }
    let active = true;
    const mapDetail = (d: any, mt: "movie" | "tv"): MediaItem => ({
      id: d.id,
      title: d.title || d.name,
      poster_path: d.poster_path,
      backdrop_path: d.backdrop_path,
      overview: d.overview,
      vote_average: d.vote_average,
      release_date: d.release_date,
      first_air_date: d.first_air_date,
      genre_ids: (d.genres || []).map((g: any) => g.id),
      media_type: mt,
    });
    const tryFetch = async (mt: "movie" | "tv") => {
      const res = await fetch(
        `https://api.themoviedb.org/3/${mt}/${heroId}?api_key=${TMDB_KEY}&language=ko-KR`,
      );
      const d = await res.json();
      return d && d.success !== false && d.id ? mapDetail(d, mt) : null;
    };
    (async () => {
      const hero = (await tryFetch("movie")) || (await tryFetch("tv"));
      if (active && hero) setPinnedHero(hero);
    })();
    return () => {
      active = false;
    };
  }, [moodName]);

  if (!info) return null;

  const featured = pinnedHero ?? items[0];
  const otherItems = pinnedHero
    ? items.filter((item) => item.id !== pinnedHero.id)
    : items.slice(1);

  return (
    <div className="category-page mood-variant">
      {/* 히어로 영역 */}
      {featured && featured.backdrop_path && (
        <div className="category-hero">
          <img
            src={`https://image.tmdb.org/t/p/original${featured.backdrop_path}`}
            alt={featured.title}
            className="hero-bg"
          />
          <div className="hero-overlay"></div>
          <div className="hero-content inner">
            <div className="hero-eyebrow">
              {menuItem && <Image src={menuItem.imgUrl} alt={info.name} width={32} height={32} />}
              <span>무드</span>
            </div>
            <h1>{info.name}</h1>
            <p className="hero-desc">{info.description}</p>
            <div className="hero-actions">
              <Link href={`/detail/${featured.media_type}/${featured.id}`} className="btn-play">
                ▶ {featured.title} 보러가기
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="inner">
        <div className="type-filter">
          <button className={type === "movie" ? "active" : ""} onClick={() => setType("movie")}>
            영화
          </button>
          <button className={type === "tv" ? "active" : ""} onClick={() => setType("tv")}>
            시리즈
          </button>
          <button className={type === "animation" ? "active" : ""} onClick={() => setType("animation")}>
            애니메이션
          </button>
        </div>

        <div className="mood-result-head" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <div style={{ width: 150 }}>
            <CustomSelect
              options={[
                { value: "popularity.desc", label: "인기순" },
                { value: "vote_average.desc", label: "평점순" },
                { value: "release_date.desc", label: "최신순" },
              ]}
              value={sort}
              onChange={setSort}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading">분위기에 맞는 작품을 찾고 있어요...</div>
        ) : otherItems.length > 0 ? (
          <div className="poster-grid">
            {otherItems.map((item) => (
              <PosterCard
                key={item.id}
                id={item.id}
                mediaType={item.media_type}
                title={item.title}
                posterPath={item.poster_path}
                voteAverage={item.vote_average}
                year={(item.release_date || item.first_air_date || "").slice(0, 4)}
                backdropPath={item.backdrop_path}
                overview={item.overview}
                genreIds={item.genre_ids}
              />
            ))}
          </div>
        ) : (
          <div className="empty">작품이 없습니다</div>
        )}
      </div>
    </div>
  );
}