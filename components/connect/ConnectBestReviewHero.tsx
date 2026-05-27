"use client";

import { useState } from "react";
import "./scss/connectReviewSpotlight.scss";
import "./scss/connectBestReviewHero.scss";

type BestReviewMovie = {
  rank: number;
  title: string;
  posterUrl: string;
  backdropUrl: string;
  expectedRating: number;
  releaseDate: string;
  reservationRate: string;
  audience: string;
  review: {
    text: string;
    author: string;
  };
};

const bestReviewMovies: BestReviewMovie[] = [
  {
    rank: 1,
    title: "블랙팬서: 와칸다 포에버",
    posterUrl: "https://image.tmdb.org/t/p/w500/sv1xJUazXeYqALzczSZ3O6nkH75.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/xDMIl84Qo5Tsu62c9DGWhmPI67A.jpg",
    expectedRating: 4.5,
    releaseDate: "2022. 11. 20",
    reservationRate: "38%",
    audience: "185만명",
    review: {
      text: "정말 오랜만에 제대로 장전한 원기옥 한방. 티찰라 포에버.",
      author: "김성훈",
    },
  },
  {
    rank: 2,
    title: "동감",
    posterUrl: "https://image.tmdb.org/t/p/w500/mK7H4MO31xWwJukHqJML5ZKn3vA.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/yY76zq9XSuJ4nWyPDuwkdV7Wt0c.jpg",
    expectedRating: 4.1,
    releaseDate: "2022. 11. 16",
    reservationRate: "22%",
    audience: "48만명",
    review: {
      text: "서로 다른 시간이 조심스럽게 겹쳐지는 순간이 좋다.",
      author: "유지나",
    },
  },
  {
    rank: 3,
    title: "데시벨",
    posterUrl: "https://image.tmdb.org/t/p/w500/6yQh8C3c1nJYfFppRop1kBYLXmq.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/pbrkL804c8yAv3zBZR4QPEafpAR.jpg",
    expectedRating: 4.0,
    releaseDate: "2022. 11. 16",
    reservationRate: "18%",
    audience: "90만명",
    review: {
      text: "소리 하나로 긴장을 밀어붙이는 방식이 꽤 선명하다.",
      author: "박평식",
    },
  },
  {
    rank: 4,
    title: "올빼미",
    posterUrl: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/iopYFB1b6Bh7FWZh3onQhph1sih.jpg",
    expectedRating: 4.4,
    releaseDate: "2022. 11. 23",
    reservationRate: "17%",
    audience: "332만명",
    review: {
      text: "어둠을 보는 인물의 시선으로 궁중 미스터리를 단단하게 조인다.",
      author: "이동진",
    },
  },
  {
    rank: 5,
    title: "폴",
    posterUrl: "https://image.tmdb.org/t/p/w500/spCAxD99U1A6jsiePFoqdEcY0dG.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/53BC9F2tpZnsGno2cLhzvGprDYS.jpg",
    expectedRating: 3.9,
    releaseDate: "2022. 11. 16",
    reservationRate: "11%",
    audience: "83만명",
    review: {
      text: "간단한 설정을 끝까지 밀고 가는 고소공포 스릴의 힘.",
      author: "정유미",
    },
  },
  {
    rank: 6,
    title: "자백",
    posterUrl: "https://image.tmdb.org/t/p/w500/aGBuiirBIQ7o64FmJxO53eYDuro.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/tIX6j3NzadlwGcJ52nuWdmtOQkg.jpg",
    expectedRating: 3.8,
    releaseDate: "2022. 10. 26",
    reservationRate: "8%",
    audience: "73만명",
    review: {
      text: "감춰진 진실을 따라갈수록 인물의 표정이 다르게 보인다.",
      author: "송경원",
    },
  },
];

export default function ConnectBestReviewHero() {
  const [activeRank, setActiveRank] = useState(bestReviewMovies[0].rank);
  const activeMovie =
    bestReviewMovies.find((movie) => movie.rank === activeRank) ??
    bestReviewMovies[0];

  const move = (direction: -1 | 1) => {
    setActiveRank((rank) => {
      const currentIndex = bestReviewMovies.findIndex(
        (movie) => movie.rank === rank,
      );
      const nextIndex =
        (currentIndex + direction + bestReviewMovies.length) %
        bestReviewMovies.length;

      return bestReviewMovies[nextIndex].rank;
    });
  };

  return (
    <section className="connect-best-review-hero" aria-label="베스트 리뷰 작품">
      <div
        className="connect-best-review-hero__backdrop"
        style={{ backgroundImage: `url(${activeMovie.backdropUrl})` }}
      />

      <div className="connect-best-review-hero__inner">
        <div className="connect-best-review-hero__featured">
          <div className="connect-best-review-hero__heading">
            <span>{activeMovie.rank}</span>
            <h1>{activeMovie.title}</h1>
            <em>
              예상 ★ <b>{activeMovie.expectedRating.toFixed(1)}</b>
            </em>
          </div>

          <div className="connect-best-review-hero__poster">
            <img src={activeMovie.posterUrl} alt={`${activeMovie.title} 포스터`} />
          </div>
        </div>

        <div className="connect-best-review-hero__content">
          <div className="connect-best-review-hero__top">
            <div className="connect-best-review-hero__review">
              <div className="connect-best-review-hero__review-head">
                <strong>베스트 코멘트</strong>
                <div aria-hidden="true">
                  <i />
                  <i className="active" />
                  <i />
                  <i />
                  <i />
                </div>
              </div>

              <div className="connect-review-spotlight__reviews connect-best-review-hero__reviews">
                <figure className="connect-review-spotlight__quote connect-best-review-hero__quote">
                  <blockquote>{activeMovie.review.text}</blockquote>
                  <figcaption>{activeMovie.review.author}</figcaption>
                </figure>
              </div>
            </div>

            <dl className="connect-best-review-hero__stats">
              <div>
                <dt>개봉일</dt>
                <dd>{activeMovie.releaseDate}</dd>
              </div>
              <div>
                <dt>예매율</dt>
                <dd>{activeMovie.reservationRate}</dd>
              </div>
              <div>
                <dt>누적관객</dt>
                <dd>{activeMovie.audience}</dd>
              </div>
            </dl>
          </div>

          <div className="connect-best-review-hero__ranking">
            {bestReviewMovies.slice(1).map((movie) => (
              <button
                className={`connect-best-review-hero__card${
                  movie.rank === activeMovie.rank ? " active" : ""
                }`}
                key={movie.rank}
                onClick={() => setActiveRank(movie.rank)}
                type="button"
              >
                <span>{movie.rank}</span>
                <strong>{movie.title}</strong>
                <img src={movie.posterUrl} alt={`${movie.title} 포스터`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        className="connect-best-review-hero__arrow connect-best-review-hero__arrow--prev"
        onClick={() => move(-1)}
        type="button"
        aria-label="이전 작품"
      >
        ‹
      </button>
      <button
        className="connect-best-review-hero__arrow connect-best-review-hero__arrow--next"
        onClick={() => move(1)}
        type="button"
        aria-label="다음 작품"
      >
        ›
      </button>
    </section>
  );
}
