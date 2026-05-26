"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMovieStore } from '@/store/useMovieStore';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, EffectCoverflow, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperClass } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';
import TopCast from './TopCast';
import './scss/recommendList.scss';

/**
 * 추천작 섹션
 * - TMDB 인기 영화 + 인기 TV 섞어 랜덤
 * - Swiper coverflow effect 로 중앙 큰 카드 + 양옆 살짝 보이는 형태
 * - 슬라이드 변경 시 현재 가운데 작품의 id/mediaType 을 state로 잡아서
 *   하단 TopCast 컴포넌트에 전달 -> 출연진도 같이 바뀜
 */
export default function RecommendList() {
  const { recommended, onFetchRecommended } = useMovieStore();
  const [activeItem, setActiveItem] = useState<{ id: number; mediaType: "movie" | "tv" } | null>(null);

  useEffect(() => {
    onFetchRecommended();
  }, []);

  //데이터 로드되면 첫 번째 작품을 active 로 세팅
  useEffect(() => {
    if (recommended.length > 0 && !activeItem) {
      setActiveItem({ id: recommended[0].id, mediaType: recommended[0].media_type });
    }
  }, [recommended]);

  //Swiper 현재 슬라이드가 바뀔 때 호출됨
  const handleSlideChange = (swiper: SwiperClass) => {
    const idx = swiper.realIndex;
    const item = recommended[idx];
    if (item) {
      setActiveItem({ id: item.id, mediaType: item.media_type });
    }
  };

  if (recommended.length === 0) return null;

  return (
    <>
      {/* 추천 슬라이더: 1600px inner 안 */}
      <div className="inner">
        <section className="recommend-section">
          <h2 className="section-title">추천</h2>

          <Swiper
            modules={[Navigation, EffectCoverflow, Autoplay]}
            effect="coverflow"
            grabCursor
            centeredSlides
            loop
            slidesPerView={1.8}
            spaceBetween={20}
            navigation
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 200,
              modifier: 1,
              slideShadows: false,
            }}
            onSlideChange={handleSlideChange}
            className="recommend-swiper"
          >
            {recommended.map((item) => (
              <SwiperSlide key={`${item.media_type}-${item.id}`} className="recommend-slide">
                {/* 배경 백드롭 */}
                <div
                  className="slide-backdrop"
                  style={{
                    backgroundImage: item.backdrop_path
                      ? `url(https://image.tmdb.org/t/p/original${item.backdrop_path})`
                      : 'none',
                  }}
                />
                <div className="slide-dim" />

                {/* 가운데 컨텐츠 */}
                <div className="slide-content">
                  <span className="slide-badge">
                    {item.media_type === 'movie' ? 'MOVIE' : 'TV'}
                  </span>

                  <h3 className="slide-title">{item.title}</h3>

                  <ul className="slide-meta">
                    {item.release_date && (
                      <li>{item.release_date.slice(0, 4)}</li>
                    )}
                    <li>{item.media_type === 'movie' ? 'Movie' : 'TV Series'}</li>
                    <li className="rating">
                      <strong>TMDB Rating</strong>
                      <span className="star">★</span>
                      <span>{item.vote_average.toFixed(1)}/10</span>
                    </li>
                  </ul>

                  <p className="slide-overview">
                    {item.overview || '소개 정보가 없습니다.'}
                  </p>

                  <Link
                    href={`/detail/${item.media_type}/${item.id}`}
                    className="play-btn"
                  >
                    <span className="play-icon">▶</span>
                    PLAY NOW
                  </Link>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      </div>

      {/* TOP CAST: 풀폭 배경이라 .inner 밖에 */}
      {activeItem && (
        <TopCast id={activeItem.id} mediaType={activeItem.mediaType} />
      )}
    </>
  );
}
