"use client";
import { useMovieStore } from '@/store/useMovieStore';
import React, { useEffect } from 'react'
import "./scss/release.scss"
import SectionTitle from '../common/SectionTitle';

export default function Release() {
    const {onFetchUpcoming, upcomings} = useMovieStore();
    useEffect(()=>{
        onFetchUpcoming();
    }, []);

    // 딱 6개만 잘라서 렌더링
    const limitedUpcomings = upcomings.slice(0, 6);

    const reorderedUpcomings = [
        limitedUpcomings[0], // 1열 상단: 옵세션 (Large)
        limitedUpcomings[3], // 1열 하단: 마이클 (Small)
        limitedUpcomings[1], // 2열 상단: 모탈컴뱃 (Small)
        limitedUpcomings[4], // 2열 하단: 귀멸의 칼날 (Large)
        limitedUpcomings[2], // 3열 상단: 만달로리안 (Large)
        limitedUpcomings[5], // 3열 하단: 노멀 (Small)
    ].filter(Boolean);

    return (
        <section className="release-section">
            <div className="release-container inner">
                <SectionTitle title='공개예정 미리보기' subTitle='새로운 작품들을 시청해보세요' />
                <div className="release-masonry">
                {reorderedUpcomings.map((movie) => {
                    const originalIndex = upcomings.findIndex(item => item.id === movie.id);
                    const isLarge = originalIndex === 0 || originalIndex === 2 || originalIndex === 4;
                    const cardSizeClass = isLarge ? 'card-large' : 'card-small';

                    return (
                    <div key={movie.id} className={`release-card ${cardSizeClass}`}>
                        
                        {/* 이미지 영역 */}
                        <div className="card-image-wrap">
                            <img 
                            src={`https://image.tmdb.org/t/p/w500${movie.backdrop_path}`} 
                            alt={movie.title}
                            className="card-image"
                            />
                            <div className="card-overlay" />
                        </div>

                        {/* 텍스트 영역 */}
                        <div className="card-info">
                            <h3 className="card-title">
                            {movie.title}
                            </h3>
                            <p className="card-overview">
                            {movie.overview}
                            </p>
                        </div>
                    </div>
                )})}
                </div>
            </div>
        </section>
    )
}
