"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import HeaderMenu from "./HeaderMenu";
import { DEFAULT_PROFILES, useAuthStore } from "@/store/useAuthStore";
import type { Profile } from "@/types/auth";
import "./scss/header.scss";
import HeaderSearchOverlay from "./HeaderSearchOverlay";

const AUTH_PATHS = ["/login", "/signin", "/forgot-password", "/payment"];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, currentProfile, onLogout, onSetProfile } = useAuthStore();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLLIElement>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const profiles = user?.profiles?.length ? user.profiles : DEFAULT_PROFILES;
  const activeProfile = currentProfile ?? profiles[0];
  const isProfileRoute = Boolean(pathname?.startsWith("/profiles"));
  const shouldSelectProfile = Boolean(
    user && !currentProfile && !AUTH_PATHS.includes(pathname ?? "") && !isProfileRoute
  );

  const handleProfileChange = (selectedProfile: Profile) => {
    onSetProfile(selectedProfile);
    setIsProfileMenuOpen(false);
  };

  useEffect(() => {
    if (shouldSelectProfile) {
      router.replace("/profiles");
    }
  }, [router, shouldSelectProfile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header>
        <div className="flex-item">
          <div className="flex-item gap-6">
            <h1>
              <Link href="/">
                <Image src="/images/logo-icon.svg" alt="Netflix" width={40} height={40} />
              </Link>
            </h1>

            <ul className="mode-menu flex-item gap-4">
              <li className={pathname === "/" ? "active" : ""}>
                <Link href="/">시네마 모드</Link>
              </li>
              <li className={pathname?.startsWith("/connect") ? "active" : ""}>
                <Link href="/connect">커넥트 모드</Link>
              </li>
            </ul>
          </div>

          <ul className="gnb-menu flex-item gap-4">
            <li onClick={() => setIsSearchOpen(true)}>
              {/* <Link href="/search"> */}
              <Image src="/images/header/search.svg" alt="검색" width={24} height={24} />
              {/* </Link> */}
            </li>
            <li>
              <Link href="/alarm">
                <Image src="/images/header/alarm.svg" alt="알림" width={24} height={24} />
              </Link>
            </li>

            {!user ? (
              <li>
                <Link href="/login" className="login-link" aria-label="로그인">
                  <Image src="/images/header/menu/mypage.svg" alt="" width={24} height={24} />
                </Link>
              </li>
            ) : (
              <li className="profile-menu-wrap" ref={profileMenuRef}>
                <button
                  className="main-profile"
                  type="button"
                  aria-expanded={isProfileMenuOpen}
                  onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
                >
                  <Image
                    src={activeProfile?.imgUrl ?? "/images/profile/image/default_icons/17.png"}
                    alt={activeProfile?.name ?? "프로필"}
                    width={40}
                    height={40}
                  />
                  <span className="profile-arrow" aria-hidden="true" />
                </button>

                {isProfileMenuOpen && (
                  <div className="profile-dropdown">
                    <span className="profile-dropdown-caret" aria-hidden="true" />

                    <ul className="profile-switch-list">
                      {profiles.map((profile) => (
                        <li key={profile.id}>
                          <button type="button" onClick={() => handleProfileChange(profile)}>
                            <Image
                              src={profile.imgUrl ?? "/images/profile/image/default_icons/17.png"}
                              alt={profile.name ?? "프로필"}
                              width={42}
                              height={42}
                            />
                            <span>{profile.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>

                    <ul className="profile-link-list">
                      <li>
                        <Link href="/mypage" onClick={() => setIsProfileMenuOpen(false)}>
                          마이페이지
                        </Link>
                      </li>
                      <li>
                        <Link href="/profiles" onClick={() => setIsProfileMenuOpen(false)}>
                          프로필 관리
                        </Link>
                      </li>
                    </ul>

                    <button className="profile-logout" type="button" onClick={onLogout}>
                      넷플릭스에서 로그아웃
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
    </>
  );
}
