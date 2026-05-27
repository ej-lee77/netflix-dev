import React, { useState } from "react";
import { useMovieStore } from "@/store/useMovieStore";
import Link from "next/link";

import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Scrollbar } from "swiper/modules";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/scrollbar";
import "./scss/categoryList.scss";

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
          title: tv.name, // tv.name을 title로 통일해서 구조 일치화
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
    <div className="swiper-container-wrap w-full py-6">
      <Swiper
        modules={[FreeMode, Scrollbar]}
        spaceBetween={24} // 카드 사이 간격 (gap-6과 동일)
        slidesPerView={"auto"} // CSS에서 카드 너비를 자유롭게 조절하도록 설정
        className="media-swiper !px-8 !pb-10"
      >
        {currentList.map((item) => {
          const trailer = item.videos?.find(
            (v) => v.type === "Trailer" || v.type === "Teaser",
          );
          const trailerKey = trailer?.key || null;

          return (
            <SwiperSlide key={item.id} className="!w-[260px] md:!w-[300px]">
              <li
                className="list-none w-full flex flex-col group relative"
                onMouseEnter={() => handleMouseEnter(item.id, item.fetchVideo)}
                onMouseLeave={handleMouseLeave}
              >
                {/* 🌟 세로 포스터 느낌을 내기 위해 aspect-video(16:9) 대신 aspect-[2/3] 고정 */}
                <div className="img-box relative w-full aspect-[2/3] bg-zinc-900 rounded-xl overflow-hidden shadow-xl border border-white/5">
                  <img
                    className="w-full h-full object-cover filter brightness-[0.85] transition-transform duration-500 group-hover:scale-105"
                    src={`https://image.tmdb.org/t/p/w500${item.backdrop_path}`} // 원본 포스터 두꺼운 느낌 유지
                    alt={item.title}
                  />

                  {/* 그라데이션 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                  {/* 호버 시 유튜브 트레일러 플레이어 박스 */}
                  {/* {hover === item.id && trailerKey && (
                        <div className="absolute inset-0 w-full h-full bg-black z-50 flex flex-col rounded-xl overflow-hidden animate-fade-in"> */}
                  {/* 카드 안에서 동영상이 세로로 꽉 차도록 설정 */}
                  {/* <iframe 
                            className='w-full flex-1'
                            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1`}
                            title='트레일러'
                        />

                        <div className="text-box bg-black p-4">
                            <h3 className='text-white text-lg font-bold mb-2 truncate'>{item.title}</h3>
                            <p className='text-xs text-zinc-400 mb-3'>
                            {category === 'movie' ? '영화 트레일러' : 'TV 프로그램'}
                            </p>
                            <div className='flex gap-3'>
                            <button>
                                <img className="w-10 h-10" src="/images/icons/icon-play-sm.svg" alt="재생" />
                            </button>
                            <Link href={`/detail/${category}/${item.id}`}>
                                <img className="w-10 h-10 bg-zinc-700 hover:bg-zinc-600 p-2 rounded-full transition-colors" src="/images/icons/arrow-circle.svg" alt="상세" />
                            </Link>
                            </div>
                        </div>
                        </div>
                    )} */}

                  {/* 이미지 내부 하단 텍스트 (기본 상태 노출) */}
                  {/* <div className="absolute bottom-0 left-0 w-full p-5 z-10 pointer-events-none">
                        <h3 className='text-xl font-bold text-white mb-1 drop-shadow-md line-clamp-1'>{item.title}</h3>
                        <div className="flex items-center gap-2">
                        <span className="text-amber-400 text-sm font-semibold">★ {item.vote_average.toFixed(1)}</span>
                        </div>
                    </div> */}
                </div>

                {/* 이미지 박스 바깥 아래 텍스트 영역 (선택 사항) */}
                <div className="text-box mt-3 px-1">
                  <Link href={`/detail/${category}/${item.id}`}>
                    <h3 className="text-lg font-semibold text-zinc-200 group-hover:text-amber-200 transition-colors truncate">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 text-sm font-semibold">
                        ★ {item.vote_average.toFixed(1)}
                      </span>
                    </div>
                  </Link>
                </div>
              </li>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
