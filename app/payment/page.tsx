// "use client";
// import React, { useState } from "react";
// import Link from "next/link";
// import "../scss/payment.scss";

// type Step = 1 | 2 | 3 | 4;
// type Plan = "basic" | "standard" | "premium";
// type Billing = "monthly" | "yearly";
// type Method = "card" | "easypay" | "bank" | "phone";

// const plans = {
//   basic: { name: "베이직", monthly: 7000, yearly: 55000, features: "광고 포함 · HD 720p · 1대 동시 시청" },
//   standard: {
//     name: "스탠다드",
//     monthly: 13500,
//     yearly: 129600,
//     features: "광고 없음 · FHD 1080p · 2대 동시 시청 · 다운로드 가능",
//     recommended: true,
//   },
//   premium: {
//     name: "프리미엄",
//     monthly: 17000,
//     yearly: 163200,
//     features: "광고 없음 · UHD 4K + HDR · 4대 동시 시청",
//   },
// };

// const coupons = [
//   { id: 1, type: "percent" as const, amount: 20, name: "신규 가입 환영 쿠폰", expire: "2026.06.30 까지", max: "최대 30,000원 할인" },
//   { id: 2, type: "amount" as const, amount: 5000, name: "프리미엄 업그레이드 쿠폰", expire: "2026.07.15 까지", max: "프리미엄 플랜 전용" },
//   { id: 3, type: "percent" as const, amount: 10, name: "친구 추천 쿠폰", expire: "사용 불가", max: "최소 결제금액 미달", disabled: true },
// ];

// export default function PaymentPage() {
//   const [step, setStep] = useState<Step>(1);
//   const [billing, setBilling] = useState<Billing>("yearly");
//   const [plan, setPlan] = useState<Plan>("standard");
//   const [method, setMethod] = useState<Method>("card");
//   const [selectedCoupon, setSelectedCoupon] = useState<number | null>(1);
//   const [points, setPoints] = useState(0);

//   const planInfo = plans[plan];
//   const basePrice = billing === "yearly" ? planInfo.yearly : planInfo.monthly;
//   const yearlySaving = billing === "yearly" ? planInfo.monthly * 12 - planInfo.yearly : 0;

//   const couponDiscount = (() => {
//     if (!selectedCoupon) return 0;
//     const c = coupons.find((co) => co.id === selectedCoupon);
//     if (!c || c.disabled) return 0;
//     if (c.type === "percent") {
//       const calc = Math.floor((basePrice * c.amount) / 100);
//       return Math.min(calc, 30000);
//     }
//     return c.amount;
//   })();

//   const finalPrice = basePrice - couponDiscount - points;
//   const earnedPoints = Math.floor(finalPrice * 0.05);

//   const goNext = () => {
//     if (step < 4) setStep((step + 1) as Step);
//   };
//   const goPrev = () => {
//     if (step > 1) setStep((step - 1) as Step);
//   };

//   return (
//     <div className="payment-page">
//       <div className="inner">
//         {/* Steps Indicator */}
//         <div className="steps-indicator">
//           {[1, 2, 3, 4].map((s) => {
//             const isDone = step > s;
//             const isActive = step === s;
//             const labels = ["플랜 선택", "결제 수단", "할인/쿠폰", "결제 완료"];
//             return (
//               <React.Fragment key={s}>
//                 <div className={`step ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
//                   <span className="num">{isDone ? "✓" : s}</span>
//                   <span className="label">{labels[s - 1]}</span>
//                 </div>
//                 {s < 4 && <div className={`step-divider ${isDone ? "done" : ""}`}></div>}
//               </React.Fragment>
//             );
//           })}
//         </div>

//         {/* Step 1: 플랜 선택 */}
//         {step === 1 && (
//           <div className="step-content step-1">
//             <div className="main-col">
//               <h2 className="section-h">플랜 선택</h2>

//               <div className="billing-toggle">
//                 <button
//                   className={billing === "monthly" ? "active" : ""}
//                   onClick={() => setBilling("monthly")}
//                 >
//                   월간 결제
//                 </button>
//                 <button
//                   className={billing === "yearly" ? "active" : ""}
//                   onClick={() => setBilling("yearly")}
//                 >
//                   연간 결제 <span className="save">최대 20% 절약</span>
//                 </button>
//               </div>

//               <div className="plan-list">
//                 {(Object.keys(plans) as Plan[]).map((key) => {
//                   const p = plans[key];
//                   const price = billing === "yearly" ? p.yearly : p.monthly;
//                   const monthlyEq = billing === "yearly" ? Math.floor(p.yearly / 12) : p.monthly;
//                   return (
//                     <label
//                       key={key}
//                       className={`plan-option ${plan === key ? "selected" : ""}`}
//                     >
//                       <input
//                         type="radio"
//                         name="plan"
//                         checked={plan === key}
//                         onChange={() => setPlan(key)}
//                       />
//                       <span className="radio"></span>
//                       <div className="plan-info">
//                         <div className="head">
//                           <h3>
//                             {p.name}
//                             {("recommended" in p && p.recommended) && <span className="badge">추천</span>}
//                           </h3>
//                           <div className="price">
//                             {billing === "yearly" ? monthlyEq.toLocaleString() : price.toLocaleString()}
//                             <span className="unit">원/월</span>
//                           </div>
//                         </div>
//                         <p className="features">{p.features}</p>
//                       </div>
//                     </label>
//                   );
//                 })}
//               </div>

//               <div className="notice-block">
//                 <h4>첫 달 무료 체험</h4>
//                 <p>신규 가입자는 첫 달 무료로 이용 가능합니다. 체험 기간 종료 7일 전에 안내 메일을 보내드려요.</p>
//               </div>
//             </div>

//             <aside className="summary">
//               <h3>주문 요약</h3>
//               <div className="summary-row">
//                 <span>플랜</span>
//                 <strong>
//                   {planInfo.name} ({billing === "yearly" ? "연간" : "월간"})
//                 </strong>
//               </div>
//               <div className="summary-row">
//                 <span>결제 주기</span>
//                 <strong>{billing === "yearly" ? "매년 1회" : "매월 1회"}</strong>
//               </div>
//               {billing === "yearly" && (
//                 <div className="summary-row discount">
//                   <span>연간 할인 -20%</span>
//                   <strong>-{yearlySaving.toLocaleString()}원</strong>
//                 </div>
//               )}
//               <div className="summary-total">
//                 <span>최종 결제 금액</span>
//                 <strong>
//                   {basePrice.toLocaleString()}
//                   <span className="unit">원</span>
//                 </strong>
//               </div>
//               <p className="summary-note">첫 달 무료 체험 후 자동 결제됩니다. 언제든 해지 가능해요.</p>
//               <button className="btn-primary" onClick={goNext}>
//                 다음 단계로 →
//               </button>
//             </aside>
//           </div>
//         )}

//         {/* Step 2: 결제 수단 */}
//         {step === 2 && (
//           <div className="step-content step-2">
//             <div className="main-col">
//               <h2 className="section-h">결제 수단</h2>

//               <div className="method-tabs">
//                 <button className={method === "card" ? "active" : ""} onClick={() => setMethod("card")}>
//                   신용/체크카드
//                 </button>
//                 <button
//                   className={method === "easypay" ? "active" : ""}
//                   onClick={() => setMethod("easypay")}
//                 >
//                   간편결제
//                 </button>
//                 <button className={method === "bank" ? "active" : ""} onClick={() => setMethod("bank")}>
//                   계좌이체
//                 </button>
//                 <button className={method === "phone" ? "active" : ""} onClick={() => setMethod("phone")}>
//                   휴대폰 결제
//                 </button>
//               </div>

//               {method === "card" && (
//                 <>
//                   <div className="form-field">
//                     <label>카드 번호</label>
//                     <input type="text" placeholder="0000 0000 0000 0000" />
//                   </div>
//                   <div className="form-row">
//                     <div className="form-field">
//                       <label>유효 기간 (MM/YY)</label>
//                       <input type="text" placeholder="MM/YY" />
//                     </div>
//                     <div className="form-field">
//                       <label>CVC</label>
//                       <input type="text" placeholder="3자리" />
//                     </div>
//                   </div>
//                   <div className="form-row">
//                     <div className="form-field">
//                       <label>생년월일 (YYMMDD)</label>
//                       <input type="text" placeholder="000000" />
//                     </div>
//                     <div className="form-field">
//                       <label>비밀번호 앞 2자리</label>
//                       <input type="password" placeholder="••" maxLength={2} />
//                     </div>
//                   </div>

//                   <label className="form-check checked">
//                     <input type="checkbox" defaultChecked />
//                     <span className="box"></span>이 카드로 매월 자동 결제에 동의합니다 (필수)
//                   </label>
//                   <label className="form-check checked">
//                     <input type="checkbox" defaultChecked />
//                     <span className="box"></span>카드 정보 안전하게 저장
//                   </label>
//                 </>
//               )}

//               {method === "easypay" && (
//                 <div className="easypay-grid">
//                   <button className="easypay-card selected">카카오페이</button>
//                   <button className="easypay-card">네이버페이</button>
//                   <button className="easypay-card">토스</button>
//                   <button className="easypay-card">페이코</button>
//                 </div>
//               )}

//               {method === "bank" && (
//                 <div className="bank-info">
//                   <p>실시간 계좌이체로 결제할 은행을 선택해주세요.</p>
//                   <div className="bank-grid">
//                     {["국민", "신한", "우리", "하나", "농협", "기업", "카카오뱅크", "토스뱅크"].map((b) => (
//                       <button key={b} className="bank-btn">{b}</button>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {method === "phone" && (
//                 <>
//                   <div className="form-field">
//                     <label>휴대폰 번호</label>
//                     <input type="text" placeholder="010-0000-0000" />
//                   </div>
//                   <p className="hint">통신요금에 합산 청구됩니다.</p>
//                 </>
//               )}
//             </div>

//             <aside className="summary">
//               <h3>주문 요약</h3>
//               <div className="summary-row">
//                 <span>플랜</span>
//                 <strong>{planInfo.name} ({billing === "yearly" ? "연간" : "월간"})</strong>
//               </div>
//               {billing === "yearly" && (
//                 <div className="summary-row discount">
//                   <span>연간 할인</span>
//                   <strong>-{yearlySaving.toLocaleString()}원</strong>
//                 </div>
//               )}
//               <div className="summary-total">
//                 <span>결제 금액</span>
//                 <strong>
//                   {basePrice.toLocaleString()}
//                   <span className="unit">원</span>
//                 </strong>
//               </div>
//               <p className="summary-note">결제 후 즉시 모든 기능을 이용할 수 있어요.</p>
//               <button className="btn-primary" onClick={goNext}>
//                 다음 단계 →
//               </button>
//               <button className="btn-outline" onClick={goPrev}>
//                 ← 이전으로
//               </button>
//             </aside>
//           </div>
//         )}

//         {/* Step 3: 할인/쿠폰 */}
//         {step === 3 && (
//           <div className="step-content step-3">
//             <div className="main-col">
//               <h2 className="section-h">할인 및 쿠폰</h2>

//               <div className="form-field">
//                 <label>쿠폰 코드 입력</label>
//                 <div className="input-with-btn">
//                   <input type="text" placeholder="WELCOME2026" />
//                   <button className="btn-secondary">적용하기</button>
//                 </div>
//               </div>

//               <h4 className="sub-h">보유 쿠폰 ({coupons.length}장)</h4>
//               <ul className="coupon-list">
//                 {coupons.map((c) => (
//                   <li
//                     key={c.id}
//                     className={`coupon-card ${selectedCoupon === c.id ? "selected" : ""} ${c.disabled ? "disabled" : ""
//                       }`}
//                     onClick={() => !c.disabled && setSelectedCoupon(c.id)}
//                   >
//                     <div className="coupon-amount">
//                       <div className="num">
//                         {c.type === "percent" ? `${c.amount}%` : `${c.amount.toLocaleString()}원`}
//                       </div>
//                       <div className="label">할인</div>
//                     </div>
//                     <div className="coupon-info">
//                       <h4>{c.name}</h4>
//                       <p>{c.max} · {c.expire}</p>
//                     </div>
//                     <span className="radio"></span>
//                   </li>
//                 ))}
//               </ul>

//               <div className="points-block">
//                 <div className="points-head">
//                   <span>
//                     보유 포인트 <strong>2,450 P</strong>
//                   </span>
//                   <button className="btn-text" onClick={() => setPoints(2450)}>
//                     전액 사용
//                   </button>
//                 </div>
//                 <div className="input-with-btn">
//                   <input
//                     type="number"
//                     value={points}
//                     onChange={(e) => setPoints(Math.min(2450, Number(e.target.value) || 0))}
//                   />
//                   <button className="btn-secondary">적용</button>
//                 </div>
//                 <p className="hint">100P 단위로 사용할 수 있어요. 결제 금액의 10%까지 사용 가능합니다.</p>
//               </div>
//             </div>

//             <aside className="summary">
//               <h3>주문 요약</h3>
//               <div className="summary-row">
//                 <span>플랜</span>
//                 <strong>{planInfo.name} ({billing === "yearly" ? "연간" : "월간"})</strong>
//               </div>
//               <div className="summary-row">
//                 <span>원래 가격</span>
//                 <strong>{basePrice.toLocaleString()}원</strong>
//               </div>
//               {couponDiscount > 0 && (
//                 <div className="summary-row discount">
//                   <span>쿠폰 할인</span>
//                   <strong>-{couponDiscount.toLocaleString()}원</strong>
//                 </div>
//               )}
//               {points > 0 && (
//                 <div className="summary-row discount">
//                   <span>포인트 사용</span>
//                   <strong>-{points.toLocaleString()}원</strong>
//                 </div>
//               )}
//               <div className="summary-total">
//                 <span>최종 금액</span>
//                 <strong>
//                   {finalPrice.toLocaleString()}
//                   <span className="unit">원</span>
//                 </strong>
//               </div>
//               <p className="summary-note">결제 금액의 5% 적립 예정 ({earnedPoints.toLocaleString()}P)</p>
//               <button className="btn-primary" onClick={goNext}>
//                 결제하기
//               </button>
//               <button className="btn-outline" onClick={goPrev}>
//                 ← 이전으로
//               </button>
//             </aside>
//           </div>
//         )}

//         {/* Step 4: 결제 완료 */}
//         {step === 4 && (
//           <div className="step-complete">
//             <div className="success-icon">✓</div>
//             <h2>결제가 완료되었어요!</h2>
//             <p className="complete-sub">이제 12,000편 이상의 콘텐츠를 무제한 시청하실 수 있어요</p>

//             <div className="receipt">
//               <div className="receipt-head">
//                 <span className="order-id">주문번호 ORD-{Date.now().toString().slice(-10)}</span>
//                 <span className="status-pill">결제 완료</span>
//               </div>
//               <div className="receipt-row">
//                 <span>플랜</span>
//                 <strong>
//                   {planInfo.name} ({billing === "yearly" ? "연간" : "월간"})
//                 </strong>
//               </div>
//               <div className="receipt-row">
//                 <span>결제 수단</span>
//                 <strong>{method === "card" ? "신한카드 ****-1234" : "간편결제"}</strong>
//               </div>
//               <div className="receipt-row">
//                 <span>결제 일시</span>
//                 <strong>{new Date().toLocaleString("ko-KR")}</strong>
//               </div>
//               <div className="receipt-row">
//                 <span>다음 결제일</span>
//                 <strong>
//                   {billing === "yearly"
//                     ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString("ko-KR")
//                     : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("ko-KR")}
//                 </strong>
//               </div>
//               <div className="receipt-row">
//                 <span>적립 예정</span>
//                 <strong>{earnedPoints.toLocaleString()} P</strong>
//               </div>
//               <div className="receipt-total">
//                 <span>결제 금액</span>
//                 <strong>{finalPrice.toLocaleString()}원</strong>
//               </div>
//             </div>

//             <div className="next-cards">
//               <Link href="/mypage" className="next-card">
//                 <div className="icon">👤</div>
//                 <h4>프로필 만들기</h4>
//                 <p>가족 구성원마다 맞춤 추천을 받으세요</p>
//               </Link>
//               <Link href="/" className="next-card">
//                 <div className="icon">📺</div>
//                 <h4>지금 시청 시작</h4>
//                 <p>다양한 작품을 만나보세요</p>
//               </Link>
//             </div>

//             <Link href="/" className="btn-primary big">
//               바로 시청 시작하기 →
//             </Link>
//             <button className="btn-outline">영수증 다운로드</button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
