"use client";
import React, { useState } from "react";
import { useMovieStore } from "@/store/useMovieStore";
import Link from "next/link";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from 'swiper/modules';

import "swiper/css";
import "./scss/categoryList.scss";
import SectionTitle from "../common/SectionTitle";

interface MediaListProps {
  category: "movie" | "tv";
}

export default function CategoryList({ category }: MediaListProps) {
  const { popMovies, popVideos, onFetchVideo, tvs, tvVideos, onFetchTvVideos } = useMovieStore();
  const [hover, setHover] = useState<number | null>(null);

  const currentList =
    category === "movie"
      ? popMovies.slice(0, 18).map((movie) => ({
          id: movie.id,
          title: movie.title,
          backdrop_path: movie.backdrop_path,
          vote_average: movie.vote_average,
          videos: popVideos[movie.id],
          fetchVideo: () => onFetchVideo(movie.id),
        }))
      : tvs.slice(0, 18).map((tv) => ({
          id: tv.id,
          title: tv.name,
          backdrop_path: tv.backdrop_path,
          vote_average: tv.vote_average,
          videos: tvVideos[tv.id],
          fetchVideo: () => onFetchTvVideos(tv.id),
        }));

  const handleMouseEnter = async (id: number, fetchVideo: () => Promise<void>) => {
    setHover(id);
    await fetchVideo();
  };

  const handleMouseLeave = () => {
    setHover(null);
  };

  return (
    <section className="category-section">
      <div className="inner">
        <SectionTitle title="카테고리" subTitle="새로운 작품들을 시청해보세요" />
        
        <Swiper
          modules={[Navigation]}
          navigation
          spaceBetween={12}
          slidesPerView={"auto"}
          className="media-swiper"
        >
          {currentList.map((item) => {
            const trailer = item.videos?.find((v) => v.type === "Trailer" || v.type === "Teaser");
            const trailerKey = trailer?.key || null;

            return (
              <SwiperSlide key={item.id} className="category-slide">
                <li
                  className="category-item"
                  onMouseEnter={() => handleMouseEnter(item.id, item.fetchVideo)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* 카드 메인 포스터 영역 */}
                  <div className="img-box">
                    <img
                      className="poster-img"
                      src={`https://image.tmdb.org/t/p/w500${item.backdrop_path}`}
                      alt={item.title}
                    />

                    {/* 하단 그라데이션 오버레이 */}
                    <div className="overlay-gradient" />

                    {/* 호버 시 트레일러 플레이어 박스 */}
                    {hover === item.id && trailerKey && (
                      <div className="trailer-box animate-fade-in">
                        <iframe
                          className="trailer-iframe"
                          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1`}
                          title="트레일러"
                        />
                        <div className="trailer-info">
                          <h3 className="trailer-title">{item.title}</h3>
                          <p className="trailer-sub">
                            {category === "movie" ? "영화 트레일러" : "TV 프로그램"}
                          </p>
                          <div className="btn-group">
                            <button type="button" className="action-btn">
                              <img src="/images/icons/icon-play-sm.svg" alt="재생" />
                            </button>
                            <Link href={`/detail/${category}/${item.id}`} className="action-btn">
                              <img src="/images/icons/arrow-circle.svg" alt="상세" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 카드 하단 기본 텍스트 정보 영역 */}
                  <div className="text-box">
                    <Link href={`/detail/${category}/${item.id}`}>
                      <h3 className="item-title">{item.title}</h3>
                      <div className="item-rating">
                        <span>★ {item.vote_average.toFixed(1)}</span>
                      </div>
                    </Link>
                  </div>
                </li>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}