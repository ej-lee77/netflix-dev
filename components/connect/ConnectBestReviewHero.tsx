"use client";

import { useEffect, useMemo, useState } from "react";
import "./scss/connectSection.scss";
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
    title: "블랙 팬서: 와칸다 포에버",
    posterUrl:
      "https://image.tmdb.org/t/p/w500/4LaJseYluZxp4Odlisd1Zb4RWHR.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/83H0C66AcvkwpG2738VCTHMY9uv.jpg",
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
    posterUrl:
      "https://image.tmdb.org/t/p/w500/f1i6kynpQDXcXxyZU5fpG9AwbKz.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/bBFpkBVlOR2qeT6oE3W9uPkfNOr.jpg",
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
    posterUrl:
      "https://image.tmdb.org/t/p/w500/t7F6s18frvtkCnciCQeIOqzz9Tu.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/vW016VDPIzzEgDzrC19xJ7pAoqg.jpg",
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
    posterUrl:
      "https://image.tmdb.org/t/p/w500/i1pkFRi96SsIqat5vIoFHCwysv1.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/aIKxC8mGq44EUDLPYw1ckCwciqz.jpg",
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
    title: "폴: 600미터",
    posterUrl:
      "https://image.tmdb.org/t/p/w500/uyiALGPVtVsrTY4YHSq2osSYls5.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/hT3OqvzMqCQuJsUjZnQwA5NuxgK.jpg",
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
    posterUrl:
      "https://image.tmdb.org/t/p/w500/9gaN2j0yWeS7Te9Wjia7Pw3EBq1.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/ynx5rhctJ9L2yYZzI0G60ADAmt9.jpg",
    expectedRating: 3.8,
    releaseDate: "2022. 10. 26",
    reservationRate: "8%",
    audience: "73만명",
    review: {
      text: "감춰진 진실을 따라갈수록 인물의 표정이 다르게 보인다.",
      author: "송경원",
    },
  },
  {
    rank: 7,
    title: "아바타: 물의 길",
    posterUrl:
      "https://image.tmdb.org/t/p/w500/u2aVXft5GLBQnjzWVNda7sdDpdu.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/kJsPVzdyBrYHLomuNv5SJDXUQ2f.jpg",
    expectedRating: 4.6,
    releaseDate: "2022. 12. 14",
    reservationRate: "41%",
    audience: "1080만명",
    review: {
      text: "바다의 깊이를 빌려 가족과 세계를 다시 크게 펼쳐낸다.",
      author: "임수연",
    },
  },
  {
    rank: 8,
    title: "영웅",
    posterUrl:
      "https://image.tmdb.org/t/p/w500/ty2BX4V4ZBAg2ApG2WMmVYKwB1t.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/wgiVj0H81KBpfUzcixmKdELhGW6.jpg",
    expectedRating: 4.0,
    releaseDate: "2022. 12. 21",
    reservationRate: "15%",
    audience: "327만명",
    review: {
      text: "무대의 감정과 영화의 규모가 만나는 순간들이 또렷하다.",
      author: "장영엽",
    },
  },
  {
    rank: 9,
    title: "탄생",
    posterUrl:
      "https://image.tmdb.org/t/p/w500/hpxeGXdaXKqRdyZOjo1GhVEAtRp.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/qWxJ2iCQ24lsQgIZde0HEE0m4XR.jpg",
    expectedRating: 3.7,
    releaseDate: "2022. 11. 30",
    reservationRate: "6%",
    audience: "35만명",
    review: {
      text: "한 인물의 걸음을 따라 시대의 결을 차분하게 짚는다.",
      author: "정시우",
    },
  },
  {
    rank: 10,
    title: "오늘 밤, 세계에서 이 사랑이 사라진다 해도",
    posterUrl:
      "https://image.tmdb.org/t/p/w500/5NJmR3IA7Rk3inlA4AeQy5ZC5cA.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/7FbPSOxJs4c3AUU3CycPpiQMMSR.jpg",
    expectedRating: 4.2,
    releaseDate: "2022. 11. 30",
    reservationRate: "5%",
    audience: "118만명",
    review: {
      text: "사라지는 기억보다 오래 남는 마음을 맑게 건져 올린다.",
      author: "김소미",
    },
  },
];

export default function ConnectBestReviewHero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeCommentIndex, setActiveCommentIndex] = useState(0);
  const [isCommentTransitioning, setIsCommentTransitioning] = useState(true);
  const activeMovie = bestReviewMovies[activeIndex];
  const activeComments = useMemo(
    () => [
      activeMovie.review,
      {
        text: `${activeMovie.title}의 장면들이 오래 곱씹히는 감정으로 남는다.`,
        author: "박혜은",
      },
      {
        text: "익숙한 장르 안에서도 리듬과 인물의 온도가 분명하다.",
        author: "정재현",
      },
      {
        text: "관객이 기대한 순간을 놓치지 않고 끝까지 밀어붙인다.",
        author: "최지은",
      },
      {
        text: "완성도보다 먼저 마음을 움직이는 결정적인 한 장면이 있다.",
        author: "오동진",
      },
    ],
    [activeMovie],
  );
  const renderedComments = useMemo(
    () => [...activeComments, activeComments[0]],
    [activeComments],
  );
  const visibleMovies = Array.from({ length: 5 }, (_, index) => {
    const nextIndex = (activeIndex + index + 1) % bestReviewMovies.length;

    return bestReviewMovies[nextIndex];
  });

  const move = (direction: -1 | 1) => {
    setActiveIndex(
      (index) =>
        (index + direction + bestReviewMovies.length) % bestReviewMovies.length,
    );
  };

  const selectMovie = (rank: number) => {
    const nextIndex = bestReviewMovies.findIndex(
      (movie) => movie.rank === rank,
    );

    if (nextIndex >= 0) {
      setActiveIndex(nextIndex);
    }
  };

  const resetCommentSlider = () => {
    setIsCommentTransitioning(false);
    setActiveCommentIndex(0);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setIsCommentTransitioning(true);
      });
    });
  };

  useEffect(() => {
    resetCommentSlider();
  }, [activeIndex]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIsCommentTransitioning(true);
      setActiveCommentIndex((index) => index + 1);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [activeComments.length]);

  const handleCommentTransitionEnd = () => {
    if (activeCommentIndex < activeComments.length) return;

    resetCommentSlider();
  };

  return (
    <section
      className="connect-section connect-best-review-hero"
      aria-label="베스트 리뷰 작품"
    >
      <div
        className="connect-best-review-hero__backdrop"
        style={{ backgroundImage: `url(${activeMovie.backdropUrl})` }}
      />

      <div className="connect-section__inner connect-best-review-hero__inner">
        <div
          className="connect-best-review-hero__featured"
          key={activeMovie.rank}
        >
          <div className="connect-best-review-hero__heading">
            <span>{activeMovie.rank}</span>
            <h1>{activeMovie.title}</h1>
            <em>
              예상 ★ <b>{activeMovie.expectedRating.toFixed(1)}</b>
            </em>
          </div>

          <div className="connect-best-review-hero__poster">
            <img
              src={activeMovie.posterUrl}
              alt={`${activeMovie.title} 포스터`}
            />
          </div>
        </div>

        <div className="connect-best-review-hero__content">
          <div className="connect-best-review-hero__top">
            <div className="connect-best-review-hero__review">
              <div className="connect-best-review-hero__review-head">
                <strong>베스트 코멘트</strong>
                <div aria-hidden="true">
                  {activeComments.map((comment, index) => (
                    <i
                      className={
                        index === activeCommentIndex % activeComments.length
                          ? "active"
                          : ""
                      }
                      key={`${comment.author}-${index}`}
                    />
                  ))}
                </div>
              </div>

              <figure className="connect-review-spotlight__quote connect-best-review-hero__quote">
                <div
                  className="connect-best-review-hero__comment-track"
                  onTransitionEnd={handleCommentTransitionEnd}
                  style={{
                    transform: `translateX(-${activeCommentIndex * 100}%)`,
                    transition: isCommentTransitioning
                      ? "transform 0.45s ease"
                      : "none",
                  }}
                >
                  {renderedComments.map((comment, index) => (
                    <div
                      className="connect-best-review-hero__comment"
                      key={`${comment.author}-${comment.text}-${index}`}
                    >
                      <blockquote>{comment.text}</blockquote>
                      <figcaption>{comment.author}</figcaption>
                    </div>
                  ))}
                </div>
              </figure>
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

          <div
            className="connect-best-review-hero__ranking"
            key={activeMovie.rank}
          >
            {visibleMovies.map((movie) => (
              <button
                className={`connect-best-review-hero__card${
                  movie.rank === activeMovie.rank ? " active" : ""
                }`}
                key={movie.rank}
                onClick={() => selectMovie(movie.rank)}
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
