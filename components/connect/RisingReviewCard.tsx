"use client";

import { useState } from "react";
import { ConnectUser } from "@/data/connectUser";

type RisingReviewCardProps = {
    user: ConnectUser;
};

export default function RisingReviewCard({ user }: RisingReviewCardProps) {
    const [posterFailed, setPosterFailed] = useState(false);

    return (
        <div className="review-card">
            <div className="review-card__glow" />

            <div className="review-card__content">
                <div className="review-card__user-row">
                    <div className="review-card__profile">
                        <img
                            src={user.profileImage}
                            alt={user.nickname}
                            className="review-card__avatar"
                        />

                        <div>
                            <h3>{user.nickname}</h3>
                            <p>취향 매칭률 {user.matchRate}%</p>
                        </div>
                    </div>

                    <button className="review-card__follow" type="button">
                        팔로우
                    </button>
                </div>

                <div className="review-card__tags">
                    {user.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                    ))}
                </div>

                <div className="review-card__movie-row">
                    <div className="review-card__movie">
                        <div className="review-card__poster">
                            {posterFailed ? (
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
                            <p>{user.favoriteMovie.description}</p>
                            <h4>{user.favoriteMovie.title}</h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
