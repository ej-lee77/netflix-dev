"use client";
import { useMovieStore } from '@/store/useMovieStore';
import React, { useState } from 'react';

export default function NewMovieList() {
    const { newMovies } = useMovieStore();
    const [activeIndex, setActiveIndex] = useState(5);

    const total = newMovies.length;


    return (
        <div>
            <h3 className='font-bold'>신작</h3>
            <div className='relative h-[560px] w-full overflow-hidden'>

                <ul className="new-movie-list">
                    {
                        newMovies.map((movie, index) => {

                            let diff = index - activeIndex;
                            if (diff > total / 2) diff -= total;
                            if (diff < -total / 2) diff += total;
                            const abs = Math.abs(diff);

                            const scale =
                                abs === 0 ? 1.35 :
                                    abs === 1 ? 1.25 :
                                        abs === 2 ? 1.15 :
                                            abs === 3 ? 0.99 : 0.95;

                            // const neonClass =
                            //     diff === 0
                            //         ? "shadow-[0_0_35px_rgba(255,0,0,0.3)]"
                            //         : diff === -1
                            //             ? "shadow-[0_0_35px_rgba(234,0,255,0.25)]"
                            //             : diff === 1
                            //                 ? "shadow-[0_0_35px_rgba(255,174,0,0.3)]"
                            //                 : "shadow-2xl";

                            // const neonClass =
                            //     diff === 0
                            //         ? "ring-2 ring-[#FF0000]/30 shadow-[0_0_35px_rgba(255,0,0,0.3)]"
                            //         : diff === -1
                            //             ? "ring-2 ring-[#EA00FF]/25 shadow-[0_0_35px_rgba(234,0,255,0.25)]"
                            //             : diff === 1
                            //                 ? "ring-2 ring-[#FFAE00]/30 shadow-[0_0_35px_rgba(255,174,0,0.3)]"
                            //                 : "shadow-2xl";

                            const activeClass =
                                abs === 0
                                    ? "border-1 border-white shadow-[0_0_35px_rgba(255,0,0,0.6)]"
                                    : "shadow-2xl";

                            const translateX = diff * 250;
                            const zIndex = 100 - abs;
                            const opacity = abs > 3 ? 0 : 1;

                            return (
                                <li key={movie.id}>
                                    <div key={movie.id}
                                        onClick={() => setActiveIndex(index)}
                                        className={`
                                        absolute
                                        left-1/2
                                        top-1/2
                                        h-[360px]
                                        w-[240px]
                                        overflow-hidden
                                        rounded-lg
                                        bg-zinc-300
                                        transition-all
                                        duration-500
                                        ease-out
                                        ${activeClass}
                                        `}
                                        style={{
                                            transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale})`,
                                            zIndex,
                                            opacity,
                                        }}>
                                        <img
                                            src={`https://image.tmdb.org/t/p/original${movie.poster_path}`}
                                            alt="."
                                            className='h-full w-full object-cover' />
                                        <div
                                            className={`
                                            absolute inset-0 transition-all duration-300
                                            ${abs === 0 ? "bg-black/0" : "bg-black/30"}
                                        `}
                                        />

                                        <p className="absolute bottom-0 left-0 right-0 bg-black/60 px-4 py-3 text-sm font-semibold text-white">
                                            {movie.title}
                                        </p>
                                    </div>
                                </li>
                            )
                        })
                    }
                </ul>
            </div>
        </div>

    )
}
