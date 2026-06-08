"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import SectionTitle from "../common/SectionTitle";
import { fetchUpcomingItems, type UpcomingItem } from "@/lib/upcoming";
import "./scss/release.scss";

const SIZE_CYCLE = ["tall", "short", "short", "tall"] as const;
type CardSize = typeof SIZE_CYCLE[number];

function getColCount(width: number): number {
  if (width >= 2560) return 6;
  if (width >= 1920) return 5;
  if (width >= 1280) return 4;
  if (width >= 768) return 3;
  if (width >= 640) return 2;
  return 1;
}

export default function Release() {
  const [colCount, setColCount] = useState(3);
  const [upcomings, setUpcomings] = useState<UpcomingItem[]>([]);

  useEffect(() => {
    let ignore = false;

    fetchUpcomingItems()
      .then((items) => {
        if (!ignore) setUpcomings(items);
      })
      .catch((error) => {
        console.error("공개예정 TMDB 요청 실패:", error);
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const update = () => setColCount(getColCount(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const cards = upcomings.slice(0, colCount * 2);

  return (
    <section className="release-section">
      <div className="section-title-outer">
        <SectionTitle title="공개예정 미리보기" subTitle="새로운 작품들을 시청해보세요" href="/release" />
      </div>
      <div className="release-masonry">
        {cards.map((movie, index) => {
          const size: CardSize = SIZE_CYCLE[index % SIZE_CYCLE.length];
          return (
            <Link
              key={`${movie.media_type}-${movie.id}`}
              href={`/detail/${movie.media_type}/${movie.id}?upcoming=1`}
              className={`release-card card-${size}`}
            >
              <img
                src={`https://image.tmdb.org/t/p/w780${movie.backdrop_path}`}
                alt={movie.title}
                className="card-image"
              />
              <div className="card-overlay" />
              <div className="card-info">
                <h3 className="card-title">{movie.title}</h3>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
