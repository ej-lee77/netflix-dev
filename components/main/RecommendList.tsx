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
import './scss/recommendList.scss';
import SectionTitle from '../common/SectionTitle';

/**
 * 추천작 섹션 (TopCast 와 무관한 독립 섹션)
 * - TMDB 인기 영화 + 인기 TV 섞어 랜덤
 * - Swiper coverflow effect 로 중앙 큰 카드 + 양옆 살짝 보이는 형태
 * - 슬라이드 변경 시 현재 가운데 작품의 backdrop 을 섹션 전체 배경으로 깔기
 */
export default function RecommendList() {
  const { recommended, onFetchRecommended } = useMovieStore();
  //현재 활성 작품의 정보 (배경 깔기용)
  const [activeBackdrop, setActiveBackdrop] = useState<{ id: number; backdropPath: string } | null>(null);

  useEffect(() => {
    onFetchRecommended();
  }, []);

  //데이터 로드되면 첫 번째 작품 backdrop 세팅
  useEffect(() => {
    if (recommended.length > 0 && !activeBackdrop) {
      const first = recommended[0];
      setActiveBackdrop({ id: first.id, backdropPath: first.backdrop_path });
    }
  }, [recommended]);

  //Swiper 현재 슬라이드가 바뀔 때
  const handleSlideChange = (swiper: SwiperClass) => {
    const idx = swiper.realIndex;
    const item = recommended[idx];
    if (item) {
      setActiveBackdrop({ id: item.id, backdropPath: item.backdrop_path });
    }
  };

  if (recommended.length === 0) return null;

  //섹션 전체 배경에 깔 이미지 URL
  const sectionBg = activeBackdrop?.backdropPath
    ? `https://image.tmdb.org/t/p/original${activeBackdrop.backdropPath}`
    : '';

  return (
    <section className="recommend-section">
      {/* 배경 레이어: 활성 작품 백드롭 - 슬라이드 바뀔 때 페이드 전환 */}
      <div
        key={activeBackdrop?.id}
        className="recommend-bg"
        style={{
          backgroundImage: sectionBg ? `url(${sectionBg})` : 'none'
        }}
      />
      {/* 어두운 오버레이 (가독성 + 분위기) */}
      <div className="recommend-bg-overlay" />

      {/* 컨텐츠: 1600px inner 안 */}
      <div className="inner">
        <SectionTitle title='추천' subTitle='새로운 작품들을 시청해보세요' />

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
              {/* 카드 내부 백드롭 */}
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
      </div>
    </section>
  );
}