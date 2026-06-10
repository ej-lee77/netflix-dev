"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useSearchOverlayStore } from "@/store/useSearchOverlayStore";
import "./scss/mobileBottomNav.scss";

const IconHome = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>
);

const IconSearch = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const IconFeed = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconMypage = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { open: openSearch, isOpen: isSearchOpen } = useSearchOverlayStore();

  const isHome = pathname === "/";
  const isSearch = pathname?.startsWith("/search");
  const isFeed = pathname?.startsWith("/feed");
  const isMypage = pathname?.startsWith("/mypage") || pathname?.startsWith("/profiles") || pathname?.startsWith("/settings");

  return (
    <nav className="mobile-bottom-nav" aria-label="하단 메뉴">
      <Link
        href="/"
        className={`mobile-bottom-nav__item${isHome ? " active" : ""}`}
        aria-current={isHome ? "page" : undefined}
      >
        <span className="mobile-bottom-nav__icon"><IconHome /></span>
        <span className="mobile-bottom-nav__label">홈</span>
      </Link>

      <button
        type="button"
        className={`mobile-bottom-nav__item${isSearchOpen || isSearch ? " active" : ""}`}
        onClick={openSearch}
        aria-label="검색"
      >
        <span className="mobile-bottom-nav__icon"><IconSearch /></span>
        <span className="mobile-bottom-nav__label">검색</span>
      </button>

      <Link
        href="/feed"
        className={`mobile-bottom-nav__item${isFeed ? " active" : ""}`}
        aria-current={isFeed ? "page" : undefined}
      >
        <span className="mobile-bottom-nav__icon"><IconFeed /></span>
        <span className="mobile-bottom-nav__label">피드</span>
      </Link>

      <Link
        href={user ? "/mypage" : "/login"}
        className={`mobile-bottom-nav__item${isMypage ? " active" : ""}`}
        aria-current={isMypage ? "page" : undefined}
      >
        <span className="mobile-bottom-nav__icon"><IconMypage /></span>
        <span className="mobile-bottom-nav__label">마이페이지</span>
      </Link>
    </nav>
  );
}
