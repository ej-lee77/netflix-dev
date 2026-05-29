"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_PROFILES, useAuthStore } from "@/store/useAuthStore";
import type { Profile } from "@/types/auth";
import "../scss/profileSelect.scss";

const AVATAR_OPTIONS = [
  "/images/profile/image/default_icons/17.png",
  "/images/profile/image/default_icons/18.png",
  "/images/profile/image/default_icons/19.png",
  "/images/profile/image/default_icons/20.png",
  "/images/profile/image/stranger_things/1.png",
  "/images/profile/image/squid_game/1.png",
  "/images/profile/image/arcane/1.png",
  "/images/profile/image/wednesday/1.png",
];

export default function ProfileSelectPage() {
  const router = useRouter();
  const { user, onSetProfile, onAddProfile, onUpdateProfile, onDeleteProfile } = useAuthStore();
  const profiles = useMemo(
    () => (user?.profiles?.length ? user.profiles : DEFAULT_PROFILES),
    [user?.profiles]
  );
  const [manageMode, setManageMode] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftAvatar, setDraftAvatar] = useState(AVATAR_OPTIONS[0]);

  useEffect(() => {
    setManageMode(false);
  }, []);

  const openEditor = (profile?: Profile) => {
    const fallbackAvatar = AVATAR_OPTIONS[profiles.length % AVATAR_OPTIONS.length];
    setEditingProfile(profile ?? { id: 0, name: "새 프로필", imgUrl: fallbackAvatar });
    setDraftName(profile?.name ?? "새 프로필");
    setDraftAvatar(profile?.imgUrl ?? fallbackAvatar);
  };

  const closeEditor = () => {
    setEditingProfile(null);
    setDraftName("");
    setDraftAvatar(AVATAR_OPTIONS[0]);
  };

  const handleSelect = (profile: Profile) => {
    if (manageMode) {
      openEditor(profile);
      return;
    }

    onSetProfile(profile);
    router.push("/");
  };

  const handleSave = () => {
    if (!editingProfile) return;

    const nextProfile = {
      ...editingProfile,
      name: draftName.trim() || "프로필",
      imgUrl: draftAvatar,
    };

    if (editingProfile.id === 0) {
      onAddProfile({ name: nextProfile.name, imgUrl: nextProfile.imgUrl });
    } else {
      onUpdateProfile(nextProfile);
    }
    closeEditor();
  };

  const handleDelete = () => {
    if (!editingProfile || editingProfile.id === 0) return;
    onDeleteProfile(editingProfile.id);
    closeEditor();
  };

  return (
    <section className="profile-select" aria-label="프로필 선택">
      <div className="profile-select-inner">
        <h1 className="ps-title">
          {manageMode ? "프로필 관리" : "넷플릭스를 시청할 프로필을 선택하세요."}
        </h1>

        <ul className="ps-grid">
          {profiles.map((profile) => (
            <li key={profile.id}>
              <button
                type="button"
                className={`ps-item${manageMode ? " is-edit" : ""}`}
                onClick={() => handleSelect(profile)}
              >
                <div className="ps-avatar">
                  <img
                    src={profile.imgUrl || "/images/profile/image/default_icons/17.png"}
                    alt={profile.name || "프로필"}
                  />
                  {manageMode && <span className="ps-edit-icon" aria-hidden="true">✎</span>}
                </div>
                <span className="ps-name">{profile.name}</span>
              </button>
            </li>
          ))}

          {profiles.length < 6 && (
            <li>
              <button type="button" className="ps-item" onClick={() => openEditor()}>
                <div className="ps-avatar ps-avatar-add" aria-hidden="true">+</div>
                <span className="ps-name">프로필 추가</span>
              </button>
            </li>
          )}
        </ul>

        <button
          type="button"
          className={`ps-manage${manageMode ? " is-active" : ""}`}
          onClick={() => setManageMode((value) => !value)}
        >
          {manageMode ? "완료" : "프로필 관리"}
        </button>
      </div>

      {editingProfile && (
        <div className="profile-editor-backdrop" role="dialog" aria-modal="true" aria-label="프로필 편집">
          <div className="profile-editor">
            <div className="profile-editor-head">
              <h2>{editingProfile.id === 0 ? "프로필 추가" : "프로필 편집"}</h2>
              <button type="button" className="profile-editor-close" onClick={closeEditor} aria-label="닫기">
                ×
              </button>
            </div>

            <div className="profile-editor-body">
              <img className="profile-editor-avatar" src={draftAvatar} alt="" />
              <label className="profile-editor-field">
                <span>프로필 이름</span>
                <input
                  value={draftName}
                  maxLength={12}
                  onChange={(event) => setDraftName(event.target.value)}
                />
              </label>

              <div className="profile-avatar-options" aria-label="아바타 선택">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    className={draftAvatar === avatar ? "is-selected" : ""}
                    onClick={() => setDraftAvatar(avatar)}
                    aria-label="아바타 선택"
                  >
                    <img src={avatar} alt="" />
                  </button>
                ))}
              </div>
            </div>

            <div className="profile-editor-actions">
              {editingProfile.id !== 0 && profiles.length > 1 && (
                <button type="button" className="profile-editor-delete" onClick={handleDelete}>
                  삭제
                </button>
              )}
              <button type="button" onClick={closeEditor}>취소</button>
              <button type="button" className="is-primary" onClick={handleSave}>저장</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
