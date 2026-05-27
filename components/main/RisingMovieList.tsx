"use-client";
import { useMovieStore } from '@/store/useMovieStore';
import React from 'react';
import SectionTitle from '../common/SectionTitle';

export default function RisingMovieList() {
    const { trendingMovies } = useMovieStore();
    const mainMovie = trendingMovies[0];
    const subMovies = trendingMovies.slice(1, 7);
    if (!mainMovie) return null;
    return (
        <section>
            <div className="inner">
                <SectionTitle title='급상승' subTitle='지금 떠오르는 작품들을 시청해보세요' />
                <div className="grid grid-cols-[1.1fr_1.6fr] gap-4">
                    {/* 왼쪽 큰 카드 */}
                    <div className="group relative h-[448px] overflow-hidden rounded-md bg-zinc-800">
                        <img
                            src={`https://image.tmdb.org/t/p/original${mainMovie.backdrop_path}`}
                            alt={mainMovie.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />

                        <div className="absolute inset-0 bg-black/25" />

                        <div className="absolute bottom-0 left-0 right-0 p-5">
                            <p className="text-xl font-bold">{mainMovie.title}</p>
                        </div>
                    </div>

                    {/* 오른쪽 6개 카드 */}
                    <ul className="grid h-[448px] grid-cols-3 grid-rows-2 gap-3">
                        {subMovies.map((movie) => (
                            <li key={movie.id}>
                                <div className="group relative h-full w-full overflow-hidden rounded-md bg-zinc-800">
                                    <img
                                        src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
                                        alt={movie.title}
                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                    />

                                    <div className="absolute inset-0 bg-black/20 opacity-0 transition group-hover:opacity-100" />

                                    <p className="absolute bottom-2 left-3 right-3 line-clamp-1 text-left text-sm font-semibold text-white opacity-0 transition group-hover:opacity-100">
                                        {movie.title}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    )
}
