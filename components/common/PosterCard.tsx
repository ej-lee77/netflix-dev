"use client";

import Link from "next/link";
import "./posterCard.scss";

interface PosterCardProps {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath?: string | null;
  voteAverage?: number;
  year?: string;
}

// 카테고리/무드 페이지가 공통으로 쓰는 포스터 카드
// .poster (aspect-ratio 2/3) 덕분에 이미지 유무·비율과 무관하게 항상 같은 크기
export default function PosterCard({
  id,
  mediaType,
  title,
  posterPath,
  voteAverage,
  year,
}: PosterCardProps) {
  return (
    <Link href={`/detail/${mediaType}/${id}`} className="poster-card">
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
        {typeof voteAverage === "number" && voteAverage > 0 && (
          <span className="rating">★ {voteAverage.toFixed(1)}</span>
        )}
      </div>
      <h3>{title}</h3>
      {year && <p className="year">{year}</p>}
    </Link>
  );
}
