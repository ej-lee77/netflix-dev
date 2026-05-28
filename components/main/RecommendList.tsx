"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMovieStore } from '@/store/useMovieStore';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperClass } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import './scss/recommendList.scss';
import SectionTitle from '../common/SectionTitle';

/**
 * 추천작 섹션
 * - TMDB 인기 영화 + 인기 TV 섞어 랜덤
 * - 카드 = 상단 포스터 + 하단 정보 영역 (세로 분할)
 * - 가운데 카드만 크게, 좌우 카드는 살짝 작고 흐리게
 * - 슬라이드 변경 시 현재 가운데 작품의 backdrop 을 섹션 전체 배경으로 깔기
 */
export default function RecommendList() {
  const { recommended, onFetchRecommended } = useMovieStore();
  const [activeBackdrop, setActiveBackdrop] = useState<{ id: number; backdropPath: string } | null>(null);

  useEffect(() => {
    onFetchRecommended();
  }, []);

  useEffect(() => {
    if (recommended.length > 0 && !activeBackdrop) {
      const first = recommended[0];
      setActiveBackdrop({ id: first.id, backdropPath: first.backdrop_path });
    }
  }, [recommended]);

  const handleSlideChange = (swiper: SwiperClass) => {
    const idx = swiper.realIndex;
    const item = recommended[idx];
    if (item) {
      setActiveBackdrop({ id: item.id, backdropPath: item.backdrop_path });
    }
  };

  if (recommended.length === 0) return null;

  const sectionBg = activeBackdrop?.backdropPath
    ? `https://image.tmdb.org/t/p/original${activeBackdrop.backdropPath}`
    : '';

  return (
    <section className="recommend-section">
      {/* 배경 레이어: 활성 작품 백드롭 */}
      <div
        key={activeBackdrop?.id}
        className="recommend-bg"
        style={{
          backgroundImage: sectionBg ? `url(${sectionBg})` : 'none'
        }}
      />
      <div className="recommend-bg-overlay" />

      <div className="inner">
        <SectionTitle title='추천' subTitle='새로운 작품들을 시청해보세요' />
      </div>
        <Swiper
          modules={[Navigation, Autoplay]}
          grabCursor
          centeredSlides
          loop
          slidesPerView={3}
          spaceBetween={100}
          observer={true}
          observeParents={true}
          navigation
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          onSlideChange={handleSlideChange}
          className="recommend-swiper"
          breakpoints={{
            640: { slidesPerView: 1.3, spaceBetween: 60 },
            1024: { slidesPerView: 1.4, spaceBetween: 80 },
            1400: { slidesPerView: 1.5, spaceBetween: 100 },
            1700: { slidesPerView: 3, spaceBetween: 100 },
          }}
        >
          {recommended.map((item) => (
            <SwiperSlide key={`${item.media_type}-${item.id}`}>
              <div className="recommend-slide">
                {/* 상단 - 포스터 영역 */}
                <div className="slide-poster">
                  {item.backdrop_path && (
                    <img
                      src={`https://image.tmdb.org/t/p/w1280${item.backdrop_path}`}
                      alt={item.title}
                    />
                  )}
                  <span className="slide-platform">
                    {item.media_type === 'movie' ? 'MOVIE' : 'TV'}
                  </span>
                </div>

                {/* 하단 - 정보 영역 */}
                <div className="slide-info">
                  {/* 제목 + PLAY 버튼 (한 줄, space-between) */}
                  <div className="slide-info-head">
                    <h3 className="slide-title">{item.title}</h3>
                    <Link
                      href={`/detail/${item.media_type}/${item.id}`}
                      className="play-btn"
                    >
                      <span className="play-icon">▶</span>
                      PLAY NOW
                    </Link>
                  </div>

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
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
    </section>
  );
}
