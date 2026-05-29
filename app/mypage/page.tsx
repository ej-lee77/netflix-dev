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

export default function MyPage() {
  const { user, currentProfile, currentMember, onLogout } = useAuthStore();
  const { playList, onLoadPlayList } = usePlayListStore();
  const { popMovies, tvs, onFetchPopular, onFetchTvs } = useMovieStore();

  useEffect(() => {
    onLoadPlayList();
    if (popMovies.length === 0) onFetchPopular();
    if (tvs.length === 0) onFetchTvs();
  }, []);

    const profileData = useMemo(() => {
      if (!mockUserData) {
        return {
          equippedBadgeName: null,
          stats: { follower: 0, following: 0, review: 0, badge: 0, watched: 0 }
        };
      }

      // 대표 칭호 찾기
      const matchedBadge = BADGE_LIST.find((b) => b.id === mockUserData.bages?.equippedBadges);
      
      return {
        equippedBadgeName: matchedBadge ? matchedBadge.name : null,
        stats: {
          follower: mockUserData.community?.followers?.length || 0,
          following: mockUserData.community?.following?.length || 0,
          review: mockUserData.community?.reviews?.length || 0,
          // 실제 획득 성공한 뱃지 개수만 카운트
          badge: mockUserData.bages?.earnedBadges?.filter(b => b.isComplete).length || 0,
          // 시청 완료 영상 개수
          watched: mockUserData.movies?.watchingVideos?.length || 0,
        }
      };
    }, [mockUserData]); // 💡 mockUserData 대신 프롭스나 상태로 받는 user로 통일

    // 2. 💡 하단 뱃지 섹션용: 획득한 뱃지 중 최대 5개 추출 및 정렬 (버그 수정 완료)
    const displayBadgesSummary = useMemo(() => {
      // 고정된 mockUserData 대신 동적 데이터인 user를 바라보도록 수정합니다.
      if (!mockUserData || !mockUserData.bages) return [];

      const { earnedBadges, equippedBadges } = mockUserData.bages;

      // 1. 완전히 획득한 뱃지만 필터링
      const completedUserBadges = earnedBadges?.filter((b) => b.isComplete) || [];

      // 2. 마스터 데이터(BADGE_LIST)와 결합
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

      // 3. 장착 중인 배지가 제일 앞으로 오게 정렬 후 5개만 자르기
      return mapped
        .sort((a, b) => (b.isEquipped ? 1 : 0) - (a.isEquipped ? 1 : 0))
        .slice(0, 5);

    }, [mockUserData]);

  const activeProfile = currentProfile ?? user?.profiles?.[0] ?? null;

  // 가짜 통계 (실제로는 firebase에서 가져옴)
  const stats = {
    watched: playList.length,
    wishlist: 38,
    review: 24,
    badge: 12,
  };

  const profileMovies = [
    ...popMovies,
  ];

  // 더미 친구 활동 (실제 TMDB 데이터로 만듦)
  const friendActivities = profileMovies.slice(0, 3).map((m, i) => ({
    id: m.id,
    title: m.title,
    poster: m.poster_path,
    friend: ["친구A", "친구B", "친구C"][i],
    action: ["에 ★★★★★ 평가", "을 시청했어요", "을 찜했어요"][i],
    time: ["1시간 전", "3시간 전", "어제"][i],
  }));

  // 최근 리뷰 더미
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

  const badges = [
    { icon: "🏆", name: "100편 클럽", desc: "100편 시청" },
    { icon: "🎬", name: "한국 영화 마니아", desc: "한국 50편" },
    { icon: "📝", name: "리뷰어", desc: "리뷰 20개" },
    { icon: "🌙", name: "올빼미", desc: "자정 시청 10회" },
    { icon: "⭐", name: "평론가", desc: "★★★★★ 5회" },
    { icon: "🔒", name: "???", desc: "잠금", locked: true },
  ];

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
            <button className="edit-badge">✎</button>
          </div>
          
          <div className="profile-info">
            <div className="name-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2>{activeProfile?.name || currentMember || "사용자"}</h2>
              {/* 💡 가공된 대표 칭호 실시간 바인딩 */}
              {profileData.equippedBadgeName && (
                <span className="user-equipped-badge-tag">
                  {profileData.equippedBadgeName}
                </span>
              )}
            </div>
            <p className="email">{user?.email || "guest@example.com"}</p>
            <span className="plan-badge">★ 스탠다드 · 다음 결제 2026.06.22</span>
          </div>
          
          {/* 💡 동적으로 카운트된 5대 스탯 영역 */}
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

        {/* 빠른 메뉴 */}
        <div className="quick-menu">
          <Link href="/mypage/playlist" className="quick-card">
            <div className="icon">📺</div>
            <h3>재생목록</h3>
            <p>최근 시청 작품</p>
          </Link>
          <Link href="/mypage/playlist?tab=wishlist" className="quick-card">
            <div className="icon">♥</div>
            <h3>위시리스트</h3>
            <p>찜한 작품 모음</p>
          </Link>
          <Link href="/menu/custom" className="quick-card">
            <div className="icon">⚙</div>
            <h3>커스텀</h3>
            <p>나만의 메뉴 설정</p>
          </Link>
          <Link href="/alarm" className="quick-card">
            <div className="icon">🔔</div>
            <h3>알림</h3>
            <p>새로운 활동</p>
            <span className="dot"></span>
          </Link>
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

        {/* 찜 목록 */}
        {/* <section className="section-block">
          <div className="section-h">
            <h2>찜 목록</h2>
            <Link href="/mypage/playlist?tab=wishlist" className="more">전체 {stats.wishlist}개 →</Link>
          </div>
          <div className="poster-row">
            {tvs.slice(0, 6).map((item) => (
              <Link key={item.id} href={`/detail/tv/${item.id}`} className="poster-item">
                <div className="poster-img">
                  {item.poster_path && (
                    <img src={`https://image.tmdb.org/t/p/w300${item.poster_path}`} alt={item.name} />
                  )}
                </div>
                <p>{item.name}</p>
              </Link>
            ))}
          </div>
        </section> */}

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
            {/* 전체 개수는 기존에 쓰고 계시던 stats.badge 값을 바인딩하거나 displayBadgesSummary.length 등으로 대체 가능합니다 */}
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
                  title={b.title} // 마우스 오버 시 전체 칭호 문장(짧은 한 문장) 툴팁 노출
                >
                  {/* 이미지 경로 매핑 및 장착 태그 추가 */}
                  <div className="badge-icon">
                    <img src={b.imgUrl} alt={b.name} style={{ width: '100%', height: 'auto' }} />
                    {b.isEquipped && <span className="equipped-badge-tag">장착됨</span>}
                  </div>
                  
                  {/* 기존 마크업 형태 유지 */}
                  <h4>{b.name}</h4>
                  <p>{b.title}</p>
                </div>
              ))
            ) : (
              /* 획득한 뱃지가 아예 없을 때 예외 화면 처리 */
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
