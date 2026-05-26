"use client";
import React, { useEffect } from 'react';
import { useMovieStore } from '@/store/useMovieStore';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
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
 * - 부모 풀폭 배경(진한 남색)을 위해 .top-cast-bg 가 바깥을 감싸고
 *   안쪽 컨텐츠만 .inner 로 1600px 정렬
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
            <Swiper
              modules={[Navigation]}
              navigation
              slidesPerView={10}
              spaceBetween={20}
              slidesPerGroup={5}
              className="cast-swiper"
            >
              {topCasts.map((cast) => (
                <SwiperSlide key={cast.id}>
                  <div className="cast-card">
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
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </section>
      </div>
    </div>
  );
}
