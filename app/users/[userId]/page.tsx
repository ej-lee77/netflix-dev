"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { useFollowStore } from "@/store/useFollowStore";
import { BADGE_LIST } from "@/data/badge";
import { filters } from "../../category/page";
import BackButton from "@/components/common/BackButton";
import "../../scss/mypage.scss";
import "./userDetail.scss";

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_IMG = "https://image.tmdb.org/t/p/w342";

interface TargetProfile {
  nickname: string;
  imgUrl: string;
  movies?: any;
  community?: any;
  badges?: any;
}

interface PosterItem {
  id: string;
  mediaType: "movie" | "tv";
  poster: string;
}

// 영화/시리즈 어느 쪽이든 포스터 + 미디어타입을 찾아 반환
async function fetchPoster(id: string): Promise<PosterItem | null> {
  try {
    const [movieRes, tvRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}&language=ko-KR`),
      fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_KEY}&language=ko-KR`),
    ]);
    const [movie, tv] = await Promise.all([movieRes.json(), tvRes.json()]);
    if (movie.poster_path) {
      return { id, mediaType: "movie", poster: `${TMDB_IMG}${movie.poster_path}` };
    }
    if (tv.poster_path) {
      return { id, mediaType: "tv", poster: `${TMDB_IMG}${tv.poster_path}` };
    }
    return null;
  } catch {
    return null;
  }
}

export default function UserDetailPage() {
  const params = useParams();
  const userId = (params?.userId as string) ?? "";

  const { currentProfile } = useAuthStore();
  const { follow, unfollow } = useFollowStore();

  const [target, setTarget] = useState<TargetProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [posters, setPosters] = useState<PosterItem[]>([]);

  // 대상 유저 문서 로드 (profile[0] 기준)
  useEffect(() => {
    if (!userId) return;
    let ignore = false;
    setLoading(true);
    setNotFound(false);

    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", userId));
        if (!snap.exists()) {
          if (!ignore) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }
        const p = snap.data().profile?.[0];
        if (!p) {
          if (!ignore) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }
        if (ignore) return;
        setTarget({
          nickname: p.nickname ?? "유저",
          imgUrl: p.imgUrl ?? "",
          movies: p.movies,
          community: p.community,
          badges: p.badges,
        });
        setLoading(false);
      } catch {
        if (!ignore) {
          setNotFound(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [userId]);

  // 플레이리스트(없으면 시청 중) 포스터 로드
  useEffect(() => {
    if (!target) return;
    let ignore = false;
    const ids: string[] = (
      target.movies?.playlist?.playlistVideos?.length
        ? target.movies.playlist.playlistVideos
        : target.movies?.watchingVideos ?? []
    ).slice(0, 24);

    if (ids.length === 0) {
      setPosters([]);
      return;
    }
    Promise.all(ids.map(fetchPoster)).then((res) => {
      if (!ignore) setPosters(res.filter((p): p is PosterItem => p !== null));
    });
    return () => {
      ignore = true;
    };
  }, [target]);

  const equippedBadgeName = useMemo(() => {
    const b = BADGE_LIST.find((x) => x.id === target?.badges?.equippedBadges);
    return b?.name ?? null;
  }, [target]);

  const stats = useMemo(
    () => ({
      follower: target?.community?.followers?.length ?? 0,
      following: target?.community?.following?.length ?? 0,
      review: target?.community?.reviews?.length ?? 0,
      badge: target?.badges?.earnedBadges?.filter((b: any) => b.isComplete).length ?? 0,
      watched: target?.movies?.watchingVideos?.length ?? 0,
    }),
    [target],
  );

  // 시청 취향 분석 (genreStats → 장르 TOP3 + 무드) — mypage 와 동일 로직
  const genreMoodStats = useMemo(() => {
    const s = (target?.movies?.genreStats || {}) as Record<string, number>;
    const total = Object.values(s).reduce((a, b) => a + b, 0);
    if (total === 0) return { isEmpty: true as const };

    const genres = Object.entries(s)
      .filter(([id]) => filters.genre.some((g) => g.query.with_genres?.includes(id)))
      .map(([id, count]) => {
        const gi = filters.genre.find((g) => g.query.with_genres?.includes(id));
        return {
          name: gi?.label || "기타",
          count,
          percentage: Math.round((count / total) * 100),
          color: "#6d28d9",
        };
      })
      .sort((a, b) => b.count - a.count);

    const moods = Object.entries(s)
      .filter(([id]) => filters.mood.some((m) => m.id === id))
      .map(([id, count]) => {
        const mi = filters.mood.find((m) => m.id === id);
        return {
          tag: mi?.label || "일반",
          count,
          type: "neutral",
          img: `/images/header/menu/mood-${id}.svg`,
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      isEmpty: false as const,
      genres,
      moods,
      topGenre: genres[0] || { name: "없음" },
      topMood: moods[0] || { tag: "없음" },
    };
  }, [target]);

  const isFollowing = (currentProfile?.community?.following ?? []).includes(userId);
  const isMe = currentProfile != null && userId === (useAuthStore.getState().user?.userId ?? "");

  const toggleFollow = () => {
    if (isFollowing) unfollow(userId);
    else follow(userId);
  };

  // 플레이리스트 포스터를 4개씩 묶어 콜라주 카드로
  const collages = useMemo(() => {
    const out: PosterItem[][] = [];
    for (let i = 0; i < posters.length; i += 4) out.push(posters.slice(i, i + 4));
    return out.slice(0, 8);
  }, [posters]);

  if (loading) {
    return (
      <div className="mypage user-detail-page">
        <div className="inner">
          <BackButton fallback="/friends" />
          <p style={{ padding: "40px 0", opacity: 0.6 }}>불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (notFound || !target) {
    return (
      <div className="mypage user-detail-page">
        <div className="inner">
          <BackButton fallback="/friends" />
          <p style={{ padding: "40px 0", opacity: 0.6 }}>존재하지 않는 사용자예요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mypage user-detail-page">
      <div className="inner">
        <BackButton fallback="/friends" />

        {/* 1. 프로필 정보 */}
        <div className="profile-summary">
          <div className="profile-avatar">
            <img
              src={target.imgUrl || "/images/profile/image/default_icons/17.png"}
              alt={target.nickname}
            />
          </div>

          <div className="profile-info">
            <div className="name-wrapper" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2>{target.nickname}</h2>
              {equippedBadgeName && (
                <span className="user-equipped-badge-tag">{equippedBadgeName}</span>
              )}
            </div>
            {!isMe && (
              <button
                className={`udp-follow-btn ${isFollowing ? "following" : ""}`}
                onClick={toggleFollow}
              >
                {isFollowing ? "팔로잉" : "+ 팔로우"}
              </button>
            )}
          </div>

          <div className="profile-stats">
            <div className="stat">
              <div className="value">{stats.follower}</div>
              <div className="label">팔로워</div>
            </div>
            <div className="stat">
              <div className="value">{stats.following}</div>
              <div className="label">팔로잉</div>
            </div>
            <div className="stat">
              <div className="value">{stats.review}</div>
              <div className="label">작성 리뷰</div>
            </div>
            <div className="stat">
              <div className="value">{stats.badge}</div>
              <div className="label">획득 뱃지</div>
            </div>
            <div className="stat">
              <div className="value">{stats.watched}</div>
              <div className="label">시청 완료</div>
            </div>
          </div>
        </div>

        {/* 2. 플레이리스트 */}
        <section className="section-block">
          <div className="section-h">
            <h2>{target.nickname}님의 플레이리스트</h2>
          </div>
          {collages.length > 0 ? (
            <div className="udp-playlist-row">
              {collages.map((group, i) => (
                <div className="udp-playlist-card" key={i}>
                  <div className="udp-collage">
                    {group.map((item) => (
                      <Link
                        key={item.id}
                        href={`/detail/${item.mediaType}/${item.id}`}
                        className="udp-collage-cell"
                      >
                        <img src={item.poster} alt="" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-block">아직 플레이리스트에 담은 작품이 없어요</div>
          )}
        </section>

        {/* 3. 시청 취향 분석 */}
        <section className="section-block preference-analysis-section">
          <div className="section-h">
            <h2>시청 취향 분석</h2>
            <span className="pref-subtitle">{target.nickname}님의 시청 기록 분석 결과입니다.</span>
          </div>

          <div className="analysis-grid">
            {genreMoodStats.isEmpty ? (
              <div className="empty-analysis-card">
                <h3>아직 분석할 데이터가 부족해요</h3>
                <p>이 사용자가 시청 기록을 더 쌓으면 분석이 표시돼요.</p>
              </div>
            ) : (
              <>
                <div className="analysis-card genre-card-box">
                  <h3>선호 장르 TOP 3</h3>
                  <div className="genre-chart-container">
                    <table className="genre-stat-table">
                      <thead>
                        <tr>
                          <th>순위</th>
                          <th>장르명</th>
                          <th>비율 및 그래프</th>
                          <th>시청 편수</th>
                        </tr>
                      </thead>
                      <tbody>
                        {genreMoodStats.genres?.slice(0, 3).map((g, index) => (
                          <tr key={index}>
                            <td className="rank-num">{index + 1}</td>
                            <td className="genre-name">{g.name}</td>
                            <td className="graph-td">
                              <div className="progress-bar-wrapper">
                                <div
                                  className="progress-bar-fill"
                                  style={{ width: `${g.percentage}%`, backgroundColor: g.color }}
                                ></div>
                                <span className="percent-text">{g.percentage}%</span>
                              </div>
                            </td>
                            <td className="count-text">{g.count}편</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="analysis-card mood-card-box">
                  <h3>선호하는 무드</h3>
                  <p className="mood-desc">주로 이런 감성의 작품들을 즐겨 봤어요.</p>
                  <div className="mood-tag-cloud">
                    {genreMoodStats.moods?.map((m, index) => (
                      <span key={index} className={`mood-tag-item ${m.type}`}>
                        <img src={m.img} alt={m.tag} />
                        {m.tag}
                      </span>
                    ))}
                  </div>

                  <div className="mood-summary-box">
                    💡 주로 <strong>{genreMoodStats.topGenre?.name}</strong> 장르와{" "}
                    <strong>{genreMoodStats.topMood?.tag}</strong> 분위기의 컨텐츠를 즐기는 편이에요!
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
