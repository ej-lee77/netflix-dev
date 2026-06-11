"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGoodsStore } from "@/store/useGoodsStore";
import { useAvailablePoints } from "@/store/usePointStore";
import { categoryMeta, pts, won } from "@/data/goods";
import { showToast } from "@/store/useToastStore";
import ShopTopBar from "./ShopTopBar";
import "./scss/shop.scss";

export default function ShopDetailClient({ productId }: { productId: string }) {
  const router = useRouter();
  const { products, loadProducts, getProduct, addToCart } = useGoodsStore();
  const { available } = useAvailablePoints();
  const [option, setOption] = useState<string | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const product = getProduct(productId);

  if (products.length === 0) {
    return (
      <div className="shop-page">
        <div className="shop-shell">
          <ShopTopBar title="굿즈샵" />
          <div className="shop-loading">불러오는 중…</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="shop-page">
        <div className="shop-shell">
          <ShopTopBar title="굿즈샵" />
          <div className="shop-empty">
            <div className="shop-empty__emoji">🔍</div>
            <div className="shop-empty__msg">상품을 찾을 수 없어요.</div>
            <button className="shop-btn shop-btn--ghost" onClick={() => router.push("/shop")}>
              굿즈샵으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  const meta = categoryMeta(product.category);
  const soldOut = product.stock <= 0;
  const needOption = !!(product.options && product.options.length > 0);
  const totalPoints = product.points * qty;
  const canAfford = available >= totalPoints;

  const ensureValid = () => {
    if (soldOut) {
      showToast("품절된 상품이에요");
      return false;
    }
    if (needOption && !option) {
      showToast(`${product.optionLabel ?? "옵션"}을 선택해 주세요`);
      return false;
    }
    return true;
  };

  const handleAdd = async (goCheckout: boolean) => {
    if (!ensureValid() || busy) return;
    setBusy(true);
    const ok = await addToCart(product.id, qty, option);
    setBusy(false);
    if (!ok) {
      showToast("로그인이 필요해요");
      router.push("/login");
      return;
    }
    if (goCheckout) router.push("/shop/checkout");
    else showToast("장바구니에 담았어요");
  };

  return (
    <div className="shop-page">
      <div className="shop-shell">
        <ShopTopBar title="굿즈샵" />

        <button
          className="shop-topbar__link"
          style={{ marginBottom: 18 }}
          onClick={() => router.push("/shop")}
        >
          ← 목록으로
        </button>

        <div className="shop-detail">
          <div className="shop-detail__thumb" style={{ background: meta.gradient }}>
            <span aria-hidden>{meta.emoji}</span>
          </div>

          <div className="shop-detail__info">
            <div className="shop-detail__cat">{meta.label}</div>
            <h2 className="shop-detail__name">{product.name}</h2>
            {product.themeTitle && <div className="shop-detail__theme">{product.themeTitle}</div>}
            <div className="shop-detail__price">{pts(product.points)}</div>
            <div className="shop-detail__ship">배송비 {won(product.shippingFee)} (실결제)</div>

            <p className="shop-detail__desc">{product.description}</p>

            {needOption && (
              <>
                <div className="shop-field-label">{product.optionLabel ?? "옵션"}</div>
                <div className="shop-opts">
                  {product.options!.map((op) => (
                    <button
                      key={op}
                      className={`shop-opt-btn${option === op ? " active" : ""}`}
                      onClick={() => setOption(op)}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="shop-field-label">수량</div>
            <div className="shop-qty">
              <button
                className="shop-qty__btn"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
              >
                −
              </button>
              <span className="shop-qty__val">{qty}</span>
              <button
                className="shop-qty__btn"
                onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
              >
                ＋
              </button>
            </div>

            <div className="shop-detail__total">
              <span>필요 포인트</span>
              <b>{pts(totalPoints)}</b>
            </div>
            <div className="shop-detail__balance">
              보유 {pts(available)}
              {!soldOut && (
                <span className={canAfford ? "ok" : "no"}>
                  {canAfford ? " · 교환 가능" : " · 포인트 부족"}
                </span>
              )}
            </div>

            <div className="shop-detail__actions">
              <button
                className="shop-btn shop-btn--ghost shop-btn--block"
                onClick={() => handleAdd(false)}
                disabled={soldOut || busy}
              >
                장바구니
              </button>
              <button
                className="shop-btn shop-btn--primary shop-btn--block"
                onClick={() => handleAdd(true)}
                disabled={soldOut || busy}
              >
                {soldOut ? "품절" : "바로 교환"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
