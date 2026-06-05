"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import "./scss/loginBanner.scss";

/**
 * 비로그인 사용자에게 화면 하단에 고정으로 노출되는 배너
 * - 로그인 상태면 표시 안 함
 * - 로그인/회원가입/결제 등 인증 관련 페이지에서는 표시 안 함
 * - "구독 시작하기" → /signin
 * - "플랜 소개" → /plan
 */

// 배너를 표시하지 않을 경로들
const HIDDEN_PATHS = ["/login", "/signin", "/payment", "/forgot-password"];

export default function LoginBanner() {
  const { user } = useAuthStore();
  const pathname = usePathname();

  // 표시 안 함 조건들
  if (user) return null;
  if (HIDDEN_PATHS.some((path) => pathname?.startsWith(path))) return null;

  return (
    <div className="login-banner" role="region" aria-label="로그인 안내">
      <div className="banner-inner">
        {/* 넷플릭스 로고 */}
        <Image
          src="/images/logo/Netflix_Logo_RGB.png"
          alt="Netflix"
          width={90}
          height={24}
          className="banner-logo"
        />

        {/* 좌측 안내 텍스트 */}
        <div className="banner-text">
          <h3 className="banner-title">매주 500편 이상 신작 업데이트!</h3>
          <p className="banner-desc">
            지금 구독을 시작하고 다양한 콘텐츠를 무제한 감상해 보세요
          </p>
        </div>

        {/* 우측 버튼 그룹 */}
        <div className="banner-actions">
          <Link href="/plan" className="banner-btn banner-btn-ghost">
            플랜 소개
          </Link>
          <Link href="/signin" className="banner-btn banner-btn-primary">
            구독 시작하기
          </Link>
        </div>

      </div>
    </div>
  );
}
