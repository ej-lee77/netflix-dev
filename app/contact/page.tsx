"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import "../scss/contact.scss";

type TabType = "faq" | "inquiry" | "history";
type CategoryType = "account" | "payment" | "watch" | "device";
type FilterStatusType = "all" | "pending" | "processing" | "answered";

const categories = [
  { id: "account" as const, icon: "👤", name: "계정 / 회원", count: 23 },
  { id: "payment" as const, icon: "💳", name: "결제 / 환불", count: 18 },
  { id: "watch" as const, icon: "📺", name: "시청 / 재생", count: 15 },
  { id: "device" as const, icon: "📱", name: "기기 / 앱", count: 12 },
];

const faqsMap: Record<CategoryType, { q: string; a: string }[]> = {
  account: [
    { q: "비밀번호를 잊어버렸어요. 어떻게 찾을 수 있나요?", a: '로그인 페이지에서 "비밀번호 찾기"를 클릭하시면 가입하신 이메일로 재설정 링크를 보내드려요.' },
    { q: "소셜 로그인을 다른 계정으로 변경할 수 있나요?", a: "마이페이지 > 계정 관리 > 소셜 로그인 연결에서 기존 연결을 해제하고 새 계정을 연결할 수 있어요." },
    { q: "회원 탈퇴 후 다시 가입할 수 있나요?", a: "네, 가능합니다. 다만 탈퇴 시 모든 시청 기록·리뷰·찜 목록·뱃지는 복구되지 않습니다." },
    { q: "이메일 주소를 변경하고 싶어요", a: "마이페이지 > 계정 관리 > 회원정보에서 이메일을 변경할 수 있습니다." },
    { q: "프로필을 몇 개까지 만들 수 있나요?", a: "최대 5개까지 만들 수 있어요. 가족 구성원마다 별도 프로필로 맞춤 추천을 받을 수 있습니다." },
  ],
  payment: [
    { q: "결제 수단을 변경하고 싶어요", a: "마이페이지 > 결제 정보에서 결제 수단을 변경할 수 있습니다." },
    { q: "환불은 어떻게 받나요?", a: "구독 시작 후 7일 이내, 시청 이력이 없는 경우 전액 환불 가능합니다." },
    { q: "두 번 결제된 것 같아요", a: "결제 정보의 결제 내역을 확인해주세요. 중복 결제인 경우 자동으로 환불 처리됩니다." },
  ],
  watch: [
    { q: "스마트 TV에서 자막이 안 나와요", a: "재생 화면 > 자막 설정에서 한국어 자막을 활성화해주세요." },
    { q: "동영상이 자꾸 끊겨요", a: "네트워크 속도를 확인하고, 화질을 낮춰서 시청해보세요." },
  ],
  device: [
    { q: "앱이 자꾸 종료됩니다", a: "최신 버전으로 업데이트하거나 앱을 삭제 후 재설치해주세요." },
    { q: "지원되는 기기는 무엇인가요?", a: "PC 웹, iOS·Android 앱, 스마트 TV 등에서 시청 가능합니다." },
  ],
};

interface InquiryHistory {
  id: number;
  category: string;
  title: string;
  preview: string;
  date: string;
  status: "answered" | "processing" | "pending";
}

const inquiryHistories: InquiryHistory[] = [
  { id: 1, category: "결제 / 환불", title: "5월 결제 환불 요청합니다", preview: "실수로 두 번 결제된 것 같아요...", date: "2026.05.20", status: "answered" },
  { id: 2, category: "시청 / 재생", title: "스마트 TV에서 자막이 안 나와요", preview: "삼성 TV 2023년 모델에서 자막이...", date: "2026.05.21", status: "processing" },
  { id: 3, category: "기기 / 앱", title: "앱이 자꾸 종료됩니다", preview: "iOS 업데이트 후 재생 중 자주 강제 종료...", date: "2026.05.22", status: "pending" },
  { id: 4, category: "계정", title: "소셜 로그인 연결 해제", preview: "네이버 계정 연결을 해제하고 싶어요...", date: "2026.05.15", status: "answered" },
];

export default function ContactPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. URL 쿼리 파라미터(?tab=...)를 파싱하여 state 초기값으로 세팅 (유효하지 않으면 'faq'가 기본값)
  const currentTabParam = (searchParams.get("tab") as TabType) || "faq";
  const [tab, setTab] = useState<TabType>(currentTabParam);
  
  const [category, setCategory] = useState<CategoryType>("account");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [historyFilter, setHistoryFilter] = useState<FilterStatusType>("all");

  // 문의 폼 상태
  const [inquiryType, setInquiryType] = useState("");
  const [inquiryTitle, setInquiryTitle] = useState("");
  const [inquiryContent, setInquiryContent] = useState("");

  // 2. 외부 브라우저 액션(새로고침, 뒤로 가기 등)으로 URL 파라미터가 바뀔 때 State 동기화
  useEffect(() => {
    const validTabs: TabType[] = ["faq", "inquiry", "history"];
    if (validTabs.includes(currentTabParam)) {
      setTab(currentTabParam);
    }
  }, [currentTabParam]);

  // 3. 탭 변경 핸들러 함수 정의 (State를 바꿈과 동시에 URL 파라미터 수정)
  const handleTabChange = (targetTab: TabType) => {
    setTab(targetTab);
    
    // 주소창 세팅을 위한 URLSearchParams 객체 빌드
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", targetTab);
    
    // 페이지 전체 갱신(리로드) 없이 깔끔하게 URL 히스토리 쿼리만 교체
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const faqs = faqsMap[category];

  const statusMap = {
    answered: { label: "답변 완료", className: "answered" },
    processing: { label: "처리 중", className: "processing" },
    pending: { label: "답변 대기", className: "pending" },
  };

  const filteredHistories = inquiryHistories.filter((h) => {
    if (historyFilter === "all") return true;
    return h.status === historyFilter;
  });

  return (
    <div className="contact-page">
      <div className="inner">
        
        <div className="page-head">
          <h1>고객 센터</h1>
        </div>

        {/* 메인 탭메뉴 적용 단락: 이제 handleTabChange 바인딩으로 주소창 제어 */}
        <div className="contact-tabs" aria-label="고객센터 메뉴">
          <button type="button" className={tab === "faq" ? "active" : ""} onClick={() => handleTabChange("faq")}>
            자주 묻는 질문
          </button>
          <button type="button" className={tab === "inquiry" ? "active" : ""} onClick={() => handleTabChange("inquiry")}>
            1:1 문의하기
          </button>
          <button type="button" className={tab === "history" ? "active" : ""} onClick={() => handleTabChange("history")}>
            내 문의 내역
          </button>
        </div>

        {/* ── [A] 자주 묻는 질문(FAQ) 탭 ── */}
        {tab === "faq" && (
          <div className="tab-content-panel">
            <div className="section-title-row">
              <h2>자주 묻는 질문</h2>
            </div>

            <div className="faq-search">
              <span className="icon">⌕</span>
              <input type="text" placeholder="궁금한 내용을 검색해보세요 (예: 결제 변경, 다운로드)" />
            </div>

            <div className="faq-categories">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={`faq-category ${category === c.id ? "active" : ""}`}
                  onClick={() => {
                    setCategory(c.id);
                    setOpenFaq(0);
                  }}
                >
                  <div className="cat-icon">{c.icon}</div>
                  <h3>{c.name}</h3>
                  <p>{c.count}개</p>
                </button>
              ))}
            </div>

            <div className="faq-results-wrapper">
              <div className="section-title-row sub-title">
                <h2>{categories.find((c) => c.id === category)?.name}</h2>
                <span className="total-count">{faqs.length}개 질문</span>
              </div>

              <ul className="faq-list">
                {faqs.map((f, idx) => (
                  <li key={idx} className={`faq-item ${openFaq === idx ? "open" : ""}`}>
                    <button type="button" className="faq-q" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                      <span>{f.q}</span>
                      <svg
                        width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                        className={`arrow-icon ${openFaq === idx ? "is-open" : ""}`}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    {openFaq === idx && (
                      <div className="faq-a">
                        <p>{f.a}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── [B] 1:1 문의 작성 탭 ── */}
        {tab === "inquiry" && (
          <div className="tab-content-panel">
            <div className="section-title-row">
              <h2>1:1 문의하기</h2>
            </div>
            
            <div className="inquiry-form-wrap">
              <p className="form-info">평균 답변 시간: 영업일 기준 24시간 이내. 답변은 등록한 이메일로 알려드려요.</p>

              <form className="inquiry-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-field">
                  <label>문의 유형 *</label>
                  <select value={inquiryType} onChange={(e) => setInquiryType(e.target.value)}>
                    <option value="">유형을 선택해주세요</option>
                    <option value="account">계정 / 회원</option>
                    <option value="payment">결제 / 환불</option>
                    <option value="watch">시청 / 재생</option>
                    <option value="device">기기 / 앱</option>
                    <option value="other">기타</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>제목 *</label>
                  <input
                    type="text"
                    placeholder="문의 제목을 입력해주세요"
                    value={inquiryTitle}
                    onChange={(e) => setInquiryTitle(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>내용 *</label>
                  <textarea
                    placeholder="자세한 내용을 입력해주세요..."
                    value={inquiryContent}
                    onChange={(e) => setInquiryContent(e.target.value)}
                    rows={8}
                  />
                </div>

                <div className="form-field">
                  <label>첨부파일 (선택)</label>
                  <div className="form-attach">📎 파일 끌어다 놓기 · 클릭하여 업로드 (최대 5MB)</div>
                </div>

                <div className="form-field">
                  <label>답변 받을 이메일</label>
                  <input type="email" placeholder="user@example.com" />
                </div>

                <button
                  type="button"
                  className="btn-submit"
                  onClick={() => {
                    if (!inquiryType || !inquiryTitle || !inquiryContent) {
                      alert("필수 항목을 모두 입력해주세요.");
                      return;
                    }
                    alert("문의가 등록되었습니다. 영업일 기준 24시간 내 답변드릴게요.");
                    setInquiryType("");
                    setInquiryTitle("");
                    setInquiryContent("");
                    handleTabChange("history"); // 탭 전환 공통 함수 적용
                    setHistoryFilter("all");
                  }}
                >
                  문의 등록
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── [C] 내 문의 내역 탭 ── */}
        {tab === "history" && (
          <div className="tab-content-panel">
            <div className="section-title-row">
              <h2>내 문의 내역</h2>
              <span className="total-count">{filteredHistories.length}개</span>
            </div>

            <div className="status-filter">
              {(["all", "pending", "processing", "answered"] as FilterStatusType[]).map((type) => (
                <button
                  type="button"
                  key={type}
                  className={`status-chip ${historyFilter === type ? "active" : ""}`}
                  onClick={() => setHistoryFilter(type)}
                >
                  {type === "all" && `전체 ${inquiryHistories.length}`}
                  {type === "pending" && "답변 대기"}
                  {type === "processing" && "처리 중"}
                  {type === "answered" && "완료"}
                </button>
              ))}
            </div>

            {filteredHistories.length > 0 ? (
              <ul className="history-list">
                {filteredHistories.map((h) => (
                  <li key={h.id} className="history-item">
                    <div className="history-head">
                      <span className="category-tag">{h.category}</span>
                      <div className="head-right">
                        <span className={`status ${statusMap[h.status].className}`}>
                          {statusMap[h.status].label}
                        </span>
                        <span className="date">{h.date}</span>
                      </div>
                    </div>
                    <h3>{h.title}</h3>
                    <p>{h.preview}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="history-empty">
                <p>선택하신 조건에 해당하는 문의 내역이 존재하지 않습니다.</p>
              </div>
            )}

            <div className="new-inquiry-cta">
              <button type="button" onClick={() => handleTabChange("inquiry")}>＋ 새 문의 작성</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}