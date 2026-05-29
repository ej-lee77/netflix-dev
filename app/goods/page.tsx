"use client";
import React, { useMemo, useState } from "react";
import "../scss/goods.scss";
import { BADGE_LIST } from "@/data/badge";
import { useAuthStore } from "@/store/useAuthStore";
import type { UserDocument } from "@/types/auth";

type TabType = "badge" | "limited" | "event" | "collection";

const badges = [
  { id: 1, icon: "🏆", name: "100편 클럽", title: "★ 영화광", desc: "100편 이상 시청 완료한 회원에게 주어지는 뱃지입니다", unlocked: true, mainTitle: false },
  { id: 2, icon: "🎬", name: "한국 영화 마니아", title: "★ 한국영화 전문가", desc: "한국 영화 50편 이상 시청한 회원에게 주어지는 뱃지입니다", unlocked: true, mainTitle: true },
  { id: 3, icon: "📝", name: "리뷰어", title: "★ 신뢰받는 평론가", desc: "리뷰 20개 작성 + 평균 좋아요 50개 이상 받기", progress: 15, total: 20 },
  { id: 4, icon: "🌙", name: "올빼미", title: "★ 야간 시청자", desc: "자정 ~ 새벽 4시 사이에 10편 시청하기", progress: 6, total: 10 },
  { id: 5, icon: "🔒", name: "???", title: "★ ???", desc: "조건 미공개 · 특정 조합으로 시청 시 자동 해금", locked: true },
  { id: 6, icon: "🔒", name: "평론가의 길", title: "★ 마스터", desc: "모든 장르에서 5편 이상 시청 + 별점 5점 평가 5회", locked: true },
];

const limitedGoods = [
  { id: 1, name: "오리지널 시리즈 포스터 (A2 사이즈)", desc: "시즌2 메인 비주얼 · 액자 별매", price: 3500, stock: 234, type: "LIMITED" as const },
  { id: 2, name: "감독 사인 한정판 시나리오북", desc: "친필 사인 · 일련번호 부여", price: 25000, stock: 12, type: "PREMIUM" as const },
  { id: 3, name: "콜라보 굿즈 세트", desc: "키링·스티커·뱃지 3종", price: 8000, stock: 0, type: "SOLD_OUT" as const },
  { id: 4, name: "캐릭터 머그컵", desc: "오리지널 캐릭터 4종", price: 4500, stock: 156, type: "LIMITED" as const },
  { id: 5, name: "OST 한정판 LP", desc: "10인치 컬러 바이닐", price: 32000, stock: 30, type: "PREMIUM" as const },
];

const events = [
  { id: 1, name: "5월의 마니아 챌린지 — 30편 시청하고 한정 뱃지 받기", period: "2026.05.01 ~ 2026.05.31", desc: "한 달 동안 30편 시청을 완료하면 한정판 '5월의 영화광' 뱃지와 5,000P 적립금을 드려요", status: "active" as const, dday: 12 },
  { id: 2, name: "친구 초대 이벤트 — 함께 하면 5,000P", period: "2026.05.18 ~ 2026.05.27", desc: "초대한 친구가 가입 시 두 분 모두 5,000P 적립. 최대 5명까지 가능합니다", status: "active" as const, dday: 5 },
  { id: 3, name: "봄맞이 리뷰 이벤트", period: "2026.04.01 ~ 2026.04.30", desc: "리뷰 작성 시 추첨을 통해 굿즈 증정 · 당첨자 발표 완료", status: "ended" as const },
];

const mockUserData: UserDocument = {
  userId: "test_user_123",
  email: "developer@example.com",
  name: "홍길동",
  phoneNumber: "010-1234-5678",
  planType: "Premium",
  profile: {
    nickname: "방구석시네필",
    imgUrl: "/images/avatar/default.png",
    viewAge: "19"
  },
  
  // 영상 및 커뮤니티 관련 리스트 (기존 설계용 빈 객체 처리)
  movies: {
      watchingVideos: [],
      wishlist: [], 
      playlist: {
        playlistVideos: [],
        customPlaylists: [] 
      },
      genreStats: { "action": 12, "comedy": 5 }
  }, 
  community: {
    followers: [],
    following: [],
    reviews: [], 
    feeds: []
  },

  // 메뉴 리스트
  headerMenus: ["home", "movies", "my-list"],

  // 💡 실시간 뱃지 진행 상태 데이터 (테스트의 핵심!)
  bages: {
    // 현재 대표 칭호로 장착한 뱃지 ID (정주행 마스터)
    equippedBadges: "binge_master", 

    earnedBadges: [
      // 1. 이미 획득 완료한 뱃지들 (isComplete: true)
      {
        id: "first_streaming",
        progress: 1,
        isComplete: true
      },
      {
        id: "binge_master", // 💡 장착까지 된 상태
        progress: 12, // 이미 많이 완주함
        isComplete: true
      },
      {
        id: "genre_action",
        progress: 25, // 목표치인 20을 넘긴 상태
        isComplete: true
      },
      {
        id: "social_reviewer",
        progress: 1,
        isComplete: true
      },

      // 2. 현재 열심히 달성 중인 뱃지들 (isComplete: false, 게이지 바 노출 테스트용)
      {
        id: "7days_attendance",
        progress: 5, // 💡 UI에서 5 / 7 진행 중으로 표시됨
        isComplete: false
      },
      {
        id: "genre_animation",
        progress: 12, // 💡 UI에서 12 / 20 진행 중으로 표시됨
        isComplete: false
      },
      {
        id: "genre_horror",
        progress: 2, // 💡 UI에서 2 / 20 진행 중으로 표시됨
        isComplete: false
      },
      {
        id: "culture_k_drama",
        progress: 18, // 💡 완료 임박! 18 / 20 진행 중
        isComplete: false
      },
      {
        id: "social_connect_star",
        progress: 45, // 💡 커뮤니티 활동 진행 중 (목표치 total 설정에 따라 게이지 노출)
        isComplete: false
      },

      // 3. 아직 시작도 안 한 뱃지 (progress: 0, 게이지 바 0% 테스트용)
      {
        id: "genre_war",
        progress: 0,
        isComplete: false
      }
    ]
  },
  
  alarm: ["movie_id_999", "movie_id_888"]
};

export default function GoodsPage() {
  const [tab, setTab] = useState<TabType>("badge");
  // const {user} = useAuthStore();

  const displayBadges = useMemo(() => {
    if (!mockUserData || !mockUserData.bages) return [];

    const { earnedBadges, equippedBadges } = mockUserData.bages;

    return BADGE_LIST.map((masterBadge) => {
      // 유저의 뱃지 정보 배열에서 현재 마스터 뱃지와 ID가 일치하는 데이터 찾기
      const userBadgeInfo = earnedBadges?.find((b) => b.id === masterBadge.id);

      // 1. 획득 유무 (유저 정보에 기록된 완료 여부 사용, 없으면 false)
      const unlocked = userBadgeInfo ? userBadgeInfo.isComplete : false;
      
      // 2. 장착 유무 (대표 칭호)
      const mainTitle = equippedBadges === masterBadge.id;

      // 3. 진행도 (유저 정보에 실시간으로 찍힌 progress 값)
      const progress = userBadgeInfo ? userBadgeInfo.progress : 0;

      return {
        ...masterBadge,
        unlocked,
        locked: !unlocked,
        mainTitle,
        progress, // 유저 데이터에서 실시간으로 갱신되는 값
        // total(목표치)은 마스터 데이터(BADGE_LIST)에 적어둔 기준값을 사용합니다.
      };
    });
  }, [mockUserData]);

  return (
    <div className="goods-page">
      <div className="inner">
        {/* 히어로 */}
        <div className="goods-hero">
          <div className="hero-eyebrow">REWARDS & GOODS</div>
          <h1>
            시청할수록 모이는<br />
            나만의 컬렉션
          </h1>
          <p>뱃지를 모으고 칭호를 획득하세요 · 한정 굿즈와 특별 이벤트도 만나보세요</p>
        </div>

        {/* 컬렉션 통계 */}
        <div className="collection-stats">
          <div className="stat-card">
            <div className="num">12</div>
            <div className="label">획득 뱃지</div>
            <div className="hint">전체 36개</div>
          </div>
          <div className="stat-card">
            <div className="num">3</div>
            <div className="label">획득 칭호</div>
            <div className="hint">대표: 한국영화 마니아</div>
          </div>
          <div className="stat-card">
            <div className="num">2</div>
            <div className="label">보유 굿즈</div>
            <div className="hint">한정판 1개</div>
          </div>
          <div className="stat-card">
            <div className="num">5,184</div>
            <div className="label">보유 포인트</div>
            <div className="hint">P</div>
          </div>
        </div>

        {/* <h2 className="section-h">수집 시스템</h2> */}
        <div className="collection-info mb-2">
          <div className="info-card">
            <h3>🎯 뱃지 시스템</h3>
            <p>시청 활동에 따라 자동으로 뱃지가 해금됩니다. 획득한 뱃지는 프로필에 표시됩니다.</p>
          </div>
          <div className="info-card">
            <h3>👑 칭호 시스템</h3>
            <p>뱃지마다 고유한 칭호가 있어요. 대표 칭호를 선택해 친구들에게 보여줄 수 있습니다.</p>
          </div>
          <div className="info-card">
            <h3>💎 포인트 시스템</h3>
            <p>결제·리뷰·시청 활동으로 포인트를 적립하고, 한정 굿즈 교환에 사용하세요.</p>
          </div>
          <div className="info-card">
            <h3>🎁 한정 이벤트</h3>
            <p>매월 새로운 이벤트와 한정 굿즈가 공개됩니다. 알림을 켜두면 놓치지 않아요.</p>
          </div>
        </div>

        {/* 탭 */}
        <div className="goods-tabs">
          <button className={tab === "badge" ? "active" : ""} onClick={() => setTab("badge")}>
            뱃지 보상
          </button>
          <button className={tab === "limited" ? "active" : ""} onClick={() => setTab("limited")}>
            한정 굿즈
          </button>
          <button className={tab === "event" ? "active" : ""} onClick={() => setTab("event")}>
            이벤트
          </button>
          {/* <button className={tab === "collection" ? "active" : ""} onClick={() => setTab("collection")}>
            수집 시스템
          </button> */}
        </div>

        {/* 뱃지 탭 */}
        {tab === "badge" && (
          <>
            <h2 className="section-h">뱃지 보상 — 칭호 시스템</h2>
            <div className="badge-grid">
              {displayBadges.map((b) => (
                <article
                key={b.id}
                className={`badge-card ${b.unlocked ? "unlocked" : ""} ${b.locked ? "locked" : ""}`}
                >
                  {/* 뱃지 아이콘 */}
                  <div className="badge-icon">
                    <img src={b.imgUrl} alt={b.name} />
                  </div>

                  {/* 뱃지 타이틀 및 칭호 */}
                  <h3>{b.title}</h3>
                  <div className="title-tag">{b.name}</div>
                  <p>{b.content}</p>
                  
                  {/* 1. 획득 완료 상태 렌더링 */}
                  {b.unlocked && (
                    <div className="status-done">
                      ✓ 획득 완료{b.mainTitle && " · 대표 칭호"}
                    </div>
                  )}
                  
                  {/* 2. 미획득 상태일 때만 게이지바 및 진행도 렌더링 (목표치 total이 설정되어 있을 때만) */}
                  {!b.unlocked && b.total !== undefined && (
                    <>
                      <div className="progress-bar">
                        <div 
                          className="fill" 
                          style={{ width: `${Math.min((b.progress / b.total) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="progress-text">
                        {b.progress} / {b.total} 진행 중
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          </>
        )}

        {/* 한정 굿즈 탭 */}
        {tab === "limited" && (
          <>
            <h2 className="section-h">
              한정 굿즈 <span className="sub-title">5월의 한정 컬렉션</span>
            </h2>
            <div className="limited-grid">
              {limitedGoods.map((g) => (
                <article key={g.id} className="limited-card">
                  <div className="limited-thumb">
                    <span className={`limited-badge ${g.type.toLowerCase()}`}>
                      {g.type === "SOLD_OUT" ? "SOLD OUT" : g.type}
                    </span>
                    {g.stock > 0 && <span className="limited-stock">잔여 {g.stock}개</span>}
                  </div>
                  <div className="limited-body">
                    <h3>{g.name}</h3>
                    <p>{g.desc}</p>
                    <div className="limited-foot">
                      <span className="price">{g.price.toLocaleString()} P</span>
                      {g.stock > 0 ? (
                        <button className="cta">교환하기</button>
                      ) : (
                        <button className="cta disabled" disabled>매진</button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {/* 이벤트 탭 */}
        {tab === "event" && (
          <>
            <h2 className="section-h">진행 중인 이벤트</h2>
            <div className="event-list">
              {events.map((e) => (
                <article key={e.id} className={`event-card ${e.status}`}>
                  <div className="event-thumb"></div>
                  <div className="event-body">
                    <span className={`event-tag ${e.status}`}>
                      {e.status === "active" ? `진행 중 · D-${e.dday}` : "종료"}
                    </span>
                    <h3>{e.name}</h3>
                    <p className="period">{e.period}</p>
                    <p className="desc">{e.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {/* 수집 시스템 탭 */}
        {/* {tab === "collection" && (
          <>
            <h2 className="section-h">수집 시스템</h2>
            <div className="collection-info">
              <div className="info-card">
                <h3>🎯 뱃지 시스템</h3>
                <p>시청 활동에 따라 자동으로 뱃지가 해금됩니다. 획득한 뱃지는 프로필에 표시됩니다.</p>
              </div>
              <div className="info-card">
                <h3>👑 칭호 시스템</h3>
                <p>뱃지마다 고유한 칭호가 있어요. 대표 칭호를 선택해 친구들에게 보여줄 수 있습니다.</p>
              </div>
              <div className="info-card">
                <h3>💎 포인트 시스템</h3>
                <p>결제·리뷰·시청 활동으로 포인트를 적립하고, 한정 굿즈 교환에 사용하세요.</p>
              </div>
              <div className="info-card">
                <h3>🎁 한정 이벤트</h3>
                <p>매월 새로운 이벤트와 한정 굿즈가 공개됩니다. 알림을 켜두면 놓치지 않아요.</p>
              </div>
            </div>
          </>
        )} */}
      </div>
    </div>
  );
}
