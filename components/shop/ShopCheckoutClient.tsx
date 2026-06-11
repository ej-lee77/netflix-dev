"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { useGoodsStore } from "@/store/useGoodsStore";
import { useAvailablePoints } from "@/store/usePointStore";
import { pts, won } from "@/data/goods";
import { showToast } from "@/store/useToastStore";
import type { PayInfo } from "@/types/auth";
import type { ShippingInfo as Ship } from "@/types/goods";
import ShopTopBar from "./ShopTopBar";
import "./scss/shop.scss";

// 멤버십 결제 페이지(app/payment)의 결제수단 라벨 로직 재사용
function payLabelOf(payInfo: PayInfo | null): string {
  if (!payInfo?.pay) return "등록된 결제 수단 없음";
  if (payInfo.pay === "card") return `카드 ****-${payInfo.num}`;
  if (payInfo.pay === "kakao") return "카카오페이";
  if (payInfo.pay === "naver") return "네이버페이";
  if (payInfo.pay === "transfer") return `계좌이체 (${payInfo.bank})`;
  if (payInfo.pay === "phone") return `휴대폰 결제 (${payInfo.bank})`;
  return "-";
}

export default function ShopCheckoutClient() {
  const router = useRouter();
  const { user, currentProfile } = useAuthStore();
  const { products, cart, cartLoaded, loadProducts, loadCart, createOrder } = useGoodsStore();
  const { available } = useAvailablePoints();

  const [payInfo, setPayInfo] = useState<PayInfo | null>(null);
  const [payLoaded, setPayLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Ship>({
    name: "",
    phone: "",
    zipcode: "",
    address: "",
    addressDetail: "",
    memo: "",
  });

  useEffect(() => {
    loadProducts();
    if (!cartLoaded) loadCart();
  }, [loadProducts, loadCart, cartLoaded]);

  // 가입 시 등록한 결제 수단 재사용 (배송비 결제에 사용)
  useEffect(() => {
    const uid = user?.userId ?? auth.currentUser?.uid;
    if (!uid) {
      setPayLoaded(true);
      return;
    }
    getDoc(doc(db, "users", uid))
      .then((snap) => {
        if (snap.exists()) setPayInfo((snap.data().payment as PayInfo) ?? null);
      })
      .finally(() => setPayLoaded(true));
  }, [user?.userId]);

  useEffect(() => {
    if (currentProfile?.nickname)
      setForm((f) => (f.name ? f : { ...f, name: currentProfile.nickname }));
  }, [currentProfile?.nickname]);

  const lines = useMemo(
    () =>
      cart
        .map((c) => ({ item: c, product: products.find((p) => p.id === c.productId) }))
        .filter((l) => l.product),
    [cart, products],
  );
  const pointsTotal = lines.reduce((s, l) => s + l.product!.points * l.item.qty, 0);
  const shippingTotal = lines.reduce((s, l) => s + l.product!.shippingFee, 0);
  const remaining = available - pointsTotal;
  const enough = remaining >= 0;

  const set = (k: keyof Ship) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const hasPay = !!payInfo?.pay;
  const payLabel = payLabelOf(payInfo);

  const handlePay = async () => {
    if (busy) return;
    if (lines.length === 0) {
      showToast("교환할 상품이 없어요");
      return;
    }
    if (!enough) {
      showToast("보유 포인트가 부족해요");
      return;
    }
    if (!form.name.trim() || !form.phone.trim() || !form.zipcode.trim() || !form.address.trim()) {
      showToast("배송 정보를 모두 입력해 주세요");
      return;
    }
    if (!hasPay) {
      showToast("배송비 결제 수단을 먼저 등록해 주세요");
      router.push("/payment");
      return;
    }
    setBusy(true);
    const res = await createOrder(form, payLabel);
    setBusy(false);
    if (!res || !res.ok) {
      showToast(res && res.reason === "insufficient" ? "보유 포인트가 부족해요" : "교환에 실패했어요");
      return;
    }
    router.push(`/shop/complete?order=${res.orderId}&used=${res.pointsUsed}&ship=${res.shippingFee}`);
  };

  if (!cartLoaded || !payLoaded) {
    return (
      <div className="shop-page">
        <div className="shop-shell">
          <ShopTopBar title="교환/결제" />
          <div className="shop-loading">불러오는 중…</div>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="shop-page">
        <div className="shop-shell">
          <ShopTopBar title="교환/결제" />
          <div className="shop-empty">
            <div className="shop-empty__emoji">🛒</div>
            <div className="shop-empty__msg">교환할 상품이 없어요.</div>
            <button className="shop-btn shop-btn--primary" onClick={() => router.push("/shop")}>
              굿즈 보러 가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-page">
      <div className="shop-shell">
        <ShopTopBar title="교환/결제" />

        <div className="shop-layout">
          <div>
            {/* 배송지 */}
            <section className="checkout-section">
              <h3 className="checkout-section__title">배송지</h3>
              <div className="checkout-field">
                <label>받는 분</label>
                <input value={form.name} onChange={set("name")} placeholder="이름" />
              </div>
              <div className="checkout-field">
                <label>연락처</label>
                <input value={form.phone} onChange={set("phone")} placeholder="010-0000-0000" />
              </div>
              <div className="checkout-field">
                <label>우편번호</label>
                <input value={form.zipcode} onChange={set("zipcode")} placeholder="우편번호" />
              </div>
              <div className="checkout-field">
                <label>주소</label>
                <input value={form.address} onChange={set("address")} placeholder="기본 주소" />
              </div>
              <div className="checkout-field">
                <label>상세주소</label>
                <input value={form.addressDetail} onChange={set("addressDetail")} placeholder="상세 주소 (선택)" />
              </div>
              <div className="checkout-field">
                <label>배송 메모</label>
                <textarea rows={2} value={form.memo} onChange={set("memo")} placeholder="요청사항 (선택)" />
              </div>
            </section>

            {/* 포인트 차감 */}
            <section className="checkout-section">
              <h3 className="checkout-section__title">포인트 차감</h3>
              <div className="shop-sum-row">
                <span>보유 포인트</span>
                <span>{pts(available)}</span>
              </div>
              <div className="shop-sum-row" style={{ color: "#ffcf3f" }}>
                <span>사용 포인트 (굿즈 교환)</span>
                <span>-{pts(pointsTotal)}</span>
              </div>
              <div className="shop-sum-row">
                <span>교환 후 잔액</span>
                <span className={enough ? "" : "point-short"}>{pts(Math.max(0, remaining))}</span>
              </div>
            </section>

            {/* 배송비 결제 수단 (멤버십 결제수단 재사용) */}
            <section className="checkout-section">
              <h3 className="checkout-section__title">배송비 결제 수단</h3>
              {hasPay ? (
                <div className="checkout-pay">
                  <span className="checkout-pay__icon">💳</span>
                  <span>{payLabel}</span>
                </div>
              ) : (
                <>
                  <p style={{ color: "#9a9a9a", fontSize: 13, marginBottom: 12 }}>
                    등록된 결제 수단이 없어요. 멤버십 결제 수단을 등록하면 배송비 결제에 그대로 사용돼요.
                  </p>
                  <button className="shop-btn shop-btn--ghost" onClick={() => router.push("/payment")}>
                    결제 수단 등록하기
                  </button>
                </>
              )}
              <p className="point-hint">굿즈값은 포인트로 충당되고, 실제 결제는 배송비만 진행돼요.</p>
            </section>

            {/* 교환 상품 */}
            <section className="checkout-section">
              <h3 className="checkout-section__title">교환 상품 ({lines.length})</h3>
              {lines.map(({ item, product }) => (
                <div className="shop-sum-row" key={`${item.productId}-${item.option ?? ""}`}>
                  <span>
                    {product!.name}
                    {item.option ? ` · ${item.option}` : ""} × {item.qty}
                  </span>
                  <span>{pts(product!.points * item.qty)}</span>
                </div>
              ))}
            </section>
          </div>

          <aside className="shop-summary">
            <h3 className="shop-summary__title">결제 요약</h3>
            <div className="shop-sum-row">
              <span>굿즈 (포인트 교환)</span>
              <span>{pts(pointsTotal)}</span>
            </div>
            <div className="shop-sum-row">
              <span>배송비</span>
              <span>{won(shippingTotal)}</span>
            </div>
            <div className="shop-sum-total">
              <span>실제 결제금액</span>
              <b>{won(shippingTotal)}</b>
            </div>
            <button
              className="shop-btn shop-btn--primary shop-btn--block"
              onClick={handlePay}
              disabled={busy || !enough}
            >
              {busy ? "처리 중…" : !enough ? "포인트가 부족해요" : `배송비 ${won(shippingTotal)} 결제하고 교환`}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
