"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DEFAULT_PROFILES, useAuthStore } from "@/store/useAuthStore";
import type { Profile } from "@/types/auth";
import "../../scss/profileSettings.scss";

type ModalKey = "lock" | "subtitles" | "playback" | "notifications" | "activity" | null;

type SubtitleSettings = {
  size: "small" | "medium" | "large";
  font: "block" | "gothic" | "serif" | "round";
  shadow: "none" | "drop" | "outline";
  shadowColor: "black" | "white";
  background: "none" | "black" | "white";
  window: "none" | "black" | "white";
};

type SettingsItem = {
  modalKey?: ModalKey;
  iconSrc: string;
  title: string;
  desc: string;
  iconType?: "icon" | "avatar";
};

const DEFAULT_SUBTITLE_SETTINGS: SubtitleSettings = {
  size: "medium",
  font: "block",
  shadow: "drop",
  shadowColor: "black",
  background: "black",
  window: "white",
};

const SETTING_ITEMS: SettingsItem[] = [
  {
    iconSrc: "/images/profile/setting/3.svg",
    title: "자녀 보호 설정 조정",
    desc: "관람등급 및 콘텐츠 제한 변경",
  },
  {
    modalKey: "subtitles",
    iconSrc: "/images/profile/setting/4.svg",
    title: "자막 표시 설정",
    desc: "자막 표시 방식 맞춤화",
  },
  {
    modalKey: "playback",
    iconSrc: "/images/profile/setting/5.svg",
    title: "재생 설정",
    desc: "자동 재생, 미리보기, 데이터 절약 설정",
  },
  {
    modalKey: "notifications",
    iconSrc: "/images/profile/setting/6.svg",
    title: "알림 설정",
    desc: "신작 및 추천 콘텐츠 알림 관리",
  },
  {
    modalKey: "activity",
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

const subtitleLabels = {
  size: { small: "작게", medium: "중간", large: "크게" },
  font: { block: "블록체", gothic: "고딕체", serif: "명조체", round: "둥근체" },
  shadow: { none: "없음", drop: "그림자 효과", outline: "외곽선" },
  shadowColor: { black: "검정색", white: "흰색" },
  background: { none: "없음", black: "검정색", white: "흰색" },
  window: { none: "없음", black: "검정색", white: "흰색" },
};

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      className={`profile-settings-toggle${on ? " on" : ""}`}
      onClick={onChange}
      aria-pressed={on}
    />
  );
}

function OptionRow({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="profile-settings-option">
      <div>
        <strong>{label}</strong>
        {desc && <span>{desc}</span>}
      </div>
      {children && <div className="profile-settings-option-action">{children}</div>}
    </div>
  );
}

function SelectBox({
  label,
  value,
  options,
  onChange,
  swatch,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  swatch?: "black" | "white" | "none";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="subtitle-field">
      <span>{label}</span>
      <div className="subtitle-select-wrap">
        <button
          type="button"
          className={`subtitle-select${isOpen ? " is-open" : ""}`}
          onClick={() => setIsOpen((open) => !open)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {swatch && <i className={`subtitle-swatch is-${swatch}`} aria-hidden="true" />}
          <strong>{selected.label}</strong>
          <em aria-hidden="true" />
        </button>
        {isOpen && (
          <div className="subtitle-menu" role="listbox">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={option.value === value ? "is-selected" : ""}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                role="option"
                aria-selected={option.value === value}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsRow({
  iconSrc,
  title,
  desc,
  iconType = "icon",
  onClick,
}: SettingsItem & { onClick?: () => void }) {
  return (
    <button type="button" className="profile-settings-row" onClick={onClick}>
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
  const [activeModal, setActiveModal] = useState<ModalKey>(null);
  const [savedSubtitle, setSavedSubtitle] = useState<SubtitleSettings>(DEFAULT_SUBTITLE_SETTINGS);
  const [draftSubtitle, setDraftSubtitle] = useState<SubtitleSettings>(DEFAULT_SUBTITLE_SETTINGS);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [requirePinForNewProfile, setRequirePinForNewProfile] = useState(false);
  const [savedPin, setSavedPin] = useState("");
  const [toggles, setToggles] = useState({
    autoplayNext: true,
    autoplayPreview: true,
    dataSaver: false,
    notiNew: true,
    notiRecommend: false,
  });

  const flip = (key: keyof typeof toggles) =>
    setToggles((value) => ({ ...value, [key]: !value[key] }));

  const updateSubtitle = <K extends keyof SubtitleSettings>(key: K, value: SubtitleSettings[K]) => {
    setDraftSubtitle((current) => ({ ...current, [key]: value }));
  };

  const closeModal = () => {
    if (activeModal === "subtitles") {
      setDraftSubtitle(savedSubtitle);
    }
    if (activeModal === "lock") {
      setPin(savedPin ? savedPin.split("") : ["", "", "", ""]);
    }
    setActiveModal(null);
  };

  const openModal = (modalKey: ModalKey) => {
    if (modalKey === "subtitles") {
      setDraftSubtitle(savedSubtitle);
    }
    if (modalKey === "lock") {
      setPin(savedPin ? savedPin.split("") : ["", "", "", ""]);
    }
    setActiveModal(modalKey);
  };

  const saveSubtitleSettings = () => {
    setSavedSubtitle(draftSubtitle);
    window.localStorage.setItem(
      `netflix-subtitle-settings-${profile.id}`,
      JSON.stringify(draftSubtitle)
    );
    setActiveModal(null);
  };

  const resetSubtitleSettings = () => {
    setDraftSubtitle(DEFAULT_SUBTITLE_SETTINGS);
  };

  const savePin = () => {
    const nextPin = pin.join("");
    if (nextPin.length !== 4) {
      window.alert("4자리 PIN을 입력해 주세요.");
      return;
    }

    setSavedPin(nextPin);
    window.localStorage.setItem(
      `netflix-profile-pin-${profile.id}`,
      JSON.stringify({ pin: nextPin, requirePinForNewProfile })
    );
    setActiveModal(null);
  };

  const handlePinChange = (index: number, value: string) => {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    setPin((current) => current.map((item, itemIndex) => (itemIndex === index ? nextValue : item)));
  };

  const openSubtitleHelp = () => {
    window.alert("디바이스, 앱 버전, 선택한 언어에 따라 일부 자막 표시 옵션이 지원되지 않을 수 있습니다.");
  };

  const modalTitle =
    activeModal === "lock"
      ? "프로필 잠금"
      : activeModal === "subtitles"
        ? "자막 표시 설정"
        : activeModal === "playback"
          ? "재생 설정"
          : activeModal === "notifications"
            ? "알림 설정"
            : activeModal === "activity"
              ? "시청 기록"
              : "";

  const previewClass = [
    `is-size-${draftSubtitle.size}`,
    `is-font-${draftSubtitle.font}`,
    `is-shadow-${draftSubtitle.shadow}`,
    `is-shadow-color-${draftSubtitle.shadowColor}`,
    `is-bg-${draftSubtitle.background}`,
    `is-window-${draftSubtitle.window}`,
    draftSubtitle.background === "white" ? "is-auto-text-black" : "is-auto-text-white",
  ].join(" ");

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
            onClick={() => openModal("lock")}
          />
        </section>

        <h2 className="profile-settings-section-title">설정</h2>

        <section className="profile-settings-card" aria-label="프로필 상세 설정">
          {SETTING_ITEMS.map((item) => (
            <SettingsRow
              key={item.title}
              {...item}
              onClick={item.modalKey ? () => openModal(item.modalKey ?? null) : undefined}
            />
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

      {activeModal && (
        <div className="profile-settings-modal-backdrop" role="dialog" aria-modal="true" aria-label={modalTitle}>
          <div
            className={`profile-settings-modal${
              activeModal === "subtitles" ? " is-subtitles" : activeModal === "lock" ? " is-lock" : ""
            }`}
          >
            <div className="profile-settings-modal-head">
              <h2>{modalTitle}</h2>
              <button type="button" onClick={closeModal} aria-label="닫기">
                ×
              </button>
            </div>

            <div className="profile-settings-modal-body">
              {activeModal === "lock" && (
                <div className="profile-lock-settings">
                  <h3>프로필 잠금을 설정하려면 4자리 PIN을 등록하세요</h3>
                  <p>모든 디바이스에서 프로필을 선택할 때 PIN을 다시 입력하라는 메시지가 표시됩니다.</p>

                  <div className="profile-pin-inputs" aria-label="4자리 PIN 입력">
                    {pin.map((digit, index) => (
                      <input
                        key={index}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(event) => handlePinChange(index, event.target.value)}
                        aria-label={`${index + 1}번째 PIN 숫자`}
                      />
                    ))}
                  </div>

                  <label className="profile-pin-checkbox">
                    <input
                      type="checkbox"
                      checked={requirePinForNewProfile}
                      onChange={(event) => setRequirePinForNewProfile(event.target.checked)}
                    />
                    <span>새 프로필을 추가하려면 {profile.name ?? "프로필"}의 PIN 번호를 입력하도록 합니다</span>
                  </label>

                  <p className="profile-pin-note">
                    참고: 프로필 설정을 변경하거나 프로필을 삭제할 때는 프로필 PIN이 필요하지 않습니다.
                  </p>

                  <div className="profile-pin-actions">
                    <button type="button" className="is-primary" onClick={savePin}>
                      PIN 저장
                    </button>
                    <button type="button" onClick={closeModal}>
                      취소
                    </button>
                  </div>
                </div>
              )}

              {activeModal === "subtitles" && (
                <div className="subtitle-settings">
                  <p className="subtitle-desc">
                    선택한 프로필의 자막 표시 방식을 지원되는 모든 디바이스에서 변경합니다.
                  </p>

                  <div className="subtitle-preview-wrap">
                    <span>미리보기</span>
                    <div className="subtitle-preview">
                      <img src="/images/profile/setting/miri.png" alt="" />
                      <p className={previewClass}>
                        본 설정은 모든 지원 디바이스에 표시되는 자막에 적용됩니다.
                      </p>
                    </div>
                  </div>

                  <div className="subtitle-form">
                    <SelectBox
                      label="글자 크기"
                      value={draftSubtitle.size}
                      options={Object.entries(subtitleLabels.size).map(([value, label]) => ({ value, label }))}
                      onChange={(value) => updateSubtitle("size", value as SubtitleSettings["size"])}
                    />
                    <SelectBox
                      label="글꼴"
                      value={draftSubtitle.font}
                      options={Object.entries(subtitleLabels.font).map(([value, label]) => ({ value, label }))}
                      onChange={(value) => updateSubtitle("font", value as SubtitleSettings["font"])}
                    />
                    <div className="subtitle-split">
                      <SelectBox
                        label="그림자"
                        value={draftSubtitle.shadow}
                        options={Object.entries(subtitleLabels.shadow).map(([value, label]) => ({ value, label }))}
                        onChange={(value) => updateSubtitle("shadow", value as SubtitleSettings["shadow"])}
                      />
                      <SelectBox
                        label="그림자 색상"
                        value={draftSubtitle.shadowColor}
                        swatch={draftSubtitle.shadowColor}
                        options={Object.entries(subtitleLabels.shadowColor).map(([value, label]) => ({ value, label }))}
                        onChange={(value) => updateSubtitle("shadowColor", value as SubtitleSettings["shadowColor"])}
                      />
                    </div>
                    <div className="subtitle-split">
                      <SelectBox
                        label="배경"
                        value={draftSubtitle.background}
                        swatch={draftSubtitle.background}
                        options={Object.entries(subtitleLabels.background).map(([value, label]) => ({ value, label }))}
                        onChange={(value) => updateSubtitle("background", value as SubtitleSettings["background"])}
                      />
                      <SelectBox
                        label="창"
                        value={draftSubtitle.window}
                        swatch={draftSubtitle.window}
                        options={Object.entries(subtitleLabels.window).map(([value, label]) => ({ value, label }))}
                        onChange={(value) => updateSubtitle("window", value as SubtitleSettings["window"])}
                      />
                    </div>
                  </div>

                  <p className="subtitle-note">
                    일부 디바이스와 언어에서는 이 설정이 지원되지 않습니다.{" "}
                    <button type="button" onClick={openSubtitleHelp}>자세히 알아보기</button>
                  </p>

                  <div className="subtitle-actions">
                    <button type="button" className="is-primary" onClick={saveSubtitleSettings}>
                      저장
                    </button>
                    <button type="button" onClick={resetSubtitleSettings}>
                      기본 설정으로 되돌리기
                    </button>
                    <button type="button" className="is-text" onClick={closeModal}>
                      취소
                    </button>
                  </div>
                </div>
              )}

              {activeModal === "playback" && (
                <>
                  <OptionRow label="다음 화 자동 재생" desc="에피소드 종료 후 다음 화를 자동 재생합니다.">
                    <Toggle on={toggles.autoplayNext} onChange={() => flip("autoplayNext")} />
                  </OptionRow>
                  <OptionRow label="미리보기 자동 재생" desc="탐색 중 미리보기 영상을 자동 재생합니다.">
                    <Toggle on={toggles.autoplayPreview} onChange={() => flip("autoplayPreview")} />
                  </OptionRow>
                  <OptionRow label="데이터 절약 모드">
                    <Toggle on={toggles.dataSaver} onChange={() => flip("dataSaver")} />
                  </OptionRow>
                </>
              )}

              {activeModal === "notifications" && (
                <>
                  <OptionRow label="신작 알림" desc="새 콘텐츠 공개 소식을 받습니다.">
                    <Toggle on={toggles.notiNew} onChange={() => flip("notiNew")} />
                  </OptionRow>
                  <OptionRow label="추천 콘텐츠 알림" desc="맞춤 추천 알림을 받습니다.">
                    <Toggle on={toggles.notiRecommend} onChange={() => flip("notiRecommend")} />
                  </OptionRow>
                </>
              )}

              {activeModal === "activity" && (
                <>
                  <OptionRow label="시청 기록" desc="최근 시청한 콘텐츠 목록을 확인합니다.">
                    <button type="button" className="profile-settings-modal-btn">기록 보기</button>
                  </OptionRow>
                  <OptionRow label="기록 전체 삭제" desc="추천에 반영되는 기록을 초기화합니다.">
                    <button type="button" className="profile-settings-modal-btn danger">
                      전체 삭제
                    </button>
                  </OptionRow>
                </>
              )}
            </div>
          </div>
        </div>
      )}
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
