"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMovieStore } from "@/store/useMovieStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { usePlayListStore } from "@/store/usePlayListStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useWatchPartyStore } from "@/store/useWatchPartyStore";
import { useCommunityEnabled } from "@/data/maturityFilter";
import { showToast } from "@/store/useToastStore";
import VideoPlayer, { type PlayerEpisode } from "@/components/common/VideoPlayer";
import RepBadge from "@/components/common/RepBadge";

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
  const searchParams = useSearchParams();
  const partyIdParam = searchParams.get("party");
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
  const { isWished, onAddWish, onRemoveWish, onLoadWishlist } = useWishlistStore();
  const { onUpdateProgress } = usePlayListStore();
  const { user, currentProfile } = useAuthStore();
  const canUseConnect = useCommunityEnabled();
  const { party, messages, createParty, subscribe, join, sendMessage, updatePlayback, updatePlaybackNow, leave } =
    useWatchPartyStore();

  const userId = user?.userId || (user as any)?.uid || "guest";
  const nickname = currentProfile?.nickname || "나";
  const myBadge = currentProfile?.badges?.equippedBadges || "";

  const [epIndex, setEpIndex] = useState(0);
  const [chatText, setChatText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastProgressRef = useRef(-1);

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
  }, [mediaId, type, isTv, onFetchMediaDetail, onFetchTvVideos, onFetchVideo, onFetchEpisodes]);

  useEffect(() => {
    if (recommended.length === 0) onFetchRecommended();
  }, [recommended.length, onFetchRecommended]);

  // 파티 구독
  useEffect(() => {
    if (!partyIdParam) return;
    subscribe(partyIdParam);
    return () => leave();
  }, [partyIdParam, subscribe, leave]);

  const mediaItem: any = mediaDetails[itemKey];
  const title = getTitle(mediaItem);
  const genreName = mediaItem?.genres?.[0]?.name ?? "";
  const year = (isTv ? mediaItem?.first_air_date : mediaItem?.release_date)?.split?.("-")?.[0];

  const videos: any[] | undefined = isTv
    ? mediaItem
      ? tvVideos[mediaItem.id]
      : undefined
    : mediaItem
      ? popVideos[mediaItem.id]
      : undefined;
  const trailer =
    videos?.find((v) => v.type === "Trailer" || v.type === "Teaser") ?? videos?.[0];
  const trailerKey: string | null = trailer?.key ?? null;

  const epList: any[] = isTv ? episodes : [];
  const currentEp = epList[epIndex] ?? epList[0] ?? null;
  const hasPrev = isTv && epIndex > 0;
  const hasNext = isTv && epIndex < epList.length - 1;
  const playerEpisodes: PlayerEpisode[] = epList.map((ep, i) => ({
    id: ep.id,
    number: ep.episode_number ?? i + 1,
    name: ep.name,
    stillUrl: imageUrl(ep.still_path, "w300"),
    runtime: ep.runtime ?? null,
    progress: 0,
  }));

  const related = (recommended as any[]).filter((r) => r.id !== mediaId).slice(0, 6);
  const wished = isWished(itemKey);

  // 파티 상태
  const isPartyMode = !!partyIdParam;
  const isHost = !!party && party.hostId === userId;

  useEffect(() => {
    if (partyIdParam && party && !isHost) {
      join(partyIdParam, { userId, nickname, badge: myBadge });
    }
  }, [partyIdParam, party, isHost, join, userId, nickname, myBadge]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const goDetail = () => router.push(`/detail/${type}/${mediaId}`);

  const handleWish = async () => {
    if (!mediaItem) return;
    if (wished) await onRemoveWish(mediaItem);
    else await onAddWish(mediaItem);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/detail/${type}/${mediaId}`);
      showToast("링크가 복사되었어요");
    } catch {
      showToast("링크 복사에 실패했어요");
    }
  };

  const handleStartParty = async () => {
    const pid = await createParty({
      type,
      mediaId,
      title,
      posterPath: mediaItem?.poster_path ?? "",
      backdropPath: mediaItem?.backdrop_path ?? "",
      host: { userId, nickname, badge: myBadge },
    });
    if (pid) router.push(`/watch/${type}/${mediaId}?party=${pid}`);
    else showToast("파티 생성에 실패했어요");
  };

  const handleInvite = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/watch/${type}/${mediaId}?party=${partyIdParam}`,
      );
      showToast("초대 링크를 복사했어요");
    } catch {
      showToast("초대 링크 복사에 실패했어요");
    }
  };

  const handleLeaveParty = () => {
    leave();
    router.push(`/watch/${type}/${mediaId}`);
  };

  const handleSendChat = async () => {
    if (!chatText.trim()) return;
    await sendMessage(chatText, { userId, nickname, badge: myBadge });
    setChatText("");
  };

  const handleTimeUpdate = (ct: number, dur: number) => {
    if (dur <= 0) return;
    const progress = Math.round((ct / dur) * 100);
    // 정수 진행률이 바뀔 때만 기록 (500ms마다 쓰기 방지)
    if (progress > 0 && progress !== lastProgressRef.current) {
      lastProgressRef.current = progress;
      onUpdateProgress(mediaId, type, progress);
    }
    if (isHost) updatePlayback({ positionPct: progress, isPlaying: true });
  };

  const startPct = isPartyMode && party && !isHost ? party.positionPct : undefined;

  const epLabel = currentEp
    ? `${currentEp.episode_number ?? epIndex + 1}화${currentEp.name ? ` 「${currentEp.name}」` : ""}`
    : "";

  const btn = (extra?: any) => ({
    background: "transparent",
    border: "1px solid #333",
    color: "#eee",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    cursor: "pointer",
    ...extra,
  });

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
        {isPartyMode ? (
          <button type="button" onClick={handleLeaveParty} style={btn({ background: "rgba(255,255,255,0.06)" })}>
            ← 파티 나가기
          </button>
        ) : (
          <button type="button" onClick={goDetail} style={btn({ background: "rgba(255,255,255,0.06)" })}>
            ← 뒤로
          </button>
        )}

        <span style={{ color: "#888", fontSize: 13, textAlign: "center" }}>
          {title}
          {isTv && currentEp ? ` · ${currentEp.episode_number ?? epIndex + 1}화` : ""}
          {isPartyMode && party ? ` · 👥 ${party.participants?.length ?? 1}명 참여 중` : ""}
        </span>

        {isPartyMode ? (
          <button
            type="button"
            onClick={handleInvite}
            style={btn({
              background: "rgba(229,9,20,0.14)",
              border: "1px solid rgba(229,9,20,0.5)",
              color: "#ff6b73",
              fontWeight: 600,
            })}
          >
            초대 링크 복사
          </button>
        ) : canUseConnect ? (
          <button
            type="button"
            onClick={handleStartParty}
            style={btn({
              background: "rgba(229,9,20,0.14)",
              border: "1px solid rgba(229,9,20,0.5)",
              color: "#ff6b73",
              fontWeight: 600,
            })}
          >
            같이 보기 시작
          </button>
        ) : (
          <span style={{ width: 120 }} />
        )}
      </div>

      {/* 본문 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {/* 플레이어 */}
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
              <VideoPlayer
                embedded
                key={`${trailerKey}-${currentEp?.id ?? "0"}`}
                videoKey={trailerKey}
                title={title}
                onClose={goDetail}
                onTimeUpdate={handleTimeUpdate}
                episodes={isTv ? playerEpisodes : undefined}
                activeEpisodeId={currentEp?.id ?? null}
                onSelectEpisode={(id) => {
                  const idx = epList.findIndex((e) => e.id === id);
                  if (idx >= 0) setEpIndex(idx);
                }}
                startPct={startPct}
                onLocalControl={isHost ? (s) => updatePlaybackNow(s) : undefined}
                remoteControl={
                  isPartyMode && !isHost && party
                    ? { positionPct: party.positionPct, isPlaying: party.isPlaying, ts: party.updatedAt }
                    : null
                }
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
                  <button type="button" onClick={goDetail} style={btn({ background: "rgba(255,255,255,0.08)" })}>
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
                  style={btn({ color: hasPrev ? "#eee" : "#555", cursor: hasPrev ? "pointer" : "default" })}
                >
                  ← 이전화
                </button>
                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={() => setEpIndex((i) => Math.min(epList.length - 1, i + 1))}
                  style={btn({ color: hasNext ? "#eee" : "#555", cursor: hasNext ? "pointer" : "default" })}
                >
                  다음화 →
                </button>
              </div>
            )}
          </div>

          {/* 액션 */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={handleWish}
              style={btn(
                wished
                  ? { background: "rgba(229,9,20,0.14)", border: "1px solid rgba(229,9,20,0.5)", color: "#ff6b73" }
                  : {},
              )}
            >
              {wished ? "♥ 찜 완료" : "+ 찜"}
            </button>
            <button type="button" onClick={handleShare} style={btn()}>
              공유
            </button>
          </div>
        </div>

        {/* 우측 패널: 파티면 채팅, 아니면 추천 */}
        <aside style={{ flex: "1 1 300px", minWidth: 0 }}>
          {isPartyMode ? (
            <div
              style={{
                border: "1px solid #1f1f1f",
                borderRadius: 10,
                background: "rgba(255,255,255,0.015)",
                display: "flex",
                flexDirection: "column",
                height: 460,
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  borderBottom: "1px solid #1f1f1f",
                  fontSize: 14,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>실시간 채팅</span>
                <span style={{ fontSize: 12, color: "#888" }}>
                  {party?.participants?.length ?? 1}명
                </span>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {messages.length === 0 && (
                  <div style={{ color: "#777", fontSize: 13, textAlign: "center", marginTop: 20 }}>
                    아직 메시지가 없어요. 먼저 인사해 보세요!
                  </div>
                )}
                {messages.map((m) => {
                  const mine = m.userId === userId;
                  return (
                    <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                      <div style={{ fontSize: 11, color: "#9a9a9a", marginBottom: 3, textAlign: mine ? "right" : "left", display: "flex", gap: 6, alignItems: "center", justifyContent: mine ? "flex-end" : "flex-start" }}>
                        <span>{mine ? "나" : m.nickname}</span>
                        {m.badge ? <RepBadge badge={m.badge} size="sm" /> : null}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          padding: "7px 10px",
                          borderRadius: 10,
                          background: mine ? "rgba(229,9,20,0.16)" : "rgba(255,255,255,0.06)",
                          color: "#eee",
                          wordBreak: "break-word",
                        }}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <div style={{ padding: 10, borderTop: "1px solid #1f1f1f", display: "flex", gap: 8 }}>
                <input
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendChat();
                  }}
                  placeholder="메시지 입력…"
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid #2a2a2a",
                    borderRadius: 8,
                    color: "#fff",
                    padding: "8px 10px",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={handleSendChat}
                  style={btn({
                    background: "rgba(229,9,20,0.16)",
                    border: "1px solid rgba(229,9,20,0.5)",
                    color: "#ff6b73",
                    fontWeight: 600,
                  })}
                >
                  전송
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                border: "1px solid #1f1f1f",
                borderRadius: 10,
                padding: 12,
                background: "rgba(255,255,255,0.015)",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>추천 작품</div>
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
                    onClick={() => router.push(`/watch/${item.media_type}/${item.id}`)}
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
          )}
        </aside>
      </div>
    </div>
  );
}
