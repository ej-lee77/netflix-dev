"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppIcon from "@/components/common/AppIcon";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { useFollowStore } from "@/store/useFollowStore";
import { BADGE_LIST } from "@/data/badge";
import { filters } from "../../category/page";
import { dummyPlaylists } from "@/data/dummyPlaylist";
import BackButton from "@/components/common/BackButton";
import "../../scss/mypage.scss";
import "./userDetail.scss";

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_IMG = "https://image.tmdb.org/t/p/w342";

interface TargetProfile {
  profileId: number;
  nickname: string;
  imgUrl: string;
  movies?: any;
  community?: any;
  badges?: any;
}

interface PlaylistCard {
  listId: string;
  name: string;
  count: number;
  isShare: boolean;
  posters: string[];
}

// videoIds 는 "movie-123" / "tv-456" 형태 → 포스터 경로 반환
async function fetchPosterByKey(key: string): Promise<string> {
  try {
    const [mediaType, id] = key.split("-");
    if (!mediaType || !id) return "";
    const res = await fetch(
      `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${TMDB_KEY}&language=ko-KR`,
    );
    const data = await res.json();
    return data.poster_path ? `${TMDB_IMG}${data.poster_path}` : "";
  } catch {
    return "";
  }
}

export default function UserDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = (params?.userId as string) ?? "";
  const profileIdParam = searchParams.get("profileId");

  const { currentProfile } = useAuthStore();
  const { follow, unfollow } = useFollowStore();

  const [target, setTarget] = useState<TargetProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistCard[]>([]);

  // 대상 유저 문서 로드 (profile[0] 기준)
  useEffect(() => {
    if (!userId) return;
    let ignore = false;
    setLoading(true);
    setNotFound(false);

    (async () => {
      try {
        // 더미 유저(dummy-*)는 Firestore 에 없으므로 로컬 더미 데이터로 실제 유저처럼 구성
        if (userId.startsWith("dummy")) {
          const idx = dummyPlaylists.findIndex((p) => p.userId === userId);
          const d = idx >= 0 ? dummyPlaylists[idx] : null;
          if (!d) {
            if (!ignore) { setNotFound(true); setLoading(false); }
            return;
          }
          // 무드 태그 → 무드 id + 파생 장르로 시청취향 통계 구성
          const genreStats: Record<string, number> = {};
          const baseGenre = d.category === "애니메이션" ? "16" : "18";
          genreStats[baseGenre] = 6;
          d.tags.forEach((tag, i) => {
            const m = filters.mood.find((x) => x.label === tag);
            if (!m) return;
            genreStats[m.id] = (genreStats[m.id] ?? 0) + (5 - i);
            (m.query?.with_genres ?? "")
              .split(",")
              .filter(Boolean)
              .forEach((gid) => {
                genreStats[gid] = (genreStats[gid] ?? 0) + (4 - i);
              });
          });
          if (ignore) return;
          setTarget({
            profileId: 1000 + idx,
            nickname: d.nickname,
            imgUrl: d.posters[0] ?? "",
            movies: { watchingVideos: d.videoIds, genreStats },
            community: {
              followers: Array.from({ length: 12 + idx * 3 }),
              following: [],
              reviews: d.videoIds.map((v, i) => ({ reviewId: `${userId}-r${i}`, videoId: v })),
            },
            badges: { equippedBadges: "", earnedBadges: [] },
          });
          setLoading(false);
          return;
        }

        const snap = await getDoc(doc(db, "users", userId));
        if (!snap.exists()) {
          if (!ignore) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }
        const profiles = snap.data().profile ?? [];
        const p =
          profiles.find(
            (profile: { id?: number | string }) =>
              String(profile.id) === profileIdParam,
          ) ?? profiles[0];
        if (!p) {
          if (!ignore) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }
        if (ignore) return;
        setTarget({
          profileId: p.id ?? 0,
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
  }, [profileIdParam, userId]);

  // 대상 유저의 커스텀 플레이리스트(playlists/{userId}) 로드 + 각 카드용 포스터
  useEffect(() => {
    if (!target) return;
    let ignore = false;

    (async () => {
      try {
        // 더미는 자신의 플레이리스트를 로컬 데이터에서 바로 구성
        if (userId.startsWith("dummy")) {
          const d = dummyPlaylists.find((p) => p.userId === userId);
          if (!ignore) {
            setPlaylists(
              d
                ? [{
                    listId: d.listId,
                    name: d.name,
                    count: d.videoIds.length,
                    isShare: d.isShare,
                    posters: d.posters.slice(0, 4),
                  }]
                : [],
            );
          }
          return;
        }

        const snap = await getDoc(doc(db, "playlists", userId));
        if (!snap.exists()) {
          if (!ignore) setPlaylists([]);
          return;
        }
        const all: any[] = snap.data().playlists ?? [];
        // 이 프로필이 만든 플레이리스트만
        const mine = all.filter((p) => p.profileId === target.profileId);

        const cards = await Promise.all(
          mine.map(async (p) => {
            const ids: string[] = (p.videoIds ?? []).slice(0, 4);
            const posters = (await Promise.all(ids.map(fetchPosterByKey))).filter(Boolean);
            return {
              listId: p.listId,
              name: p.name ?? "제목 없음",
              count: (p.videoIds ?? []).length,
              isShare: !!p.isShare,
              posters,
            } as PlaylistCard;
          }),
        );

        if (!ignore) setPlaylists(cards);
      } catch {
        if (!ignore) setPlaylists([]);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [target, userId]);

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

  if (loading) {
    return (
      <div className="mypage user-detail-page">
        <div className="inner">
          <BackButton fallback="/friends" />
          <div className="profile-summary user-detail-skeleton">
            <div className="profile-avatar user-detail-skeleton__avatar" />
            <div className="profile-info">
              <div className="user-detail-skeleton__line user-detail-skeleton__line--name" />
              <div className="user-detail-skeleton__button" />
            </div>
            <div className="profile-stats">
              {Array.from({ length: 5 }).map((_, index) => (
                <div className="stat user-detail-skeleton__stat" key={index}>
                  <div className="user-detail-skeleton__line user-detail-skeleton__line--value" />
                  <div className="user-detail-skeleton__line user-detail-skeleton__line--label" />
                </div>
              ))}
            </div>
          </div>

          <section className="section-block user-detail-skeleton__section">
            <div className="section-h">
              <div className="user-detail-skeleton__line user-detail-skeleton__line--heading" />
            </div>
            <div className="udp-playlist-row">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="udp-playlist-card user-detail-skeleton__playlist" key={index}>
                  <div className="udp-collage" />
                  <div className="udp-playlist-meta">
                    <div className="user-detail-skeleton__line" />
                    <div className="user-detail-skeleton__line user-detail-skeleton__line--short" />
                  </div>
                </div>
              ))}
            </div>
          </section>
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
          {playlists.length > 0 ? (
            <div className="udp-playlist-row">
              {playlists.map((pl) => (
                <Link
                  key={pl.listId}
                  href={`/playlist/${userId}/${pl.listId}`}
                  className="udp-playlist-card"
                >
                  <div className="udp-collage">
                    {pl.posters.length > 0 ? (
                      pl.posters.map((src, j) => <img key={j} src={src} alt="" />)
                    ) : (
                      <div className="udp-collage-empty" />
                    )}
                  </div>
                  <div className="udp-playlist-meta">
                    <h3>{pl.name}</h3>
                    <span>{pl.count}개 작품</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-block">아직 만든 플레이리스트가 없어요</div>
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
                    <AppIcon name="bulb" size={15} /> 주로 <strong>{genreMoodStats.topGenre?.name}</strong> 장르와{" "}
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
