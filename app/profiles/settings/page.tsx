"use client";

import React, { useState } from "react";
import Link from "next/link";
import "../../scss/profileSettings.scss";

// ─── 섹션 정의 (가로 탭) ──────────────────────────────────────────────────────

type TabKey =
  | "account"
  | "lock"
  | "language"
  | "history"
  | "notifications"
  | "parental"
  | "playback";

const TABS: { key: TabKey; label: string }[] = [
  { key: "account", label: "개인정보" },
  { key: "lock", label: "프로필 잠금" },
  { key: "language", label: "언어" },
  { key: "history", label: "시청 기록" },
  { key: "notifications", label: "알림" },
  { key: "parental", label: "자녀 보호" },
  { key: "playback", label: "재생" },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      className={`st-toggle${on ? " on" : ""}`}
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
    <div className="st-row">
      <div>
        <div className="st-row-label">{label}</div>
        {desc && <div className="st-row-desc">{desc}</div>}
      </div>
      <div className="st-row-action">{children}</div>
    </div>
  );
}

export default function ProfileSettingsPage() {
  const [active, setActive] = useState<TabKey>("account");

  const [toggles, setToggles] = useState({
    profileLock: false,
    saveHistory: true,
    notiNew: true,
    notiRecommend: false,
    notiWatching: true,
    notiPush: true,
    parentalPin: true,
    autoplayNext: true,
    autoplayPreview: true,
    dataSaver: false,
  });
  const flip = (k: keyof typeof toggles) =>
    setToggles((t) => ({ ...t, [k]: !t[k] }));

  const [ratings, setRatings] = useState<string[]>(["전체", "7+", "12+"]);
  const allRatings = ["전체", "7+", "12+", "15+", "19+"];
  const toggleRating = (r: string) =>
    setRatings((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );

  const activeTab = TABS.find((t) => t.key === active);

  return (
    <div className="profile-settings-page">
      <div className="ps-container">
        {/* ── 헤더 ──────────────────────────────────────────────────────── */}
        <div className="ps-top">
          <Link href="/profiles" className="ps-back">← 프로필 선택</Link>
          <h1 className="ps-page-title">프로필 설정</h1>
          <p className="ps-page-subtitle">'나' 프로필의 환경을 설정합니다</p>
        </div>

        {/* ── 가로 탭 ───────────────────────────────────────────────────── */}
        <div className="ps-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`ps-tab${active === tab.key ? " is-active" : ""}`}
              onClick={() => setActive(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── 콘텐츠 ────────────────────────────────────────────────────── */}
        <div className="ps-panel">
          <div className="panel-head">
            <h2>{activeTab?.label}</h2>
          </div>

          <div className="panel-body">
            {/* 개인정보 */}
            {active === "account" && (
              <>
                <div className="account-top">
                  <div className="account-avatar">
                    <img src="/images/profile/normal.svg" alt="프로필" />
                    <span className="avatar-cam">📷</span>
                  </div>
                  <div className="account-name-field">
                    <label className="field-label">프로필 이름</label>
                    <input className="st-input" defaultValue="나" />
                  </div>
                </div>
                <Row label="아바타 선택" desc="원하는 이미지로 변경">
                  <button className="st-btn">갤러리에서 선택</button>
                </Row>
                <Row label="프로필 삭제" desc="이 프로필의 모든 기록이 삭제됩니다">
                  <button className="st-btn danger">삭제</button>
                </Row>
                <div className="save-bar">
                  <button className="st-btn">취소</button>
                  <button className="st-btn red">저장</button>
                </div>
              </>
            )}

            {/* 프로필 잠금 */}
            {active === "lock" && (
              <>
                <Row label="프로필 잠금 사용" desc="4자리 PIN으로 이 프로필 보호">
                  <Toggle on={toggles.profileLock} onChange={() => flip("profileLock")} />
                </Row>
                {toggles.profileLock && (
                  <>
                    <label className="field-label" style={{ marginTop: 16 }}>
                      PIN 입력 (4자리)
                    </label>
                    <div className="pin-row">
                      <input className="pin-box" maxLength={1} />
                      <input className="pin-box" maxLength={1} />
                      <input className="pin-box" maxLength={1} />
                      <input className="pin-box" maxLength={1} />
                    </div>
                    <p className="st-note">⚠ PIN을 잊으면 계정 이메일로 재설정할 수 있습니다.</p>
                    <div className="save-bar">
                      <button className="st-btn red">PIN 저장</button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* 언어 */}
            {active === "language" && (
              <>
                <Row label="표시 언어">
                  <select className="st-select">
                    <option>한국어</option>
                    <option>English</option>
                    <option>日本語</option>
                  </select>
                </Row>
                <Row label="기본 자막 언어">
                  <select className="st-select">
                    <option>한국어</option>
                    <option>English</option>
                    <option>끄기</option>
                  </select>
                </Row>
                <Row label="기본 오디오 언어">
                  <select className="st-select">
                    <option>한국어</option>
                    <option>원어</option>
                  </select>
                </Row>
                <Row label="자막 표시 스타일" desc="글자 크기, 색상, 배경">
                  <button className="st-btn">스타일 설정</button>
                </Row>
              </>
            )}

            {/* 시청 기록 */}
            {active === "history" && (
              <>
                <Row label="시청 기록 보기" desc="최근 시청한 작품 목록">
                  <button className="st-btn">기록 보기</button>
                </Row>
                <Row label="시청 기록 저장" desc="끄면 기록이 저장되지 않습니다">
                  <Toggle on={toggles.saveHistory} onChange={() => flip("saveHistory")} />
                </Row>
                <Row label="기록 전체 삭제" desc="추천에 반영된 기록 초기화">
                  <button className="st-btn danger">전체 삭제</button>
                </Row>
                <Row label="평가한 콘텐츠" desc="좋아요/싫어요 표시 목록">
                  <button className="st-btn">목록 보기</button>
                </Row>
              </>
            )}

            {/* 알림 */}
            {active === "notifications" && (
              <>
                <Row label="신작 알림" desc="찜한 작품의 신규 회차 공개 시">
                  <Toggle on={toggles.notiNew} onChange={() => flip("notiNew")} />
                </Row>
                <Row label="추천 콘텐츠 알림" desc="맞춤 추천 작품 안내">
                  <Toggle on={toggles.notiRecommend} onChange={() => flip("notiRecommend")} />
                </Row>
                <Row label="시청 중인 작품 알림" desc="이어보기 리마인드">
                  <Toggle on={toggles.notiWatching} onChange={() => flip("notiWatching")} />
                </Row>
                <Row label="푸시 알림" desc="앱 푸시 받기">
                  <Toggle on={toggles.notiPush} onChange={() => flip("notiPush")} />
                </Row>
              </>
            )}

            {/* 자녀 보호 */}
            {active === "parental" && (
              <>
                <div className="st-row" style={{ borderBottom: "none", paddingBottom: 4 }}>
                  <div>
                    <div className="st-row-label">시청 가능 관람등급</div>
                    <div className="st-row-desc">선택한 등급까지만 표시됩니다</div>
                  </div>
                </div>
                <div className="rating-chips">
                  {allRatings.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`chip${ratings.includes(r) ? " on" : ""}`}
                      onClick={() => toggleRating(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <Row label="특정 작품 제한" desc="개별 작품을 차단 목록에 추가">
                  <button className="st-btn">작품 관리</button>
                </Row>
                <Row label="제한 변경 시 PIN 요구" desc="설정 변경에 보호자 PIN 필요">
                  <Toggle on={toggles.parentalPin} onChange={() => flip("parentalPin")} />
                </Row>
                <p className="st-note">⚠ 자녀 보호 설정 변경에는 보호자 PIN이 필요합니다.</p>
              </>
            )}

            {/* 재생 */}
            {active === "playback" && (
              <>
                <Row label="다음 화 자동 재생" desc="에피소드 종료 시 자동 재생">
                  <Toggle on={toggles.autoplayNext} onChange={() => flip("autoplayNext")} />
                </Row>
                <Row label="미리보기 자동 재생" desc="탐색 중 미리보기 영상 재생">
                  <Toggle on={toggles.autoplayPreview} onChange={() => flip("autoplayPreview")} />
                </Row>
                <Row label="기본 재생 화질">
                  <select className="st-select">
                    <option>자동</option>
                    <option>고화질</option>
                    <option>데이터 절약</option>
                  </select>
                </Row>
                <Row label="데이터 절약 모드" desc="모바일 데이터 사용량 절감">
                  <Toggle on={toggles.dataSaver} onChange={() => flip("dataSaver")} />
                </Row>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
