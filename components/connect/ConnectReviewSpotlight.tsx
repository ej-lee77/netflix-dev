"use client";

import { useMemo, useState } from "react";
import "./scss/connectReviewSpotlight.scss";

export interface ConnectReview {
  author: string;
  text: string;
}

export interface ConnectMovieSpotlight {
  id: number;
  title: string;
  year: number;
  posterUrl: string;
  backdropUrl: string;
  expectedRating: number;
  averageRating: number;
  reviews: ConnectReview[];
  connectPointTitle: string;
  connectPointLines: string[];
}

interface ConnectReviewSpotlightProps {
  items?: ConnectMovieSpotlight[];
}

const defaultItems: ConnectMovieSpotlight[] = [
  {
    id: 1,
    title: "테넷",
    year: 2020,
    posterUrl: "https://image.tmdb.org/t/p/w500/k68nPLbIST6NP96JmTxmZijEvCA.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/yY76zq9XSuJ4nWyPDuwkdV7Wt0c.jpg",
    expectedRating: 4.5,
    averageRating: 3.7,
    reviews: [
      { author: "남린", text: "이 영화는 시간이동에 대한 영화인가요?" },
      { author: "이동욱 평론가", text: "복잡한 플롯을 시각적이고 지적인 쾌감으로 전달해내는 놀란의 고유성." },
      { author: "DXRE", text: "이해하려 하지 말아요. 시간에 양보하세요." },
    ],
    connectPointTitle: "Connect Point!",
    connectPointLines: [
      "복잡한 시간 구조와 높은 평점을 받은 영화",
      "선호 감독 크리스토퍼 놀란의 대표작",
      "선호 태그 시간 여행, 두뇌 싸움",
    ],
  },
  {
    id: 2,
    title: "인터스텔라",
    year: 2014,
    posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/pbrkL804c8yAv3zBZR4QPEafpAR.jpg",
    expectedRating: 4.7,
    averageRating: 4.1,
    reviews: [
      { author: "윤서", text: "우주보다 더 크게 느껴지는 가족의 시간." },
      { author: "김태오", text: "차갑고 거대한 이미지 안에 끝까지 따뜻한 감정이 남는다." },
      { author: "J", text: "다시 봐도 사운드와 감정선이 압도적이다." },
    ],
    connectPointTitle: "Connect Point!",
    connectPointLines: [
      "SF와 드라마를 함께 좋아하는 취향",
      "긴 러닝타임에도 몰입도가 높은 작품",
      "선호 태그 우주, 가족, 생존",
    ],
  },
  {
    id: 3,
    title: "듄",
    year: 2021,
    posterUrl: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/iopYFB1b6Bh7FWZh3onQhph1sih.jpg",
    expectedRating: 4.3,
    averageRating: 3.9,
    reviews: [
      { author: "해나", text: "세계관을 설명하기보다 체험하게 만드는 영화." },
      { author: "민재", text: "사막의 질감과 음악만으로도 충분히 설득된다." },
      { author: "CINE", text: "속편을 기다리게 만드는 장대한 첫 장." },
    ],
    connectPointTitle: "Connect Point!",
    connectPointLines: [
      "웅장한 영상미를 선호하는 취향",
      "세계관 중심의 시리즈 선호",
      "선호 태그 판타지, 권력, 운명",
    ],
  },
];

export default function ConnectReviewSpotlight({ items = defaultItems }: ConnectReviewSpotlightProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex];

  const sidePreview = useMemo(() => {
    const prev = items[(activeIndex - 1 + items.length) % items.length];
    const next = items[(activeIndex + 1) % items.length];
    return { prev, next };
  }, [activeIndex, items]);

  const move = (direction: -1 | 1) => {
    setActiveIndex((index) => (index + direction + items.length) % items.length);
  };

  if (!activeItem) return null;

  return (
    <section className="connect-review-spotlight" aria-label="커넥트 영화 리뷰 추천">
      <div
        className="connect-review-spotlight__panel"
        style={{ backgroundImage: `url(${activeItem.backdropUrl})` }}
      >
        <div className="connect-review-spotlight__side connect-review-spotlight__side--prev" aria-hidden="true">
          {sidePreview.prev.title}
        </div>
        <div className="connect-review-spotlight__side connect-review-spotlight__side--next" aria-hidden="true">
          {sidePreview.next.title}
        </div>

        <div className="connect-review-spotlight__header">
          <h2>{activeItem.title} ({activeItem.year})</h2>
          {/* <span>예상 ★ {activeItem.expectedRating.toFixed(1)}</span>
          <span>평균 ★ {activeItem.averageRating.toFixed(1)}</span> */}
        </div>

        <button className="connect-review-spotlight__arrow connect-review-spotlight__arrow--left" type="button" onClick={() => move(-1)} aria-label="이전 작품">
          ‹
        </button>
        <button className="connect-review-spotlight__arrow connect-review-spotlight__arrow--right" type="button" onClick={() => move(1)} aria-label="다음 작품">
          ›
        </button>

        <div className="connect-review-spotlight__content">
          <div className="connect-review-spotlight__poster">
            <img src={activeItem.posterUrl} alt={`${activeItem.title} 포스터`} />
          </div>

          <div className="connect-review-spotlight__reviews">
            {activeItem.reviews.map((review) => (
              <figure className="connect-review-spotlight__quote" key={`${review.author}-${review.text}`}>
                <blockquote>{review.text}</blockquote>
                <figcaption>{review.author}</figcaption>
              </figure>
            ))}
          </div>

          <div className="connect-review-spotlight__point">
            <h3>{activeItem.connectPointTitle}</h3>
            <ul>
              {activeItem.connectPointLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="connect-review-spotlight__prompt">더 완벽한 추천을 바란다면?</p>
    </section>
  );
}
