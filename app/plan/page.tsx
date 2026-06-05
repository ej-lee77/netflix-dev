"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import StepPlan, { SelectedPlan } from "@/app/signin/components/StepPlan";
import StepPlanComplete from "./components/StepPlanComplete";
import "@/app/signin/signin.scss";

export default function PlanPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>({
    name: "스탠다드",
    billing: "monthly",
    monthlyPrice: 13500,
    annualTotal: 135000,
    annualDiscount: 27000,
  });
  const [planType, setPlanType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentBilling, setCurrentBilling] = useState<string>("");

  useEffect(() => {
    const uid = user?.uid ?? auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }

    getDoc(doc(db, "users", uid)).then((snap) => {
      setPlanType(snap.exists() ? (snap.data().planType ?? "") : "");
      setCurrentBilling(snap.exists() ? (snap.data().payment?.billing ?? "monthly") : "monthly");
    }).finally(() => setLoading(false));
  }, [user?.uid]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentStep]);

  // 로딩 중
  if (loading) return null;

  // 비로그인 or 비구독자
  const isLoggedIn = !!(user?.uid ?? auth.currentUser?.uid);
  if (!isLoggedIn || planType === "") {
    return (
      <div className="signin-page">
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

  return (
    <div className="signin-page">
      {/* 스텝 인디케이터 대신 타이틀 */}
      {/* <div className="signin-form-wrap" style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 className="signin-title">플랜 변경하기</h1>
        <p className="signin-subtitle">현재 플랜: {
          planType === "basic" ? "베이직" :
            planType === "standard" ? "스탠다드" :
              planType === "premium" ? "프리미엄" : planType
        }</p>
      </div> */}
      {/* <div className="signin-form-wrap" style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 className="signin-title">플랜 변경하기</h1>
      </div> */}

      {currentStep === 1 && (
        <StepPlan
          currentPlanType={planType ?? ""}
          currentBilling={currentBilling}
          submitLabel="변경하기"
          onNext={(plan) => {
            setSelectedPlan(plan);
            setCurrentStep(2);
          }}
        />
      )}
      {currentStep === 2 && (
        <StepPlanComplete
          plan={selectedPlan}
          onGoSettings={() => router.push("/settings")}
        />
      )}
    </div>
  );
}