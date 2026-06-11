"use client";

import Link from "next/link";

/** K-POP DEMON HUNTERS 상세페이지 (TMDB movie id) */
const DETAIL_HREF = "/detail/movie/803796";

interface GameOverModalProps {
  score: number;
  best: number;
  /** 이번 판이 최고 기록 갱신인지 */
  isNewBest: boolean;
  onRestart: () => void;
}

/** 게임 오버 전체 화면 오버레이 */
export default function GameOverModal({
  score,
  best,
  isNewBest,
  onRestart,
}: GameOverModalProps) {
  return (
    <div className="game-overlay game-over">
      <h2 className="game-over__title">GAME OVER</h2>
      {isNewBest && <p className="game-over__new-best">🏆 NEW BEST SCORE!</p>}

      <div className="game-over__scores">
        <div className="game-over__score">
          <span>SCORE</span>
          <strong>{String(score).padStart(5, "0")}</strong>
        </div>
        <div className="game-over__score game-over__score--best">
          <span>BEST</span>
          <strong>{String(best).padStart(5, "0")}</strong>
        </div>
      </div>

      <div className="game-over__actions">
        <button
          type="button"
          className="game-btn game-btn--primary game-btn--ko"
          onClick={onRestart}
        >
          다시 시작
        </button>
        <Link href={DETAIL_HREF} className="game-btn game-btn--ghost game-btn--ko">
          작품 보러가기
        </Link>
      </div>
    </div>
  );
}
