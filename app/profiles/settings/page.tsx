"use client";

import React, { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { updateEmail, updateProfile } from "firebase/auth";
import { FreeMode, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { auth } from "@/firebase/firebase";
import ProfilePinGate from "@/components/ProfilePinGate";
import { DEFAULT_PROFILES, useAuthStore } from "@/store/useAuthStore";
import type { Profile } from "@/types/auth";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "../../scss/profileSettings.scss";

type ModalKey =
  | "profile"
  | "lock"
  | "maturity"
  | "subtitles"
  | "playback"
  | "notifications"
  | "activity"
  | null;

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

type ContactField = "name" | "email" | "phone";
type ProfileIconSection = {
  title: string;
  icons: string[];
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
    modalKey: "maturity",
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
];

const subtitleLabels = {
  size: { small: "작게", medium: "중간", large: "크게" },
  font: { block: "블록체", gothic: "고딕체", serif: "명조체", round: "둥근체" },
  shadow: { none: "없음", drop: "그림자 효과", outline: "외곽선" },
  shadowColor: { black: "검정색", white: "흰색" },
  background: { none: "없음", black: "검정색", white: "흰색" },
  window: { none: "없음", black: "검정색", white: "흰색" },
};

const MATURITY_RATINGS = ["전체관람가", "7+", "12+", "15+", "19+"];

const iconPaths = (folder: string, count: number) =>
  Array.from(
    { length: count },
    (_, index) => `/images/profile/image/${folder}/${index + 1}.png`,
  );

const PROFILE_ICON_SECTIONS: ProfileIconSection[] = [
  {
    title: "대표 아이콘",
    icons: iconPaths("default_icons", 23),
  },
  {
    title: "앨리스 인 보더랜드",
    icons: iconPaths("alice_in_borderland", 12),
  },
  {
    title: "아케인",
    icons: iconPaths("arcane", 12),
  },
  {
    title: "뷰티 인 블랙",
    icons: iconPaths("beauty_in_black", 12),
  },
  {
    title: "블랙 미러",
    icons: iconPaths("black_mirror", 8),
  },
  {
    title: "보스 베이비",
    icons: iconPaths("boss_baby", 11),
  },
  {
    title: "브리저튼",
    icons: iconPaths("bridgerton", 16),
  },
  {
    title: "다크",
    icons: iconPaths("dark", 11),
  },
  {
    title: "엘리트",
    icons: iconPaths("elite", 16),
  },
  {
    title: "개비의 매직 하우스",
    icons: iconPaths("gabbys_dollhouse", 10),
  },
  {
    title: "케이팝 데몬 헌터스",
    icons: iconPaths("kpop_demon_hunters", 11),
  },
  {
    title: "라바 아일랜드",
    icons: iconPaths("larva_island", 9),
  },
  {
    title: "로스트 인 스페이스",
    icons: iconPaths("lost_in_space", 9),
  },
  {
    title: "러브, 데스 + 로봇",
    icons: iconPaths("love_death_robots", 6),
  },
  {
    title: "루시퍼",
    icons: iconPaths("lucifer", 8),
  },
  {
    title: "종이의 집",
    icons: iconPaths("money_heist", 10),
  },
  {
    title: "마이 멜로디 & 쿠로미",
    icons: iconPaths("my_melody_kuromi", 16),
  },
  {
    title: "원피스",
    icons: iconPaths("one_piece", 17),
  },
  {
    title: "오렌지 이즈 더 뉴 블랙",
    icons: iconPaths("orange_is_the_new_black", 11),
  },
  {
    title: "피키 블라인더스",
    icons: iconPaths("peaky_blinders", 6),
  },
  {
    title: "레트로 애니메이션",
    icons: iconPaths("retro_animation", 8),
  },
  {
    title: "소닉 프라임",
    icons: iconPaths("sonic_prime", 21),
  },
  {
    title: "오징어 게임",
    icons: iconPaths("squid_game", 20),
  },
  {
    title: "기묘한 이야기",
    icons: iconPaths("stranger_things", 21),
  },
  {
    title: "더 크라운",
    icons: iconPaths("the_crown", 14),
  },
  {
    title: "웬즈데이",
    icons: iconPaths("wednesday", 13),
  },
  {
    title: "웬즈데이 방",
    icons: iconPaths("wednesday_room", 11),
  },
  {
    title: "위쳐",
    icons: iconPaths("witcher", 8),
  },
  {
    title: "WWE RAW",
    icons: iconPaths("wwe_raw", 8),
  },
];

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
      {children && (
        <div className="profile-settings-option-action">{children}</div>
      )}
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
  const selected =
    options.find((option) => option.value === value) ?? options[0];

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
          {swatch && (
            <i className={`subtitle-swatch is-${swatch}`} aria-hidden="true" />
          )}
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
      <span
        className={`profile-settings-icon is-${iconType}`}
        aria-hidden="true"
      >
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
  const { user, onUpdateProfile } = useAuthStore();
  const profiles = user?.profiles?.length ? user.profiles : DEFAULT_PROFILES;
  const profile =
    profiles.find((item: Profile) => item.id === profileId) ??
    profiles[0] ??
    DEFAULT_PROFILES[0];
  const isDefaultProfile = profile.id === profiles[0]?.id;
  const [activeModal, setActiveModal] = useState<ModalKey>(null);
  const [savedSubtitle, setSavedSubtitle] = useState<SubtitleSettings>(
    DEFAULT_SUBTITLE_SETTINGS,
  );
  const [draftSubtitle, setDraftSubtitle] = useState<SubtitleSettings>(
    DEFAULT_SUBTITLE_SETTINGS,
  );
  const [pin, setPin] = useState(["", "", "", ""]);
  const pinInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [pinError, setPinError] = useState("");
  const [draftProfileName, setDraftProfileName] = useState(
    profile.name ?? "프로필",
  );
  const [draftProfileAvatar, setDraftProfileAvatar] = useState(
    profile.imgUrl ?? "/images/profile/image/default_icons/17.png",
  );
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [contactEdit, setContactEdit] = useState<ContactField | null>(null);
  const [contactOverrides, setContactOverrides] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [draftContact, setDraftContact] = useState({
    first: "",
    second: "",
  });
  const [contactError, setContactError] = useState("");
  const [maturityRating, setMaturityRating] = useState("19+");
  const [toggles, setToggles] = useState({
    autoplayNext: true,
    autoplayPreview: true,
    dataSaver: false,
    notiNew: true,
    notiRecommend: false,
  });

  const flip = (key: keyof typeof toggles) =>
    setToggles((value) => ({ ...value, [key]: !value[key] }));

  const profileDisplayName =
    contactOverrides.name ||
    draftProfileName.trim() ||
    user?.displayName ||
    profile.name ||
    "프로필";
  const firebaseEmail = contactOverrides.email || user?.email || "";
  const firebasePhone = contactOverrides.phone || user?.phoneNumber || "";

  const updateSubtitle = <K extends keyof SubtitleSettings>(
    key: K,
    value: SubtitleSettings[K],
  ) => {
    setDraftSubtitle((current) => ({ ...current, [key]: value }));
  };

  const closeModal = () => {
    if (activeModal === "subtitles") {
      setDraftSubtitle(savedSubtitle);
    }
    if (activeModal === "lock") {
      setPin(["", "", "", ""]);
      setPinError("");
    }
    if (activeModal === "profile") {
      setDraftProfileName(profile.name ?? "프로필");
      setDraftProfileAvatar(
        profile.imgUrl ?? "/images/profile/image/default_icons/17.png",
      );
      setIsIconPickerOpen(false);
      setContactEdit(null);
      setContactError("");
    }
    setActiveModal(null);
  };

  const openModal = (modalKey: ModalKey) => {
    if (modalKey === "subtitles") {
      setDraftSubtitle(savedSubtitle);
    }
    if (modalKey === "lock") {
      setPin(["", "", "", ""]);
      setPinError("");
    }
    if (modalKey === "profile") {
      setDraftProfileName(profileDisplayName);
      setDraftProfileAvatar(
        profile.imgUrl ?? "/images/profile/image/default_icons/17.png",
      );
      setIsIconPickerOpen(false);
      setContactEdit(null);
      setContactError("");
    }
    setActiveModal(modalKey);
  };

  const saveSubtitleSettings = () => {
    setSavedSubtitle(draftSubtitle);
    window.localStorage.setItem(
      `netflix-subtitle-settings-${profile.id}`,
      JSON.stringify(draftSubtitle),
    );
    setActiveModal(null);
  };

  const resetSubtitleSettings = () => {
    setDraftSubtitle(DEFAULT_SUBTITLE_SETTINGS);
  };

  const saveProfileInfo = () => {
    onUpdateProfile({
      ...profile,
      name: draftProfileName.trim() || "프로필",
      imgUrl: draftProfileAvatar,
    });
    setActiveModal(null);
  };

  const selectProfileIcon = (iconSrc: string) => {
    setDraftProfileAvatar(iconSrc);
    setIsIconPickerOpen(false);
  };

  const openContactEdit = (field: ContactField) => {
    setContactEdit(field);
    setContactError("");

    if (field === "name") {
      const [firstName = profileDisplayName, ...restName] =
        profileDisplayName.split(" ");
      setDraftContact({
        first: firstName,
        second: restName.join(" "),
      });
      return;
    }

    setDraftContact({
      first: field === "email" ? firebaseEmail : firebasePhone,
      second: "",
    });
  };

  const saveContactEdit = async () => {
    if (!contactEdit) return;

    const nextValue =
      contactEdit === "name"
        ? `${draftContact.first.trim()} ${draftContact.second.trim()}`
            .trim()
            .replace(/\s+/g, " ")
        : draftContact.first.trim();

    if (!nextValue) {
      setContactError("값을 입력해 주세요.");
      return;
    }

    try {
      if (contactEdit === "name") {
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: nextValue });
        }
        setContactOverrides((current) => ({ ...current, name: nextValue }));
        setDraftProfileName(nextValue);
        onUpdateProfile({ ...profile, name: nextValue });
      }

      if (contactEdit === "email") {
        if (auth.currentUser && auth.currentUser.email !== nextValue) {
          await updateEmail(auth.currentUser, nextValue);
        }
        setContactOverrides((current) => ({ ...current, email: nextValue }));
      }

      if (contactEdit === "phone") {
        setContactOverrides((current) => ({ ...current, phone: nextValue }));
      }

      setContactEdit(null);
    } catch (err: unknown) {
      const errorCode =
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        typeof err.code === "string"
          ? err.code
          : "";

      if (errorCode === "auth/requires-recent-login") {
        setContactError("보안을 위해 다시 로그인한 뒤 수정해 주세요.");
      } else if (errorCode === "auth/invalid-email") {
        setContactError("올바른 이메일 주소를 입력해 주세요.");
      } else {
        setContactError("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    }
  };

  const clearContactEdit = () => {
    setDraftContact({ first: "", second: "" });
    setContactError("");
  };

  const savePin = () => {
    const nextPin = pin.join("");
    if (nextPin.length !== 4) {
      setPinError("4자리 PIN을 모두 입력해 주세요.");
      return;
    }

    setPinError("");
    window.localStorage.setItem(
      `netflix-profile-pin-${profile.id}`,
      JSON.stringify({ pin: nextPin }),
    );
    setActiveModal(null);
  };

  const handlePinChange = (index: number, value: string) => {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    setPinError("");
    setPin((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? nextValue : item,
      ),
    );
    if (nextValue && index < 3) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      savePin();
      return;
    }

    if (event.key === "Backspace" && !pin[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const openSubtitleHelp = () => {
    window.alert(
      "디바이스, 앱 버전, 선택한 언어에 따라 일부 자막 표시 옵션이 지원되지 않을 수 있습니다.",
    );
  };

  const modalTitle =
    activeModal === "profile"
      ? "프로필 변경"
      : activeModal === "lock"
      ? "프로필 잠금"
      : activeModal === "maturity"
        ? "자녀 보호 설정 조정"
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
    draftSubtitle.background === "white"
      ? "is-auto-text-black"
      : "is-auto-text-white",
  ].join(" ");
  const maturityIndex = Math.max(0, MATURITY_RATINGS.indexOf(maturityRating));

  return (
    <div className="profile-settings-page">
      <ProfilePinGate key={profile.id} profile={profile} />
      <div className="profile-settings-container">
        <Link
          href="/settings"
          className="profile-settings-back"
          aria-label="설정으로 돌아가기"
        >
          <span aria-hidden="true" />
        </Link>
        <h1 className="profile-settings-title">프로필 및 설정 관리</h1>

        <section
          className="profile-settings-card"
          aria-label="프로필 기본 설정"
        >
          <SettingsRow
            iconSrc={
              profile.imgUrl ?? "/images/profile/image/default_icons/17.png"
            }
            iconType="avatar"
            title={profile.name ?? "프로필"}
            desc="개인 정보 및 연락처 정보 수정"
            onClick={() => openModal("profile")}
          />
          <SettingsRow
            iconSrc="/images/profile/setting/1.svg"
            title="프로필 잠금"
            desc="이 프로필을 이용하려면 PIN을 입력해야 합니다"
            onClick={() => openModal("lock")}
          />
        </section>

        <h2 className="profile-settings-section-title">설정</h2>

        <section
          className="profile-settings-card"
          aria-label="프로필 상세 설정"
        >
          {SETTING_ITEMS.map((item) => (
            <SettingsRow
              key={item.title}
              {...item}
              onClick={
                item.modalKey
                  ? () => openModal(item.modalKey ?? null)
                  : undefined
              }
            />
          ))}
        </section>

        <button
          type="button"
          className="profile-settings-delete"
          disabled={isDefaultProfile}
        >
          <img src="/images/profile/setting/9.svg" alt="" aria-hidden="true" />
          프로필 삭제
        </button>
        {isDefaultProfile && (
          <p className="profile-settings-delete-note">
            기본 프로필은 삭제할 수 없습니다.
          </p>
        )}
      </div>

      {activeModal && (
        <div
          className="profile-settings-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={modalTitle}
        >
          <div
            className={`profile-settings-modal${
              activeModal === "subtitles"
                ? " is-subtitles"
                : activeModal === "lock"
                  ? " is-lock"
                  : activeModal === "profile" && isIconPickerOpen
                    ? " is-icons"
                  : activeModal === "maturity"
                    ? " is-account is-maturity"
                  : activeModal === "profile"
                    ? " is-account"
                  : ""
            }`}
          >
            <div className="profile-settings-modal-head">
              <h2>{modalTitle}</h2>
              <button type="button" onClick={closeModal} aria-label="닫기">
                ×
              </button>
            </div>

            <div className="profile-settings-modal-body">
              {activeModal === "profile" && (
                <div className="profile-edit-settings">
                  {isIconPickerOpen ? (
                    <div className="profile-icon-picker">
                      <button
                        type="button"
                        className="profile-contact-back"
                        onClick={() => setIsIconPickerOpen(false)}
                        aria-label="프로필 변경으로 돌아가기"
                      >
                        <span aria-hidden="true" />
                        돌아가기
                      </button>

                      <h3>프로필 아이콘 선택</h3>
                      <div className="profile-icon-picker-user">
                        <span>{profileDisplayName} 님</span>
                        <img src={draftProfileAvatar} alt="" />
                      </div>

                      <section className="profile-icon-section">
                        <h4>최근에 사용한 아이콘</h4>
                        <Swiper
                          modules={[FreeMode, Navigation]}
                          freeMode
                          navigation
                          slidesPerView="auto"
                          spaceBetween={10}
                          className="profile-icon-swiper"
                        >
                          <SwiperSlide className="profile-icon-slide">
                            <button
                              type="button"
                              className="is-selected"
                              onClick={() =>
                                selectProfileIcon(draftProfileAvatar)
                              }
                              aria-label="최근에 사용한 프로필 아이콘 선택"
                            >
                              <img src={draftProfileAvatar} alt="" />
                            </button>
                          </SwiperSlide>
                        </Swiper>
                      </section>

                      {PROFILE_ICON_SECTIONS.map((section) => (
                        <section
                          key={section.title}
                          className="profile-icon-section"
                        >
                          <h4>{section.title}</h4>
                          <Swiper
                            modules={[FreeMode, Navigation]}
                            freeMode
                            navigation
                            slidesPerView="auto"
                            spaceBetween={10}
                            className="profile-icon-swiper"
                          >
                            {section.icons.map((iconSrc) => (
                              <SwiperSlide
                                key={iconSrc}
                                className="profile-icon-slide"
                              >
                                <button
                                  type="button"
                                  className={
                                    draftProfileAvatar === iconSrc
                                      ? "is-selected"
                                      : ""
                                  }
                                  onClick={() => selectProfileIcon(iconSrc)}
                                  aria-label={`${section.title} 프로필 아이콘 선택`}
                                >
                                  <img src={iconSrc} alt="" />
                                </button>
                              </SwiperSlide>
                            ))}
                          </Swiper>
                        </section>
                      ))}
                    </div>
                  ) : contactEdit ? (
                    <form
                      className="profile-contact-editor"
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveContactEdit();
                      }}
                    >
                      <button
                        type="button"
                        className="profile-contact-back"
                        onClick={() => setContactEdit(null)}
                      >
                        <span aria-hidden="true" />
                        돌아가기
                      </button>

                      <h3>
                        {contactEdit === "name"
                          ? "이름 수정"
                          : contactEdit === "email"
                            ? "이메일 수정"
                            : "휴대폰 수정"}
                      </h3>
                      <div className="profile-contact-editor-user">
                        <span>{profileDisplayName} 님</span>
                        <img
                          src={
                            profile.imgUrl ??
                            "/images/profile/image/default_icons/17.png"
                          }
                          alt=""
                        />
                      </div>
                      <p>
                        Netflix는 광고를 포함하여 회원의 경험을 개인화하기 위해
                        Netflix의 개인정보 처리방침에 부합하는 목적으로 이
                        정보를 사용할 수 있습니다.
                      </p>

                      <div className="profile-contact-fields">
                        <label>
                          <span>
                            {contactEdit === "name"
                              ? "이름"
                              : contactEdit === "email"
                                ? "이메일"
                                : "휴대폰"}
                          </span>
                          <input
                            value={draftContact.first}
                            inputMode={
                              contactEdit === "phone" ? "tel" : "text"
                            }
                            onChange={(event) =>
                              setDraftContact((current) => ({
                                ...current,
                                first: event.target.value,
                              }))
                            }
                          />
                        </label>
                        {contactEdit === "name" && (
                          <label>
                            <span>성</span>
                            <input
                              value={draftContact.second}
                              onChange={(event) =>
                                setDraftContact((current) => ({
                                  ...current,
                                  second: event.target.value,
                                }))
                              }
                            />
                          </label>
                        )}
                      </div>

                      {contactError && (
                        <p className="profile-contact-error">
                          {contactError}
                        </p>
                      )}

                      <div className="profile-edit-actions">
                        <button
                          type="submit"
                          className="is-primary"
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          className="is-danger-outline"
                          onClick={clearContactEdit}
                        >
                          삭제
                        </button>
                        <button
                          type="button"
                          onClick={() => setContactEdit(null)}
                        >
                          취소
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveProfileInfo();
                      }}
                    >
                      <div className="profile-edit-main">
                        <div className="profile-edit-avatar">
                          <img
                            src={draftProfileAvatar}
                            alt=""
                          />
                          <button
                            type="button"
                            onClick={() => setIsIconPickerOpen(true)}
                            aria-label="프로필 사진 편집"
                          >
                            ✎
                          </button>
                        </div>
                        <label className="profile-edit-name">
                          <span>프로필 이름</span>
                          <input
                            value={draftProfileName}
                            maxLength={12}
                            onChange={(event) =>
                              setDraftProfileName(event.target.value)
                            }
                          />
                        </label>
                      </div>

                      <section className="profile-contact-section">
                        <h3>연락처 정보</h3>
                        <div className="profile-contact-list">
                          <button
                            type="button"
                            className="profile-contact-row"
                            onClick={() => openContactEdit("name")}
                          >
                            <span className="profile-contact-icon">♙</span>
                            <span>
                              <strong>이름</strong>
                              <em>{profileDisplayName}</em>
                            </span>
                            <i aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="profile-contact-row"
                            onClick={() => openContactEdit("email")}
                          >
                            <span className="profile-contact-icon">✉</span>
                            <span>
                              <strong>이메일</strong>
                              <em>{firebaseEmail || "등록된 이메일 없음"}</em>
                            </span>
                            <i aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="profile-contact-row"
                            onClick={() => openContactEdit("phone")}
                          >
                            <span className="profile-contact-icon">▯</span>
                            <span>
                              <strong>휴대폰</strong>
                              <em>{firebasePhone || "등록된 번호 없음"}</em>
                            </span>
                            <i aria-hidden="true" />
                          </button>
                        </div>
                      </section>

                      <div className="profile-edit-actions">
                        <button
                          type="submit"
                          className="is-primary"
                        >
                          저장
                        </button>
                        <button type="button" onClick={closeModal}>
                          취소
                        </button>
                      </div>

                      <div className="profile-edit-delete">
                        <button type="button" disabled={isDefaultProfile}>
                          프로필 삭제
                        </button>
                        {isDefaultProfile && (
                          <p>기본 프로필은 삭제할 수 없습니다.</p>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              )}

              {activeModal === "lock" && (
                <div className="profile-lock-settings">
                  <h3>프로필 잠금을 설정하려면 4자리 PIN을 등록하세요</h3>
                  <p>
                    모든 디바이스에서 프로필을 선택할 때 PIN을 다시 입력하라는
                    메시지가 표시됩니다.
                  </p>

                  <div
                    className="profile-pin-inputs"
                    aria-label="4자리 PIN 입력"
                  >
                    {pin.map((digit, index) => (
                      <input
                        key={index}
                        ref={(element) => {
                          pinInputRefs.current[index] = element;
                        }}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(event) =>
                          handlePinChange(index, event.target.value)
                        }
                        onKeyDown={(event) => handlePinKeyDown(index, event)}
                        aria-label={`${index + 1}번째 PIN 숫자`}
                        className={pinError ? "is-error" : ""}
                      />
                    ))}
                  </div>

                  {pinError && <p className="profile-pin-error">{pinError}</p>}

                  <p className="profile-pin-note">
                    참고: 프로필 설정을 변경하거나 프로필을 삭제할 때는 프로필
                    PIN이 필요하지 않습니다.
                  </p>

                  <div className="profile-pin-actions">
                    <button
                      type="button"
                      className="is-primary"
                      onClick={savePin}
                    >
                      PIN 저장
                    </button>
                    <button type="button" onClick={closeModal}>
                      취소
                    </button>
                  </div>
                </div>
              )}

              {activeModal === "maturity" && (
                <div className="profile-maturity-settings">
                  <div className="profile-maturity-avatar">
                    <img
                      src={
                        draftProfileAvatar ||
                        profile.imgUrl ||
                        "/images/profile/image/default_icons/17.png"
                      }
                      alt=""
                    />
                  </div>
                  <h3>{profileDisplayName} 프로필의 관람등급</h3>
                  <p>
                    이 프로필에서는 {maturityRating} 등급까지의 콘텐츠가
                    표시됩니다. 손잡이를 잡아 이동해 관람등급을 조정하세요.
                  </p>

                  <div className="profile-rating-slider">
                    <div className="profile-rating-line" />
                    <input
                      type="range"
                      min={0}
                      max={MATURITY_RATINGS.length - 1}
                      step={1}
                      value={maturityIndex}
                      onChange={(event) =>
                        setMaturityRating(
                          MATURITY_RATINGS[Number(event.target.value)],
                        )
                      }
                      aria-label="관람등급 조정"
                      style={
                        {
                          "--rating-progress": `${(maturityIndex / (MATURITY_RATINGS.length - 1)) * 100}%`,
                        } as React.CSSProperties
                      }
                    />
                    <div className="profile-rating-labels">
                      {MATURITY_RATINGS.map((rating, index) => (
                        <span
                          key={rating}
                          className={index === maturityIndex ? "is-active" : ""}
                        >
                          <i aria-hidden="true" />
                          <strong>{rating}</strong>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="profile-edit-actions">
                    <button
                      type="button"
                      className="is-primary"
                      onClick={() => setActiveModal(null)}
                    >
                      저장
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
                    선택한 프로필의 자막 표시 방식을 지원되는 모든 디바이스에서
                    변경합니다.
                  </p>

                  <div className="subtitle-preview-wrap">
                    <span>미리보기</span>
                    <div className="subtitle-preview">
                      <img src="/images/profile/setting/miri.png" alt="" />
                      <p className={previewClass}>
                        본 설정은 모든 지원 디바이스에 표시되는 자막에
                        적용됩니다.
                      </p>
                    </div>
                  </div>

                  <div className="subtitle-form">
                    <SelectBox
                      label="글자 크기"
                      value={draftSubtitle.size}
                      options={Object.entries(subtitleLabels.size).map(
                        ([value, label]) => ({ value, label }),
                      )}
                      onChange={(value) =>
                        updateSubtitle(
                          "size",
                          value as SubtitleSettings["size"],
                        )
                      }
                    />
                    <SelectBox
                      label="글꼴"
                      value={draftSubtitle.font}
                      options={Object.entries(subtitleLabels.font).map(
                        ([value, label]) => ({ value, label }),
                      )}
                      onChange={(value) =>
                        updateSubtitle(
                          "font",
                          value as SubtitleSettings["font"],
                        )
                      }
                    />
                    <div className="subtitle-split">
                      <SelectBox
                        label="그림자"
                        value={draftSubtitle.shadow}
                        options={Object.entries(subtitleLabels.shadow).map(
                          ([value, label]) => ({ value, label }),
                        )}
                        onChange={(value) =>
                          updateSubtitle(
                            "shadow",
                            value as SubtitleSettings["shadow"],
                          )
                        }
                      />
                      <SelectBox
                        label="그림자 색상"
                        value={draftSubtitle.shadowColor}
                        swatch={draftSubtitle.shadowColor}
                        options={Object.entries(subtitleLabels.shadowColor).map(
                          ([value, label]) => ({ value, label }),
                        )}
                        onChange={(value) =>
                          updateSubtitle(
                            "shadowColor",
                            value as SubtitleSettings["shadowColor"],
                          )
                        }
                      />
                    </div>
                    <div className="subtitle-split">
                      <SelectBox
                        label="배경"
                        value={draftSubtitle.background}
                        swatch={draftSubtitle.background}
                        options={Object.entries(subtitleLabels.background).map(
                          ([value, label]) => ({ value, label }),
                        )}
                        onChange={(value) =>
                          updateSubtitle(
                            "background",
                            value as SubtitleSettings["background"],
                          )
                        }
                      />
                      <SelectBox
                        label="창"
                        value={draftSubtitle.window}
                        swatch={draftSubtitle.window}
                        options={Object.entries(subtitleLabels.window).map(
                          ([value, label]) => ({ value, label }),
                        )}
                        onChange={(value) =>
                          updateSubtitle(
                            "window",
                            value as SubtitleSettings["window"],
                          )
                        }
                      />
                    </div>
                  </div>

                  <p className="subtitle-note">
                    일부 디바이스와 언어에서는 이 설정이 지원되지 않습니다.{" "}
                    <button type="button" onClick={openSubtitleHelp}>
                      자세히 알아보기
                    </button>
                  </p>

                  <div className="subtitle-actions">
                    <button
                      type="button"
                      className="is-primary"
                      onClick={saveSubtitleSettings}
                    >
                      저장
                    </button>
                    <button type="button" onClick={resetSubtitleSettings}>
                      기본 설정으로 되돌리기
                    </button>
                    <button
                      type="button"
                      className="is-text"
                      onClick={closeModal}
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              {activeModal === "playback" && (
                <>
                  <OptionRow
                    label="다음 화 자동 재생"
                    desc="에피소드 종료 후 다음 화를 자동 재생합니다."
                  >
                    <Toggle
                      on={toggles.autoplayNext}
                      onChange={() => flip("autoplayNext")}
                    />
                  </OptionRow>
                  <OptionRow
                    label="미리보기 자동 재생"
                    desc="탐색 중 미리보기 영상을 자동 재생합니다."
                  >
                    <Toggle
                      on={toggles.autoplayPreview}
                      onChange={() => flip("autoplayPreview")}
                    />
                  </OptionRow>
                  <OptionRow label="데이터 절약 모드">
                    <Toggle
                      on={toggles.dataSaver}
                      onChange={() => flip("dataSaver")}
                    />
                  </OptionRow>
                </>
              )}

              {activeModal === "notifications" && (
                <>
                  <OptionRow
                    label="신작 알림"
                    desc="새 콘텐츠 공개 소식을 받습니다."
                  >
                    <Toggle
                      on={toggles.notiNew}
                      onChange={() => flip("notiNew")}
                    />
                  </OptionRow>
                  <OptionRow
                    label="추천 콘텐츠 알림"
                    desc="맞춤 추천 알림을 받습니다."
                  >
                    <Toggle
                      on={toggles.notiRecommend}
                      onChange={() => flip("notiRecommend")}
                    />
                  </OptionRow>
                </>
              )}

              {activeModal === "activity" && (
                <>
                  <OptionRow
                    label="시청 기록"
                    desc="최근 시청한 콘텐츠 목록을 확인합니다."
                  >
                    <button
                      type="button"
                      className="profile-settings-modal-btn"
                    >
                      기록 보기
                    </button>
                  </OptionRow>
                  <OptionRow
                    label="기록 전체 삭제"
                    desc="추천에 반영되는 기록을 초기화합니다."
                  >
                    <button
                      type="button"
                      className="profile-settings-modal-btn danger"
                    >
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
