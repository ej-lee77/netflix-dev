"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, notFound } from "next/navigation";
import { customMenus } from "@/data/mainMenu";
import "../../scss/category.scss";

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

// 장르 path → TMDB genre_id 매핑
const genreMap: Record<string, { name: string; movieId: number; tvId: number; description: string }> = {
  action: { name: "액션", movieId: 28, tvId: 10759, description: "심장이 멎을 듯한 액션의 세계" },
  animation: { name: "애니메이션", movieId: 16, tvId: 16, description: "상상력이 폭발하는 애니메이션" },
  comedy: { name: "코미디", movieId: 35, tvId: 35, description: "유쾌하고 즐거운 웃음 한 스푼" },
  documentary: { name: "다큐멘터리", movieId: 99, tvId: 99, description: "현실보다 더 흥미로운 진짜 이야기" },
  drama: { name: "드라마", movieId: 18, tvId: 18, description: "마음 깊이 울리는 드라마" },
  fantasy: { name: "판타지", movieId: 14, tvId: 10765, description: "꿈과 마법이 가득한 판타지 세계" },
  horror: { name: "공포", movieId: 27, tvId: 9648, description: "심장이 쫄깃해지는 공포의 밤" },
  mystery: { name: "미스터리", movieId: 9648, tvId: 9648, description: "끝까지 멈출 수 없는 미스터리" },
  romance: { name: "로맨스", movieId: 10749, tvId: 10749, description: "설레는 로맨스의 모든 것" },
  scifi: { name: "SF", movieId: 878, tvId: 10765, description: "상상을 넘어선 미래의 이야기" },
  thriller: { name: "스릴러", movieId: 53, tvId: 9648, description: "긴장의 끈을 놓을 수 없는 스릴러" },
  war: { name: "전쟁", movieId: 10752, tvId: 10768, description: "역사와 인간을 그린 전쟁 이야기" },
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
  media_type: "movie" | "tv";
}

export default function GenrePage() {
  const params = useParams();
  const genreName = params.name as string;

  const [type, setType] = useState<"movie" | "tv">("movie");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  const info = genreMap[genreName];

  // 장르 메뉴에서 아이콘 경로 가져오기
  const menuItem = customMenus.find((m) => m.path === `/genre/${genreName}`);

  if (!info) {
    notFound();
  }

  useEffect(() => {
    if (!info) return;
    setLoading(true);

    const fetchGenre = async () => {
      const genreId = type === "movie" ? info.movieId : info.tvId;
      const res = await fetch(
        `https://api.themoviedb.org/3/discover/${type}?api_key=${TMDB_KEY}&language=ko-KR&with_genres=${genreId}&sort_by=popularity.desc&page=1`
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
        media_type: type,
      }));
      setItems(list);
      setLoading(false);
    };

    fetchGenre();
  }, [type, genreName, info]);

  if (!info) return null;

  const featured = items[0];
  const otherItems = items.slice(1);

  return (
    <div className="category-page">
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
              <span>장르</span>
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
        {/* 필터 */}
        <div className="type-filter">
          <button
            className={type === "movie" ? "active" : ""}
            onClick={() => setType("movie")}
          >
            영화
          </button>
          <button
            className={type === "tv" ? "active" : ""}
            onClick={() => setType("tv")}
          >
            시리즈
          </button>
        </div>

        {/* 그리드 */}
        {loading ? (
          <div className="loading">불러오는 중...</div>
        ) : otherItems.length > 0 ? (
          <div className="poster-grid">
            {otherItems.map((item) => (
              <Link
                key={item.id}
                href={`/detail/${item.media_type}/${item.id}`}
                className="poster-card"
              >
                <div className="poster">
                  {item.poster_path ? (
                    <img src={`https://image.tmdb.org/t/p/w300${item.poster_path}`} alt={item.title} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  <span className="rating">★ {item.vote_average.toFixed(1)}</span>
                </div>
                <h3>{item.title}</h3>
                <p className="year">{(item.release_date || item.first_air_date)?.slice(0, 4)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">작품이 없습니다</div>
        )}
      </div>
    </div>
  );
}
