"use client";

import { useState } from "react";
import { SimilarUser, useFollowStore } from "@/store/useFollowStore";
import { useAuthStore } from "@/store/useAuthStore";

type Props = {
    user: SimilarUser;
};

export default function RisingReviewCard({ user }: Props) {
    const [posterFailed, setPosterFailed] = useState(false);
    const [loading, setLoading] = useState(false);
    const { currentProfile } = useAuthStore();
    const { follow, unfollow } = useFollowStore();

    const isFollowing = currentProfile?.community?.following?.includes(user.userId) ?? false;

    const initials = (user.nickname ?? "").slice(0, 2).toUpperCase() || "?";

    const handleFollowToggle = async () => {
        if (loading) return;
        setLoading(true);
        try {
            if (isFollowing) {
                await unfollow(user.userId);
            } else {
                await follow(user.userId);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="review-card">
            <div className="review-card__glow" />

            <div className="review-card__content">
                <div className="review-card__user-row">
                    <div className="review-card__profile">
                        {user.imgUrl ? (
                            <img
                                src={user.imgUrl}
                                alt={user.nickname}
                                className="review-card__avatar"
                            />
                        ) : (
                            <div className="review-card__avatar review-card__avatar--text">
                                {initials}
                            </div>
                        )}

                        <div>
                            <h3>{user.nickname}</h3>
                            {user.followersCount > 0 && (
                                <p className="review-card__followers">팔로워 {user.followersCount}명</p>
                            )}
                            {user.matchRate > 0 && (
                                <p>취향 매칭률 {user.matchRate}%</p>
                            )}
                        </div>
                    </div>

                    <button
                        className={`review-card__follow${isFollowing ? " review-card__follow--active" : ""}`}
                        type="button"
                        onClick={handleFollowToggle}
                        disabled={loading}
                    >
                        {loading ? "···" : isFollowing ? "팔로잉" : "팔로우"}
                    </button>
                </div>

                {user.tags.length > 0 && (
                    <div className="review-card__tags">
                        {user.tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                        ))}
                    </div>
                )}

                <div className="review-card__movie-row">
                    {user.favoriteMovie.title && (
                        <div className="review-card__movie">
                            <div className="review-card__poster">
                                {posterFailed || !user.favoriteMovie.poster ? (
                                    <div className="review-card__poster-fallback">
                                        <span>N</span>
                                        <strong>{user.favoriteMovie.title}</strong>
                                    </div>
                                ) : (
                                    <img
                                        src={user.favoriteMovie.poster}
                                        alt={user.favoriteMovie.title}
                                        onError={() => setPosterFailed(true)}
                                    />
                                )}
                            </div>

                            <div className="review-card__movie-text">
                                {user.matchRate > 0 && (
                                    <p className="review-card__predicted-rating">
                                        예상 ★{(user.matchRate / 100 * 5).toFixed(1)}
                                    </p>
                                )}
                                <p>{user.favoriteMovie.description}</p>
                                <h4>{user.favoriteMovie.title}</h4>
                            </div>
                        </div>
                    )}

                    <div className="review-card__analysis-badge">
                        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                            <rect x="2" y="14" width="4" height="8" rx="1" />
                            <rect x="9" y="9" width="4" height="13" rx="1" />
                            <rect x="16" y="4" width="4" height="18" rx="1" />
                        </svg>
                        취향분석
                    </div>
                </div>
            </div>
        </div>
    );
}
