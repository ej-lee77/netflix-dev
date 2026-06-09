"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import BackButton from "@/components/common/BackButton";
import "../../scss/communityPage.scss";
import Review from "@/components/mypage/Review";
import { useCommunityStore } from "@/store/useCommunityStore";
import Feed from "@/components/mypage/Feed";
import { type FeedView, useFeedStore } from "@/store/useFeedStore";

type CommunityTab = "reviews" | "my-feeds" | "create-feed" | "create-review";
type ScopeFilterType = "mine" | "liked" | "following";
type SortType = "recent" | "likes" | "comments";

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
  const initialTab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<CommunityTab>(
    initialTab === "my-feeds" || initialTab === "reviews"
      ? initialTab
      : "reviews",
  );
  const [scopeFilter, setScopeFilter] = useState<ScopeFilterType>("mine");
  const [sortType, setSortType] = useState<SortType>("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const isLoading = false;

  // 작성 폼 상태
  const [feedTitle, setFeedTitle] = useState("");
  const [feedContent, setFeedContent] = useState("");

  const { currentProfile } = useAuthStore();
  const { reviews, fetchUserReviews } = useCommunityStore();
  const { feeds, onDeleteFeed, onHydrateFeeds } = useFeedStore();

  useEffect(() => {
    fetchUserReviews(); 
    onHydrateFeeds();
  }, [fetchUserReviews, onHydrateFeeds]);

  const currentTabLabel = tabs.find((t) => t.id === activeTab)?.label || "커뮤니티";
  const currentSortLabel = sortOptions.find((o) => o.key === sortType)?.label;

  // 1. 현재 프로필 ID와 일치하는 피드만 필터링
  const myFeeds = feeds.filter(
    (feed) => feed.profileId === currentProfile?.id
  );

  // 2. 수정 핸들러 (수정 모달을 띄우는 로직 연결)
  const handleEdit = (review: FeedView) => {
    // page.tsx에 있던 handleOpenEditReview와 같은 역할을 수행
    console.log("수정할 피드:", review);
  };

  // 3. 삭제 핸들러
  const handleDelete = (feedId: string) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      onDeleteFeed(feedId);
    }
  };

  return (
    <div className="media-list-page community-page">
      <div className="community-inner">
        <BackButton fallback="/mypage" />
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
                      {sortOptions
                        // 1. 리뷰 탭일 때 "comments" 옵션 필터링
                        .filter((opt) => !(activeTab === "reviews" && opt.key === "comments"))
                        .map((opt) => (
                          <li key={opt.key}>
                            <button
                              type="button"
                              className={`sort-option ${sortType === opt.key ? "is-selected" : ""}`}
                              onClick={() => {
                                setSortType(opt.key);
                                setSortOpen(false);
                              }}
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
                <>
                  <Review sortType={sortType} scopeFilter={scopeFilter} />
                </>
              )}

              {activeTab === "my-feeds" && (
                <>
                <Feed 
                  feeds={myFeeds} 
                  onDeleteFeed={handleDelete} 
                  onEditFeed={handleEdit} 
                />
                </>
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

              {activeTab === "create-review" && (
                <div className="community-empty"><p className="empty-text">아카이브가 비어있습니다.</p></div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
