"use client";
import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { usePlayListStore } from "@/store/usePlayListStore";
import { useMovieStore } from "@/store/useMovieStore";
import "../scss/mypage.scss";
import { mockUserData } from "@/data/mockUserData";
import { BADGE_LIST } from "@/data/badge";
import { customMenus } from "@/data/mainMenu"; // 💡 메인 메뉴 데이터 임포트

export default function MyPage() {
  const { user, currentProfile, currentMember, onLogout } = useAuthStore();
  const { playList, onLoadPlayList } = usePlayListStore();
  const { popMovies, tvs, onFetchPopular, onFetchTvs } = useMovieStore();

  useEffect(() => {
    onLoadPlayList();
    if (popMovies.length === 0) onFetchPopular();
    if (tvs.length === 0) onFetchTvs();
  }, []);

  // 💡 메인 메뉴 데이터에서 아이콘 경로 추출 
  // (임포트된 파일명이나 구조에 맞춰 "홈", "재생목록", "알림" 등의 title 혹은 path로 매핑합니다)
  const menuIcons = useMemo(() => {
    const findIcon = (path: string) => customMenus.find(m => m.path === path)?.imgUrl;
    return {
      playlist: findIcon("/mypage/playlist") || "/images/header/menu/playlist.svg",
      wishlist: findIcon("/mypage/playlist?tab=wishlist") || "/images/header/menu/wishlist.svg",
      custom: findIcon("/menu/custom") || "/images/header/menu/custom.svg",
      alarm: findIcon("/alarm") || "/images/header/alarm.svg",
      // 아래 관리 항목용 기본 아이콘 경로 (메인 데이터에 없다면 폴백용으로 지정)
      community: "/images/menu/community.svg",
      review: "/images/menu/review.svg",
      feed: "/images/menu/feed.svg",
      badge: "/images/menu/badge.svg"
    };
  }, []);

  // 💡 새롭게 확장된 빠른 메뉴 리스트 객체 (기존 4개 + 신규 관리 메뉴 4개)
  const quickMenuItems = [
    { href: "/mypage/playlist", icon: menuIcons.playlist, title: "재생목록", desc: "최근 시청 작품", isImage: true },
    { href: "/mypage/playlist?tab=wishlist", icon: menuIcons.wishlist, title: "위시리스트", desc: "찜한 작품 모음", isImage: true },
    { href: "/menu/custom", icon: menuIcons.custom, title: "커스텀", desc: "나만의 메뉴 설정", isImage: true },
    { href: "/alarm", icon: menuIcons.alarm, title: "알림", desc: "새로운 활동", isImage: true, hasDot: true },
    
    // ✨ 새로 추가된 관리 메뉴 4종
    { href: "/mypage/followers", icon: menuIcons.community, title: "팔로워 관리", desc: "팔로워 및 팔로잉 설정" },
    { href: "/mypage/reviews", icon: menuIcons.review, title: "리뷰 관리", desc: "내가 쓴 한줄평/리뷰" },
    { href: "/mypage/feeds", icon: menuIcons.feed, title: "피드 관리", desc: "소식 및 업로드 피드" },
    { href: "/goods", icon: menuIcons.badge, title: "뱃지 관리", desc: "대표 칭호 및 장착 설정" }
  ];

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
    stars: ["★★★★★", "★★★★☆"][i],
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

        {/* 💡 컴팩트하게 리팩토링 및 확장된 빠른 메뉴 구조 */}
        <div className="quick-menu">
          {quickMenuItems.map((item, idx) => (
            <Link href={item.href} className="quick-card" key={idx}>
              <div className="icon">
                {/* 메인 메뉴용 혹은 신규 SVG 이미지가 매핑되어 있을 경우 이미지로 바인딩 */}
                {item.icon.endsWith(".svg") || item.icon.endsWith(".png") ? (
                  <Image src={item.icon} alt="" width={24} height={24} />
                ) : (
                  // 파일 경로가 없을 때 비상용 이모지 분기 처리
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

        {/* 2단: 친구 활동 + 최근 리뷰 */}
        <div className="two-col-section">
          <section>
            <div className="section-h">
              <h2>친구 활동</h2>
              <span className="more">더보기 →</span>
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
              <span className="more">전체 {stats.review}개 →</span>
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
                      <span>💬 {r.comments}</span>
                      <span>{r.time}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

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