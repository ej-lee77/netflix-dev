"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMovieStore } from '@/store/useMovieStore';
import type { TV } from '@/types/movie';
import './css/originalBanner.scss';

interface Props {
  //한 작품을 통째로 받음
  tv: TV;
  //카드 개수 (와이어프레임 기준 7)
  pieces?: number;
}

/**
 * 오리지널 하단 조각 배너 (단일 작품 버전)
 * - 평상시: tv.backdrop_path 한 장을 7조각으로 잘라서 깔아둠
 * - 호버 시: 같은 작품의 다른 스틸컷이 카드별로 표시됨 (tvImages 캐시에서 가져옴)
 */
export default function OriginalBanner({ tv, pieces = 7 }: Props) {
  const { tvImages, onFetchTvImages } = useMovieStore();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  //이 작품의 스틸컷들 미리 받아오기
  useEffect(() => {
    if (tv?.id) onFetchTvImages(tv.id);
  }, [tv?.id]);

  if (!tv) return null;

  //배경에 깔 메인 배너 (이 작품의 backdrop)
  const mainBanner = tv.backdrop_path
    ? `https://image.tmdb.org/t/p/original${tv.backdrop_path}`
    : '';

  //이 작품의 스틸컷 배열
  const stills = tvImages[tv.id] || [];

  //카드 배열 생성
  const cards = Array.from({ length: pieces });

  return (
    <div className="original-banner">
      {cards.map((_, idx) => {
        //이 카드에 대응되는 스틸컷: 스틸컷이 부족하면 모듈로로 순환
        let hoverImg = '';
        if (stills.length > 0) {
          const still = stills[idx % stills.length];
          hoverImg = `https://image.tmdb.org/t/p/original${still.file_path}`;
        } else if (tv.backdrop_path) {
          hoverImg = mainBanner;
        }

        //전체 배너에서 이 카드가 보여줄 영역의 가로 위치 (0% ~ 100%)
        const positionX = pieces > 1 ? (idx / (pieces - 1)) * 100 : 50;

        return (
          <Link
            key={idx}
            href={`/detail/tv/${tv.id}`}
            className={`banner-piece ${hoverIdx === idx ? 'is-hover' : ''}`}
            onMouseEnter={() => setHoverIdx(idx)}
            onMouseLeave={() => setHoverIdx(null)}
          >
            {/* 평상시: 메인 배너의 일부분 */}
            <div
              className="banner-piece-bg"
              style={{
                backgroundImage: `url(${mainBanner})`,
                backgroundPosition: `${positionX}% center`,
              }}
            />

            {/* 호버 시: 같은 작품의 다른 스틸컷 */}
            <div
              className="banner-piece-hover"
              style={{
                backgroundImage: `url(${hoverImg})`,
              }}
            />
          </Link>
        );
      })}
    </div>
  );
}