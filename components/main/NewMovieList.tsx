"use client";
import { useMovieStore } from '@/store/useMovieStore';
import React, { useState } from 'react';
import SectionTitle from '../common/SectionTitle';

export default function NewMovieList() {
    const { newMovies } = useMovieStore();
    const [activeIndex, setActiveIndex] = useState(5);

    const total = newMovies.length;


    return (
        <section>
            <div className="inner">
                <SectionTitle title='신작' subTitle='새로운 작품들을 시청해보세요' />
            </div>
            <div className='relative left-1/2 h-[600px] w-[calc(100vw-var(--main-menu-width))] -translate-x-1/2 overflow-hidden'>

                <ul className="new-movie-list">
                    {
                        newMovies.map((movie, index) => {

                            let diff = index - activeIndex;
                            if (diff > total / 2) diff -= total;
                            if (diff < -total / 2) diff += total;
                            const abs = Math.abs(diff);

                            const scale =
                                abs === 0 ? 1.4 :
                                    abs === 1 ? 1.3 :
                                        abs === 2 ? 1.2 :
                                            abs === 3 ? 1.1 :
                                                abs === 4 ? 1 :
                                                    abs === 5 ? 0.95 :
                                                        abs === 6 ? 0.85 : 0.8;

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
                                    ? "border-1 border-white-50 shadow-[0_0_45px_rgba(255,0,0,0.65)]"
                                    : "shadow-2xl";

                            const translateX = diff * 260;
                            const zIndex = 100 - abs;
                            const opacity = abs > 5 ? 0 : 1;

                            return (
                                <li key={movie.id}>
                                    <div key={movie.id}
                                        onClick={() => setActiveIndex(index)}
                                        className={`
                                        absolute
                                        left-1/2
                                        top-1/2
                                        h-[420px]
                                        w-[280px]
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
        </section>

    )
}
