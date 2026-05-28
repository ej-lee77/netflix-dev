"use client";

import { useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "./scss/connectReviewSpotlight.scss";
import SectionTitle from "../common/SectionTitle";

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
      { author: "민지", text: "시간 구조가 복잡하지만 계속 생각나게 만드는 영화예요." },
      { author: "이동진 평론가", text: "시각적이고 지적인 쾌감으로 끝까지 밀어붙이는 작품." },
      { author: "DXRE", text: "이해하려 하지 말고 먼저 느끼면 더 재밌어요." },
    ],
    connectPointTitle: "Connect Point!",
    connectPointLines: [
      "복잡한 시간 구조와 높은 평점을 선호하는 취향",
      "크리스토퍼 놀란 감독 스타일과 잘 맞는 작품",
      "선호 태그: 시간 여행, 두뇌 싸움, 액션",
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
      { author: "다서", text: "우주보다 크게 남는 건 결국 가족의 시간이에요." },
      { author: "김시오", text: "차갑고 거대한 이미지 안에 감정이 끝까지 흐릅니다." },
      { author: "J", text: "다시 봐도 사운드와 감정선이 압도적이에요." },
    ],
    connectPointTitle: "Connect Point!",
    connectPointLines: [
      "SF와 드라마를 함께 좋아하는 취향",
      "긴 러닝타임 안에서 몰입감이 높은 작품",
      "선호 태그: 우주, 가족, 생존",
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
      { author: "이나", text: "세계관을 설명하기보다 체험하게 만드는 영화예요." },
      { author: "민재", text: "사막의 질감과 음악만으로도 충분히 압도적입니다." },
      { author: "CINE", text: "후속편을 기다리게 만드는 첫 장." },
    ],
    connectPointTitle: "Connect Point!",
    connectPointLines: [
      "웅장한 영상미를 선호하는 취향",
      "세계관 중심의 시리즈를 좋아하는 사용자",
      "선호 태그: 판타지, 권력, 운명",
    ],
  },
];

export default function ConnectReviewSpotlight({ items = defaultItems }: ConnectReviewSpotlightProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const sidePreview = useMemo(() => {
    const prev = items[(activeIndex - 1 + items.length) % items.length];
    const next = items[(activeIndex + 1) % items.length];
    return { prev, next };
  }, [activeIndex, items]);

  if (!items.length) return null;

  return (
    <section className="connect-review-spotlight" aria-label="커넥트 영화 리뷰 추천">
      <SectionTitle
        title="커넥트 리뷰 spotlight"
        subTitle="주목받는 리뷰와 영화를 확인해보세요"
      />

      <div className="connect-review-spotlight__swiper-shell">
        <Swiper
          modules={[Navigation]}
          navigation
          loop={items.length > 1}
          slidesPerView={1}
          spaceBetween={24}
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          className="connect-review-spotlight__swiper"
        >
          {items.map((item) => (
            <SwiperSlide key={item.id} className="connect-review-spotlight__slide">
              <article
                className="connect-review-spotlight__panel"
                style={{ backgroundImage: `url(${item.backdropUrl})` }}
              >
                <div className="connect-review-spotlight__side connect-review-spotlight__side--prev" aria-hidden="true">
                  {sidePreview.prev.title}
                </div>
                <div className="connect-review-spotlight__side connect-review-spotlight__side--next" aria-hidden="true">
                  {sidePreview.next.title}
                </div>

                <div className="connect-review-spotlight__header">
                  <h2>
                    {item.title} ({item.year})
                  </h2>
                  {/* <span>예상 {item.expectedRating.toFixed(1)}</span>
                  <span>평균 {item.averageRating.toFixed(1)}</span> */}
                </div>

                <div className="connect-review-spotlight__content">
                  <div className="connect-review-spotlight__poster">
                    <img src={item.posterUrl} alt={`${item.title} 포스터`} />
                  </div>

                  <div className="connect-review-spotlight__reviews">
                    {item.reviews.map((review) => (
                      <figure className="connect-review-spotlight__quote" key={`${review.author}-${review.text}`}>
                        <blockquote>{review.text}</blockquote>
                        <figcaption>{review.author}</figcaption>
                      </figure>
                    ))}
                  </div>

                  <div className="connect-review-spotlight__point">
                    <h3>{item.connectPointTitle}</h3>
                    <ul>
                      {item.connectPointLines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <p className="connect-review-spotlight__prompt">내 취향과 맞는 리뷰를 더 찾아볼까요?</p>
    </section>
  );
}
