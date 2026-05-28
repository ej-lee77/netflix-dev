"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { usePlayListStore } from "@/store/usePlayListStore";
import { useMovieStore } from "@/store/useMovieStore";
import "../scss/mypage.scss";

export default function MyPage() {
  const { user, currentProfile, currentMember, onLogout } = useAuthStore();
  const { playList, onLoadPlayList } = usePlayListStore();
  const { popMovies, tvs, onFetchPopular, onFetchTvs } = useMovieStore();

  useEffect(() => {
    onLoadPlayList();
    if (popMovies.length === 0) onFetchPopular();
    if (tvs.length === 0) onFetchTvs();
  }, []);

  const activeProfile = currentProfile ?? user?.profiles?.[0] ?? null;
  const profileIndex = Math.max((activeProfile?.id ?? 1) - 1, 0);

  // 가짜 통계 (실제로는 firebase에서 가져옴)
  const stats = {
    watched: playList.length + profileIndex * 2,
    wishlist: 38 + profileIndex * 3,
    review: 24 + profileIndex,
    badge: 12 + (profileIndex % 3),
  };

  const profileMovies = [
    ...popMovies.slice(profileIndex),
    ...popMovies.slice(0, profileIndex),
  ];
  const profileTvs = [
    ...tvs.slice(profileIndex),
    ...tvs.slice(0, profileIndex),
  ];
  const profilePlayList = [
    ...playList.slice(profileIndex),
    ...playList.slice(0, profileIndex),
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
              src={activeProfile?.imgUrl || "/images/profile/normal.svg"}
              alt={activeProfile?.name || "프로필"}
            />
            <button className="edit-badge">✎</button>
          </div>
          <div className="profile-info">
            <h2>{activeProfile?.name || currentMember || "사용자"}</h2>
            <p className="email">{user?.email || "guest@example.com"}</p>
            <span className="plan-badge">★ 스탠다드 · 다음 결제 2026.06.22</span>
          </div>
          <div className="profile-stats">
            <div className="stat">
              <div className="value">{stats.watched}</div>
              <div className="label">시청 완료</div>
            </div>
            <div className="stat">
              <div className="value">{stats.wishlist}</div>
              <div className="label">찜한 작품</div>
            </div>
            <div className="stat">
              <div className="value">{stats.review}</div>
              <div className="label">작성 리뷰</div>
            </div>
            <div className="stat">
              <div className="value">{stats.badge}</div>
              <div className="label">획득 뱃지</div>
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
          <Link href="/mypage/wishlist" className="quick-card">
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
              {profilePlayList.slice(0, 6).map((item) => (
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
        <section className="section-block">
          <div className="section-h">
            <h2>찜 목록</h2>
            <Link href="/mypage/wishlist" className="more">전체 {stats.wishlist}개 →</Link>
          </div>
          <div className="poster-row">
            {profileTvs.slice(0, 6).map((item) => (
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
            <span className="more">전체 {stats.badge}개 →</span>
          </div>
          <div className="badge-grid">
            {badges.map((b) => (
              <div key={b.name} className={`badge-card ${b.locked ? "locked" : ""}`}>
                <div className="badge-icon">{b.icon}</div>
                <h4>{b.name}</h4>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 위험 영역 */}
        <div className="danger-zone">
          <div>
            <h3>회원 탈퇴</h3>
            <p>탈퇴 시 모든 시청 기록·리뷰·찜 목록·뱃지가 삭제되며 복구할 수 없습니다.</p>
          </div>
          <button className="btn-danger">회원 탈퇴</button>
        </div>

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
