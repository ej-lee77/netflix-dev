"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useMovieStore } from '@/store/useMovieStore';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import OriginalBanner from './OriginalBanner';
import './scss/netflixOriginal.scss';

/**
 * 넷플릭스 오리지널 시리즈 섹션
 * - TMDB discover API + with_networks=213 (Netflix) 로 넷플릭스 자료만 필터링
 * - 하단 조각 배너에는 그 중 한 작품만 골라서 넘김 (호버 시 그 작품의 여러 스틸컷)
 */
export default function NetflixOriginal() {
  const { netflixOriginals, onFetchNetflixOriginals } = useMovieStore();

  useEffect(() => {
    onFetchNetflixOriginals();
  }, []);

  //하단 배너용 작품: 첫 번째 작품 사용
  const bannerTv = netflixOriginals[0];

  return (
    <section className="netflix-original-section">
      <div className="inner">
        <h2 className="section-title">오리지널</h2>

        <div className="original-wrap">
          {/* 좌측 고정 로고 영역 */}
          <div className="original-logo">
            <Image
              src="/images/main/netflix-original-logo.png"
              alt="NETFLIX ORIGINAL SERIES"
              width={220}
              height={180}
              priority
            />
          </div>

          {/* 우측 Swiper */}
          <div className="original-slider">
            <Swiper
              modules={[Navigation]}
              navigation
              slidesPerView={4}
              spaceBetween={12}
              slidesPerGroup={4}
              className="original-swiper"
            >
              {netflixOriginals.map((tv) => (
                <SwiperSlide key={tv.id}>
                  <Link href={`/detail/tv/${tv.id}`} className="original-card">
                    <div className="original-thumb">
                      {tv.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w500${tv.poster_path}`}
                          alt={tv.name}
                        />
                      ) : (
                        <div className="thumb-empty">이미지 없음</div>
                      )}
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

        {/* 하단 조각 배너: 단일 작품 + 그 작품의 여러 스틸컷 */}
        {bannerTv && <OriginalBanner tv={bannerTv} pieces={7} />}
      </div>
    </section>
  );
}