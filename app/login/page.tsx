"use client";

import { auth, googleProvider } from "@/firebase/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { Movie } from "@/types/movie";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import "../scss/login.scss";

// ─── 상수 ──────────────────────────────────────────────────────────────────────

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const IMG_BASE = "https://image.tmdb.org/t/p/w342"; // 포스터 사이즈 w342

const COL_COUNT = 4;
const ITEMS_PER_COL = 8; // 컬럼당 타일 수 (스크롤 루프용 x2 = 16)

// ─── 아이콘 ────────────────────────────────────────────────────────────────────

const EyeOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

// ─── 포스터 그리드 컴포넌트 ────────────────────────────────────────────────────

function PosterGrid() {
  const [posters, setPosters] = useState<string[]>([]); // poster_path 배열

  useEffect(() => {
    const fetchPosters = async () => {
      try {
        // 인기영화 3페이지를 병렬로 받아서 충분한 포스터 확보
        const pages = [1, 2, 3];
        const results = await Promise.all(
          pages.map((p) =>
            fetch(
              `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=ko-KR&page=${p}`
            ).then((r) => r.json())
          )
        );
        const allMovies: Movie[] = results.flatMap((r) => r.results ?? []);
        // poster_path 있는 것만 필터 후 셔플
        const paths = allMovies
          .filter((m) => m.poster_path)
          .map((m) => m.poster_path)
          .sort(() => Math.random() - 0.5);
        setPosters(paths);
      } catch (err) {
        console.error("포스터 fetch 실패", err);
      }
    };
    fetchPosters();
  }, []);

  // 포스터가 아직 없으면 빈 컬럼 스켈레톤 표시
  if (posters.length === 0) {
    return (
      <div className="poster-grid">
        {Array.from({ length: COL_COUNT }).map((_, ci) => (
          <div key={ci} className="poster-col">
            {Array.from({ length: ITEMS_PER_COL * 2 }).map((_, ti) => (
              <div key={ti} className="poster-item poster-skeleton" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // 포스터를 컬럼별로 분배
  // 각 컬럼에 ITEMS_PER_COL개씩, 루프용으로 2배 복제
  const columns: string[][] = Array.from({ length: COL_COUNT }, (_, ci) => {
    const slice = Array.from(
      { length: ITEMS_PER_COL },
      (_, ti) => posters[(ci * ITEMS_PER_COL + ti) % posters.length]
    );
    return [...slice, ...slice]; // 무한 스크롤을 위해 2배
  });

  return (
    <div className="poster-grid">
      {columns.map((col, ci) => (
        <div key={ci} className="poster-col">
          {col.map((path, ti) => (
            <div key={`${ci}-${ti}`} className="poster-item">
              <Image
                src={`${IMG_BASE}${path}`}
                alt=""
                fill
                sizes="(max-width: 1024px) 25vw, 15vw"
                className="poster-img"
                // 이미지 로드 실패 시 어둡게 처리 (fallback)
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.opacity = "0";
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { onLogin } = useAuthStore();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const defaultProfiles = [{ id: 1, name: "나", imgUrl: "images/profile/1.png" }];

  // ── 이메일/비밀번호 로그인 ──────────────────────────────────────────────────
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      onLogin({ ...result.user, profiles: defaultProfiles });
      router.push("/");
    } catch (err) {
      console.log(err);
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── 구글 로그인 ─────────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onLogin({ ...result.user, profiles: defaultProfiles });
      router.push("/");
    } catch (err) {
      console.log(err);
      setError("Google 로그인에 실패했습니다.");
    }
  };

  return (
    <div className="login-page">

      {/* ── 왼쪽: TMDB 포스터 그리드 ───────────────────────────────────────── */}
      <section className="login-poster" aria-hidden="true">
        <PosterGrid />
      </section>

      {/* ── 오른쪽: 로그인 패널 ─────────────────────────────────────────────── */}
      <section className="login-panel">
        <div className="login-card">
          <h2 className="login-title">다시 오신 것을<br />환영해요</h2>
          <p className="login-subtitle">계정에 로그인하고 시청을 이어가세요</p>

          {error && <div className="login-error" role="alert">{error}</div>}

          <form className="login-form" onSubmit={handleEmailLogin} noValidate>
            <div className="form-field">
              <label htmlFor="login-email" className="form-label">이메일</label>
              <input
                id="login-email"
                type="email"
                placeholder="user@example.com"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="form-field">
              <label htmlFor="login-password" className="form-label">비밀번호</label>
              <div className="input-wrap">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="form-input has-icon"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? <EyeOpenIcon /> : <EyeOffIcon />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                자동 로그인
              </label>
              <Link href="/forgot-password" className="forgot-link">비밀번호 찾기</Link>
            </div>

            <button
              type="submit"
              className={`login-btn${isLoading ? " is-loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? "" : "로그인"}
            </button>
          </form>

          <div className="login-divider">또는</div>

          <ul className="social-list">
            <li>
              <button type="button" className="social-btn" onClick={handleGoogleLogin}>
                <span className="social-icon icon-google">G</span>
                Google로 계속하기
              </button>
            </li>
            <li>
              <button type="button" className="social-btn">
                <span className="social-icon icon-apple"></span>
                Apple로 계속하기
              </button>
            </li>
            <li>
              <button type="button" className="social-btn">
                <span className="social-icon icon-naver">N</span>
                N 네이버로 계속하기
              </button>
            </li>
            <li>
              <button type="button" className="social-btn">
                <span className="social-icon icon-kakao">K</span>
                K 카카오로 계속하기
              </button>
            </li>
          </ul>

          <p className="login-signup">
            아직 회원이 아니신가요?
            <Link href="/signin">회원가입</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
