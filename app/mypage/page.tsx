"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { usePlayListStore } from "@/store/usePlayListStore";
import { useMovieStore } from "@/store/useMovieStore";
import "../scss/mypage.scss";
import { mockUserData } from "@/data/mockUserData";
import { BADGE_LIST } from "@/data/badge";

export default function MyPage() {
  const { user, currentProfile, currentMember, onLogout } = useAuthStore();
  const { playList, onLoadPlayList } = usePlayListStore();
  const { popMovies, tvs, onFetchPopular, onFetchTvs } = useMovieStore();

  // 🌟 커뮤니티 모드 제어 State (기본값: false = 보임)
  const [hideCommunity, setHideCommunity] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  useEffect(() => {
    onLoadPlayList();
    if (popMovies.length === 0) onFetchPopular();
    if (tvs.length === 0) onFetchTvs();

    // 로컬 스토리지에서 유저의 기존 설정 불러오기
    const savedMode = localStorage.getItem("hide_community_ui");
    if (savedMode === "true") {
      setHideCommunity(true);
    }
    setIsHydrated(true);
  }, []);

  // 토글 핸들러
  const handleToggleCommunity = () => {
    const nextState = !hideCommunity;
    setHideCommunity(nextState);
    localStorage.setItem("hide_community_ui", String(nextState));
  };

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

  // 커뮤니티 활성화 여부에 따라 퀵메뉴 목록 필터링
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

    if (hideCommunity) {
      return allItems.filter(item => !item.isCommunity);
    }
    return allItems;
  }, [hideCommunity, menuIcons]);

  const profileData = useMemo(() => {
    if (!mockUserData) {
      return {
        equippedBadgeName: null,
        stats: { follower: 0, following: 0, review: 0, badge: 0, watched: 0 }
      };
    }
    const matchedBadge = BADGE_LIST.find((b) => b.id === mockUserData.bages?.equippedBadges);
    return {
      equippedBadgeName: matchedBadge ? matchedBadge.name : null,
      stats: {
        follower: mockUserData.community?.followers?.length || 0,
        following: mockUserData.community?.following?.length || 0,
        review: mockUserData.community?.reviews?.length || 0,
        badge: mockUserData.bages?.earnedBadges?.filter(b => b.isComplete).length || 0,
        watched: mockUserData.movies?.watchingVideos?.length || 0,
      }
    };
  }, [mockUserData]);

  const displayBadgesSummary = useMemo(() => {
    if (!mockUserData || !mockUserData.bages) return [];
    const { earnedBadges, equippedBadges } = mockUserData.bages;
    const completedUserBadges = earnedBadges?.filter((b) => b.isComplete) || [];
    const mapped = completedUserBadges.map((userBadge) => {
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
  }, [mockUserData]);

  // 🌟 [신설] 자주 본 장르 및 무드 데이터 가공 (플레이리스트 기반 혹은 Mocking 데이터 기반)
  const genreMoodStats = useMemo(() => {
    // 실제 서비스 적용 시에는 playList 내 영화들의 genre_ids를 맵핑하여 카운팅하도록 고도화할 수 있습니다.
    // 여기서는 UI 구현을 위해 직관적인 목데이터 세트를 제공합니다.
    return {
      genres: [
        { name: "SF / 판타지", count: 28, percentage: 40, color: "#6366f1" },
        { name: "액션 / 스릴러", count: 18, percentage: 25, color: "#3b82f6" },
        { name: "로맨스 / 코미디", count: 12, percentage: 17, color: "#ec4899" },
        { name: "드라마 / 다큐", count: 8, percentage: 11, color: "#10b981" },
        { name: "공포 / 미스터리", count: 5, percentage: 7, color: "#f59e0b" },
      ],
      moods: [
        { tag: "🍿 긴장감 넘치는", type: "positive" },
        { tag: "✨ 영상미가 뛰어난", type: "positive" },
        { tag: "🧠 심오한 세계관", type: "positive" },
        { tag: "💧 눈물샘 자극하는", type: "neutral" },
        { tag: "⚡️ 몰입감 최고", type: "positive" },
        { tag: "🕊️ 잔잔하고 평화로운", type: "neutral" },
        { tag: "🔥 화려한 스케일", type: "positive" }
      ]
    };
  }, [playList]);

  const activeProfile = currentProfile ?? user?.profiles?.[0] ?? null;

  const stats = {
    watched: playList.length,
    wishlist: 38,
    review: 24,
    badge: 12,
  };

  const profileMovies = [...popMovies];

  const friendActivities = profileMovies.slice(0, 3).map((m, i) => ({
    id: m.id,
    title: m.title,
    poster: m.poster_path,
    friend: ["친구A", "친구B", "친구C"][i],
    action: ["에 ★★★★★ 평가", "을 시청했어요", "을 찜했어요"][i],
    time: ["1시간 전", "3시간 전", "어제"][i],
  }));

  const myReviews = profileMovies.slice(0, 2).map((m, i) => ({
    id: m.id,
    title: m.title,
    poster: m.poster_path,
    stars: ["★★★★★", "★★¼☆☆"][i],
    text: [
      "이번 시즌은 정말 다른 차원이었어요. 첫 화부터 빠져들었고...",
      "전체적으로 만족스럽지만 중반부가 살짝 늘어지는 느낌이...",
    ][i],
    likes: [132, 45][i],
    comments: [14, 3][i],
    time: ["2일 전", "1주 전"][i],
  }));

  return (
    <div className="mypage">
      <div className="inner">
        
        {/* 상단 모드 컨트롤러 바 */}
        <div className="mypage-mode-controller">
          <p>🎬 피드/리뷰 기능을 숨길 수 있습니다.</p>
          <button 
            type="button" 
            className={`toggle-mode-btn ${hideCommunity ? "active" : ""}`}
            onClick={handleToggleCommunity}
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
              alt={activeProfile?.name || "프로필"}
            />
          </div>
          
          <div className="profile-info">
            <div className="name-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2>{activeProfile?.name || currentMember || "사용자"}</h2>
              {profileData.equippedBadgeName && (
                <span className="user-equipped-badge-tag">
                  {profileData.equippedBadgeName}
                </span>
              )}
            </div>
            <p className="email">{user?.email || "guest@example.com"}</p>
            <span className="plan-badge">★ 스탠다드 · 다음 결제 2026.06.22</span>
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
          {playList.length > 0 ? (
            <div className="poster-row">
              {playList.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  href={`/detail/${item.mediaType}/${item.id}`}
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

        {/* 🌟 [신설] 취향 분석 (장르/무드 그래프 & 테이블 & 태그 컴포넌트) */}
        <section className="section-block preference-analysis-section">
          <div className="section-h">
            <h2>시청 취향 분석</h2>
            <span className="pref-subtitle">{activeProfile?.name || "사용자"}님의 시청 기록 분석 결과입니다.</span>
          </div>
          
          <div className="analysis-grid">
            {/* 좌측: 선호 장르 테이블 & 그래프 차트 */}
            <div className="analysis-card genre-card-box">
              <h3>📊 선호 장르 TOP 5</h3>
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
                    {genreMoodStats.genres.map((g, index) => (
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

            {/* 우측: 선호 무드 태그 클라우드 */}
            <div className="analysis-card mood-card-box">
              <h3>✨ 선호하는 무드 / 태그</h3>
              <p className="mood-desc">주로 이런 감성의 작품들을 즐겨 보셨어요.</p>
              <div className="mood-tag-cloud">
                {genreMoodStats.moods.map((m, index) => (
                  <span key={index} className={`mood-tag-item ${m.type}`}>
                    {m.tag}
                  </span>
                ))}
              </div>
              <div className="mood-summary-box">
                💡 주로 <strong>현실을 벗어난 몰입감 있는 세계관</strong>과 <strong>긴장감 넘치는 연출</strong>을 가진 작품에 높은 선호도를 보이고 있습니다.
              </div>
            </div>
          </div>
        </section>

        {/* 2단 섹션: 커뮤니티 활성화 상태일 때만 출력 */}
        {!hideCommunity && isHydrated && (
          <div className="two-col-section">
            <section>
              <div className="section-h">
                <h2>팔로워 활동</h2>
                <span className="more"><Link href="/alarm?tab=friend">더보기 →</Link></span>
              </div>
              <ul className="activity-list">
                {friendActivities.map((act) => (
                  <li key={act.id} className="activity-item">
                    <div className="friend-avatar"></div>
                    <div className="activity-body">
                      <p>
                        <strong>{act.friend}</strong>님이{" "}
                        <Link href={`/detail/movie/${act.id}`} className="target">
                          {act.title}
                        </Link>
                        {act.action}
                      </p>
                      <span className="time">{act.time}</span>
                    </div>
                    {act.poster && (
                      <div className="activity-thumb">
                        <img src={`https://image.tmdb.org/t/p/w200${act.poster}`} alt="" />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <div className="section-h">
                <h2>최근 리뷰</h2>
                <span className="more"><Link href="/mypage/community?tab=review">전체 {stats.review}개 →</Link></span>
              </div>
              <ul className="review-list">
                {myReviews.map((r) => (
                  <li key={r.id} className="review-item">
                    <Link href={`/detail/movie/${r.id}`} className="review-thumb">
                      {r.poster && <img src={`https://image.tmdb.org/t/p/w200${r.poster}`} alt={r.title} />}
                    </Link>
                    <div className="review-body">
                      <div className="review-head">
                        <h3>{r.title}</h3>
                        <span className="stars">{r.stars}</span>
                      </div>
                      <p className="text">{r.text}</p>
                      <div className="meta">
                        <span>♡ {r.likes}</span>
                        <span>{r.time}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {/* 뱃지 */}
        <section className="section-block">
          <div className="section-h">
            <h2>획득한 뱃지</h2>
            <span className="more">
              <Link href="/goods">전체 {stats.badge}개 →</Link>
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