"use client";
import React, { useEffect } from 'react';
import { useMovieStore } from '@/store/useMovieStore';
import './scss/topCast.scss';

/**
 * TOP CAST 섹션 (독립 섹션)
 * - 추천작과 무관한 별개 섹션
 * - 현재 전 세계에서 가장 인기 있는 배우/감독을 보여줌 (TMDB person/popular)
 * - 10명 카드를 grid 로 한 줄에 균등 배치
 */
export default function TopCast() {
  const { popularPeople, onFetchPopularPeople } = useMovieStore();

  useEffect(() => {
    onFetchPopularPeople();
  }, []);

  //상위 10명만
  const topPeople = popularPeople.slice(0, 10);

  return (
    <div className="top-cast-wrap">
      <div className="inner">
        <section className="top-cast-section">
          {/* <div className="cast-header">
            <h2 className="cast-title">
              TOP CAST
              <span className="title-underline" />
            </h2>
            <a href="#" className="all-cast">All Cast →</a>
          </div> */}

          {topPeople.length === 0 ? (
            <p className="cast-empty">인기 인물 정보를 불러오는 중입니다.</p>
          ) : (
            <ul className="cast-grid">
              {topPeople.map((person) => {
                //가장 유명한 작품 제목 (배역 자리에 표시)
                const knownFor = person.known_for?.[0];
                const knownTitle = knownFor?.title || knownFor?.name || person.known_for_department;

                return (
                  <li key={person.id} className="cast-card">
                    <div className="cast-photo">
                      {person.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w300${person.profile_path}`}
                          alt={person.name}
                        />
                      ) : (
                        <div className="photo-empty">{person.name.charAt(0)}</div>
                      )}
                    </div>
                    <p className="cast-name">{person.name}</p>
                    <p className="cast-character">{knownTitle}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}