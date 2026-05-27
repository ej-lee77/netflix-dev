"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useMovieStore } from "@/store/useMovieStore";
import "../scss/release.scss";

type PeriodType = "week" | "month" | "all";

export default function ReleasePage() {
  const { upcomings, onFetchUpcoming } = useMovieStore();
  const [period, setPeriod] = useState<PeriodType>("all");
  const [notifySet, setNotifySet] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (upcomings.length === 0) onFetchUpcoming();
  }, []);

  // 기간별 필터
  const now = new Date();
  const filtered = upcomings.filter((m) => {
    if (!m.release_date) return false;
    const release = new Date(m.release_date);
    if (period === "all") return true;
    const diff = (release.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (period === "week") return diff >= 0 && diff <= 7;
    if (period === "month") return diff >= 0 && diff <= 30;
    return true;
  });

  const featured = filtered[0];
  const others = filtered.slice(1);

  const handleNotify = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = new Set(notifySet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setNotifySet(next);
  };

  const getDday = (dateStr?: string) => {
    if (!dateStr) return "";
    const release = new Date(dateStr);
    const diff = Math.ceil((release.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "공개됨";
    if (diff === 0) return "D-Day";
    return `D-${diff}`;
  };

  return (
    <div className="release-page">
      {/* 히어로 */}
      {featured && (
        <div className="release-hero">
          {featured.backdrop_path && (
            <img
              src={`https://image.tmdb.org/t/p/original${featured.backdrop_path}`}
              alt={featured.title}
              className="hero-bg"
            />
          )}
          <div className="hero-overlay"></div>
          <div className="hero-content inner">
            <div className="hero-eyebrow">
              <span className="dday">{getDday(featured.release_date)}</span>
              <span>공개 예정</span>
            </div>
            <h1>{featured.title}</h1>
            <p className="hero-meta">
              {featured.release_date} · ⭐ {featured.vote_average.toFixed(1)}
            </p>
            <p className="hero-overview">{featured.overview}</p>
            <div className="hero-actions">
              <Link href={`/detail/movie/${featured.id}`} className="btn-primary">
                자세히 보기
              </Link>
              <button
                className={`btn-notify ${notifySet.has(featured.id) ? "active" : ""}`}
                onClick={(e) => handleNotify(featured.id, e)}
              >
                🔔 {notifySet.has(featured.id) ? "알림 설정됨" : "공개 알림 받기"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="inner">
        <div className="page-head">
          <h2>공개 예정 작품</h2>
          <p>곧 만나볼 수 있는 작품들을 미리 확인하고 알림을 설정하세요</p>
        </div>

        <div className="period-filter">
          <button className={period === "all" ? "active" : ""} onClick={() => setPeriod("all")}>
            전체
          </button>
          <button className={period === "week" ? "active" : ""} onClick={() => setPeriod("week")}>
            이번 주
          </button>
          <button className={period === "month" ? "active" : ""} onClick={() => setPeriod("month")}>
            한 달 내
          </button>
        </div>

        {others.length > 0 ? (
          <div className="release-grid">
            {others.map((m) => (
              <Link key={m.id} href={`/detail/movie/${m.id}`} className="release-card">
                <div className="thumb">
                  {m.poster_path && (
                    <img src={`https://image.tmdb.org/t/p/w300${m.poster_path}`} alt={m.title} />
                  )}
                  <span className="dday-badge">{getDday(m.release_date)}</span>
                </div>
                <div className="info">
                  <h3>{m.title}</h3>
                  <p className="date">{m.release_date}</p>
                  <button
                    className={`notify-btn ${notifySet.has(m.id) ? "active" : ""}`}
                    onClick={(e) => handleNotify(m.id, e)}
                  >
                    🔔 {notifySet.has(m.id) ? "알림 설정됨" : "알림 받기"}
                  </button>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">해당 기간에 공개 예정인 작품이 없어요</div>
        )}
      </div>
    </div>
  );
}
