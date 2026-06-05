"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WishlistButton from "@/components/common/WishlistButton";
import "./posterCard.scss";

// 홈 카드와 동일한 장르 매핑
const GENRE_MAP: Record<number, string> = {
  28: "액션", 12: "모험", 16: "애니메이션", 35: "코미디", 80: "범죄",
  99: "다큐", 18: "드라마", 10751: "가족", 14: "판타지", 36: "역사",
  27: "공포", 10402: "음악", 9648: "미스터리", 10749: "로맨스", 878: "SF",
  53: "스릴러", 10752: "전쟁", 37: "서부",
  10759: "액션", 10762: "어린이", 10765: "SF", 10768: "전쟁",
};

interface PosterCardProps {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath?: string | null;
  voteAverage?: number;
  year?: string;
  backdropPath?: string | null;
  overview?: string;
  genreIds?: number[];
}

// 카테고리/무드 페이지 공통 포스터 카드
// 호버 시 홈 카드와 동일한 팝업(백드롭 + 정보 + 메타 + 줄거리 + 버튼)이 뜬다.
export default function PosterCard({
  id,
  mediaType,
  title,
  posterPath,
  voteAverage,
  year,
  backdropPath,
  overview,
  genreIds = [],
}: PosterCardProps) {
  const router = useRouter();
  const [hover, setHover] = useState(false);
  const detailHref = `/detail/${mediaType}/${id}`;
  const score = typeof voteAverage === "number" ? voteAverage : 0;
  const genreText = genreIds
    .slice(0, 2)
    .map((gid) => GENRE_MAP[gid])
    .filter(Boolean)
    .join(" • ");
  const wishItem = {
    id,
    title,
    poster_path: posterPath ?? null,
    backdrop_path: backdropPath ?? null,
    vote_average: score,
    overview: overview ?? "",
    genre_ids: genreIds,
  };

  return (
    <div
      className="poster-card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => router.push(detailHref)}
    >
      <div className="poster">
        {posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w342${posterPath}`}
            alt={title}
            loading="lazy"
          />
        ) : (
          <div className="no-image">이미지 없음</div>
        )}
        {score > 0 && <span className="rating">★ {score.toFixed(1)}</span>}
      </div>
      <h3>{title}</h3>

      {/* 홈 카드와 동일한 호버 팝업 */}
      {hover && (
        <div className="hover-card">
          <div className="hover-video">
            {backdropPath ? (
              <img
                src={`https://image.tmdb.org/t/p/w780${backdropPath}`}
                alt={title}
                className="fallback-img"
              />
            ) : posterPath ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${posterPath}`}
                alt={title}
                className="fallback-img"
              />
            ) : (
              <div className="no-image">이미지 없음</div>
            )}
          </div>
          <div className="hover-info">
            <div className="hover-title-row">
              <h3 className="hover-title">{title}</h3>
            </div>
            <div className="hover-meta">
              {score > 0 && (
                <>
                  <span className="meta-star">★</span>
                  <span className="meta-score">{score.toFixed(1)}</span>
                  {(year || genreText) && <span className="meta-sep">|</span>}
                </>
              )}
              {year && (
                <>
                  <span className="meta-year">{year}</span>
                  {genreText && <span className="meta-sep">|</span>}
                </>
              )}
              {genreText && <span className="meta-genre">{genreText}</span>}
            </div>
            {overview && <p className="hover-overview">{overview}</p>}
            <div className="hover-actions">
              <Link
                href={detailHref}
                className="btn-play"
                onClick={(e) => e.stopPropagation()}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                재생하기
              </Link>
              <Link
                href={detailHref}
                className="btn-detail"
                onClick={(e) => e.stopPropagation()}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                상세정보
              </Link>
              <WishlistButton
                item={wishItem}
                mediaType={mediaType}
                stopPropagation
                className="card-wish"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
