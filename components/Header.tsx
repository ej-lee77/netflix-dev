"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import HeaderMenu from "./HeaderMenu";
import { useAuthStore } from "@/store/useAuthStore";
import type { Profile } from "@/types/auth";
import "./scss/header.scss";

export default function Header() {
  const pathname = usePathname();
  const { user, onLogout } = useAuthStore();
  const [currentProfile, setCurrentProfile] = useState(user?.profiles?.[0] || null);

  const handleProfileChange = (selectedProfile: Profile) => {
    setCurrentProfile(selectedProfile);
  };

  return (
    <>
      <header>
        <div className="flex-item">
          <div className="flex-item gap-4">
            <h1>
              <Link href="/">
                <Image src="/images/logo-icon.svg" alt="Netflix" width="40" height="40" />
              </Link>
            </h1>
            <ul className="mode-menu flex-item gap-4">
              <li className={pathname === "/" ? "active" : ""}>
                <Link href="/">방구석모드</Link>
              </li>
              <li className={pathname?.startsWith("/connect") ? "active" : ""}>
                <Link href="/connect">커넥트모드</Link>
              </li>
            </ul>
          </div>

          <ul className="gnb-menu flex-item gap-4">
            <li>
              <Link href="/search">
                <Image src="/images/header/search.svg" alt="검색" width="24" height="24" />
              </Link>
            </li>
            <li>
              <Link href="/alarm">
                <Image src="/images/header/alarm.svg" alt="알림" width="24" height="24" />
              </Link>
            </li>
            {!user ? (
              <li>
                <Link href="/login">
                  <Image src="/images/header/login.svg" alt="로그인" width="24" height="24" />
                </Link>
              </li>
            ) : (
              <li>
                <div className="main-profile">
                  <Image
                    src={currentProfile?.imgUrl ?? "/images/profile/normal.svg"}
                    alt={currentProfile?.name ?? "프로필"}
                    width="40"
                    height="40"
                  />
                  <strong>{currentProfile?.name}</strong>
                </div>

                <ul>
                  {user.profiles
                    ?.filter((profile) => profile.id !== currentProfile?.id)
                    ?.map((profile) => (
                      <li key={profile.name}>
                        <button type="button" onClick={() => handleProfileChange(profile)}>
                          <img
                            src={profile.imgUrl ?? "/images/profile/normal.svg"}
                            alt={profile.name ?? "프로필"}
                            width="40"
                            height="40"
                          />
                          <span>{profile.name}</span>
                        </button>
                      </li>
                    ))}

                  <li className="profile-switch-item">
                    <Link href="/profiles">프로필 전환</Link>
                  </li>

                  <li className="logout-item">
                    <button type="button" onClick={onLogout}>로그아웃</button>
                  </li>
                </ul>
              </li>
            )}
          </ul>
        </div>
      </header>
      <HeaderMenu />
    </>
  );
}
