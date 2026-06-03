"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import "./videoPlayer.scss";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | null;
  }
}

interface VideoPlayerProps {
  videoKey: string;
  title?: string;
  onClose: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoPlayer({ videoKey, title, onClose, onTimeUpdate }: VideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerId = useRef(`vp-${Math.random().toString(36).slice(2)}`);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const isDraggingProgress = useRef(false);
  const resetHideTimerRef = useRef<() => void>(() => {});
  const seekToRef = useRef<(pct: number) => void>(() => {});
  onTimeUpdateRef.current = onTimeUpdate;

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [feedback, setFeedback] = useState<"play" | "pause" | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);
  resetHideTimerRef.current = resetHideTimer;

  useEffect(() => {
    const createPlayer = () => {
      if (!document.getElementById(playerId.current)) return;
      playerRef.current = new window.YT.Player(playerId.current, {
        videoId: videoKey,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          fs: 0,
          disablekb: 1,
          playsinline: 1,
        },
        events: {
          onReady: (e: any) => {
            playerRef.current = e.target;
            e.target.setVolume(80);
            e.target.playVideo();
            if (tickRef.current) clearInterval(tickRef.current);
            tickRef.current = setInterval(() => {
              const p = playerRef.current;
              if (!p || typeof p.getCurrentTime !== 'function') return;
              const ct = p.getCurrentTime();
              const d = p.getDuration();
              setCurrentTime(ct);
              if (d > 0) {
                setDuration(d);
                onTimeUpdateRef.current?.(ct, d);
              }
            }, 500);
          },
          onStateChange: (e: any) => {
            setPlaying(e.data === window.YT.PlayerState.PLAYING);
          },
        },
      });
    };

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        createPlayer();
      };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement("script");
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
      }
    }

    resetHideTimer();

    return () => {
      try { playerRef.current?.destroy?.(); } catch { }
      if (tickRef.current) clearInterval(tickRef.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [videoKey, resetHideTimer]);


  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === " " || e.key === "k") { e.preventDefault(); doTogglePlay(); }
      if (e.key === "ArrowLeft") seek(-10);
      if (e.key === "ArrowRight") seek(10);
      if (e.key === "m") doToggleMute();
      if (e.key === "f") doToggleFullscreen();
      resetHideTimer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, playing, muted, isFullscreen, currentTime, duration]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const triggerFeedback = (type: "play" | "pause") => {
    setFeedback(type);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 600);
  };

  const doTogglePlay = () => {
    if (!playerRef.current) return;
    if (playing) { playerRef.current.pauseVideo?.(); triggerFeedback("pause"); }
    else { playerRef.current.playVideo?.(); triggerFeedback("play"); }
  };

  const doToggleMute = () => {
    if (muted) {
      setMuted(false);
      playerRef.current?.unMute();
      playerRef.current?.setVolume(volume || 50);
    } else {
      setMuted(true);
      playerRef.current?.mute();
    }
  };

  const handleVolume = (v: number) => {
    setVolume(v);
    setMuted(v === 0);
    if (v > 0) playerRef.current?.unMute();
    playerRef.current?.setVolume(v);
  };

  const seek = (secs: number) => {
    const p = playerRef.current;
    if (!p) return;
    const cur = p.getCurrentTime?.() ?? currentTime;
    const dur = p.getDuration?.() ?? duration;
    if (!dur) return;
    const t = Math.max(0, Math.min(dur, cur + secs));
    p.seekTo?.(t, true);
    setCurrentTime(t);
  };

  const seekTo = (pct: number) => {
    const p = playerRef.current;
    if (!p) return;
    const dur = p.getDuration?.() ?? duration;
    if (!dur) return;
    const t = (pct / 100) * dur;
    p.seekTo?.(t, true);
    setCurrentTime(t);
  };
  seekToRef.current = seekTo;

  const getPctFromMouse = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return null;
    const rect = track.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  };

  const handleTrackMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    isDraggingProgress.current = true;
    resetHideTimer();
    const pct = getPctFromMouse(e.clientX);
    if (pct !== null) seekTo(pct);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDraggingProgress.current) return;
      const pct = getPctFromMouse(e.clientX);
      if (pct !== null) seekToRef.current(pct);
      resetHideTimerRef.current();
    };
    const onUp = () => {
      isDraggingProgress.current = false;
      resetHideTimerRef.current();
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doToggleFullscreen = () => {
    if (!wrapRef.current) return;
    if (!document.fullscreenElement) wrapRef.current.requestFullscreen();
    else document.exitFullscreen();
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayVol = muted ? 0 : volume;

  return (
    <div
      ref={wrapRef}
      className="vp-root"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => { if (hideTimer.current) clearTimeout(hideTimer.current); setShowControls(false); }}
    >
      {/* YouTube 플레이어 마운트 포인트 */}
      <div id={playerId.current} className="vp-iframe" />

      {/* 클릭 영역 (play/pause toggle) */}
      <div
        className="vp-click-area"
        onClick={() => { resetHideTimer(); doTogglePlay(); }}
      />

      {/* 재생/일시정지 피드백 아이콘 */}
      {feedback && (
        <div className={`vp-feedback vp-feedback--${feedback}`}>
          {feedback === "play" ? (
            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          ) : (
            <svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          )}
        </div>
      )}

      {/* 컨트롤 오버레이 */}
      <div className={`vp-controls ${showControls ? "vp-controls--on" : "vp-controls--off"}`}>
        {/* 상단: 뒤로가기 + 제목 */}
        <div className="vp-top">
          <button className="vp-back-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          {title && <span className="vp-title">{title}</span>}
        </div>

        {/* 하단: 진행바 + 버튼 */}
        <div className="vp-bottom">
          {/* 진행바 */}
          <div className="vp-progress-row">
            <span className="vp-time">{formatTime(currentTime)}</span>
            <div
              ref={trackRef}
              className="vp-track"
              onMouseDown={handleTrackMouseDown}
            >
              <div className="vp-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="vp-time">{formatTime(duration)}</span>
          </div>

          {/* 버튼 줄 */}
          <div className="vp-btn-row">
            <div className="vp-left-btns">
              {/* 재생/일시정지 */}
              <button className="vp-btn vp-btn--play" onClick={doTogglePlay} title={playing ? "일시정지 (K)" : "재생 (K)"}>
                {playing ? (
                  <svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                )}
              </button>

              {/* 10초 뒤로 */}
              <button className="vp-btn vp-skip-btn" onClick={() => seek(-10)} title="10초 뒤로 (←)">
                <img src="/images/icon/iconmonstr-history-lined-1.svg" alt="10초 뒤로" className="vp-skip-icon" />
                <span className="vp-skip-num">10</span>
              </button>

              {/* 10초 앞으로 */}
              <button className="vp-btn vp-skip-btn" onClick={() => seek(10)} title="10초 앞으로 (→)">
                <img src="/images/icon/iconmonstr-future-lined-1.svg" alt="10초 앞으로" className="vp-skip-icon" />
                <span className="vp-skip-num">10</span>
              </button>

              {/* 볼륨 */}
              <div className="vp-volume-group">
                <button className="vp-btn" onClick={doToggleMute} title="음소거 (M)">
                  {displayVol === 0 ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  ) : displayVol < 50 ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  )}
                </button>
                <input
                  type="range" min={0} max={100} value={displayVol}
                  className="vp-vol-range"
                  onChange={(e) => handleVolume(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="vp-right-btns">
              {/* 전체화면 */}
              <button className="vp-btn" onClick={doToggleFullscreen} title="전체화면 (F)">
                {isFullscreen ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
