"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { auth } from "@/firebase/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeedStore } from "@/store/useFeedStore";
import { getPosterUrl } from "../feedData";
import "../../scss/feed.scss";

const BEST_REVIEWER_BADGE_IMAGE = "/images/badge/social_review_master.png";
const BEST_REVIEWER_BADGE_ALT = "베스트 리뷰어";

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
  const { user, currentProfile } = useAuthStore();
  const { reviews, onAddComment, onDeleteComment, onHydrateReviews, onUpdateComment } = useFeedStore();
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const review = useMemo(() => (
    reviews.find((item) => String(item.id) === params.id) ?? null
  ), [params.id, reviews]);
  const viewerUid = user?.uid || user?.userId || auth.currentUser?.uid || "";
  const viewerProfileId = currentProfile?.id ?? null;
  const viewerName = currentProfile?.nickname || user?.email?.split("@")[0] || "나";
  const viewerInitial = viewerName.slice(0, 1) || "나";
  const isSameAuthor = (authorUid?: string, authorProfileId?: number | null) => (
    Boolean(viewerUid) &&
    authorUid === viewerUid &&
    (authorProfileId == null || viewerProfileId == null || authorProfileId === viewerProfileId)
  );
  const isCommentOwner = (comment: NonNullable<typeof review>["commentsList"][number]) => (
    isSameAuthor(comment.authorUid, comment.authorProfileId) ||
    (
      !comment.authorUid &&
      comment.authorProfileId === viewerProfileId &&
      (comment.author === viewerName || comment.author === "나")
    ) ||
    (
      !comment.authorUid &&
      comment.isMine === true &&
      (comment.authorProfileId == null || comment.authorProfileId === viewerProfileId)
    ) ||
    (
      !comment.authorUid &&
      comment.authorProfileId == null &&
      comment.author === "나"
    )
  );
  const isReviewOwner = (
    isSameAuthor(review?.authorUid, review?.authorProfileId) ||
    (
      !review?.authorUid &&
      review?.authorProfileId === viewerProfileId &&
      (review?.author === viewerName || review?.author === "나")
    ) ||
    (
      !review?.authorUid &&
      review?.isMine === true &&
      (review?.authorProfileId == null || review?.authorProfileId === viewerProfileId)
    ) ||
    (
      !review?.authorUid &&
      review?.authorProfileId == null &&
      review?.author === "나"
    )
  );
  const getDisplayAuthor = (author: string, isOwner: boolean) => (
    isOwner ? "나" : author
  );

  useEffect(() => {
    onHydrateReviews();
  }, [onHydrateReviews]);

  const handleSubmitComment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!review || !commentText.trim()) return;

    if (editingCommentId) {
      onUpdateComment(review.id, editingCommentId, commentText.trim());
      setEditingCommentId(null);
      setCommentText("");
      return;
    }

    // const nextCommentId = review.commentsList.reduce((maxId, comment) => (
    //   Math.max(maxId, comment.id)
    // ), review.id * 100);

    const nextComment = {
      //id: nextCommentId + 1,
      id: `local-comment-${crypto.randomUUID()}`,
      author: viewerName,
      avatarInitial: viewerInitial,
      avatarImage: currentProfile?.imgUrl,
      authorUid: viewerUid,
      authorProfileId: viewerProfileId,
      time: "방금 전",
      text: commentText.trim(),
      likes: 0,
      liked: false,
    };

    onAddComment(review.id, nextComment);
    setCommentText("");
  };

  const handleOpenEditComment = (commentId: string, text: string) => {
    setEditingCommentId(commentId);
    setCommentText(text);
  };

  const handleDeleteComment = (commentId: string) => {
    if (!review) return;

    onDeleteComment(review.id, commentId);
    if (editingCommentId === commentId) {
      setEditingCommentId(null);
      setCommentText("");
    }
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
              <h3>
                {getDisplayAuthor(review.author, isReviewOwner)}
                {review.isBestReviewer && (
                  <img className="reviewer-badge" src={BEST_REVIEWER_BADGE_IMAGE} alt={BEST_REVIEWER_BADGE_ALT} />
                )}
              </h3>
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
              {editingCommentId ? "수정" : "등록"}
            </button>
          </form>

          <div className="comment-list detail-comment-list">
            {review.commentsList.length > 0 ? (
              review.commentsList.map((comment) => {
                const commentOwner = isCommentOwner(comment);

                return (
                <div className="comment-item" key={comment.id}>
                  <div className="comment-avatar">
                    {comment.avatarImage ? <img src={comment.avatarImage} alt="" /> : comment.avatarInitial}
                  </div>
                  <div className="comment-content">
                    <div className="comment-meta">
                      <strong>
                        {getDisplayAuthor(comment.author, commentOwner)}
                        {comment.isBestReviewer && (
                          <img className="reviewer-badge" src={BEST_REVIEWER_BADGE_IMAGE} alt={BEST_REVIEWER_BADGE_ALT} />
                        )}
                      </strong>
                      <span>{comment.time}</span>
                    </div>
                    <p>{comment.text}</p>
                    <div className="comment-actions">
                      <button type="button">좋아요 {comment.likes}</button>
                      {commentOwner && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEditComment(comment.id, comment.text)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="comment-delete-btn"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                );
              })
            ) : (
              <div className="comment-empty">아직 댓글이 없어요.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
