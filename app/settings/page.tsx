"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DEFAULT_PROFILES, useAuthStore } from "@/store/useAuthStore";
import "../scss/settings.scss";

type TabKey =
  | "account"
  | "membership"
  | "profile"
  | "playback"
  | "notifications"
  | "activity"
  | "app";

const TABS: { key: TabKey; label: string }[] = [
  { key: "account", label: "계정 정보" },
  { key: "membership", label: "멤버십 / 결제" },
  { key: "profile", label: "프로필 관리" },
  { key: "playback", label: "재생 설정" },
  { key: "notifications", label: "알림 설정" },
  { key: "activity", label: "보기 활동" },
  { key: "app", label: "앱 설정" },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      className={`acset-toggle${on ? " on" : ""}`}
      onClick={onChange}
      aria-pressed={on}
    />
  );
}

function Row({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="acset-row">
      <div>
        <div className="acset-row-label">{label}</div>
        {desc && <div className="acset-row-desc">{desc}</div>}
      </div>
      <div className="acset-row-action">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [active, setActive] = useState<TabKey>("account");
  const { user } = useAuthStore();
  const profiles = user?.profiles?.length ? user.profiles : DEFAULT_PROFILES;
  const [toggles, setToggles] = useState({
    autoplayNext: true,
    autoplayPreview: true,
    dataSaver: false,
    darkMode: true,
    notiNew: true,
    notiRecommend: false,
  });

  const flip = (key: keyof typeof toggles) =>
    setToggles((value) => ({ ...value, [key]: !value[key] }));
  const activeTab = TABS.find((tab) => tab.key === active);

  return (
    <div className="acset-page">
      <div className="acset-container">
        <div className="acset-top">
          <h1 className="acset-title">설정</h1>
          <p className="acset-subtitle">계정과 시청 환경을 관리합니다.</p>
        </div>

        <div className="acset-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`acset-tab${active === tab.key ? " is-active" : ""}`}
              onClick={() => setActive(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="acset-panel">
          <div className="acset-panel-head">
            <h2>{activeTab?.label}</h2>
          </div>

          <div className="acset-panel-body">
            {active === "account" && (
              <>
                <Row label="이메일" desc="로그인에 사용하는 이메일">
                  <span className="acset-row-value">
                    {user?.email ?? "user@example.com"}
                  </span>
                </Row>
                <Row
                  label="비밀번호"
                  desc="계정 보안을 위해 주기적으로 변경하세요."
                >
                  <button className="acset-btn">비밀번호 변경</button>
                </Row>
                <Row label="회원 탈퇴" desc="모든 계정 데이터가 삭제됩니다.">
                  <button className="acset-btn danger">회원 탈퇴</button>
                </Row>
              </>
            )}

            {active === "membership" && (
              <>
                <div className="acset-plan-box">
                  <div>
                    <div className="acset-plan-name">스탠다드</div>
                    <div className="acset-plan-price">
                      월 13,500원 · 다음 결제일 2026.06.15
                    </div>
                  </div>
                  <div className="acset-plan-actions">
                    <Link href="/plan" className="acset-btn">
                      플랜 변경
                    </Link>
                    <button className="acset-btn danger">해지</button>
                  </div>
                </div>
                <Row label="결제 수단">
                  <button className="acset-btn">관리</button>
                </Row>
              </>
            )}

            {active === "profile" && (
              <>
                <div className="acset-profile-grid">
                  {profiles.map((profile) => (
                    <Link
                      key={profile.id}
                      href="/profiles"
                      className="acset-profile-card"
                    >
                      <div className="acset-profile-avatar">
                        <img
                          src={
                            profile.imgUrl ??
                            "/images/profile/default_icons/17.png"
                          }
                          alt={profile.name ?? "프로필"}
                        />
                      </div>
                      <span className="acset-profile-name">{profile.name}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {active === "playback" && (
              <>
                <Row
                  label="다음 화 자동 재생"
                  desc="에피소드 종료 후 다음 화를 자동 재생합니다."
                >
                  <Toggle
                    on={toggles.autoplayNext}
                    onChange={() => flip("autoplayNext")}
                  />
                </Row>
                <Row
                  label="미리보기 자동 재생"
                  desc="탐색 중 미리보기 영상을 자동 재생합니다."
                >
                  <Toggle
                    on={toggles.autoplayPreview}
                    onChange={() => flip("autoplayPreview")}
                  />
                </Row>
                <Row label="데이터 절약 모드">
                  <Toggle
                    on={toggles.dataSaver}
                    onChange={() => flip("dataSaver")}
                  />
                </Row>
              </>
            )}

            {active === "notifications" && (
              <>
                <Row label="신작 알림" desc="새 콘텐츠 공개 소식을 받습니다.">
                  <Toggle
                    on={toggles.notiNew}
                    onChange={() => flip("notiNew")}
                  />
                </Row>
                <Row label="추천 콘텐츠 알림" desc="맞춤 추천을 받습니다.">
                  <Toggle
                    on={toggles.notiRecommend}
                    onChange={() => flip("notiRecommend")}
                  />
                </Row>
              </>
            )}

            {active === "activity" && (
              <>
                <Row
                  label="시청 기록"
                  desc="최근 시청한 콘텐츠 목록을 확인합니다."
                >
                  <button className="acset-btn">기록 보기</button>
                </Row>
                <Row
                  label="기록 전체 삭제"
                  desc="추천에 반영되는 기록을 초기화합니다."
                >
                  <button className="acset-btn danger">전체 삭제</button>
                </Row>
              </>
            )}

            {active === "app" && (
              <>
                <Row label="언어">
                  <select className="acset-select" defaultValue="ko">
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                  </select>
                </Row>
                <Row label="다크 모드">
                  <Toggle
                    on={toggles.darkMode}
                    onChange={() => flip("darkMode")}
                  />
                </Row>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
