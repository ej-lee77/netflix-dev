"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeedStore } from "@/store/useFeedStore";
import { getPosterUrl } from "../feedData";
import "../../scss/feed.scss";

const renderRatingStars = (rating: number) => (
  <span className="rating-stars" aria-label={`${rating.toFixed(1)}점`}>
    {[1, 2, 3, 4, 5].map((star) => {
      const fillPercent = Math.max(0, Math.min(1, rating - (star - 1))) * 100;

      return (
        <span
          className="rating-star"
          key={star}
          style={{ "--fill": `${fillPercent}%` } as React.CSSProperties}
          aria-hidden="true"
        >
          ★
        </span>
      );
    })}
  </span>
);

export default function FeedDetailPage() {
  const params = useParams<{ id: string }>();
  const { currentProfile } = useAuthStore();
  const { reviews, onAddComment } = useFeedStore();
  const [commentText, setCommentText] = useState("");
  const [copied, setCopied] = useState(false);

  const review = useMemo(() => (
    reviews.find((item) => String(item.id) === params.id) ?? null
  ), [params.id, reviews]);

  const handleSubmitComment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!review || !commentText.trim()) return;
    const nextCommentId = review.commentsList.reduce((maxId, comment) => (
      Math.max(maxId, comment.id)
    ), review.id * 100);

    const nextComment = {
      id: nextCommentId + 1,
      author: "나",
      avatarInitial: "나",
      avatarImage: currentProfile?.imgUrl,
      time: "방금 전",
      text: commentText.trim(),
      likes: 0,
      liked: false,
    };

    onAddComment(review.id, nextComment);
    setCommentText("");
  };

  const handleCopyShareLink = () => {
    if (!review) return;

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
    void navigator.clipboard.writeText(`${window.location.origin}/feed/${review.id}`);
  };

  if (!review) {
    return (
      <main className="feed-page feed-detail-page">
        <div className="inner">
          <div className="feed-detail-empty">
            <h1>피드를 찾을 수 없어요.</h1>
            <Link href="/feed">피드로 돌아가기</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="feed-page feed-detail-page">
      <div className="inner">
        <Link href="/feed" className="feed-back-link">
          피드로 돌아가기
        </Link>

        <article className="feed-post feed-detail-card">
          <div className="post-head">
            <div className="post-avatar">
              {review.avatarImage ? <img src={review.avatarImage} alt="" /> : review.avatarInitial}
            </div>
            <div className="post-meta">
              <h3>{review.author}</h3>
              <div className="post-info">
                <span className="time">{review.time}</span>
                {!review.public && <span className="private-tag">비공개</span>}
              </div>
            </div>
            <div className="detail-rating">
              {renderRatingStars(review.rating)}
              <em>{review.rating.toFixed(1)}</em>
            </div>
          </div>

          <div className="post-body review-body">
            <Link href={`/detail/${review.mediaType}/${review.mediaId}`} className="thumb">
              {review.mediaPoster && (
                <img src={getPosterUrl(review.mediaPoster)} alt={review.mediaTitle} />
              )}
            </Link>
            <div className="review-info">
              <h4>{review.mediaTitle}</h4>
              <p className="meta">{review.mediaMeta}</p>
              <p className="review-text">{review.reviewText}</p>
            </div>
          </div>

          <div className="post-actions">
            <button type="button" className={`action ${review.liked ? "liked" : ""}`}>
              {review.liked ? "♥" : "♡"} {review.likes}
            </button>
            {/* <span className="action readonly">댓글 {review.comments}</span> */}
            <button
              type="button"
              className={copied ? "action copied" : "action"}
              onClick={handleCopyShareLink}
            >
              {copied ? "복사됨" : "공유"}
            </button>
          </div>
        </article>

        <section className="feed-detail-comments">
          <div className="detail-comments-head">
            <h2>댓글 {review.comments}</h2>
          </div>

          <form className="comment-write detail-comment-write" onSubmit={handleSubmitComment}>
            <input
              type="text"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="댓글을 입력해 주세요"
            />
            <button type="submit" disabled={!commentText.trim()}>
              등록
            </button>
          </form>

          <div className="comment-list detail-comment-list">
            {review.commentsList.length > 0 ? (
              review.commentsList.map((comment) => (
                <div className="comment-item" key={comment.id}>
                  <div className="comment-avatar">
                    {comment.avatarImage ? <img src={comment.avatarImage} alt="" /> : comment.avatarInitial}
                  </div>
                  <div className="comment-content">
                    <div className="comment-meta">
                      <strong>{comment.author}</strong>
                      <span>{comment.time}</span>
                    </div>
                    <p>{comment.text}</p>
                    <button type="button">좋아요 {comment.likes}</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="comment-empty">아직 댓글이 없어요.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
