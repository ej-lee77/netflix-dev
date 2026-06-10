"use client";

import React, { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import HeaderMenu from "./HeaderMenu";
import ProfilePinGate, { getProfilePin } from "./ProfilePinGate";
import ProfileSwitchOverlay from "./ProfileSwitchOverlay";
import { useAuthStore } from "@/store/useAuthStore";
import { useCommunityEnabled } from "@/data/maturityFilter";
import type { UserProfile } from "@/types/auth";
import "./scss/header.scss";
import HeaderSearchOverlay from "./HeaderSearchOverlay";
import { useT } from "@/lib/i18n";

const AUTH_PATHS = ["/login", "/signin", "/forgot-password", "/payment"];

export default function Header() {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  // 커넥트 모드: isCommunity 플래그 기반 (12세 이하 프로필은 자동 비활성)
  const canUseConnect = useCommunityEnabled();
  const { user, currentProfile, onLogout, onSetProfile } = useAuthStore();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(
    null,
  );
  const [switchingProfile, setSwitchingProfile] = useState<UserProfile | null>(
    null,
  );
  const [switchOverlayPhase, setSwitchOverlayPhase] = useState<
    "enter" | "exit"
  >("enter");
  const profileMenuRef = useRef<HTMLLIElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 마우스(hover 가능) 기기에서만 호버로 프로필 메뉴를 연다. 터치 기기는 탭 토글만 사용.
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(mql.matches);
    update();
    mql.addEventListener?.("change", update);
    return () => mql.removeEventListener?.("change", update);
  }, []);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const modeMenuRef = useRef<HTMLUListElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!modeMenuRef.current) return;
    const activeLi = modeMenuRef.current.querySelector<HTMLLIElement>("li.active");
    if (activeLi) {
      setIndicator({ left: activeLi.offsetLeft, width: activeLi.offsetWidth });
    } else {
      setIndicator(null);
    }
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const profiles = user?.profile || [];
  const activeProfile = currentProfile;
  const isProfileRoute = Boolean(pathname?.startsWith("/profiles"));
  const shouldSelectProfile = Boolean(
    user &&
    !currentProfile &&
    !AUTH_PATHS.includes(pathname ?? "") &&
    !isProfileRoute,
  );

  const runProfileSwitch = async (selectedProfile: UserProfile) => {
    setSwitchOverlayPhase("enter");
    setSwitchingProfile(selectedProfile);
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    onSetProfile(selectedProfile);
    router.replace("/");
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    setSwitchOverlayPhase("exit");
    await new Promise((resolve) => window.setTimeout(resolve, 720));
    setSwitchingProfile(null);
  };

  const handleProfileChange = (selectedProfile: UserProfile) => {
    if (selectedProfile.id === currentProfile?.id) {
      setIsProfileMenuOpen(false);
      return;
    }

    if (getProfilePin(selectedProfile.id)) {
      setPendingProfile(selectedProfile);
      setIsProfileMenuOpen(false);
      return;
    }

    setIsProfileMenuOpen(false);
    void runProfileSwitch(selectedProfile);
  };

  const confirmPendingProfile = () => {
    if (!pendingProfile) return;
    const selectedProfile = pendingProfile;
    setPendingProfile(null);
    void runProfileSwitch(selectedProfile);
  };

  const handleProfileMenuEnter = () => {
    if (!canHover) return; // 터치 기기에서는 호버로 열지 않음
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsProfileMenuOpen(true);
  };

  const handleProfileMenuLeave = () => {
    if (!canHover) return; // 터치 기기에서는 호버로 닫지 않음
    hoverTimeoutRef.current = setTimeout(() => setIsProfileMenuOpen(false), 200);
  };

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    await onLogout();
    router.push("/");
  };

  useEffect(() => {
    if (shouldSelectProfile) {
      router.replace("/profiles");
    }
  }, [router, shouldSelectProfile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  return (
    <>
      <header
        className={`${(isScrolled && (pathname === "/" || pathname?.startsWith("/connect"))) || isSearchOpen ? "scrolled" : ""}${
          isSearchOpen ? " search-open" : ""
        }`}
      >
        <div className="flex-item">
          <div className="flex-item gap-6">
            <h1>
              <Link href="/">
                <Image
                  src="/images/logo-icon.svg"
                  alt="Netflix"
                  width={40}
                  height={40}
                />
              </Link>
            </h1>

            {(pathname === "/" || pathname?.startsWith("/connect")) && (
              <ul ref={modeMenuRef} className="mode-menu flex-item gap-4">
                <li className={pathname === "/" ? "active" : ""}>
                  <Link href="/">{t("header.cinema")}</Link>
                </li>
                {canUseConnect && (
                  <li className={pathname?.startsWith("/connect") ? "active" : ""}>
                    <Link href="/connect">{t("header.connect")}</Link>
                  </li>
                )}
                {indicator && (
                  <span
                    className="mode-indicator"
                    style={{ left: indicator.left, width: indicator.width }}
                  />
                )}
              </ul>
            )}
          </div>

          <ul className="gnb-menu flex-item gap-4">
            <li>
              <button
                type="button"
                className="header-search-toggle"
                onClick={() => setIsSearchOpen((isOpen) => !isOpen)}
                aria-label={isSearchOpen ? "검색창 닫기" : "검색창 열기"}
                aria-expanded={isSearchOpen}
              >
                {isSearchOpen ? (
                  <span
                    className="header-search-toggle__close"
                    aria-hidden="true"
                  >
                    <img src="/images/header/header-search-close.svg" alt="." />
                  </span>
                ) : (
                  <Image
                    src="/images/header/search.svg"
                    alt=""
                    width={24}
                    height={24}
                  />
                )}
              </button>
            </li>
            <li>
              <Link href="/alarm">
                <Image
                  src="/images/header/alarm.svg"
                  alt="알림"
                  width={24}
                  height={24}
                />
              </Link>
            </li>

            {!user ? (
              <li>
                <Link href="/login" className="login-link" aria-label="로그인">
                  <Image
                    src="/images/header/menu/mypage.svg"
                    alt=""
                    width={24}
                    height={24}
                  />
                </Link>
              </li>
            ) : (
              <li
                className="profile-menu-wrap"
                ref={profileMenuRef}
                onMouseEnter={handleProfileMenuEnter}
                onMouseLeave={handleProfileMenuLeave}
              >
                <button
                  className="main-profile"
                  type="button"
                  aria-expanded={isProfileMenuOpen}
                  onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
                >
                  <Image
                    src={
                      activeProfile?.imgUrl ??
                      "/images/profile/image/default_icons/17.png"
                    }
                    alt={
                      activeProfile?.nickname ??
                      activeProfile?.nickname ??
                      "프로필"
                    }
                    width={40}
                    height={40}
                  />
                  <span className="profile-arrow" aria-hidden="true">
                    <svg
                      className="cs-arrow"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </button>

                {(
                  <div className={`profile-dropdown${isProfileMenuOpen ? " open" : ""}`}>
                    <ul className="profile-switch-list">
                      {/* 🌟 이제 profiles가 빈 배열 또는 온전한 프로필 리스트이므로 에러가 나지 않습니다. */}
                      {profiles.map((profile) => (
                        <li key={profile.id}>
                          <button
                            type="button"
                            onClick={() => handleProfileChange(profile)}
                          >
                            <Image
                              src={
                                profile.imgUrl ??
                                "/images/profile/image/default_icons/17.png"
                              }
                              alt={
                                profile.nickname ?? profile.nickname ?? "프로필"
                              }
                              width={42}
                              height={42}
                            />
                            {/* 데이터 스키마에 따라 nickname 혹은 name을 띄워줍니다. */}
                            <span>{profile.nickname || profile.nickname}</span>
                          </button>
                        </li>
                      ))}
                    </ul>

                    <ul className="profile-link-list">
                      <li>
                        <Link
                          href="/mypage"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          {t("header.mypage")}
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/profiles"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          프로필 전환
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/settings"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          설정
                        </Link>
                      </li>
                    </ul>

                    <button
                      className="profile-logout"
                      type="button"
                      onClick={handleLogout}
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </li>

            )}
          </ul>
        </div>
        <HeaderSearchOverlay
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      </header>

      <Suspense fallback={null}>
        <HeaderMenu />
      </Suspense>
      {pendingProfile && (
        <ProfilePinGate
          key={pendingProfile.id}
          profile={pendingProfile}
          description={`${pendingProfile.nickname ?? "프로필"} 프로필로 전환하려면 PIN을 입력해 주세요.`}
          onCancel={() => setPendingProfile(null)}
          onSuccess={confirmPendingProfile}
        />
      )}
      <ProfileSwitchOverlay
        phase={switchOverlayPhase}
        profile={switchingProfile}
      />
    </>
  );
}