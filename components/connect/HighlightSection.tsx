"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useMovieStore } from "@/store/useMovieStore";

import "./scss/netflixHighlights.scss";

const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

export default function HighlightSection() {
    const { netflixHighlights, onFetchNetflixHighlights } = useMovieStore();
    const [activeId, setActiveId] = useState<number | null>(null);

    useEffect(() => {
        onFetchNetflixHighlights();
    }, [onFetchNetflixHighlights]);

    return (
        <section className="netflix-highlights" aria-label="Netflix highlights">
            <div className="netflix-highlights__brand">
                <Image
                    src="/images/connect/highlight-logo.png"
                    alt="Netflix Highlights"
                    width={260}
                    height={174}
                    priority={false}
                />
            </div>

            <div className="netflix-highlights__grid">
                {netflixHighlights.slice(0, 5).map((item) => {
                    const isActive = activeId === item.id;

                    return (
                        <article
                            className="netflix-highlights__card"
                            key={`${item.movieId}-${item.videoKey}`}
                            onMouseEnter={() => setActiveId(item.id)}
                            onMouseLeave={() => setActiveId(null)}
                            onFocus={() => setActiveId(item.id)}
                            onBlur={() => setActiveId(null)}
                            tabIndex={0}
                        >
                            <img
                                src={`${POSTER_BASE}${item.poster_path}`}
                                alt={`${item.title} 포스터`}
                            />

                            {isActive && (
                                <iframe
                                    src={`https://www.youtube.com/embed/${item.videoKey}?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=${item.videoKey}`}
                                    title={`${item.title} ${item.videoName}`}
                                    allow="autoplay; encrypted-media; picture-in-picture"
                                />
                            )}

                            <div className="netflix-highlights__shade" />
                            <div className="netflix-highlights__meta">
                                <span>{item.videoType}</span>
                                <h3>{item.title}</h3>
                                <p>{item.videoName}</p>
                            </div>
                        </article>
                    );
                })}

                {netflixHighlights.length === 0 &&
                    Array.from({ length: 5 }).map((_, index) => (
                        <div className="netflix-highlights__card netflix-highlights__card--skeleton" key={index} />
                    ))}
            </div>
        </section>
    );
}
