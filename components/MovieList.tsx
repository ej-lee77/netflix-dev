"use client";
import React, { useState } from 'react'
import { useMovieStore } from '@/store/useMovieStore';
import Link from 'next/link';

export default function MovieList() {
  const { popMovies, popVideos, onFetchVideo } = useMovieStore();
  //마우스 호버를 체크할 변수
  const [hover, setHover] = useState<number | null>(null);

  //마우스가 리스트에 올라갈때 영상 재생
  const handleMouseEnter = async (id: number) => {
    setHover(id);
    console.log(id);
    //불러온 비디오의 type값이 어떤 종류인지 체크해서 
    await onFetchVideo(id);
  }

  //마우스가 벗어나면
  const handleMouseLeave = () => {
    setHover(null);
  }

  return (
    <div>

      <ul className='list grid grid-cols-4 gap-8'>
        {popMovies.map((movie) => {
          const videos = popVideos[movie.id];
          const trailer = videos?.find((v) => v.type === "Trailer" || v.type === "Teaser")

          const trailerKey = trailer?.key || null

          return (
            <li key={movie.id}
              onMouseEnter={() => handleMouseEnter(movie.id)}
              onMouseLeave={handleMouseLeave}>

              <div className="img-box relative bg-black">
                <img src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`} alt={movie.title} />

                {hover === movie.id && trailerKey && (
                  <div className="absolute left-0 top-0 w-full h-full z-1000">
                    <iframe className='w-full h-50'
                      src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1`}></iframe>

                    <div className="text-box bg-black p-4">
                      <h3 className='text-white mb-5'>{movie.title}</h3>
                      <p>연령</p>
                      <div className='flex gap-4'>
                        <button><img className="w-12" src="/images/icons/icon-play-sm.svg" alt="재생하기" /></button>
                        {/* <HeartButton item={movie}/> */}
                        <Link href={`/detail/movie/${movie.id}`}><img className="w-12 bg-gray-300 rounded-4xl" src="/images/icons/arrow-circle.svg" alt="상세보기" /></Link>
                      </div>
                    </div>
                  </div>
                )
                }
              </div>

              <div className="text-box">
                <Link href={`/detail/movie/${movie.id}`}>
                  <h3 className='text-2xl font-bold'>{movie.title}</h3>
                  <p>{movie.vote_average}</p>
                </Link>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
