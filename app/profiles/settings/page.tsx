"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DEFAULT_PROFILES, useAuthStore } from "@/store/useAuthStore";
import type { Profile } from "@/types/auth";
import "../../scss/profileSettings.scss";

type SettingsItem = {
  iconSrc: string;
  title: string;
  desc: string;
  iconType?: "icon" | "avatar";
};

const SETTING_ITEMS: SettingsItem[] = [
  {
    iconSrc: "/images/profile/setting/2.svg",
    title: "언어",
    desc: "화면 표시 및 음성용 언어 설정",
  },
  {
    iconSrc: "/images/profile/setting/3.svg",
    title: "자녀 보호 설정 조정",
    desc: "관람등급 및 콘텐츠 제한 변경",
  },
  {
    iconSrc: "/images/profile/setting/4.svg",
    title: "자막 표시 설정",
    desc: "자막 표시 방식 맞춤화",
  },
  {
    iconSrc: "/images/profile/setting/5.svg",
    title: "재생 설정",
    desc: "자동 재생, 오디오, 화질 설정",
  },
  {
    iconSrc: "/images/profile/setting/6.svg",
    title: "알림 설정",
    desc: "이메일, 문자, 푸시 알림 관리",
  },
  {
    iconSrc: "/images/profile/setting/7.svg",
    title: "시청 기록",
    desc: "시청 기록 및 평가 관리",
  },
  {
    iconSrc: "/images/profile/setting/8.svg",
    title: "개인 정보 및 데이터 설정",
    desc: "개인 정보 이용 관리",
  },
];

function SettingsRow({ iconSrc, title, desc, iconType = "icon" }: SettingsItem) {
  return (
    <button type="button" className="profile-settings-row">
      <span className={`profile-settings-icon is-${iconType}`} aria-hidden="true">
        <img src={iconSrc} alt="" />
      </span>
      <span className="profile-settings-copy">
        <strong>{title}</strong>
        <span>{desc}</span>
      </span>
      <span className="profile-settings-arrow" aria-hidden="true" />
    </button>
  );
}

function ProfileSettingsContent() {
  const searchParams = useSearchParams();
  const profileId = Number(searchParams.get("profileId"));
  const { user } = useAuthStore();
  const profiles = user?.profiles?.length ? user.profiles : DEFAULT_PROFILES;
  const profile =
    profiles.find((item: Profile) => item.id === profileId) ?? profiles[0] ?? DEFAULT_PROFILES[0];
  const isDefaultProfile = profile.id === profiles[0]?.id;

  return (
    <div className="profile-settings-page">
      <div className="profile-settings-container">
        <Link href="/settings" className="profile-settings-back" aria-label="설정으로 돌아가기">
          <span aria-hidden="true" />
        </Link>
        <h1 className="profile-settings-title">프로필 및 설정 관리</h1>

        <section className="profile-settings-card" aria-label="프로필 기본 설정">
          <SettingsRow
            iconSrc={profile.imgUrl ?? "/images/profile/image/default_icons/17.png"}
            iconType="avatar"
            title={profile.name ?? "프로필"}
            desc="개인 정보 및 연락처 정보 수정"
          />
          <SettingsRow
            iconSrc="/images/profile/setting/1.svg"
            title="프로필 잠금"
            desc="이 프로필을 이용하려면 PIN을 입력해야 합니다"
          />
        </section>

        <h2 className="profile-settings-section-title">설정</h2>

        <section className="profile-settings-card" aria-label="프로필 상세 설정">
          {SETTING_ITEMS.map((item) => (
            <SettingsRow key={item.title} {...item} />
          ))}
        </section>

        <button type="button" className="profile-settings-delete" disabled={isDefaultProfile}>
          <img src="/images/profile/setting/9.svg" alt="" aria-hidden="true" />
          프로필 삭제
        </button>
        {isDefaultProfile && (
          <p className="profile-settings-delete-note">기본 프로필은 삭제할 수 없습니다.</p>
        )}
      </div>
    </div>
  );
}

export default function ProfileSettingsPage() {
  return (
    <Suspense fallback={null}>
      <ProfileSettingsContent />
    </Suspense>
  );
}
