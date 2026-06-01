"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import "../../scss/communityPage.scss";

type CommunityTab = "reviews" | "my-feeds" | "create-feed" | "saved";
type ScopeFilterType = "mine" | "liked" | "following";
type FeedFilterType = "all" | "movie" | "tv" | "general";
type SortType = "recent" | "likes" | "comments";

interface UserFeed {
  id: string;
  title: string;
  content: string;
  mediaType: "movie" | "tv" | "general";
  mediaTitle?: string;
  isLikedByUser: boolean;
  isFollowingAuthor: boolean;
  likes: number;
  commentsCount: number;
  createdAt: string;
  isPublic: boolean;
}

interface UserReview {
  id: string;
  mediaId: number;
  mediaType: "movie" | "tv";
  mediaTitle: string;
  posterPath?: string;
  rating: number;
  content: string;
  spoiler: boolean;
  isLikedByUser: boolean;
  isFollowingAuthor: boolean;
  createdAt: string;
}

const tabs: { id: CommunityTab; label: string }[] = [
  { id: "reviews", label: "리뷰 관리" },
  { id: "my-feeds", label: "피드 관리" }
];

const scopeFilters: { key: ScopeFilterType; label: string }[] = [
  { key: "mine", label: "내가 쓴 글" },
  { key: "liked", label: "좋아요 한 글" },
  { key: "following", label: "팔로워 글" },
];

const sortOptions: { key: SortType; label: string }[] = [
  { key: "recent", label: "최근 작성순" },
  { key: "likes", label: "좋아요 많은순" },
  { key: "comments", label: "댓글 많은순" },
];

export default function CommunityPage() {
  return (
    <Suspense fallback={null}>
      <CommunityContent />
    </Suspense>
  );
}

function CommunityContent() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<CommunityTab>("reviews");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilterType>("mine");
  const [feedFilter, setFeedFilter] = useState<FeedFilterType>("all");
  const [sortType, setSortType] = useState<SortType>("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 작성 폼 상태
  const [feedTitle, setFeedTitle] = useState("");
  const [feedContent, setFeedContent] = useState("");
  const [feedMediaType, setFeedMediaType] = useState<"movie" | "tv" | "general">("general");

  const [feeds] = useState<UserFeed[]>([]);
  const [reviews] = useState<UserReview[]>([]);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const currentTabLabel = tabs.find((t) => t.id === activeTab)?.label || "커뮤니티";
  const currentSortLabel = sortOptions.find((o) => o.key === sortType)?.label;

  return (
    <div className="media-list-page community-page">
      <div className="community-inner">
        
        {/* 1. 타이틀 헤더 */}
        <div className="community-header">
          <h1>커뮤니티 관리</h1>
        </div>

        {/* 2. 상단 메인 탭메뉴 (하단 라인 스타일) */}
        <div className="community-tabs" aria-label="커뮤니티 메인 메뉴">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "is-active" : ""}`}
              onClick={() => {
                setActiveTab(tab.id);
                setScopeFilter("mine");
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 로딩 및 예외 처리 가드 */}
        {isLoading ? (
          <div className="community-skeleton-wrap"><div className="wish-poster-skeleton" style={{ height: "250px" }} /></div>
        ) : !user ? (
          <div className="community-empty">
            <p className="empty-text">로그인 후 이용 가능합니다.</p>
            <Link href="/login" className="empty-cta">로그인하기</Link>
          </div>
        ) : (
          <div className="tab-content-panel">
            
            {/* 3. 섹션 타이틀 및 총 개수 표시 */}
            <div className="section-title-row">
              <h2>{currentTabLabel}</h2>
              <span className="total-count">
                {activeTab === "reviews" ? `${reviews.length}개` : activeTab === "my-feeds" ? `${feeds.length}개` : ""}
              </span>
            </div>

            {/* 4. 스크린샷 스타일의 서브 툴바 (타원형 칩 필터 + 우측 정렬) */}
            {activeTab !== "create-feed" && (
              <div className="community-toolbar">
                <div className="community-chips">
                  {scopeFilters.map((sf) => (
                    <button
                      type="button"
                      key={sf.key}
                      className={`chip ${scopeFilter === sf.key ? "is-active" : ""}`}
                      onClick={() => setScopeFilter(sf.key)}
                    >
                      {sf.label} {sf.key === "mine" && activeTab === "reviews" ? reviews.length : 0}
                    </button>
                  ))}
                </div>

                <div className="community-sort">
                  <button type="button" className="sort-btn" onClick={() => setSortOpen(!sortOpen)}>
                    {currentSortLabel}
                    <svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                      className={`sort-arrow ${sortOpen ? "is-open" : ""}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {sortOpen && (
                    <ul className="sort-menu">
                      {sortOptions.map((opt) => (
                        <li key={opt.key}>
                          <button
                            type="button"
                            className={`sort-option ${sortType === opt.key ? "is-selected" : ""}`}
                            onClick={() => { setSortType(opt.key); setSortOpen(false); }}
                          >
                            {opt.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* ── 탭별 본문 콘텐츠 렌더링 영역 ── */}
            <div className="main-content-area">
              {activeTab === "reviews" && (
                <div className="community-empty"><p className="empty-text">작성된 리뷰가 없습니다.</p></div>
              )}

              {activeTab === "my-feeds" && (
                <div className="community-empty"><p className="empty-text">작성된 피드가 없습니다.</p></div>
              )}

              {activeTab === "create-feed" && (
                <form className="feed-builder-form">
                  <div className="form-group">
                    <label>제목</label>
                    <input type="text" placeholder="제목을 입력해주세요." value={feedTitle} onChange={(e) => setFeedTitle(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>내용</label>
                    <textarea rows={6} placeholder="이야기를 공유해보세요." value={feedContent} onChange={(e) => setFeedContent(e.target.value)} />
                  </div>
                  <div className="form-footer-options">
                    <button type="submit" className="btn-submit-feed">발행하기</button>
                  </div>
                </form>
              )}

              {activeTab === "saved" && (
                <div className="community-empty"><p className="empty-text">아카이브가 비어있습니다.</p></div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}