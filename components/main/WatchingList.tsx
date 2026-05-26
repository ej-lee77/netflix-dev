"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePlayListStore } from '@/store/usePlayListStore';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import './css/watchingList.scss';

/**
 * 시청중(Watching) 섹션
 * - Firebase에 저장된 시청기록(playList)을 가로 스와이프 카드로 표시
 * - 각 카드 하단에 시청률(progress bar) 표시
 * - 실제 시청률 데이터가 PlayListItem에 없으므로, 임시로 id 기반 의사난수로 채워 시각화 (추후 progress 필드 추가 시 교체)
 */
export default function WatchingList() {
    const { playList, onLoadPlayList } = usePlayListStore();

    useEffect(() => {
        onLoadPlayList();
    }, []);

    //임시 시청률 계산기: 실제 진행률 필드가 생기기 전까지 시각용
    //id를 시드로 사용해서 새로고침해도 같은 값이 유지되도록 함
    const getProgress = (id: number) => {
        return 15 + (id % 80); // 15% ~ 94% 범위
    };

    //시청기록이 비어있을 때는 섹션 자체를 노출하지 않음
    if (!playList || playList.length === 0) return null;

    return (
        <section className="watching-section">
            <h2 className="section-title">시청중</h2>

            <Swiper
                modules={[Navigation]}
                navigation
                slidesPerView={6}
                spaceBetween={12}
                slidesPerGroup={6}
                className="watching-swiper"
            >
                {playList.map((item) => {
                    const progress = getProgress(item.id);
                    return (
                        <SwiperSlide key={`${item.mediaType}-${item.id}`}>
                            <Link href={`/detail/${item.mediaType}/${item.id}`} className="watching-card">
                                <div className="watching-thumb">
                                    <img
                                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                                        alt={item.title}
                                    />
                                    {/* 시청률 진행바 */}
                                    <div className="progress-bar">
                                        <span
                                            className="progress-fill"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                                <h3 className="watching-title">{item.title}</h3>
                            </Link>
                        </SwiperSlide>
                    );
                })}
            </Swiper>
        </section>
    );
}
