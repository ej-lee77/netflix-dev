"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchUpcomingItems, type UpcomingItem } from "@/lib/upcoming";
import "../scss/release.scss";

type PeriodType = "week" | "month" | "all";

const getItemKey = (item: UpcomingItem) => `${item.media_type}-${item.id}`;

export default function ReleasePage() {
  const [upcomings, setUpcomings] = useState<UpcomingItem[]>([]);
  const [period, setPeriod] = useState<PeriodType>("all");
  const [notifySet, setNotifySet] = useState<Set<string>>(new Set());

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

  const now = new Date();
  const filtered = upcomings.filter((item) => {
    const release = new Date(item.release_date);
    const diff = (release.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (period === "week") return diff >= 0 && diff <= 7;
    if (period === "month") return diff >= 0 && diff <= 30;
    return diff >= 0;
  });

  const featured = filtered[0];
  const others = filtered.slice(1);

  const handleNotify = (item: UpcomingItem, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const itemKey = getItemKey(item);
    setNotifySet((current) => {
      const next = new Set(current);
      if (next.has(itemKey)) next.delete(itemKey);
      else next.add(itemKey);
      return next;
    });
  };

  const getDday = (dateStr: string) => {
    const release = new Date(dateStr);
    const diff = Math.ceil((release.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return "D-Day";
    return `D-${diff}`;
  };

  return (
    <div className="release-page">
      {featured && (
        <div className="release-hero">
          <img
            src={`https://image.tmdb.org/t/p/original${featured.backdrop_path}`}
            alt={featured.title}
            className="hero-bg"
          />
          <div className="hero-overlay" />
          <div className="hero-content inner">
            <div className="hero-eyebrow">
              <span className="dday">{getDday(featured.release_date)}</span>
              <span>공개 예정</span>
            </div>
            <h1>{featured.title}</h1>
            <p className="hero-meta">{featured.release_date}</p>
            <div className="hero-actions">
              <Link href={`/detail/${featured.media_type}/${featured.id}?upcoming=1`} className="btn-primary">
                자세히 보기
              </Link>
              <button
                className={`btn-notify ${notifySet.has(getItemKey(featured)) ? "active" : ""}`}
                onClick={(event) => handleNotify(featured, event)}
              >
                {notifySet.has(getItemKey(featured)) ? "알림 설정됨" : "알림받기"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="inner">
        <div className="page-head">
          <h2>공개 예정 작품</h2>
          <p>메인 공개예정 미리보기와 같은 기준의 작품들을 모아봤어요.</p>
        </div>

        <div className="period-filter">
          <button className={period === "all" ? "active" : ""} onClick={() => setPeriod("all")}>
            전체
          </button>
          <button className={period === "week" ? "active" : ""} onClick={() => setPeriod("week")}>
            이번 주
          </button>
          <button className={period === "month" ? "active" : ""} onClick={() => setPeriod("month")}>
            이번 달
          </button>
        </div>

        {others.length > 0 ? (
          <div className="release-grid">
            {others.map((item) => (
              <Link
                key={getItemKey(item)}
                href={`/detail/${item.media_type}/${item.id}?upcoming=1`}
                className="release-card"
              >
                <div className="thumb">
                  <img src={`https://image.tmdb.org/t/p/w300${item.poster_path}`} alt={item.title} />
                  <span className="dday-badge">{getDday(item.release_date)}</span>
                </div>
                <div className="info">
                  <button
                    className={`notify-btn ${notifySet.has(getItemKey(item)) ? "active" : ""}`}
                    onClick={(event) => handleNotify(item, event)}
                  >
                    {notifySet.has(getItemKey(item)) ? "알림 설정됨" : "알림받기"}
                  </button>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">해당 기간의 공개 예정 작품이 없습니다.</div>
        )}
      </div>
    </div>
  );
}
