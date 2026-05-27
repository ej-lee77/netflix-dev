"use client";
import { useMovieStore } from '@/store/useMovieStore';
import React, { useState } from 'react';
import SectionTitle from '../common/SectionTitle';
import "./scss/newMovieList.scss"

export default function NewMovieList() {
    const { newMovies } = useMovieStore();
    const [activeIndex, setActiveIndex] = useState(5);

    const total = newMovies.length;

    return (
        <section className="new-movie-section">
            <div className="inner">
                <SectionTitle title='신작' subTitle='새로운 작품들을 시청해보세요' />
            </div>
            
            {/* 슬라이더 전체를 감싸는 뷰포트 영역 */}
            <div className="movie-list-viewport">
                <ul className="new-movie-list">
                    {newMovies.map((movie, index) => {
                        let diff = index - activeIndex;
                        if (diff > total / 2) diff -= total;
                        if (diff < -total / 2) diff += total;
                        const abs = Math.abs(diff);

                        // SCSS 분기 처리를 위해 스타일 맵을 컴포넌트에서 전달
                        const scale =
                            abs === 0 ? 1.4 :
                            abs === 1 ? 1.2 :
                            abs === 2 ? 1.1 :
                            abs === 3 ? 1 :
                            abs === 4 ? 0.9 :
                            abs === 5 ? 0.8 :
                            abs === 6 ? 0.7 : 0.6;

                        const translateX = 
                            abs > 4 ? 700 : 
                            abs > 6 ? diff * 260 : diff * 260;
                        const zIndex = 100 - abs;
                        const opacity = 
                            abs === 0 ? 1 :
                            abs > 4 ? 0 : 0.7;

                        return (
                            <li key={movie.id}>
                                <div
                                    onClick={() => setActiveIndex(index)}
                                    // abs 값에 따라 고유 클래스를 동적으로 매핑하여 SCSS에서 스타일 분기 조절
                                    className={`movie-card-item abs-${abs}`}
                                    style={{
                                        transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale})`,
                                        zIndex,
                                        opacity,
                                    }}
                                >
                                    <img
                                        src={`https://image.tmdb.org/t/p/original${movie.poster_path}`}
                                        alt={movie.title}
                                        className="poster-img"
                                    />
                                    
                                    {/* 딤드 오버레이 레이어 */}
                                    <div className="dim-overlay" />

                                    <p className="movie-title">
                                        {movie.title}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}