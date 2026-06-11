"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMovieStore } from "@/store/useMovieStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCommunityEnabled } from "@/data/maturityFilter";
import { showToast } from "@/store/useToastStore";

const TMDB_IMG = "https://image.tmdb.org/t/p";
function imageUrl(path?: string | null, size = "w342") {
  return path ? `${TMDB_IMG}/${size}${path}` : "";
}
function getTitle(item?: any) {
  return item?.title || item?.name || "작품";
}

interface WatchClientProps {
  type: "movie" | "tv";
  mediaId: number;
}

export default function WatchClient({ type, mediaId }: WatchClientProps) {
  const router = useRouter();
  const isTv = type === "tv";
  const itemKey = `${type}-${mediaId}`;

  const {
    mediaDetails,
    onFetchMediaDetail,
    popVideos,
    tvVideos,
    onFetchVideo,
    onFetchTvVideos,
    episodes,
    onFetchEpisodes,
    recommended,
    onFetchRecommended,
  } = useMovieStore();

  const { isWished, onAddWish, onRemoveWish, onLoadWishlist } =
    useWishlistStore();
  const canUseConnect = useCommunityEnabled();

  const [epIndex, setEpIndex] = useState(0);

  useEffect(() => {
    onLoadWishlist();
  }, [onLoadWishlist]);

  useEffect(() => {
    if (!mediaId) return;
    onFetchMediaDetail(mediaId, type);
    if (isTv) {
      onFetchTvVideos(mediaId);
      onFetchEpisodes(mediaId, 1);
    } else {
      onFetchVideo(mediaId);
    }
  }, [
    mediaId,
    type,
    isTv,
    onFetchMediaDetail,
    onFetchTvVideos,
    onFetchVideo,
    onFetchEpisodes,
  ]);

  useEffect(() => {
    if (recommended.length === 0) onFetchRecommended();
  }, [recommended.length, onFetchRecommended]);

  const mediaItem: any =
    mediaDetails[itemKey] ?? mediaDetails[`${type}-${mediaId}`];
  const title = getTitle(mediaItem);
  const genreName = mediaItem?.genres?.[0]?.name ?? "";
  const year = (
    isTv ? mediaItem?.first_air_date : mediaItem?.release_date
  )?.split?.("-")?.[0];

  const videos: any[] | undefined = isTv
    ? mediaItem
      ? tvVideos[mediaItem.id]
      : undefined
    : mediaItem
      ? popVideos[mediaItem.id]
      : undefined;
  const trailer =
    videos?.find((v) => v.type === "Trailer" || v.type === "Teaser") ??
    videos?.[0];
  const trailerKey: string | null = trailer?.key ?? null;

  const epList: any[] = isTv ? episodes : [];
  const currentEp = epList[epIndex] ?? epList[0] ?? null;
  const hasPrev = isTv && epIndex > 0;
  const hasNext = isTv && epIndex < epList.length - 1;

  const related = (recommended as any[])
    .filter((r) => r.id !== mediaId)
    .slice(0, 6);

  const wished = isWished(itemKey);

  const goDetail = () => router.push(`/detail/${type}/${mediaId}`);

  const handleWish = async () => {
    if (!mediaItem) return;
    if (wished) await onRemoveWish(mediaItem);
    else await onAddWish(mediaItem);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/detail/${type}/${mediaId}`,
      );
      showToast("링크가 복사되었어요");
    } catch {
      showToast("링크 복사에 실패했어요");
    }
  };

  const handleWatchParty = () => {
    showToast("같이 보기는 곧 제공돼요");
  };

  const epLabel = currentEp
    ? `${currentEp.episode_number ?? epIndex + 1}화${currentEp.name ? ` 「${currentEp.name}」` : ""}`
    : "";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#fff",
        padding: "16px clamp(16px, 4vw, 48px) 60px",
      }}
    >
      {/* 상단 바 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <button
          type="button"
          onClick={goDetail}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid #2a2a2a",
            color: "#eee",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          ← 뒤로
        </button>

        <span style={{ color: "#888", fontSize: 13, textAlign: "center" }}>
          {title}
          {isTv && currentEp ? ` · ${currentEp.episode_number ?? epIndex + 1}화` : ""}
        </span>

        {canUseConnect ? (
          <button
            type="button"
            onClick={handleWatchParty}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(229,9,20,0.14)",
              border: "1px solid rgba(229,9,20,0.5)",
              color: "#ff6b73",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            같이 보기 시작
          </button>
        ) : (
          <span style={{ width: 120 }} />
        )}
      </div>

      {/* 본문: 플레이어 + 추천 패널 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {/* 플레이어 영역 */}
        <div style={{ flex: "1 1 560px", minWidth: 0 }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              paddingBottom: "56.25%",
              background: "#000",
              borderRadius: 10,
              overflow: "hidden",
              border: "1px solid #1c1c1c",
            }}
          >
            {trailerKey ? (
              <iframe
                key={trailerKey}
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                title={title}
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  color: "#888",
                }}
              >
                <span style={{ fontSize: 14 }}>
                  {mediaItem ? "재생할 영상이 없어요." : "불러오는 중…"}
                </span>
                {mediaItem && (
                  <button
                    type="button"
                    onClick={goDetail}
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid #2a2a2a",
                      color: "#eee",
                      borderRadius: 8,
                      padding: "8px 14px",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    상세페이지로 가기
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 제목 + 메타 + (시리즈) 이전화/다음화 */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 12,
              marginTop: 14,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{title}</div>
              <div style={{ fontSize: 13, color: "#9a9a9a", marginTop: 4 }}>
                {[genreName, year, isTv ? epLabel : ""].filter(Boolean).join(" · ")}
              </div>
            </div>

            {isTv && epList.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  disabled={!hasPrev}
                  onClick={() => setEpIndex((i) => Math.max(0, i - 1))}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    background: "transparent",
                    border: "1px solid #333",
                    color: hasPrev ? "#eee" : "#555",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 13,
                    cursor: hasPrev ? "pointer" : "default",
                  }}
                >
                  ← 이전화
                </button>
                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={() =>
                    setEpIndex((i) => Math.min(epList.length - 1, i + 1))
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    background: "transparent",
                    border: "1px solid #333",
                    color: hasNext ? "#eee" : "#555",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 13,
                    cursor: hasNext ? "pointer" : "default",
                  }}
                >
                  다음화 →
                </button>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={handleWish}
              style={{
                background: wished ? "rgba(229,9,20,0.14)" : "transparent",
                border: `1px solid ${wished ? "rgba(229,9,20,0.5)" : "#333"}`,
                color: wished ? "#ff6b73" : "#eee",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {wished ? "♥ 찜 완료" : "+ 찜"}
            </button>
            <button
              type="button"
              onClick={handleShare}
              style={{
                background: "transparent",
                border: "1px solid #333",
                color: "#eee",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              공유
            </button>
          </div>
        </div>

        {/* 추천 작품 패널 */}
        <aside style={{ flex: "1 1 280px", minWidth: 0 }}>
          <div
            style={{
              border: "1px solid #1f1f1f",
              borderRadius: 10,
              padding: 12,
              background: "rgba(255,255,255,0.015)",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
              추천 작품
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {related.length === 0 && (
                <div style={{ color: "#777", fontSize: 13, padding: "8px 0" }}>
                  추천 작품을 불러오는 중…
                </div>
              )}
              {related.map((item) => (
                <button
                  key={`${item.media_type}-${item.id}`}
                  type="button"
                  onClick={() =>
                    router.push(`/watch/${item.media_type}/${item.id}`)
                  }
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    textAlign: "left",
                    background: "transparent",
                    border: "1px solid #222",
                    borderRadius: 8,
                    padding: 6,
                    cursor: "pointer",
                    color: "#eee",
                  }}
                >
                  <span
                    style={{
                      width: 64,
                      height: 38,
                      borderRadius: 4,
                      background: imageUrl(item.backdrop_path || item.poster_path)
                        ? `#111 url(${imageUrl(item.backdrop_path || item.poster_path)}) center/cover`
                        : "#1a1a1a",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title || item.name}
                    </span>
                    <span style={{ display: "block", fontSize: 11, color: "#888" }}>
                      {item.media_type === "tv" ? "시리즈" : "영화"}
                    </span>
                  </span>
                  <span style={{ color: "#666", fontSize: 14 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
