"use client";

import { auth } from "@/firebase/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { Movie } from "@/types/movie";
import { createUserWithEmailAndPassword } from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import "../scss/login.scss";
import "../scss/signup-extras.scss";

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const IMG_BASE = "https://image.tmdb.org/t/p/w342";

const COL_COUNT = 4;
const ITEMS_PER_COL = 8;

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

function PosterGrid() {
  const [posters, setPosters] = useState<string[]>([]);

  useEffect(() => {
    const fetchPosters = async () => {
      try {
        const pages = [1, 2, 3];
        const results = await Promise.all(
          pages.map((p) =>
            fetch(
              `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=ko-KR&page=${p}`
            ).then((r) => r.json())
          )
        );
        const allMovies: Movie[] = results.flatMap((r) => r.results ?? []);
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

  const columns: string[][] = Array.from({ length: COL_COUNT }, (_, ci) => {
    const slice = Array.from(
      { length: ITEMS_PER_COL },
      (_, ti) => posters[(ci * ITEMS_PER_COL + ti) % posters.length]
    );
    return [...slice, ...slice];
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

export default function SignupPage() {
  const router = useRouter();
  const { onLogin } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeMarketing(checked);
  };

  useEffect(() => {
    setAgreeAll(agreeTerms && agreePrivacy && agreeMarketing);
  }, [agreeTerms, agreePrivacy, agreeMarketing]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !nickname) {
      setError("필수 항목을 모두 입력해주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      setError("필수 약관에 동의해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const defaultProfiles = [{ id: 1, name: nickname, imgUrl: "/images/profile/normal.svg" }];
      onLogin({ ...result.user, profiles: defaultProfiles });
      router.push("/payment");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("이미 사용 중인 이메일입니다.");
      } else {
        setError("회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-poster" aria-hidden="true">
        <PosterGrid />
      </section>

      <section className="login-panel">
        <div className="login-card">
          <h2 className="login-title">
            새로운 시청의<br />
            시작
          </h2>
          <p className="login-subtitle">간단한 정보로 가입하고 무제한 시청을 시작하세요</p>

          {error && <div className="login-error" role="alert">{error}</div>}

          <form className="login-form" onSubmit={handleSignup} noValidate>
            <div className="form-field">
              <label htmlFor="signup-email" className="form-label">이메일 *</label>
              <input
                id="signup-email"
                type="email"
                placeholder="user@example.com"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="form-field">
              <label htmlFor="signup-nickname" className="form-label">닉네임 *</label>
              <input
                id="signup-nickname"
                type="text"
                placeholder="2~12자"
                className="form-input"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={12}
              />
            </div>

            <div className="form-field">
              <label htmlFor="signup-password" className="form-label">비밀번호 *</label>
              <div className="input-wrap">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="8자 이상"
                  className="form-input has-icon"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="비밀번호 보기 전환"
                >
                  {showPassword ? <EyeOpenIcon /> : <EyeOffIcon />}
                </button>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="signup-password-confirm" className="form-label">비밀번호 확인 *</label>
              <input
                id="signup-password-confirm"
                type={showPassword ? "text" : "password"}
                placeholder="비밀번호 재입력"
                className="form-input"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {/* 약관 동의 */}
            <div className="agree-section">
              <label className="agree-row agree-all">
                <input
                  type="checkbox"
                  checked={agreeAll}
                  onChange={(e) => handleAgreeAll(e.target.checked)}
                />
                <span className="custom-check"></span>
                전체 동의
              </label>

              <div className="agree-list">
                <label className="agree-row">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <span className="custom-check"></span>
                  <span className="agree-label">
                    <strong>[필수]</strong> 서비스 이용약관 동의
                  </span>
                  <a href="#" className="agree-view">보기</a>
                </label>

                <label className="agree-row">
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                  />
                  <span className="custom-check"></span>
                  <span className="agree-label">
                    <strong>[필수]</strong> 개인정보 처리방침 동의
                  </span>
                  <a href="#" className="agree-view">보기</a>
                </label>

                <label className="agree-row">
                  <input
                    type="checkbox"
                    checked={agreeMarketing}
                    onChange={(e) => setAgreeMarketing(e.target.checked)}
                  />
                  <span className="custom-check"></span>
                  <span className="agree-label">[선택] 마케팅 정보 수신 동의</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className={`login-btn${isLoading ? " is-loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? "" : "가입하기"}
            </button>
          </form>

          <p className="login-signup">
            이미 계정이 있으신가요?
            <Link href="/login">로그인</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
