"use client";
import React, { useState } from "react";
import { useMovieStore } from "@/store/useMovieStore";
import Link from "next/link";

import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Scrollbar } from "swiper/modules";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/scrollbar";
import "./scss/categoryList.scss";
import SectionTitle from "../common/SectionTitle";

// 부모에게서 받을 props 타입 정의 ("movie" 또는 "tv")
interface MediaListProps {
  category: "movie" | "tv";
}

export default function CategoryList({ category }: MediaListProps) {
  const { popMovies, popVideos, onFetchVideo, tvs, tvVideos, onFetchTvVideos } =
    useMovieStore();

  // 마우스 호버 체크용 변수
  const [hover, setHover] = useState<number | null>(null);

  // 🌟 선택된 카테고리에 따라 18개 데이터 추출 및 매핑 분기 처리
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

  // 마우스 진입 핸들러
  const handleMouseEnter = async (
    id: number,
    fetchVideo: () => Promise<void>,
  ) => {
    setHover(id);
    await fetchVideo();
  };

  // 마우스 이탈 핸들러
  const handleMouseLeave = () => {
    setHover(null);
  };

  return (
    <div className="swiper-container-wrap category-list-wrap">
      <div className="inner">
      <SectionTitle title='카테고리' subTitle='새로운 작품들을 시청해보세요' />
      <Swiper
        modules={[FreeMode, Scrollbar]}
        spaceBetween={24}
        slidesPerView={"auto"}
        className="media-swiper"
      >
        {currentList.map((item) => {
          return (
            <SwiperSlide key={item.id} className="category-slide">
              <li
                className="category-item"
                onMouseEnter={() => handleMouseEnter(item.id, item.fetchVideo)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="img-box">
                  <img
                    className="poster-img"
                    src={`https://image.tmdb.org/t/p/w500${item.backdrop_path}`}
                    alt={item.title}
                  />
                  <div className="overlay" />
                </div>

                <div className="text-box">
                  <Link href={`/detail/${category}/${item.id}`}>
                    <h3 className="item-title">
                      {item.title}
                    </h3>
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
    </div>
  );
}
