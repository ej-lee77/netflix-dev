"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { usePlayListStore } from "@/store/usePlayListStore";
import { useMovieStore } from "@/store/useMovieStore";
import "../scss/mypage.scss";
import { BADGE_LIST } from "@/data/badge";
import { useCommunityStore } from "@/store/useCommunityStore";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/firebase";
import { filters } from "../category/page";
import { PlayListItem } from "@/types/playList";

const GENRE_COLORS: { [key: string]: string } = {
  // DS: 강조색은 빨강 계열만 사용 (장르별 임의 색상 금지)
  "SF": "#E50914",
  "액션": "#E50914",
  "스릴러": "#E50914",
  "판타지": "#E50914",
  "드라마": "#E50914",
  "코미디": "#E50914",
  "로맨스": "#E50914",
  "다큐멘터리": "#E50914",
  "기타": "#B00710"
};

// 사용 시 함수 형태로 호출
const getGenreColor = (genreName: string) => {
  return GENRE_COLORS[genreName] || GENRE_COLORS["기타"];
};

export default function MyPage() {
  const { user, currentProfile, onLogout, toggleCommunity } = useAuthStore();
  const { playHist, onLoadPlayList } = usePlayListStore();
  const { popMovies, tvs, onFetchPopular, onFetchTvs, mediaDetails, onFetchMediaDetail, fetchMediaDetail } = useMovieStore();

  const userId = user?.userId;
  const { reviews, fetchUserReviews } = useCommunityStore();
  const [historyItems, setHistoryItems] = useState<PlayListItem[]>([]);

  // 1. 리뷰 로드 호출
  useEffect(() => {
    if (userId) fetchUserReviews();
  }, [userId, fetchUserReviews]);

  useEffect(() => {
    const loadHistory = async () => {
        const items = await getDetailedHistory(playHist);
        setHistoryItems(items);
    };
    loadHistory();
  }, [playHist]);

  // 2. 영화 상세 정보 보완
  useEffect(() => {
    reviews.forEach(review => {
      if (!mediaDetails[`movie-${review.videoId}`]) {
        onFetchMediaDetail(review.videoId, 'movie');
      }
    });
  }, [reviews, mediaDetails, onFetchMediaDetail]);

  // 스토어의 값을 기준으로 UI 판단 (true면 표시, false면 숨김)
  const isCommunityEnabled = currentProfile?.isCommunity ?? true;
  const hideCommunity = !isCommunityEnabled;

  const activeProfile = useMemo(() => {
    return currentProfile ?? user?.profile?.[0] ?? null;
  }, [currentProfile, user]);

  useEffect(() => {
    onLoadPlayList();
    if (popMovies.length === 0) onFetchPopular();
    if (tvs.length === 0) onFetchTvs();
  }, []);

  const menuIcons = useMemo(() => {
    return {
      playlist: "/images/header/menu/playlist.svg",
      genre: "/images/header/menu/genre-filter.svg",
      custom: "/images/header/menu/custom.svg",
      alarm: "/images/header/alarm.svg",
      friends: "/images/icon/icon-friends.svg",
      review: "/images/icon/icon-community.svg",
      contact: "/images/icon/icon-mail.svg",
      badge: "/images/icon/icon-badge.svg"
    };
  }, []);

  const quickMenuItems = useMemo(() => {
    const allItems = [
      { href: "/mypage/playlist", icon: menuIcons.playlist, title: "콘텐츠 관리", desc: "저장한 작품 모음", isCommunity: false },
      { href: "/mypage/community", icon: menuIcons.review, title: "커뮤니티 관리", desc: "내가 쓴 리뷰/피드", isCommunity: true },
      { href: "/menu/custom", icon: menuIcons.custom, title: "메뉴 커스텀", desc: "나만의 메뉴 커스텀", isCommunity: false },
      { href: "/alarm", icon: menuIcons.alarm, title: "알림", desc: "새로운 활동", hasDot: true, isCommunity: false },
      { href: "/friends", icon: menuIcons.friends, title: "팔로워 • 팔로잉", desc: "팔로워 및 팔로잉 관리", isCommunity: true },
      { href: "/mypage/genre", icon: menuIcons.genre, title: "장르 관리", desc: "선호/제외 장르 선택", isCommunity: false },
      { href: "/contact?tab=history", icon: menuIcons.contact, title: "문의 관리", desc: "내가 쓴 문의", isCommunity: false },
      { href: "/goods", icon: menuIcons.badge, title: "뱃지 관리", desc: "대표 칭호 및 장착 설정", isCommunity: false }
    ];

    // hideCommunity가 true(숨김)일 때 isCommunity: true인 항목 필터링
    return hideCommunity ? allItems.filter(item => !item.isCommunity) : allItems;
  }, [hideCommunity, menuIcons]); // 의존성 배열에 hideCommunity 유지

  const filteredActivities = useMemo(() => {
    const alarms = activeProfile?.alarm || [];

    return alarms
      .filter((alarm) => alarm.category === 'review' || alarm.category === 'feed')
      .slice(0, 5); // 최근 활동 5개만 표시
  }, [activeProfile]);

  // 💡 [수정] 가짜 데이터(mockUserData) 대신 실제 스토어의 activeProfile 기반 통계 계산
  const profileData = useMemo(() => {
    if (!activeProfile) {
      return {
        equippedBadgeName: null,
        stats: { follower: 0, following: 0, review: 0, badge: 0, watched: 0 }
      };
    }

    // 장착된 대표 칭호/뱃지 찾기
    const matchedBadge = BADGE_LIST.find((b) => b.id === activeProfile.bages?.equippedBadges);

    return {
      equippedBadgeName: matchedBadge ? matchedBadge.name : null,
      stats: {
        follower: activeProfile.community?.followers?.length || 0,
        following: activeProfile.community?.following?.length || 0,
        review: activeProfile.community?.reviews?.length || 0,
        badge: activeProfile.bages?.earnedBadges?.filter(b => b.isComplete).length || 0,
        watched: activeProfile.movies?.watchingVideos?.length || playHist.length || 0, // 실제 담긴 목록 카운트 바인딩
      }
    };
  }, [activeProfile, playHist]);

  // 💡 [수정] 가짜 데이터 대신 실제 활성화된 프로필의 획득 뱃지 동기화
  const displayBadgesSummary = useMemo(() => {
    if (!activeProfile || !activeProfile.bages) return [];

    const { earnedBadges, equippedBadges } = activeProfile.bages;
    const completedUserBadges = earnedBadges?.filter((b: any) => b.isComplete) || [];

    const mapped = completedUserBadges.map((userBadge: any) => {
      const master = BADGE_LIST.find((m) => m.id === userBadge.id);
      return {
        id: userBadge.id,
        name: master ? master.name : "알 수 없는 뱃지",
        title: master ? master.title : "",
        imgUrl: master ? master.imgUrl : "/images/badge/default.png",
        isEquipped: equippedBadges === userBadge.id
      };
    });

    return mapped
      .sort((a, b) => (b.isEquipped ? 1 : 0) - (a.isEquipped ? 1 : 0))
      .slice(0, 5);
  }, [activeProfile]);

  const getDetailedHistory = async (histKeys: string[]): Promise<PlayListItem[]> => {
      const detailPromises = histKeys.map(async (key) => {
          const [mediaType, id] = key.split("-");
          const data = await fetchMediaDetail(id, mediaType as "movie" | "tv");
          
          if (!data) return null;

          return {
              id: Number(id),
              title: data.title || data.name || "제목 없음",
              poster_path: data.poster_path ?? "",
              mediaType: mediaType as "movie" | "tv",
              playTime: "", 
              progress: 100,
              episodeProgress: {}
          };
      });

      const results = await Promise.all(detailPromises);
      
      return results.filter((item): item is PlayListItem => item !== null);
  };

  // const genreMoodStats = useMemo(() => {
  //   const gStats = activeProfile?.movies?.genreStats || {};
  //   const mStats = activeProfile?.movies?.moodStats || {};

  //   const totalCount = Object.values(gStats).reduce((a, b) => a + b, 0);

  //   if (totalCount === 0) {
  //     return {
  //       isEmpty: true,
  //       genres: [],
  //       moods: [],
  //       topGenre: { name: "없음" },
  //       topMood: { tag: "없음" }
  //     };
  //   }

  //   // 1. 장르 데이터 처리
  //   const totalGenre = Object.values(gStats).reduce((a, b) => a + b, 0);
  //   const genres = Object.entries(gStats)
  //     .map(([name, count]) => ({
  //       name,
  //       count,
  //       percentage: totalGenre > 0 ? Math.round((count / totalGenre) * 100) : 0,
  //       color: getGenreColor(name)
  //     }))
  //     .sort((a, b) => b.count - a.count);

  //   // 2. 무드 데이터 처리
  //   const moods = Object.entries(mStats)
  //     .map(([tag, count]) => ({
  //       tag,
  //       count,
  //       type: "neutral", // 추후 로직에 따라 positive/negative 할당
  //       img: `/images/header/menu/mood-${tag}.svg`
  //     }))
  //     .sort((a, b) => b.count - a.count);

  //   return {
  //     genres,
  //     moods,
  //     topGenre: genres[0] || { name: "없음", count: 0 },
  //     topMood: moods[0] || { tag: "없음" },
  //     totalGenre
  //   };
  // }, [activeProfile]);

  const genreMoodStats = useMemo(() => {
    const stats = activeProfile?.movies?.genreStats || {}; // 통합된 stats 객체
    const totalCount = Object.values(stats).reduce((a, b) => a + b, 0);

    if (totalCount === 0) return { isEmpty: true };

    // 1. 장르 처리: filters.genre에 ID가 존재하는지 확인
    const genres = Object.entries(stats)
      .filter(([id]) => filters.genre.some(g => g.query.with_genres?.includes(id)))
      .map(([id, count]) => {
        const gInfo = filters.genre.find(g => g.query.with_genres?.includes(id));
        return {
          name: gInfo?.label || "기타",
          count,
          percentage: Math.round((count / totalCount) * 100),
          color: "#6d28d9" // 필요시 별도 컬러 함수 사용
        };
      })
      .sort((a, b) => b.count - a.count);

    // 2. 무드 처리: filters.mood에 ID가 존재하는지 확인
    const moods = Object.entries(stats)
      .filter(([id]) => filters.mood.some(m => m.id === id))
      .map(([id, count]) => {
        const mInfo = filters.mood.find(m => m.id === id);
        return {
          tag: mInfo?.label || "일반",
          count,
          type: "neutral",
          img: `/images/header/menu/mood-${id}.svg`
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      isEmpty: false,
      genres,
      moods,
      topGenre: genres[0] || { name: "없음" },
      topMood: moods[0] || { tag: "없음" }
    };
  }, [activeProfile]);

  // Firestore에서 플랜/결제 정보 불러오기
  const [planType, setPlanType] = useState<string>("");
  const [nextDate, setNextDate] = useState<string>("");

  useEffect(() => {
    const uid = user?.userId ?? auth.currentUser?.uid;
    if (!uid) return; // 로그인 안 된 경우 early return

    getDoc(doc(db, "users", uid)).then((snap) => {
      if (!snap.exists()) return; // 문서 없으면 early return
      const data = snap.data();
      setPlanType(data.planType ?? "");           // 플랜 종류 (basic/standard/premium)
      setNextDate(data.payment?.nextDate ?? "");  // 다음 결제일
    });
  }, [user?.userId]); // user가 바뀔 때마다 재실행

  // planType 영문 → 한글 변환
  const planLabel = (() => {
    if (planType === "basic") return "베이직";
    if (planType === "standard") return "스탠다드";
    if (planType === "premium") return "프리미엄";
    return null; // planType 없으면 뱃지 자체를 숨김
  })();

  return (
    <div className="mypage">
      <div className="inner">

        {/* 상단 모드 컨트롤러 바 */}
        <div className="mypage-mode-controller">
          <p>🎬 피드/리뷰 기능을 숨길 수 있습니다.</p>
          <button
            className={`toggle-mode-btn ${hideCommunity ? "active" : ""}`}
            onClick={toggleCommunity} // 스토어 액션 직접 연결
          >
            <span>{hideCommunity ? "🔒 커뮤니티 숨김 모드" : "🔓 커뮤니티 표시 모드"}</span>
            <div className="switch-track">
              <div className="switch-thumb"></div>
            </div>
          </button>
        </div>

        {/* 프로필 요약 */}
        <div className="profile-summary">
          <div className="profile-avatar">
            <img
              src={activeProfile?.imgUrl || "/images/profile/image/default_icons/17.png"}
              alt={activeProfile?.nickname || "프로필"}
            />
          </div>

          <div className="profile-info">
            <div className="name-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2>{activeProfile?.nickname || "사용자"}</h2>
              {profileData.equippedBadgeName && (
                <span className="user-equipped-badge-tag">
                  {profileData.equippedBadgeName}
                </span>
              )}
            </div>
            <p className="email">{user?.email || "guest@example.com"}</p>
            {/* 플랜 정보 뱃지 — planLabel 없으면 렌더링 안 함 */}
            {planLabel ? (
              // 구독 중일 때
              <span className="plan-badge">
                ★ {planLabel}{nextDate ? ` · 다음 결제 ${nextDate}` : ""}
              </span>
            ) : (
              // 구독 중이 아닐 때
              <Link href="/plan" className="plan-badge plan-badge-empty">
                구독하고 무제한으로 즐기세요 →
              </Link>
            )}
          </div>

          <div className="profile-stats">
            {!hideCommunity && (
              <>
                <div className="stat">
                  <div className="value">{profileData.stats.follower}</div>
                  <div className="label">팔로워</div>
                </div>
                <div className="stat">
                  <div className="value">{profileData.stats.following}</div>
                  <div className="label">팔로잉</div>
                </div>
                <div className="stat">
                  <div className="value">{profileData.stats.review}</div>
                  <div className="label">작성 리뷰</div>
                </div>
              </>
            )}
            <div className="stat">
              <div className="value">{profileData.stats.badge}</div>
              <div className="label">획득 뱃지</div>
            </div>
            <div className="stat">
              <div className="value">{profileData.stats.watched}</div>
              <div className="label">시청 완료</div>
            </div>
          </div>
        </div>

        {/* 빠른 메뉴 구조 */}
        <div className="quick-menu">
          {quickMenuItems.map((item, idx) => (
            <Link href={item.href} className="quick-card" key={idx}>
              <div className="icon">
                {item.icon.endsWith(".svg") || item.icon.endsWith(".png") ? (
                  <Image src={item.icon} alt="" width={24} height={24} />
                ) : (
                  <span>⚙️</span>
                )}
              </div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              {item.hasDot && <span className="dot"></span>}
            </Link>
          ))}
        </div>

        {/* 최근 시청 */}
        <section className="section-block">
          <div className="section-h">
            <h2>최근 시청</h2>
            <Link href="/mypage/playlist" className="more">전체보기 →</Link>
          </div>
          {historyItems.length > 0 ? (
            <div className="poster-row">
              {historyItems.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  href={`/detail/${item.mediaType || 'movie'}/${item.id}`}
                  className="poster-item"
                >
                  <div className="poster-img">
                    {item.poster_path && (
                      <img src={`https://image.tmdb.org/t/p/w300${item.poster_path}`} alt={item.title} />
                    )}
                  </div>
                  <p>{item.title}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-block">아직 시청한 작품이 없어요</div>
          )}
        </section>

        {/* 취향 분석 */}
        <section className="section-block preference-analysis-section">
          <div className="section-h">
            <h2>시청 취향 분석</h2>
            <span className="pref-subtitle">{activeProfile?.nickname || "사용자"}님의 시청 기록 분석 결과입니다.</span>
          </div>

          <div className="analysis-grid">
            {genreMoodStats.isEmpty ? (
              <div className="empty-analysis-card">
                <img src="/images/header/search.svg" alt="데이터 없음" />
                <h3>아직 분석할 데이터가 부족해요</h3>
                <p>영상을 시청하고 나만의 취향을 확인해보세요!</p>
                <Link href="/" className="go-browse-btn">영상 탐색하러 가기</Link>
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
                  <p className="mood-desc">주로 이런 감성의 작품들을 즐겨 보셨어요.</p>
                  <div className="mood-tag-cloud">
                    {genreMoodStats.moods?.map((m, index) => (
                      <span key={index} className={`mood-tag-item ${m.type}`}>
                        <img src={m.img} alt={m.tag} />
                        {m.tag}
                      </span>
                    ))}
                  </div>

                  <div className="mood-summary-box">
                    💡 주로 <strong>{genreMoodStats.topGenre?.name}</strong> 장르와
                    <strong>{genreMoodStats.topMood?.tag}</strong> 분위기의 컨텐츠에 깊은 몰입감을 느끼시는 편이네요!
                  </div>
                </div>
              </>
            )}
          </div>
        </section>


        {/* 2단 섹션: 커뮤니티 활성화 상태일 때만 출력 */}
        {!hideCommunity && (
          <div className="two-col-section">
            <section className="section-block">
              <div className="section-h">
                <h2>팔로워 활동</h2>
                <span className="more"><Link href="/alarm?tab=friend">더보기</Link></span>
              </div>

              {filteredActivities.length > 0 ? (
                <div className="activity-list">
                  {filteredActivities.map((item, index) => (
                    <div key={index} className="activity-item">
                      <div className="friend-avatar">
                        {/* 알림 제공자 썸네일 혹은 기본 이미지 */}
                      </div>
                      <div className="activity-body">
                        <p>
                          <strong>{item.title}</strong> 님이 {item.category === 'review' ? '리뷰를' : '새 피드를'} 작성했습니다.
                        </p>
                        <p className="content-preview">{item.content}</p>
                        <span className="time">방금 전</span>
                      </div>
                      <div className="activity-thumb">
                        <img src={item.link} alt="썸네일" /> {/* link를 이미지 URL로 활용 */}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-block">최근 팔로워 활동이 없습니다.</div>
              )}
            </section>

            <section className="section-block">
              <div className="section-h">
                <h2>나의 최근 리뷰</h2>
                <span className="more"><Link href="/mypage/community">더보기</Link></span>
              </div>

              {reviews.length > 0 ? (
                <div className="review-list">
                  {reviews.map((review) => {
                    const movie = mediaDetails[`movie-${review.videoId}`];
                    return (
                      <div key={review.reviewId} className="review-item">
                        <div className="review-thumb">
                          <img
                            src={movie ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : '/placeholder.png'}
                            alt={movie?.title || movie?.name || '영화 포스터'}
                          />
                        </div>
                        <div className="review-body">
                          <div className="review-head">
                            <h3>{movie?.title || movie?.name || '로딩 중...'}</h3>
                            <span className="stars">👍 {review.likesCount}</span>
                          </div>
                          <p className="text">
                            {review.isSpoiler && <span className="spoiler-badge">[스포일러]</span>}
                            {review.content}
                          </p>
                          <div className="meta">
                            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                            <span>신고 {review.reportsCount}회</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-block">작성하신 리뷰가 없습니다.</div>
              )}
            </section>
          </div>
        )}

        {/* 뱃지 */}
        <section className="section-block">
          <div className="section-h">
            <h2>획득한 뱃지</h2>
            <span className="more">
              <Link href="/goods">전체 {profileData.stats.badge}개 →</Link>
            </span>
          </div>

          <div className="badge-grid summary-mode">
            {displayBadgesSummary.length > 0 ? (
              displayBadgesSummary.map((b) => (
                <div
                  key={b.id}
                  className={`badge-card ${b.isEquipped ? "equipped-highlight" : ""}`}
                  title={b.title}
                >
                  <div className="badge-icon">
                    <img src={b.imgUrl} alt={b.name} style={{ width: '100%', height: 'auto' }} />
                    {b.isEquipped && <span className="equipped-badge-tag">장착됨</span>}
                  </div>
                  <h4>{b.name}</h4>
                  <p>{b.title}</p>
                </div>
              ))
            ) : (
              <div className="empty-badge-block" style={{ gridColumn: '1 / -1', padding: '20px 0', color: '#666' }}>
                아직 획득한 뱃지가 없습니다.
              </div>
            )}
          </div>
        </section>

        {/* 로그아웃 */}
        {user && (
          <div className="logout-row">
            <button onClick={onLogout}>로그아웃</button>
          </div>
        )}
      </div>
    </div>
  );
}