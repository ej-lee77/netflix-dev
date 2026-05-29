"use client";

import React, { useState } from "react";
import Link from "next/link";
import "../scss/plan.scss";

// ─── 플랜 데이터 ──────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  highlighted?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "basic",
    name: "베이직",
    price: 9500,
    description: "혼자 즐기는 깔끔한 시청",
    features: [
      "HD 화질 (720p)",
      "1개의 기기에서 동시 시청",
      "광고 없는 영상 스트리밍",
      "영화 및 시리즈 무제한 시청",
      "휴대폰/태블릿/노트북/TV 시청",
    ],
  },
  {
    id: "standard",
    name: "스탠다드",
    price: 13500,
    description: "가족과 함께 더 좋은 화질로",
    features: [
      "Full HD 화질 (1080p)",
      "2개의 기기에서 동시 시청",
      "광고 없는 영상 스트리밍",
      "영화 및 시리즈 무제한 시청",
      "휴대폰/태블릿/노트북/TV 시청",
      "다운로드 지원 (2개 기기)",
    ],
    highlighted: true,
  },
  {
    id: "premium",
    name: "프리미엄",
    price: 17000,
    description: "최고의 경험을 모두에게",
    features: [
      "4K UHD + HDR 화질",
      "4개의 기기에서 동시 시청",
      "광고 없는 영상 스트리밍",
      "영화 및 시리즈 무제한 시청",
      "휴대폰/태블릿/노트북/TV 시청",
      "다운로드 지원 (6개 기기)",
      "공간 음향 (Dolby Atmos)",
    ],
  },
];

// ─── FAQ 데이터 ───────────────────────────────────────────────────────────────

interface FAQ {
  question: string;
  answer: string;
}

const FAQS: FAQ[] = [
  {
    question: "MOVIES는 어떤 서비스인가요?",
    answer:
      "MOVIES는 다양한 영화, 시리즈, 다큐멘터리를 인터넷이 연결된 기기에서 무제한으로 시청할 수 있는 스트리밍 서비스입니다. 매주 500편 이상의 신작이 업데이트됩니다.",
  },
  {
    question: "비용은 얼마인가요?",
    answer:
      "월 9,500원부터 17,000원까지 다양한 요금제를 제공합니다. 추가 비용이나 약정 없이 매월 자유롭게 변경하거나 해지하실 수 있습니다.",
  },
  {
    question: "어디에서 시청할 수 있나요?",
    answer:
      "어디서든 시청할 수 있습니다. 휴대폰, 태블릿, 노트북, TV, 게임 콘솔 등 인터넷이 연결된 모든 기기에서 MOVIES 앱이나 웹사이트로 접속해 시청할 수 있습니다.",
  },
  {
    question: "어떻게 해지하나요?",
    answer:
      "간편하고 자유로운 해지가 가능합니다. 마이페이지에서 두 번의 클릭으로 해지할 수 있으며, 해지 수수료는 없습니다. 언제든지 다시 가입할 수 있습니다.",
  },
  {
    question: "어떤 콘텐츠를 볼 수 있나요?",
    answer:
      "MOVIES는 다양한 장르의 영화, 시리즈, 다큐멘터리, 애니메이션을 제공합니다. MOVIES 오리지널 작품을 포함해 매주 새로운 콘텐츠가 추가됩니다.",
  },
  {
    question: "MOVIES는 어린이가 시청하기에 적합한가요?",
    answer:
      "키즈 프로필을 만들어 어린이 전용 콘텐츠만 볼 수 있도록 설정할 수 있습니다. 자녀가 시청하는 콘텐츠를 부모님이 직접 제어할 수 있습니다.",
  },
];

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function PlanPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="plan-page">
      {/* ── 헤더 섹션 ─────────────────────────────────────────────────────── */}
      <section className="plan-hero">
        <div className="plan-hero-inner">
          <h1 className="plan-hero-title">
            나에게 딱 맞는<br />
            <span className="accent">플랜</span>을 선택하세요
          </h1>
          <p className="plan-hero-desc">
            언제든지 자유롭게 변경하거나 해지할 수 있습니다.
          </p>
        </div>
      </section>

      {/* ── 플랜 카드 영역 ────────────────────────────────────────────────── */}
      <section className="plan-cards-section">
        <div className="plan-cards-inner">
          <div className="plan-cards">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`plan-card${plan.highlighted ? " is-highlighted" : ""}`}
              >
                {plan.highlighted && <div className="popular-badge">인기</div>}

                <div className="plan-header">
                  <h2 className="plan-name">{plan.name}</h2>
                  <p className="plan-desc">{plan.description}</p>
                </div>

                <div className="plan-price">
                  <span className="price-value">
                    ₩{plan.price.toLocaleString()}
                  </span>
                  <span className="price-unit">/월</span>
                </div>

                <ul className="plan-features">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="feature-item">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="check-icon"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/payment?plan=${plan.id}`}
                  className="plan-select-btn"
                >
                  {plan.name} 선택하기
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ 섹션 ─────────────────────────────────────────────────────── */}
      <section className="plan-faq-section">
        <div className="plan-faq-inner">
          <h2 className="faq-section-title">자주 묻는 질문</h2>
          <ul className="faq-list">
            {FAQS.map((faq, idx) => (
              <li key={idx} className="faq-item">
                <button
                  type="button"
                  className={`faq-question${openFaq === idx ? " is-open" : ""}`}
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={openFaq === idx}
                >
                  <span>{faq.question}</span>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="faq-icon"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
                {openFaq === idx && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 하단 CTA ─────────────────────────────────────────────────────── */}
      <section className="plan-cta-section">
        <div className="plan-cta-inner">
          <h2 className="cta-title">지금 바로 시작하세요</h2>
          <p className="cta-desc">
            지금 가입하고 다양한 콘텐츠를 무제한으로 즐겨보세요
          </p>
          <Link href="/signin" className="cta-btn">
            구독 시작하기
          </Link>
        </div>
      </section>
    </div>
  );
}
