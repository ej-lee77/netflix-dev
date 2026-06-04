"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import StepPayment from "@/app/signin/components/StepPayment";
import type { PayInfo } from "@/types/auth";
import "@/app/signin/signin.scss";
import "./payment.scss";  // ← 추가

export default function PaymentPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [done, setDone] = useState(false);
  const [planType, setPlanType] = useState("");
  const [payInfo, setPayInfo] = useState<PayInfo | null>(null);

  useEffect(() => {
    const uid = user?.uid ?? auth.currentUser?.uid;
    if (!uid) return;
    getDoc(doc(db, "users", uid)).then((snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setPlanType(data.planType ?? "");
      setPayInfo(data.payment ?? null);
    });
  }, [user?.uid]);

  const planLabel = (() => {
    if (planType === "basic") return "베이직";
    if (planType === "standard") return "스탠다드";
    if (planType === "premium") return "프리미엄";
    return "-";
  })();

  const payLabel = (() => {
    if (!payInfo?.pay) return "등록된 결제 수단 없음";
    if (payInfo.pay === "card") return `카드 ****-${payInfo.num}`;
    if (payInfo.pay === "kakao") return "카카오페이";
    if (payInfo.pay === "naver") return "네이버페이";
    if (payInfo.pay === "transfer") return `계좌이체 (${payInfo.bank})`;
    if (payInfo.pay === "phone") return `휴대폰 결제 (${payInfo.bank})`;
    return "-";
  })();

  if (done) {
    return (
      <div className="signin-page">
        <div className="complete-page">
          <div className="complete-check-circle" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="complete-title">결제 수단이 변경되었어요!</h1>
          <p className="complete-sub">새로운 결제 수단으로 변경되었습니다</p>
          <button
            type="button"
            className="complete-home-btn"
            onClick={() => router.push("/settings?tab=membership")}
          >
            설정으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="signin-page">
      <div className="pay-change-page">
        <h1 className="pay-change-title">결제 수단 변경</h1>

        {/* 현재 구독 정보 요약 */}
        <div className="pay-change-summary">
          <div className="pay-change-summary-row">
            <span className="pay-change-summary-label">현재 플랜</span>
            <span className="pay-change-summary-value">{planLabel}</span>
          </div>
          <div className="pay-change-summary-row">
            <span className="pay-change-summary-label">현재 결제 수단</span>
            <span className="pay-change-summary-value">{payLabel}</span>
          </div>
          {payInfo?.nextDate && (
            <div className="pay-change-summary-row">
              <span className="pay-change-summary-label">다음 결제일</span>
              <span className="pay-change-summary-value">{payInfo.nextDate}</span>
            </div>
          )}
        </div>

        <StepPayment
          plan={{
            name: planLabel,
            billing: "monthly",
            monthlyPrice: 0,
            annualTotal: 0,
            annualDiscount: 0,
          }}
          hidePlanSummary
          currentPayInfo={payInfo}
          submitLabel="변경하기"
          onBack={() => router.push("/settings?tab=membership")}
          onComplete={() => setDone(true)}
        />
      </div>
    </div>
  );
}