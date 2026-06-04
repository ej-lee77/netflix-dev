"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/firebase/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeedStore } from "@/store/useFeedStore";
import { getInitial, getPosterUrl, getRelativeTime } from "@/types/feedData";
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
  const router = useRouter();
  const { user, currentProfile } = useAuthStore();
  const {
    reviews,
    onAddComment,
    onDeleteComment,
    onHydrateReviews,
    onToggleLike,
    onUpdateComment,
  } = useFeedStore();
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const currentUserId =
    user?.userId ||
    (user as { uid?: string } | null)?.uid ||
    auth.currentUser?.uid;

  const review = useMemo(
    () => reviews.find((item) => item.feedId === params.id) ?? null,
    [params.id, reviews],
  );

  useEffect(() => {
    void onHydrateReviews();
  }, [currentProfile?.id, currentUserId, onHydrateReviews]);

  const handleSubmitComment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!review || !commentText.trim()) return;
    if (!currentUserId) {
      window.alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }
    if (!currentProfile) {
      window.alert("프로필을 선택해 주세요.");
      return;
    }

    if (editingCommentId) {
      void onUpdateComment(review.feedId, editingCommentId, commentText.trim());
      setEditingCommentId(null);
      setCommentText("");
      return;
    }

    const now = new Date().toISOString();
    const nextComment = {
      commentId: "",
      userId: currentUserId,
      profileId: currentProfile.id,
      content: commentText.trim(),
      reportsCount: 0,
      likesCount: 0,
      createdAt: now,
      updatedAt: now,
      isDelete: false,
    };

    void onAddComment(review.feedId, nextComment);
    setCommentText("");
  };

  const handleOpenEditComment = (commentId: string, text: string) => {
    setEditingCommentId(commentId);
    setCommentText(text);
  };

  const handleDeleteComment = (commentId: string) => {
    if (!review) return;

    void onDeleteComment(review.feedId, commentId);
    if (editingCommentId === commentId) {
      setEditingCommentId(null);
      setCommentText("");
    }
  };

  const handleCopyShareLink = () => {
    if (!review) return;

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
    void navigator.clipboard.writeText(
      `${window.location.origin}/feed/${review.feedId}`,
    );
  };
  const requireFeedAuth = () => {
    if (!currentUserId) {
      window.alert("로그인이 필요합니다.");
      router.push("/login");
      return false;
    }
    if (!currentProfile) {
      window.alert("프로필을 선택해 주세요.");
      return false;
    }

    return true;
  };

  const handleLike = (feedId: string) => {
    if (!requireFeedAuth()) return;

    void onToggleLike(feedId);
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
              {review.authorImage ? (
                <img src={review.authorImage} alt="" />
              ) : (
                getInitial(review.author)
              )}
            </div>
            <div className="post-meta">
              <h3>{review.author}</h3>
              <div className="post-info">
                <span className="time">
                  {getRelativeTime(review.createdAt)}
                </span>
                {!review.isPublic && (
                  <span className="private-tag">비공개</span>
                )}
              </div>
            </div>
            <div className="detail-rating">
              {renderRatingStars(review.rating)}
              <em>{review.rating.toFixed(1)}</em>
            </div>
          </div>

          <div className="post-body review-body">
            <Link
              href={`/detail/${review.mediaType}/${review.mediaId}`}
              className="thumb"
            >
              {review.mediaPoster && (
                <img
                  src={getPosterUrl(review.mediaPoster)}
                  alt={review.mediaTitle}
                />
              )}
            </Link>
            <div className="review-info">
              <h4>{review.mediaTitle}</h4>
              <p className="meta">{review.mediaMeta}</p>
              <p className="review-text">{review.content}</p>
            </div>
          </div>

          <div className="post-actions">
            <button
              type="button"
              className={`action ${review.liked ? "liked" : ""}`}
              onClick={() => handleLike(review.feedId)}
            >
              {review.liked ? "♥" : "♡"} {review.likesCount}
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

          <form
            className="comment-write detail-comment-write"
            onSubmit={handleSubmitComment}
          >
            <input
              type="text"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="댓글을 입력해 주세요"
            />
            <button type="submit" disabled={!commentText.trim()}>
              {editingCommentId ? "수정" : "등록"}
            </button>
          </form>

          <div className="comment-list detail-comment-list">
            {review.commentsList.length > 0 ? (
              review.commentsList.map((comment) => (
                <div className="comment-item" key={comment.commentId}>
                  <div className="comment-avatar">
                    {comment.authorImage ? (
                      <img src={comment.authorImage} alt="" />
                    ) : (
                      getInitial(comment.author)
                    )}
                  </div>
                  <div className="comment-content">
                    <div className="comment-meta">
                      <strong>{comment.author}</strong>
                      <span>
                        {getRelativeTime(
                          comment.updatedAt || comment.createdAt,
                        )}
                      </span>
                    </div>
                    <p>{comment.content}</p>
                    <div className="comment-actions">
                      <button type="button">좋아요 {comment.likesCount}</button>
                      {comment.isMine && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenEditComment(
                                comment.commentId,
                                comment.content,
                              )
                            }
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="comment-delete-btn"
                            onClick={() =>
                              handleDeleteComment(comment.commentId)
                            }
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
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
