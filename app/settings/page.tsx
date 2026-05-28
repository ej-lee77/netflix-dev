"use client";

import React, { useState } from "react";
import Link from "next/link";
import "../scss/settings.scss";

// ─── 섹션 정의 (가로 탭) ──────────────────────────────────────────────────────

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

// ─── 재사용 UI ────────────────────────────────────────────────────────────────

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

  const [toggles, setToggles] = useState({
    notiNew: true,
    notiRecommend: false,
    notiEmail: false,
    notiPush: true,
    autoplayNext: true,
    autoplayPreview: true,
    dataSaver: false,
    darkMode: true,
  });
  const flip = (k: keyof typeof toggles) =>
    setToggles((t) => ({ ...t, [k]: !t[k] }));

  const activeTab = TABS.find((t) => t.key === active);

  return (
    <div className="acset-page">
      <div className="acset-container">
        {/* ── 헤더 ──────────────────────────────────────────────────────── */}
        <div className="acset-top">
          <h1 className="acset-title">설정</h1>
          <p className="acset-subtitle">계정과 환경설정을 관리합니다</p>
        </div>

        {/* ── 가로 탭 ───────────────────────────────────────────────────── */}
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

        {/* ── 콘텐츠 ────────────────────────────────────────────────────── */}
        <div className="acset-panel">
          <div className="acset-panel-head">
            <h2>{activeTab?.label}</h2>
          </div>

          <div className="acset-panel-body">
            {/* 1. 계정 정보 */}
            {active === "account" && (
              <>
                <Row label="이메일" desc="로그인에 사용되는 이메일">
                  <div className="acset-row-multi">
                    <span className="acset-row-value">user@example.com</span>
                    <button className="acset-btn">변경</button>
                  </div>
                </Row>
                <Row label="비밀번호" desc="마지막 변경: 30일 전">
                  <button className="acset-btn">비밀번호 변경</button>
                </Row>
                <Row label="휴대폰 번호" desc="본인 확인 및 알림용">
                  <div className="acset-row-multi">
                    <span className="acset-row-value">010-****-1234</span>
                    <button className="acset-btn">변경</button>
                  </div>
                </Row>
                <Row label="회원 탈퇴" desc="모든 데이터가 삭제되며 복구할 수 없습니다">
                  <button className="acset-btn danger">회원 탈퇴</button>
                </Row>
              </>
            )}

            {/* 2. 멤버십 / 결제 */}
            {active === "membership" && (
              <>
                <div className="acset-plan-box">
                  <div>
                    <div className="acset-plan-name">스탠다드</div>
                    <div className="acset-plan-price">₩13,500 / 월 · 다음 결제일 2026.06.15</div>
                  </div>
                  <div className="acset-plan-actions">
                    <Link href="/plan" className="acset-btn">플랜 변경</Link>
                    <button className="acset-btn danger">해지</button>
                  </div>
                </div>
                <Row label="결제 수단">
                  <button className="acset-btn">+ 추가</button>
                </Row>
                <div className="acset-pay-method">
                  <div className="acset-pay-logo">CARD</div>
                  <div className="acset-pay-info">
                    <div className="acset-row-label">신한카드</div>
                    <div className="acset-row-desc">**** **** **** 1234</div>
                  </div>
                  <span className="acset-pay-default">기본</span>
                  <button className="acset-btn">관리</button>
                </div>
                <Row label="결제 내역" desc="지난 결제 기록 보기">
                  <button className="acset-btn">내역 보기</button>
                </Row>
              </>
            )}

            {/* 3. 프로필 관리 */}
            {active === "profile" && (
              <>
                <div className="acset-profile-grid">
                  <div className="acset-profile-card">
                    <div className="acset-profile-avatar">
                      <img src="/images/profile/normal.svg" alt="나" />
                    </div>
                    <span className="acset-profile-name">나</span>
                  </div>
                  <Link href="/profiles/new" className="acset-profile-card">
                    <div className="acset-profile-avatar acset-profile-add">+</div>
                    <span className="acset-profile-name">프로필 추가</span>
                  </Link>
                </div>
                <Row label="프로필 잠금 (PIN)" desc="프로필 전환 시 비밀번호 요구">
                  <Link href="/profiles" className="acset-btn">프로필 설정으로</Link>
                </Row>
              </>
            )}

            {/* 4. 재생 설정 */}
            {active === "playback" && (
              <>
                <Row label="다음 화 자동 재생" desc="에피소드 종료 시 자동 재생">
                  <Toggle on={toggles.autoplayNext} onChange={() => flip("autoplayNext")} />
                </Row>
                <Row label="미리보기 자동 재생" desc="탐색 중 미리보기 영상 재생">
                  <Toggle on={toggles.autoplayPreview} onChange={() => flip("autoplayPreview")} />
                </Row>
                <Row label="기본 재생 화질">
                  <select className="acset-select">
                    <option>자동</option>
                    <option>고화질</option>
                    <option>데이터 절약</option>
                  </select>
                </Row>
                <Row label="기본 자막 언어">
                  <select className="acset-select">
                    <option>한국어</option>
                    <option>English</option>
                    <option>끄기</option>
                  </select>
                </Row>
                <Row label="기본 오디오 언어">
                  <select className="acset-select">
                    <option>한국어</option>
                    <option>원어</option>
                  </select>
                </Row>
              </>
            )}

            {/* 5. 알림 설정 */}
            {active === "notifications" && (
              <>
                <Row label="신작 알림" desc="찜한 작품의 신규 회차 공개 시">
                  <Toggle on={toggles.notiNew} onChange={() => flip("notiNew")} />
                </Row>
                <Row label="추천 콘텐츠 알림" desc="맞춤 추천 작품 안내">
                  <Toggle on={toggles.notiRecommend} onChange={() => flip("notiRecommend")} />
                </Row>
                <Row label="이메일 수신" desc="이벤트·혜택 정보 메일">
                  <Toggle on={toggles.notiEmail} onChange={() => flip("notiEmail")} />
                </Row>
                <Row label="푸시 알림" desc="앱 푸시 알림 받기">
                  <Toggle on={toggles.notiPush} onChange={() => flip("notiPush")} />
                </Row>
              </>
            )}

            {/* 6. 보기 활동 */}
            {active === "activity" && (
              <>
                <Row label="시청 기록" desc="최근 시청한 작품 목록">
                  <button className="acset-btn">기록 보기</button>
                </Row>
                <Row label="평가한 콘텐츠" desc="좋아요/싫어요 표시한 작품">
                  <button className="acset-btn">목록 보기</button>
                </Row>
                <Row label="시청 기록 전체 삭제" desc="추천에 반영된 기록을 초기화">
                  <button className="acset-btn danger">전체 삭제</button>
                </Row>
              </>
            )}

            {/* 7. 앱 설정 */}
            {active === "app" && (
              <>
                <Row label="언어">
                  <select className="acset-select">
                    <option>한국어</option>
                    <option>English</option>
                    <option>日本語</option>
                  </select>
                </Row>
                <Row label="다크 모드" desc="어두운 테마 사용">
                  <Toggle on={toggles.darkMode} onChange={() => flip("darkMode")} />
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
