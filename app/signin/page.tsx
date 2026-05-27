"use client";

import { auth, googleProvider } from "@/firebase/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import "./signin.scss";

// ─── 스텝 타입 ────────────────────────────────────────────────────────────────

type StepStatus = "active" | "done" | "idle";

interface Step {
  label: string;
  status: StepStatus;
}

const STEPS: Step[] = [
  { label: "계정 만들기", status: "active" },
  { label: "플랜 선택", status: "idle" },
  { label: "결제", status: "idle" },
  { label: "시청 시작", status: "idle" },
];

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

// ─── 컴포넌트 ──────────────────────────────────────────────────────────────────

export default function SigninPage() {
  const router = useRouter();
  const { onLogin } = useAuthStore();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [agreeAll, setAgreeAll] = useState<boolean>(false);
  const [agreeRequired, setAgreeRequired] = useState<boolean>(false);
  const [agreeMarketing, setAgreeMarketing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const defaultProfiles = [{ id: 1, name: "나", imgUrl: "images/profile/1.png" }];

  // ── 전체 동의 토글 ──────────────────────────────────────────────────────────
  const handleAgreeAll = () => {
    const next = !agreeAll;
    setAgreeAll(next);
    setAgreeRequired(next);
    setAgreeMarketing(next);
  };

  // 개별 체크 시 전체동의 상태 동기화
  const handleAgreeRequired = () => {
    const next = !agreeRequired;
    setAgreeRequired(next);
    if (!next) setAgreeAll(false);
    else if (agreeMarketing) setAgreeAll(true);
  };

  const handleAgreeMarketing = () => {
    const next = !agreeMarketing;
    setAgreeMarketing(next);
    if (next && agreeRequired) setAgreeAll(true);
    else setAgreeAll(false);
  };

  // 전체동의 체크박스 상태 (부분 체크)
  const allCheckClass =
    agreeRequired && agreeMarketing
      ? "agree-checkbox checked"
      : agreeRequired
        ? "agree-checkbox partial"
        : "agree-checkbox";

  // ── 이메일 회원가입 ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (!agreeRequired) {
      setError("필수 약관에 동의해주세요.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      onLogin({ ...result.user, profiles: defaultProfiles });
      router.push("/");
    } catch (err: unknown) {
      console.log(err);
      const code = (err as { code?: string }).code;
      if (code === "auth/email-already-in-use") {
        setError("이미 사용 중인 이메일입니다.");
      } else if (code === "auth/weak-password") {
        setError("비밀번호가 너무 약합니다. 영문+숫자 조합 8자 이상을 사용해주세요.");
      } else {
        setError("회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Google 가입 ─────────────────────────────────────────────────────────────
  const handleGoogleSignin = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onLogin({ ...result.user, profiles: defaultProfiles });
      router.push("/");
    } catch (err) {
      console.log(err);
      setError("Google 가입에 실패했습니다.");
    }
  };

  return (
    <div className="signin-page">

      {/* ── 스텝 인디케이터 ──────────────────────────────────────────────── */}
      <div className="step-bar" aria-label="가입 단계">
        {STEPS.map((step, idx) => (
          <React.Fragment key={step.label}>
            <div className="step-node">
              <div className={`step-circle ${step.status}`}>{idx + 1}</div>
              <span className={`step-name ${step.status}`}>{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className="step-connector">
                <div className={`step-line ${step.status === "done" ? "done" : ""}`} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── 폼 ───────────────────────────────────────────────────────────── */}
      <div className="signin-form-wrap">
        <h1 className="signin-title">계정 만들기</h1>
        <p className="signin-subtitle">30초면 가입할 수 있어요</p>

        {error && <div className="signin-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>

          {/* 이메일 */}
          <div className="form-field">
            <label htmlFor="signin-email" className="form-label">이메일</label>
            <input
              id="signin-email"
              type="email"
              placeholder="user@example.com"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <span className="form-hint">로그인 시 사용할 이메일입니다</span>
          </div>

          {/* 비밀번호 */}
          <div className="form-field">
            <label htmlFor="signin-password" className="form-label">비밀번호</label>
            <div className="input-wrap">
              <input
                id="signin-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="form-input has-icon"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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
            <span className="form-hint">영문, 숫자 포함 8자 이상</span>
          </div>

          {/* 약관 동의 */}
          <div className="agree-section">
            <div className="agree-all" onClick={handleAgreeAll} role="button" tabIndex={0}>
              <div className={allCheckClass} />
              <span className="agree-text all">전체 동의</span>
            </div>
            <div className="agree-row" onClick={handleAgreeRequired} role="button" tabIndex={0}>
              <div className={`agree-checkbox ${agreeRequired ? "checked" : ""}`} />
              <span className="agree-text">[필수] 이용약관 · 개인정보처리방침 동의</span>
            </div>
            <div className="agree-row" onClick={handleAgreeMarketing} role="button" tabIndex={0}>
              <div className={`agree-checkbox ${agreeMarketing ? "checked" : ""}`} />
              <span className="agree-text">[선택] 마케팅 정보 수신 동의</span>
            </div>
          </div>

          {/* 가입하기 버튼 */}
          <button
            type="submit"
            className={`btn-submit${isLoading ? " is-loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "" : "가입하기"}
          </button>
        </form>

        <div className="signin-divider">또는</div>

        {/* 소셜 가입 */}
        <button type="button" className="btn-social" onClick={handleGoogleSignin}>
          <span className="social-icon icon-google">G</span>
          Google로 계속하기
        </button>
        <button type="button" className="btn-social">
          <span className="social-icon icon-apple"></span>
          Apple로 계속하기
        </button>
        <button type="button" className="btn-social">
          <span className="social-icon icon-naver">N</span>
          N 네이버로 계속하기
        </button>
        <button type="button" className="btn-social">
          <span className="social-icon icon-kakao">K</span>
          K 카카오로 계속하기
        </button>

        <p className="signin-login-link">
          이미 회원이신가요?
          <Link href="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}
