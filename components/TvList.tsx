"use client";
import React, { useState } from 'react'
import { useMovieStore } from '@/store/useMovieStore';
import Link from 'next/link';

export default function TvList() {
  const {tvs, tvVideos, onFetchTvVideos} = useMovieStore();
  const [hover, setHover] = useState<number | null>(null);
  const handleMouseEnter = async(id:number)=>{
    console.log("마우스오버");
    setHover(id);
    await onFetchTvVideos(id);
  }
  const handleMouseLeave = ()=>{
    console.log("마우스리브");
    setHover(null);
  }
  return (
    <div>
      <ul className='list grid grid-cols-4 gap-8'>
        {tvs.map((tv)=>{
          const videos = tvVideos[tv.id];
          console.log("비디오", videos);
          const trailer = videos?.find((v)=>v.type === "Trailer" || v.type === "Teaser");
          const trailerKey = trailer?.key || null;

          return(
            <li key={tv.name} onMouseEnter={()=>handleMouseEnter(tv.id)} onMouseLeave={handleMouseLeave}>
              <div className='relative bg-black'>
                <img src={`https://image.tmdb.org/t/p/original${tv.backdrop_path}`} alt={tv.name} />
                {hover === tv.id && trailerKey && (
                <div className='absolute left-0 top-0 w-full h-full z-50'>
                  <iframe className='w-full h-50' src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1`} title='TV 트레일러'></iframe>
                  <div className='bg-black p-4'>
                    <h3 className='text-white mb-5'>{tv.name}</h3>
                    <p className='text-sm'>연령등급: </p>
                    <div className='flex gap-4'>
                      <button><img className='w-12' src="/images/icons/icon-play-sm.svg" alt="play" /></button>
                      {/* <HeartButton item={tv}/> */}
                      <Link href={`/detail/tv/${tv.id}`}><img className='w-12 bg-gray-300 rounded-4xl' src="/images/icons/arrow-circle.svg" alt="arrow" /></Link>
                    </div>
                  </div>
                </div>
                )}
              </div>
              <div className='text-box'>
                <h3 className='text-2xl font-bold'>{tv.name}</h3>
                <p>{tv.vote_average}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
