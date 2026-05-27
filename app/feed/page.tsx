"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useMovieStore } from "@/store/useMovieStore";
import "../scss/feed.scss";

type FilterType = "all" | "review" | "playlist" | "watch";

interface FeedPost {
  id: number;
  type: "review" | "playlist" | "watch";
  friend: string;
  action: string;
  time: string;
  mediaId?: number;
  mediaType?: "movie" | "tv";
  mediaTitle?: string;
  mediaPoster?: string;
  mediaMeta?: string;
  stars?: string;
  reviewText?: string;
  playlistName?: string;
  playlistCount?: number;
  likes: number;
  comments: number;
  liked: boolean;
  commentsList?: { name: string; text: string }[];
}

export default function FeedPage() {
  const { popMovies, tvs, onFetchPopular, onFetchTvs } = useMovieStore();
  const [filter, setFilter] = useState<FilterType>("all");
  const [posts, setPosts] = useState<FeedPost[]>([]);

  useEffect(() => {
    if (popMovies.length === 0) onFetchPopular();
    if (tvs.length === 0) onFetchTvs();
  }, []);

  useEffect(() => {
    if (popMovies.length === 0 || tvs.length === 0) return;

    // TMDB 데이터로 피드 생성
    const samplePosts: FeedPost[] = [
      {
        id: 1,
        type: "review",
        friend: "친구A",
        action: "리뷰를 작성했어요",
        time: "2시간 전",
        mediaId: popMovies[0].id,
        mediaType: "movie",
        mediaTitle: popMovies[0].title,
        mediaPoster: popMovies[0].poster_path,
        mediaMeta: `스릴러 · ${popMovies[0].release_date?.slice(0, 4)} · ⭐ ${popMovies[0].vote_average.toFixed(1)}`,
        stars: "★★★★★",
        reviewText:
          "이번 시즌은 정말 다른 차원이에요. 첫 화부터 빠져들었고, 매주 다음 화를 기다리느라 힘들 정도. 연기·연출·음악 다 완벽.",
        likes: 132,
        comments: 14,
        liked: true,
        commentsList: [
          { name: "친구B", text: "저도 보고 있어요 ㅋㅋ 진짜 미쳤음" },
          { name: "친구C", text: "이거 시즌2도 기대됩니다" },
        ],
      },
      {
        id: 2,
        type: "playlist",
        friend: "친구B",
        action: "플레이리스트를 공유했어요",
        time: "5시간 전",
        playlistName: "비 오는 날 베스트 모음 ☔",
        playlistCount: 12,
        likes: 45,
        comments: 7,
        liked: false,
      },
      {
        id: 3,
        type: "watch",
        friend: "친구C",
        action: "시리즈를 완주했어요",
        time: "어제",
        mediaId: tvs[0].id,
        mediaType: "tv",
        mediaTitle: `${tvs[0].name} · 시즌 완주`,
        mediaPoster: tvs[0].backdrop_path,
        mediaMeta: `미스터리 · 평점 ★★★★★`,
        likes: 23,
        comments: 3,
        liked: false,
      },
      {
        id: 4,
        type: "review",
        friend: "친구D",
        action: "리뷰를 작성했어요",
        time: "2일 전",
        mediaId: popMovies[1].id,
        mediaType: "movie",
        mediaTitle: popMovies[1].title,
        mediaPoster: popMovies[1].poster_path,
        mediaMeta: `드라마 · ${popMovies[1].release_date?.slice(0, 4)}`,
        stars: "★★★★☆",
        reviewText: "전체적으로 만족스럽지만 중반부 페이스가 살짝 늘어지는 느낌. 그래도 마지막 두 화는 정말 강렬해요.",
        likes: 67,
        comments: 8,
        liked: false,
      },
    ];

    setPosts(samplePosts);
  }, [popMovies, tvs]);

  const handleLike = (id: number) => {
    setPosts(
      posts.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
      )
    );
  };

  const filtered = filter === "all" ? posts : posts.filter((p) => p.type === filter);

  // 추천 친구 (popMovies에서 따와서 만들기)
  const recommendFriends = [
    { name: "추천친구1", meta: "취향 일치 92%" },
    { name: "추천친구2", meta: "친구 3명 공통" },
    { name: "추천친구3", meta: "취향 일치 87%" },
  ];

  return (
    <div className="feed-page">
      <div className="inner">
        <div className="page-head">
          <h1>피드</h1>
          <p>친구들의 시청 활동과 리뷰를 한눈에</p>
        </div>

        <div className="filter-chips">
          <button className={filter === "all" ? "chip active" : "chip"} onClick={() => setFilter("all")}>
            전체
          </button>
          <button className={filter === "review" ? "chip active" : "chip"} onClick={() => setFilter("review")}>
            리뷰
          </button>
          <button
            className={filter === "playlist" ? "chip active" : "chip"}
            onClick={() => setFilter("playlist")}
          >
            플레이리스트
          </button>
          <button className={filter === "watch" ? "chip active" : "chip"} onClick={() => setFilter("watch")}>
            시청 활동
          </button>
        </div>

        <div className="feed-layout">
          {/* 메인 피드 */}
          <div className="feed-main">
            {filtered.map((post) => (
              <article key={post.id} className="feed-post">
                <header className="post-head">
                  <div className="post-avatar"></div>
                  <div className="post-meta">
                    <h3>{post.friend}</h3>
                    <div className="post-info">
                      <span className="action-tag">{post.action}</span>
                      <span className="sep">·</span>
                      <span className="time">{post.time}</span>
                    </div>
                  </div>
                  <button className="post-more">⋯</button>
                </header>

                {/* 리뷰 본문 */}
                {post.type === "review" && (
                  <div className="post-body review-body">
                    <Link
                      href={`/detail/${post.mediaType}/${post.mediaId}`}
                      className="thumb"
                    >
                      {post.mediaPoster && (
                        <img
                          src={`https://image.tmdb.org/t/p/w300${post.mediaPoster}`}
                          alt={post.mediaTitle}
                        />
                      )}
                    </Link>
                    <div className="review-info">
                      <h4>{post.mediaTitle}</h4>
                      <p className="meta">{post.mediaMeta}</p>
                      <div className="stars">{post.stars}</div>
                      <p className="review-text">{post.reviewText}</p>
                    </div>
                  </div>
                )}

                {/* 플레이리스트 본문 */}
                {post.type === "playlist" && (
                  <div className="post-body playlist-body">
                    <div className="playlist-mosaic">
                      <div className="m1"></div>
                      <div className="m2"></div>
                      <div className="m3"></div>
                    </div>
                    <h4>{post.playlistName}</h4>
                    <p className="meta">{post.playlistCount}편 · 잔잔한 무드의 작품들</p>
                  </div>
                )}

                {/* 시청 활동 본문 */}
                {post.type === "watch" && (
                  <div className="post-body watch-body">
                    <Link
                      href={`/detail/${post.mediaType}/${post.mediaId}`}
                      className="watch-thumb"
                    >
                      {post.mediaPoster && (
                        <img
                          src={`https://image.tmdb.org/t/p/w500${post.mediaPoster}`}
                          alt={post.mediaTitle}
                        />
                      )}
                      <div className="play-icon">▶</div>
                    </Link>
                    <div className="watch-info">
                      <h4>{post.mediaTitle}</h4>
                      <p className="meta">{post.mediaMeta}</p>
                    </div>
                  </div>
                )}

                <div className="post-actions">
                  <button
                    className={`action ${post.liked ? "liked" : ""}`}
                    onClick={() => handleLike(post.id)}
                  >
                    {post.liked ? "♥" : "♡"} {post.likes}
                  </button>
                  <button className="action">💬 {post.comments}</button>
                  <button className="action">↗ 공유</button>
                  <button className="action">＋ {post.type === "playlist" ? "저장" : "찜"}</button>
                </div>

                {/* 댓글 미리보기 (리뷰만) */}
                {post.commentsList && post.commentsList.length > 0 && (
                  <div className="post-comments">
                    {post.commentsList.map((c, i) => (
                      <div key={i} className="comment-item">
                        <div className="comment-avatar"></div>
                        <p>
                          <strong>{c.name}</strong> {c.text}
                        </p>
                      </div>
                    ))}
                    <input type="text" className="comment-input" placeholder="댓글 작성..." />
                  </div>
                )}
              </article>
            ))}
          </div>

          {/* 사이드바 */}
          <aside className="feed-side">
            <div className="side-block">
              <div className="side-h">
                <h3>알 수도 있는 친구</h3>
                <Link href="/friends" className="more">더보기</Link>
              </div>
              {recommendFriends.map((f) => (
                <div key={f.name} className="side-friend">
                  <div className="avatar"></div>
                  <div className="info">
                    <h4>{f.name}</h4>
                    <p>{f.meta}</p>
                  </div>
                  <button className="follow-btn">＋</button>
                </div>
              ))}
            </div>

            <div className="side-block">
              <div className="side-h">
                <h3>실시간 인기 리뷰</h3>
              </div>
              {popMovies.slice(0, 3).map((m) => (
                <Link key={m.id} href={`/detail/movie/${m.id}`} className="trend-item">
                  <h4>{m.title}</h4>
                  <p>★★★★★ · {Math.floor(Math.random() * 1500 + 500)}명이 좋아함</p>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
