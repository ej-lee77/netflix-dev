"use client";
import React, { useEffect } from 'react';
import { useMovieStore } from '@/store/useMovieStore';
import './scss/topCast.scss';

interface Props {
  id: number;
  mediaType: "movie" | "tv";
}

/**
 * TOP CAST 섹션
 * - 부모(RecommendList)로부터 현재 가운데 작품의 id와 mediaType을 받아서
 *   해당 작품의 출연진을 가져옴
 * - 둥근 프로필 + 배우명 + 배역명
 * - 10명 카드를 grid 로 한 줄에 균등 배치 (Swiper 없음, 스크롤 없음)
 */
export default function TopCast({ id, mediaType }: Props) {
  const { casts, onFetchCredits } = useMovieStore();

  useEffect(() => {
    onFetchCredits(id, mediaType);
  }, [id, mediaType]);

  const key = `${mediaType}-${id}`;
  const castList = casts[key] || [];
  //order(주연 순서) 기준 정렬 후 상위 10명만
  const topCasts = [...castList]
    .sort((a, b) => a.order - b.order)
    .slice(0, 10);

  return (
    <div className="top-cast-bg">
      <div className="inner">
        <section className="top-cast-section">
          <div className="cast-header">
            <h2 className="cast-title">
              TOP CAST
              <span className="title-underline" />
            </h2>
            <a href="#" className="all-cast">All Cast →</a>
          </div>

          {topCasts.length === 0 ? (
            <p className="cast-empty">출연진 정보를 불러오는 중입니다.</p>
          ) : (
            <ul className="cast-grid">
              {topCasts.map((cast) => (
                <li key={cast.id} className="cast-card">
                  <div className="cast-photo">
                    {cast.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w300${cast.profile_path}`}
                        alt={cast.name}
                      />
                    ) : (
                      <div className="photo-empty">{cast.name.charAt(0)}</div>
                    )}
                  </div>
                  <p className="cast-name">{cast.name}</p>
                  <p className="cast-character">{cast.character || '-'}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}