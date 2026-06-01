"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { customMenus } from "@/data/mainMenu";
import { usePlayListStore } from "@/store/usePlayListStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import type { PlayListItem } from "@/types/playList";
import "../../scss/mediaList.scss";

type ActivityTab = "watching" | "history" | "wishlist" | "reviews" | "playlists";
type FilterType = "all" | "movie" | "tv";
type WishFilterType = "all" | "movie" | "drama" | "animation";
type WishSortType = "recent" | "title" | "rating";

interface CustomPlaylist {
  id: string;
  title: string;
  description?: string;
  moodTags?: string[];
  isPublic?: boolean;
  itemKeys: string[];
  createdAt: string;
}

interface ActivityReview {
  id: number;
  author: string;
  rating: number;
  content: string;
  createdAt: string;
  spoiler: boolean;
  mediaId: number;
  mediaType: "movie" | "tv";
  mediaTitle: string;
  posterPath?: string;
}

const CUSTOM_PLAYLIST_KEY = "netflix-custom-playlists";
const USER_REVIEWS_KEY = "netflix-user-reviews";
const SELECTABLE_PAGE_SIZE = 10;
const PLAYLIST_MOOD_TAGS = customMenus.filter((menu) => menu.path.startsWith("/mood/"));
const getMoodIcon = (tag: string) => PLAYLIST_MOOD_TAGS.find((mood) => mood.title === tag)?.imgUrl;

const tabs: { id: ActivityTab; label: string }[] = [
  { id: "watching", label: "시청중" },
  { id: "history", label: "시청기록" },
  { id: "wishlist", label: "위시리스트" },
  { id: "reviews", label: "리뷰" },
  { id: "playlists", label: "플레이리스트" },
];

// URL ?tab= 값이 유효한 탭인지 확인
const isActivityTab = (value: string | null): value is ActivityTab =>
  value === "watching" || value === "history" || value === "wishlist" ||
  value === "reviews" || value === "playlists";

const wishTabs: { key: WishFilterType; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "movie", label: "영화" },
  { key: "drama", label: "드라마" },
  { key: "animation", label: "애니메이션" },
];

const wishSortOptions: { key: WishSortType; label: string }[] = [
  { key: "recent", label: "최근 찜한 순" },
  { key: "title", label: "제목순" },
  { key: "rating", label: "평점순" },
];

const getItemKey = (item: Pick<PlayListItem, "id" | "mediaType">) => `${item.mediaType}-${item.id}`;

const getPosterUrl = (path?: string) => (
  path ? `https://image.tmdb.org/t/p/w500${path}` : ""
);

const getBackdropUrl = (item: PlayListItem) => (
  getPosterUrl(item.backdrop_path || item.poster_path)
);

const getProgress = (item: PlayListItem) => 35 + (item.id % 50);

const formatDate = (value: string) => new Date(value).toLocaleDateString("ko-KR");

const loadCustomPlaylists = () => {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(CUSTOM_PLAYLIST_KEY);
    return stored ? JSON.parse(stored) as CustomPlaylist[] : [];
  } catch {
    return [];
  }
};

const saveCustomPlaylists = (items: CustomPlaylist[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CUSTOM_PLAYLIST_KEY, JSON.stringify(items));
};

const loadUserReviews = () => {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(USER_REVIEWS_KEY);
    return stored ? JSON.parse(stored) as ActivityReview[] : [];
  } catch {
    return [];
  }
};

export default function PlaylistPage() {
  return (
    <Suspense fallback={null}>
      <ActivityContent />
    </Suspense>
  );
}

function ActivityContent() {
  const {
    playList,
    myList,
    onLoadPlayList,
    onLoadMyList,
    onRemovePlayList,
    onRemoveMyList,
  } = usePlayListStore();
  const { wishlist, onLoadWishlist, onRemoveWish } = useWishlistStore();
  const { user } = useAuthStore();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<ActivityTab>("watching");
  const [filter, setFilter] = useState<FilterType>("all");
  const [wishFilter, setWishFilter] = useState<WishFilterType>("all");
  const [wishSort, setWishSort] = useState<WishSortType>("recent");
  const [wishSortOpen, setWishSortOpen] = useState(false);
  const [wishLoading, setWishLoading] = useState(true);
  const [playlistTitle, setPlaylistTitle] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [selectedMoodTags, setSelectedMoodTags] = useState<string[]>([]);
  const [playlistIsPublic, setPlaylistIsPublic] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectionPage, setSelectionPage] = useState(1);
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);
  const [customPlaylists, setCustomPlaylists] = useState<CustomPlaylist[]>(loadCustomPlaylists);
  const [reviews, setReviews] = useState<ActivityReview[]>(loadUserReviews);
  const [modifyPlaylistId, setModifyPlaylistId] = useState<string | null>(null);
  const [modifyTitle, setModifyTitle] = useState("");
  const [modifyDescription, setModifyDescription] = useState("");
  const [modifyMoodTags, setModifyMoodTags] = useState<string[]>([]);
  const [modifyIsPublic, setModifyIsPublic] = useState(false);
  const [modifyItemKeys, setModifyItemKeys] = useState<string[]>([]);

  // 헤더 메뉴에서 ?tab=wishlist / ?tab=playlists 로 들어오면 해당 탭 열기
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (isActivityTab(tabParam)) {
      const timeoutId = window.setTimeout(() => {
        setActiveTab(tabParam);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [searchParams]);

  useEffect(() => {
    onLoadPlayList();
    onLoadMyList();
    const timeoutId = window.setTimeout(() => {
      setReviews(loadUserReviews());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [onLoadPlayList, onLoadMyList]);

  useEffect(() => {
    if (!modifyPlaylistId && !createPlaylistOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (modifyPlaylistId) {
          setModifyPlaylistId(null);
          setModifyTitle("");
          setModifyDescription("");
          setModifyMoodTags([]);
          setModifyIsPublic(false);
          setModifyItemKeys([]);
        }
        if (createPlaylistOpen) {
          setCreatePlaylistOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modifyPlaylistId, createPlaylistOpen]);

  // 찜 목록 불러오기
  useEffect(() => {
    const load = async () => {
      setWishLoading(true);
      await onLoadWishlist();
      setWishLoading(false);
    };
    load();
  }, [onLoadWishlist, user]);

  const watchItems = playList;
  const listItems = myList;
  const watchingItems = watchItems.slice(0, 6);
  const filteredHistory = filter === "all" ? watchItems : watchItems.filter((item) => item.mediaType === filter);
  const movieCount = watchItems.filter((item) => item.mediaType === "movie").length;
  const tvCount = watchItems.filter((item) => item.mediaType === "tv").length;

  // ── 찜하기 필터/정렬 ──────────────────────────────────────────────────
  const wishCount = (key: WishFilterType) => {
    if (key === "all") return wishlist.length;
    if (key === "movie") return wishlist.filter((i) => i.genre === "movie").length;
    if (key === "drama") return wishlist.filter((i) => i.genre === "drama").length;
    if (key === "animation") return wishlist.filter((i) => i.genre === "animation").length;
    return 0;
  };

  const filteredWish = wishlist.filter((item) => {
    if (wishFilter === "all") return true;
    return item.genre === wishFilter;
  });

  const sortedWish = [...filteredWish].sort((a, b) => {
    if (wishSort === "title") return a.title.localeCompare(b.title);
    if (wishSort === "rating") return b.vote_average - a.vote_average;
    return 0; // recent: 배열 순서 유지 (맨 앞이 최근)
  });

  const currentWishSortLabel = wishSortOptions.find((o) => o.key === wishSort)?.label;

  const handleRemoveWish = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    await onRemoveWish(id);
  };

  const selectedItems = listItems.filter((item) => selectedKeys.includes(getItemKey(item)));
  const totalSelectionPages = Math.max(1, Math.ceil(listItems.length / SELECTABLE_PAGE_SIZE));
  const currentSelectionPage = Math.min(selectionPage, totalSelectionPages);
  const pagedSelectionItems = listItems.slice(
    (currentSelectionPage - 1) * SELECTABLE_PAGE_SIZE,
    currentSelectionPage * SELECTABLE_PAGE_SIZE
  );

  const toggleSelected = (key: string) => {
    setSelectedKeys((prev) => (
      prev.includes(key)
        ? prev.filter((itemKey) => itemKey !== key)
        : [...prev, key]
    ));
  };

  const toggleMoodTag = (tag: string) => {
    setSelectedMoodTags((prev) => (
      prev.includes(tag)
        ? prev.filter((item) => item !== tag)
        : [...prev, tag]
    ));
  };

  const handleCreatePlaylist = () => {
    const title = playlistTitle.trim();
    const description = playlistDescription.trim();
    if (!title || selectedKeys.length === 0) return;

    const nextPlaylists = [
      {
        id: `${Date.now()}`,
        title,
        description,
        moodTags: selectedMoodTags,
        isPublic: playlistIsPublic,
        itemKeys: selectedKeys,
        createdAt: new Date().toISOString(),
      },
      ...customPlaylists,
    ];

    setCustomPlaylists(nextPlaylists);
    saveCustomPlaylists(nextPlaylists);
    setPlaylistTitle("");
    setPlaylistDescription("");
    setSelectedMoodTags([]);
    setPlaylistIsPublic(false);
    setSelectedKeys([]);
    setSelectionPage(1);
    setCreatePlaylistOpen(false);
  };

  const openCreatePlaylistModal = () => {
    if (selectedKeys.length === 0) return;
    setCreatePlaylistOpen(true);
  };

  const closeCreatePlaylistModal = () => {
    setCreatePlaylistOpen(false);
  };

  const handleDeletePlaylist = (playlistId: string) => {
    const nextPlaylists = customPlaylists.filter((playlist) => playlist.id !== playlistId);

    setCustomPlaylists(nextPlaylists);
    saveCustomPlaylists(nextPlaylists);
    if (modifyPlaylistId === playlistId) {
      closeModifyCard();
    }
  };

  const openModifyCard = (playlist: CustomPlaylist) => {
    setModifyPlaylistId(playlist.id);
    setModifyTitle(playlist.title);
    setModifyDescription(playlist.description || "");
    setModifyMoodTags(playlist.moodTags || []);
    setModifyIsPublic(Boolean(playlist.isPublic));
    setModifyItemKeys(playlist.itemKeys);
  };

  const closeModifyCard = () => {
    setModifyPlaylistId(null);
    setModifyTitle("");
    setModifyDescription("");
    setModifyMoodTags([]);
    setModifyIsPublic(false);
    setModifyItemKeys([]);
  };

  const toggleModifyMoodTag = (tag: string) => {
    setModifyMoodTags((prev) => (
      prev.includes(tag)
        ? prev.filter((item) => item !== tag)
        : [...prev, tag]
    ));
  };

  const toggleModifyItemKey = (key: string) => {
    setModifyItemKeys((prev) => (
      prev.includes(key)
        ? prev.filter((itemKey) => itemKey !== key)
        : [...prev, key]
    ));
  };

  const handleSaveModifyPlaylist = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!modifyPlaylistId) return;

    const title = modifyTitle.trim();
    const description = modifyDescription.trim();
    if (!title || modifyItemKeys.length === 0) return;

    const nextPlaylists = customPlaylists.map((playlist) => (
      playlist.id === modifyPlaylistId
        ? {
          ...playlist,
          title,
          description,
          moodTags: modifyMoodTags,
          isPublic: modifyIsPublic,
          itemKeys: modifyItemKeys,
        }
        : playlist
    ));

    setCustomPlaylists(nextPlaylists);
    saveCustomPlaylists(nextPlaylists);
    closeModifyCard();
  };

  const handleDeleteWatchingItem = async (item: PlayListItem) => {
    await onRemovePlayList(item.id, item.mediaType);
  };

  const handleDeleteMyListItem = async (item: PlayListItem) => {
    await onRemoveMyList(item.id, item.mediaType);

    const itemKey = getItemKey(item);
    setSelectedKeys((prev) => prev.filter((key) => key !== itemKey));

    const nextPlaylists = customPlaylists.map((playlist) => ({
      ...playlist,
      itemKeys: playlist.itemKeys.filter((key) => key !== itemKey),
    }));
    setCustomPlaylists(nextPlaylists);
    saveCustomPlaylists(nextPlaylists);
    setModifyItemKeys((prev) => prev.filter((key) => key !== itemKey));
  };

  //renderModifyCard : 제목, 설명, 무드태그, 공개여부, 추가된 컨텐츠 수정 팝업창
  const renderModifyCard = () => {
    if (!modifyPlaylistId) return null;

    const selectedModifyItems = listItems.filter((item) => modifyItemKeys.includes(getItemKey(item)));

    return (
      <div
        className="modify-playlist-backdrop"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeModifyCard();
          }
        }}
      >
        <section
          className="modify-playlist-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modify-playlist-title"
        >
          <form onSubmit={handleSaveModifyPlaylist}>
            <div className="modify-playlist-head">
              <div>
                <div className="title-area">
                  <img src="/images/playlist/playlist-icon.svg" alt="." />
                  <h3 id="modify-playlist-title">플레이리스트 수정</h3>
                </div>

                <p>{selectedModifyItems.length}개 작품 선택됨</p>
              </div>
              <button
                type="button"
                className="modify-close-btn"
                onClick={closeModifyCard}
                aria-label="수정 창 닫기"
              >
                ×
              </button>
            </div>

            <div className="modify-field-stack">
              <label>
                <span>제목</span>
                <input
                  type="text"
                  value={modifyTitle}
                  onChange={(event) => setModifyTitle(event.target.value)}
                  placeholder="플레이리스트 제목"
                />
              </label>

              <label>
                <span>설명</span>
                <textarea
                  value={modifyDescription}
                  onChange={(event) => setModifyDescription(event.target.value)}
                  placeholder="플레이리스트 설명"
                />
              </label>
            </div>

            <div className="modify-section">
              <strong>무드 태그</strong>
              <div className="modify-mood-tags">
                {PLAYLIST_MOOD_TAGS.map((mood) => (
                  <button
                    type="button"
                    key={mood.path}
                    className={modifyMoodTags.includes(mood.title) ? "active" : ""}
                    onClick={() => toggleModifyMoodTag(mood.title)}
                  >
                    <img src={mood.imgUrl} alt="" />
                    {mood.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="modify-section">
              <strong>피드 공개 여부</strong>
              <button
                type="button"
                className={modifyIsPublic ? "modify-visibility-toggle active" : "modify-visibility-toggle"}
                onClick={() => setModifyIsPublic((value) => !value)}
                aria-pressed={modifyIsPublic}
              >
                피드 공개
                {/* {modifyIsPublic ? "피드 공개" : "비공개"} */}
              </button>
            </div>

            <div className="modify-section">
              <strong>추가된 콘텐츠</strong>
              <div className="modify-content-grid">
                {listItems.map((item) => {
                  const key = getItemKey(item);
                  const isSelected = modifyItemKeys.includes(key);

                  return (
                    <button
                      type="button"
                      key={key}
                      className={isSelected ? "modify-content-card selected" : "modify-content-card"}
                      onClick={() => toggleModifyItemKey(key)}
                    >
                      {item.poster_path && <img src={getPosterUrl(item.poster_path)} alt="" />}
                      <span>{isSelected ? "✓" : "+"}</span>
                      <strong>{item.title}</strong>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="modify-actions">
              <button type="button" className="modify-cancel-btn" onClick={closeModifyCard}>
                취소
              </button>
              <button
                type="submit"
                className="modify-save-btn"
                disabled={!modifyTitle.trim() || modifyItemKeys.length === 0}
              >
                저장
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  };

  const renderCreatePlaylistModal = () => {
    if (!createPlaylistOpen) return null;

    return (
      <div
        className="modify-playlist-backdrop"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeCreatePlaylistModal();
          }
        }}
      >
        <section
          className="modify-playlist-modal create-playlist-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-playlist-title"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleCreatePlaylist();
            }}
          >
            <div className="modify-playlist-head">
              <div>
                <div className="title-area">
                  <img src="/images/playlist/playlist-icon.svg" alt="." />
                  <h3 id="create-playlist-title">플레이리스트 만들기</h3>
                </div>

                <p>{selectedItems.length}개 작품으로 새 플레이리스트를 만들어요</p>
              </div>
              <button
                type="button"
                className="modify-close-btn"
                onClick={closeCreatePlaylistModal}
                aria-label="만들기 창 닫기"
              >
                ×
              </button>
            </div>

            <div className="create-selected-strip" aria-label="선택된 콘텐츠">
              {selectedItems.slice(0, 6).map((item) => (
                <span key={getItemKey(item)}>
                  {item.poster_path && <img src={getPosterUrl(item.poster_path)} alt="" />}
                </span>
              ))}
              {selectedItems.length > 6 && <em>+{selectedItems.length - 6}</em>}
            </div>

            <div className="modify-field-stack">
              <label>
                <span>제목</span>
                <input
                  type="text"
                  value={playlistTitle}
                  onChange={(event) => setPlaylistTitle(event.target.value)}
                  placeholder="플레이리스트 이름"
                />
              </label>

              <label>
                <span>설명</span>
                <textarea
                  value={playlistDescription}
                  onChange={(event) => setPlaylistDescription(event.target.value)}
                  placeholder="플레이리스트 설명"
                />
              </label>
            </div>

            <div className="modify-section">
              <strong>무드 태그</strong>
              <div className="modify-mood-tags">
                {PLAYLIST_MOOD_TAGS.map((mood) => (
                  <button
                    type="button"
                    key={mood.path}
                    className={selectedMoodTags.includes(mood.title) ? "active" : ""}
                    onClick={() => toggleMoodTag(mood.title)}
                  >
                    <img src={mood.imgUrl} alt="" />
                    {mood.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="modify-section">
              <strong>피드 공개 여부</strong>
              <button
                type="button"
                className={playlistIsPublic ? "modify-visibility-toggle active" : "modify-visibility-toggle"}
                onClick={() => setPlaylistIsPublic((value) => !value)}
                aria-pressed={playlistIsPublic}
              >
                {/* {playlistIsPublic ? "피드 공개" : "비공개"} */}
                피드 공개
              </button>
            </div>

            <div className="modify-actions">
              <button type="button" className="modify-cancel-btn" onClick={closeCreatePlaylistModal}>
                취소
              </button>
              <button
                type="submit"
                className="modify-save-btn"
                disabled={!playlistTitle.trim() || selectedKeys.length === 0}
              >
                만들기
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  };

  const renderEmpty = (message: string) => (
    <div className="empty">
      <img src="/images/playlist/empty-contents.png" alt="." />
      <p>{message}</p>
      {/* <Link href="/" className="btn-primary">작품 둘러보기</Link> */}
    </div>
  );

  const renderWatching = () => (
    <section className="activity-section">
      <div className="section-head">
        <h2>시청 중인 콘텐츠 <strong>{watchingItems.length}</strong></h2>
        <button type="button" onClick={() => setActiveTab("history")}>전체보기</button>
      </div>

      {watchingItems.length > 0 ? (
        <div className="watching-grid">
          {watchingItems.map((item) => (
            <article className="watch-card" key={getItemKey(item)}>
              <button
                type="button"
                className="watch-delete-btn"
                onClick={() => handleDeleteWatchingItem(item)}
                aria-label={`${item.title} 시청중 콘텐츠 삭제`}
              >
                -
              </button>
              <Link href={`/detail/${item.mediaType}/${item.id}`}>
                <div className="watch-thumb">
                  {item.poster_path && <img src={getPosterUrl(item.poster_path)} alt={item.title} />}
                  <span className="progress-bar" style={{ width: `${getProgress(item)}%` }} />
                </div>
                <div className="watch-info">
                  <div>
                    <h3>{item.title}</h3>
                    <p>마지막 시청: {formatDate(item.playTime)}</p>
                  </div>
                  <span className="play-pill">▶ 이어보기</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      ) : renderEmpty("시청 중인 콘텐츠가 없어요.")}
    </section>
  );

  const renderHistory = () => (
    <section className="activity-section">
      <div className="section-head">
        <h2>시청기록</h2>
        <select className="sort-select" defaultValue="recent" aria-label="정렬">
          <option value="recent">최근 시청순</option>
          <option value="title">제목순</option>
        </select>
      </div>

      <div className="filter-row">
        <div className="filter-chips">
          <button className={filter === "all" ? "chip active" : "chip"} onClick={() => setFilter("all")}>
            전체 {watchItems.length}
          </button>
          <button className={filter === "movie" ? "chip active" : "chip"} onClick={() => setFilter("movie")}>
            영화 {movieCount}
          </button>
          <button className={filter === "tv" ? "chip active" : "chip"} onClick={() => setFilter("tv")}>
            TV 프로그램 {tvCount}
          </button>
        </div>
      </div>

      {filteredHistory.length > 0 ? (
        <div className="history-poster-grid">
          {filteredHistory.map((item) => (
            <article className="mini-poster-card" key={getItemKey(item)}>
              <button
                type="button"
                className="mini-delete-btn"
                onClick={() => handleDeleteWatchingItem(item)}
                aria-label={`${item.title} 시청기록 삭제`}
              >
                -
              </button>
              <Link href={`/detail/${item.mediaType}/${item.id}`} className="mini-poster">
                <div className="mini-poster__image">
                  {item.poster_path && <img src={getPosterUrl(item.poster_path)} alt={item.title} />}
                </div>
                <h3>{item.title}</h3>
                <p>{formatDate(item.playTime)}</p>
              </Link>
            </article>
          ))}
        </div>
      ) : renderEmpty("시청기록이 없어요.")}
    </section>
  );

  // ── 찜하기 (위시리스트 통합) ──────────────────────────────────────────
  const renderWishlist = () => (
    <section className="activity-section">
      <div className="section-head">
        <h2>위시리스트</h2>
        <span>{wishlist.length}개</span>
      </div>

      <div className="wish-toolbar">
        <div className="wish-chips">
          {wishTabs.map((tab) => (
            <button
              type="button"
              key={tab.key}
              className={wishFilter === tab.key ? "chip active" : "chip"}
              onClick={() => setWishFilter(tab.key)}
            >
              {tab.label} {wishCount(tab.key)}
            </button>
          ))}
        </div>

        <div className="wish-sort">
          <button
            type="button"
            className="wish-sort-btn"
            onClick={() => setWishSortOpen((v) => !v)}
          >
            {currentWishSortLabel}
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              className={`wish-sort-arrow${wishSortOpen ? " is-open" : ""}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {wishSortOpen && (
            <ul className="wish-sort-menu">
              {wishSortOptions.map((opt) => (
                <li key={opt.key}>
                  <button
                    type="button"
                    className={`wish-sort-option${wishSort === opt.key ? " is-selected" : ""}`}
                    onClick={() => {
                      setWishSort(opt.key);
                      setWishSortOpen(false);
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

      {wishLoading ? (
        <div className="history-poster-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <article className="mini-poster-card" key={i}>
              <div className="mini-poster">
                <div className="mini-poster__image wish-skeleton" />
              </div>
            </article>
          ))}
        </div>
      ) : !user ? (
        <div className="empty">
          <p>로그인하고 찜한 작품을 확인하세요.</p>
          <Link href="/login" className="btn-primary">로그인하기</Link>
        </div>
      ) : sortedWish.length > 0 ? (
        <div className="history-poster-grid">
          {sortedWish.map((item) => (
            <article className="mini-poster-card" key={`${item.mediaType}-${item.id}`}>
              <button
                type="button"
                className="mini-delete-btn"
                onClick={(e) => handleRemoveWish(e, item.id)}
                aria-label={`${item.title} 찜 해제`}
              >
                삭제
              </button>
              <Link href={`/detail/${item.mediaType}/${item.id}`} className="mini-poster">
                <div className="mini-poster__image">
                  {item.poster_path && <img src={getPosterUrl(item.poster_path)} alt={item.title} />}
                </div>
                <h3>{item.title}</h3>
                <p>★ {item.vote_average.toFixed(1)}</p>
              </Link>
            </article>
          ))}
        </div>
      ) : renderEmpty("아직 찜한 작품이 없어요.")}
    </section>
  );

  const renderReviews = () => (
    <section className="activity-section">
      <div className="section-head">
        <h2>작성한 리뷰</h2>
        <span>{reviews.length}개</span>
      </div>

      {reviews.length > 0 ? (
        <div className="review-stack">
          {reviews.map((review) => (
            <article className="review-row" key={review.id}>
              <Link href={`/detail/${review.mediaType}/${review.mediaId}`} className="review-poster">
                {review.posterPath && <img src={getPosterUrl(review.posterPath)} alt={review.mediaTitle} />}
              </Link>
              <div className="review-content">
                <div className="review-title-row">
                  <h3>{review.mediaTitle}</h3>
                  {review.spoiler && <span>스포일러</span>}
                </div>
                <p className="stars">★★★★★ <em>{review.rating.toFixed(1)} / 5.0</em></p>
                <p className="review-copy">{review.content}</p>
                <div className="review-meta">
                  <span>{review.author}</span>
                  <time>{review.createdAt}</time>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : renderEmpty("작성한 리뷰가 없어요.")}
    </section>
  );

  const renderPlaylistMosaic = (playlist: CustomPlaylist) => {
    const playlistItems = listItems.filter((item) => playlist.itemKeys.includes(getItemKey(item)));
    const previewItems = playlistItems.slice(0, 4);

    return (
      <article className="custom-playlist-card" key={playlist.id}>
        <button
          type="button"
          className="playlist-delete-btn"
          onClick={() => handleDeletePlaylist(playlist.id)}
          aria-label={`${playlist.title} 플레이리스트 삭제`}
        >
          -
        </button>
        <div className="playlist-mosaic">
          {previewItems.map((item) => (
            <div key={getItemKey(item)}>
              {(item.backdrop_path || item.poster_path) && <img src={getBackdropUrl(item)} alt={item.title} />}
            </div>
          ))}
          {playlistItems.length > 4 && <span>+{playlistItems.length - 4}</span>}
        </div>
        <h3>{playlist.title}</h3>
        {playlist.description && <p className="playlist-description">{playlist.description}</p>}
        {playlist.moodTags && playlist.moodTags.length > 0 && (
          <div className="playlist-tag-row">
            {playlist.moodTags.map((tag) => {
              const icon = getMoodIcon(tag);

              return (
                <span key={tag}>
                  {icon && <img src={icon} alt="" />}
                  {tag}
                </span>
              );
            })}
          </div>
        )}
        <span className={playlist.isPublic ? "playlist-visibility public" : "playlist-visibility"}>
          {playlist.isPublic ? "피드 공개" : "비공개"}
        </span>
        <div className="playlist-extra-area">
          <p>{playlistItems.length}개 작품 · {formatDate(playlist.createdAt)}</p>
          <button
            className="playcard-more-btn"
            type="button"
            onClick={() => openModifyCard(playlist)}
            aria-label={`${playlist.title} 플레이리스트 수정`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="m12 16.495c1.242 0 2.25 1.008 2.25 2.25s-1.008 2.25-2.25 2.25-2.25-1.008-2.25-2.25 1.008-2.25 2.25-2.25zm0-6.75c1.242 0 2.25 1.008 2.25 2.25s-1.008 2.25-2.25 2.25-2.25-1.008-2.25-2.25 1.008-2.25 2.25-2.25zm0-6.75c1.242 0 2.25 1.008 2.25 2.25s-1.008 2.25-2.25 2.25-2.25-1.008-2.25-2.25 1.008-2.25 2.25-2.25z"
              />
            </svg>
          </button>
        </div>

      </article>
    );
  };

  const renderPlaylists = () => (
    <section className="activity-section">
      <div className="section-head playlist-content-head">
        <div>
          <h2>플레이리스트에 담을 콘텐츠</h2>
          <span>{selectedItems.length}개 선택됨</span>
        </div>
        <button
          type="button"
          className="create-playlist-btn"
          onClick={openCreatePlaylistModal}
          disabled={selectedKeys.length === 0}
        >
          <div className="content">
            <img src="/images/playlist/playlist-icon.svg" alt="" />
            <p>플레이리스트 만들기</p>
          </div>

        </button>
      </div>

      <div className="playlist-content-layout" id="playlist-builder">
        <div className="selectable-history-wrap playlist-content-panel">
          {listItems.length > 0 ? (
            <div className="selectable-history">
              {pagedSelectionItems.map((item) => {
                const key = getItemKey(item);
                const isSelected = selectedKeys.includes(key);

                return (
                  <article key={key} className={isSelected ? "select-card selected" : "select-card"}>
                    <button
                      type="button"
                      className="select-card-main"
                      onClick={() => toggleSelected(key)}
                    >
                      <span className="select-check">{isSelected ? "✓" : "+"}</span>
                      {item.poster_path && <img src={getPosterUrl(item.poster_path)} alt="" />}
                    </button>
                    <div className="select-card-title-row">
                      <strong>{item.title}</strong>
                      <button
                        type="button"
                        className="select-delete-btn"
                        onClick={() => handleDeleteMyListItem(item)}
                        aria-label={`${item.title} 내 리스트 삭제`}
                      >
                        -
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="playlist-selection-empty">
              {renderEmpty("아직 플레이리스트에 담을 콘텐츠가 없어요.")}
            </div>
          )}

          {totalSelectionPages > 1 && (
            <div className="selection-pagination">
              <button
                type="button"
                onClick={() => setSelectionPage((page) => Math.max(1, page - 1))}
                disabled={currentSelectionPage === 1}
              >
                ‹
              </button>
              {Array.from({ length: totalSelectionPages }, (_, index) => index + 1).map((page) => (
                <button
                  type="button"
                  key={page}
                  className={page === currentSelectionPage ? "active" : ""}
                  onClick={() => setSelectionPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectionPage((page) => Math.min(totalSelectionPages, page + 1))}
                disabled={currentSelectionPage === totalSelectionPages}
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="playlist-section-divider" aria-hidden="true" />

      <div className="section-head">
        <h2>나의 플레이리스트</h2>
        <span>{customPlaylists.length}개</span>
      </div>

      {customPlaylists.length > 0 ? (
        <div className="custom-playlist-grid">
          {customPlaylists.map(renderPlaylistMosaic)}
        </div>
      ) : (
        <div className="playlist-empty-state">
          <img src="/images/playlist/empty-playlist.png" alt="" />
          {/* <h3>아직 플레이리스트가 없어요</h3> */}
          <p>아직 플레이리스트가 없어요.</p>
          {/* <p>
            Your archive is empty.<br />
            Start your collection.
          </p> */}
        </div>
      )}
    </section>
  );

  return (
    <div className="media-list-page activity-page">
      <div className="inner">
        <div className="activity-hero">
          <div className="page-head">
            <h1>콘텐츠 활동</h1>
            <p>내가 찜·시청하고 기록한 모든 작품</p>
          </div>

          <nav className="activity-tabs" aria-label="콘텐츠 활동 탭">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                className={activeTab === tab.id ? "active" : ""}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === "watching" && renderWatching()}
        {activeTab === "history" && renderHistory()}
        {activeTab === "wishlist" && renderWishlist()}
        {activeTab === "reviews" && renderReviews()}
        {activeTab === "playlists" && renderPlaylists()}
        {renderCreatePlaylistModal()}
        {renderModifyCard()}
      </div>
    </div>
  );
}
