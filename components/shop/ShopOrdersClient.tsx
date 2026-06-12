"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGoodsStore } from "@/store/useGoodsStore";
import { categoryMeta, pts, won } from "@/data/goods";
import { showToast } from "@/store/useToastStore";
import ShopTopBar from "./ShopTopBar";
import CategoryIcon from "./CategoryIcon";
import "./scss/shop.scss";

function OrderThumb({ thumbUrl, gradient, iconKey }: { thumbUrl?: string; gradient: string; iconKey: string }) {
  const [imgError, setImgError] = useState(false);
  const showImg = !!thumbUrl && !imgError;
  return (
    <div className="order-item__thumb" style={showImg ? undefined : { background: gradient }}>
      {showImg ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={thumbUrl} alt="" className="goods-card__img" onError={() => setImgError(true)} />
      ) : (
        <CategoryIcon name={iconKey} size={28} />
      )}
    </div>
  );
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function ShopOrdersClient() {
  const router = useRouter();
  const { orders, ordersLoaded, loadOrders, products, loadProducts } = useGoodsStore();

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, [loadOrders, loadProducts]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="shop-page">
      <div className="shop-shell">
        <ShopTopBar title="교환내역" />

        {!ordersLoaded ? (
          <div className="shop-loading">불러오는 중…</div>
        ) : orders.length === 0 ? (
          <div className="shop-empty">
            <div className="shop-empty__emoji">📦</div>
            <div className="shop-empty__msg">아직 교환 내역이 없어요.</div>
            <button className="shop-btn shop-btn--primary" onClick={() => router.push("/shop")}>
              굿즈 보러 가기
            </button>
          </div>
        ) : (
          orders.map((o) => {
            const canceled = o.orderStatus === "canceled";
            const stages = canceled ? CANCEL_STAGES : ORDER_STAGES;
            const startTs = canceled ? o.canceledAt ?? o.createdAt : o.createdAt;
            const activeIdx = stageIndex(startTs, now);
            const canCancel = !canceled && activeIdx < 2; // 배송완료 전까지만 취소 가능
            const rightLabel = canceled ? "주문취소" : o.payStatus;

              {o.items.map((it, i) => {
                const meta = categoryMeta(it.category);
                const thumbUrl = it.thumbUrl ?? products.find((p) => p.id === it.productId)?.thumbUrl;
                return (
                  <div className="order-item" key={`${it.productId}-${it.option ?? ""}-${i}`}>
                    <OrderThumb thumbUrl={thumbUrl} gradient={meta.gradient} iconKey={meta.iconKey} />
                    <div className="order-item__info">
                      <div className="order-item__name">{it.name}</div>
                      <div className="order-item__meta">
                        {it.option ? `${it.option} · ` : ""}수량 {it.qty}개
                      </div>
                      <div className="order-item__info">
                        <div className="order-item__name">{it.name}</div>
                        <div className="order-item__meta">
                          {it.option ? `${it.option} · ` : ""}수량 {it.qty}개
                        </div>
                      </div>
                      <div className="order-item__price">{pts(it.points * it.qty)}</div>
                    </div>
                  );
                })}

                <div className="order-card__total">
                  <span>{pts(o.pointsUsed)} 사용 · 배송비 결제</span>
                  <b>{won(o.shippingFee)}</b>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}