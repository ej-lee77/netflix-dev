"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { mainMenus } from "@/data/mainMenu";
import { useMenuLabel } from "@/lib/i18n";
import { useAuthStore } from "@/store/useAuthStore";
import type { UserProfile } from "@/types/auth";
import "./scss/mobileDrawer.scss";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const tm = useMenuLabel();
  const { currentProfile, user, onSetProfile, onLogout } = useAuthStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const profiles = user?.profile ?? [];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setIsProfileModalOpen(false);
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleProfileSelect = (profile: UserProfile) => {
    if (profile.id === currentProfile?.id) {
      setIsProfileModalOpen(false);
      return;
    }
    onSetProfile(profile);
    setIsProfileModalOpen(false);
    onClose();
    router.replace("/");
  };

  const handleLogout = async () => {
    await onLogout();
    setIsProfileModalOpen(false);
    onClose();
    router.push("/");
  };

  return (
    <>
      <div
        className={`mobile-drawer-backdrop${isOpen ? " open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`mobile-drawer${isOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="메뉴"
      >
        <div className="mobile-drawer-header">
          {user && currentProfile ? (
            <button
              type="button"
              className="mobile-drawer-profile"
              onClick={() => setIsProfileModalOpen(true)}
            >
              <Image
                src={currentProfile.imgUrl ?? "/images/profile/image/default_icons/17.png"}
                alt={currentProfile.nickname ?? "프로필"}
                width={40}
                height={40}
                className="mobile-drawer-profile__img"
              />
              <span className="mobile-drawer-profile__name">
                {currentProfile.nickname ?? "프로필"}
              </span>
              <svg className="mobile-drawer-profile__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          ) : (
            <Link href="/login" className="mobile-drawer-profile">
              <div className="mobile-drawer-profile__placeholder">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>
              <span className="mobile-drawer-profile__name">로그인</span>
            </Link>
          )}
          <button
            className="mobile-drawer-close"
            onClick={onClose}
            aria-label="메뉴 닫기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mobile-drawer-nav">
          {mainMenus.map((menu, index) => {
            const isActive = menu.path.includes("?")
              ? pathname + (typeof window !== "undefined" ? window.location.search : "") === menu.path
              : pathname === menu.path;
            return (
              <React.Fragment key={menu.path}>
                {index === 1 && <div className="mobile-drawer-divider" />}
                <Link
                  href={menu.path}
                  className={`mobile-drawer-item${isActive ? " active" : ""}`}
                >
                  <Image src={menu.imgUrl} alt="" width={22} height={22} aria-hidden="true" />
                  <span>{tm(menu.title)}</span>
                </Link>
              </React.Fragment>
            );
          })}
          <div className="mobile-drawer-divider" />
          <Link
            href="/menu/custom"
            className={`mobile-drawer-item${pathname === "/menu/custom" ? " active" : ""}`}
          >
            <Image src="/images/header/menu/custom.svg" alt="" width={22} height={22} aria-hidden="true" />
            <span>{tm("커스텀")}</span>
          </Link>
        </nav>
      </div>

      {/* 프로필 바텀시트 */}
      {isProfileModalOpen && (
        <>
          <div
            className="profile-modal-backdrop"
            onClick={() => setIsProfileModalOpen(false)}
            aria-hidden="true"
          />
          <div className="profile-modal" role="dialog" aria-modal="true" aria-label="프로필">
            <div className="profile-modal__handle" />

            {profiles.length > 0 && (
              <ul className="profile-modal__switch-list">
                {profiles.map((profile) => (
                  <li key={profile.id}>
                    <button
                      type="button"
                      className={`profile-modal__switch-btn${profile.id === currentProfile?.id ? " active" : ""}`}
                      onClick={() => handleProfileSelect(profile)}
                    >
                      <Image
                        src={profile.imgUrl ?? "/images/profile/image/default_icons/17.png"}
                        alt={profile.nickname ?? "프로필"}
                        width={44}
                        height={44}
                        className="profile-modal__switch-img"
                      />
                      <span>{profile.nickname}</span>
                      {profile.id === currentProfile?.id && (
                        <svg className="profile-modal__check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="profile-modal__divider" />

            <ul className="profile-modal__link-list">
              <li>
                <Link href="/mypage" onClick={() => { setIsProfileModalOpen(false); onClose(); }}>
                  마이페이지
                </Link>
              </li>
              <li>
                <Link href="/profiles" onClick={() => { setIsProfileModalOpen(false); onClose(); }}>
                  프로필 전환
                </Link>
              </li>
              <li>
                <Link href="/settings" onClick={() => { setIsProfileModalOpen(false); onClose(); }}>
                  설정
                </Link>
              </li>
            </ul>

            <div className="profile-modal__divider" />

            <button
              type="button"
              className="profile-modal__logout"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        </>
      )}
    </>
  );
}
