"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePlayListStore } from '@/store/usePlayListStore';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import './scss/watchingList.scss';
import SectionTitle from '../common/SectionTitle';

/**
 * 시청중(Watching) 섹션
 * - Firebase에 저장된 시청기록(playList)을 가로 스와이프 카드로 표시
 * - 각 카드 하단에 시청률(progress bar) 표시
 */
export default function WatchingList() {
    const { playList, onLoadPlayList } = usePlayListStore();

    useEffect(() => {
        onLoadPlayList();
    }, []);

    //시청기록이 비어있을 때는 섹션 자체를 노출하지 않음
    if (!playList || playList.length === 0) return null;

    return (
        <section className="watching-section">
            <div className="section-title-outer">
                <SectionTitle title="시청중" href="/mypage/playlist" />
            </div>

            <div className="watching-swiper-wrap">
                <Swiper
                    modules={[Navigation]}
                    navigation
                    slidesPerView={6}
                    spaceBetween={12}
                    slidesPerGroup={6}
                    className="watching-swiper"
                >
                    {playList.map((item) => {
                        return (
                            <SwiperSlide key={`${item.mediaType}-${item.id}`}>
                                <Link href={`/detail/${item.mediaType}/${item.id}?play=1`} className="watching-card">
                                    <div className="watching-thumb">
                                        <img
                                            src={item.backdrop_path
                                                ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
                                                : `https://image.tmdb.org/t/p/w500${item.poster_path}`}
                                            alt={item.title}
                                        />
                                        <div className="watching-play-overlay">
                                            <div className="watching-play-btn">▶</div>
                                        </div>
                                        {/* 실제 시청 진행바 */}
                                        <div className="progress-bar">
                                            <span
                                                className="progress-fill"
                                                style={{ width: `${item.progress ?? 0}%` }}
                                            />
                                        </div>
                                    </div>
                                    <h3 className="watching-title">{item.title}</h3>
                                </Link>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </div>
        </section>
    );
}