"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import type { Profile } from "@/types/auth";
import "../scss/profileSelect.scss";

export default function ProfileSelectPage() {
  const router = useRouter();
  const { user, currentProfile, onSetProfile } = useAuthStore() as any;
  const [editMode, setEditMode] = useState(false);

  // user.profiles가 없으면 기본 프로필 하나
  const profiles: Profile[] = user?.profiles ?? [];

  const handleSelect = (profile: Profile) => {
    if (editMode) {
      // 편집 모드: 프로필 설정으로 이동
      router.push(`/profiles/settings`);
      return;
    }
    // 일반 모드: 프로필 선택 후 메인으로
    if (onSetProfile) onSetProfile(profile);
    router.push("/");
  };

  return (
    <div className="profile-select">
      <div className="profile-select-inner">
        <h1 className="ps-title">누가 시청하나요?</h1>

        <ul className="ps-grid">
          {profiles.map((profile) => (
            <li key={profile.id}>
              <button
                type="button"
                className={`ps-item${editMode ? " is-edit" : ""}`}
                onClick={() => handleSelect(profile)}
              >
                <div className="ps-avatar">
                  <img
                    src={profile.imgUrl || "/images/profile/normal.svg"}
                    alt={profile.name || "프로필"}
                  />
                  {editMode && (
                    <span className="ps-edit-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </span>
                  )}
                </div>
                <span className="ps-name">{profile.name}</span>
              </button>
            </li>
          ))}

          {/* 프로필 추가 (최대 4개) */}
          {profiles.length < 4 && (
            <li>
              <button
                type="button"
                className="ps-item"
                onClick={() => router.push("/profiles/new")}
              >
                <div className="ps-avatar ps-avatar-add">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                </div>
                <span className="ps-name">프로필 추가</span>
              </button>
            </li>
          )}
        </ul>

        <button
          type="button"
          className={`ps-manage${editMode ? " is-active" : ""}`}
          onClick={() => setEditMode((v) => !v)}
        >
          {editMode ? "완료" : "프로필 관리"}
        </button>
      </div>
    </div>
  );
}
