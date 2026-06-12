"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGoodsStore } from "@/store/useGoodsStore";
import { categoryMeta, pts, won } from "@/data/goods";
import { showToast } from "@/store/useToastStore";
import ShopTopBar from "./ShopTopBar";
import CategoryIcon from "./CategoryIcon";
import ShopIcon from "./ShopIcon";
import "./scss/shop.scss";

// 왼쪽 3단계 스테퍼 라벨 — 결제완료(정상) 흐름과 주문취소 흐름
const ORDER_STAGES = ["주문완료", "주문배송", "배송완료"];
const CANCEL_STAGES = ["취소신청", "환불배송", "취소완료"];

// ▼ 시연 속도 조절: 각 단계로 넘어가는 시간(ms).
//   빠른 시연(기본): [0, 10_000, 20_000]  (10초 → 주문배송, 20초 → 배송완료)
//   실제감(1·2분):   [0, 60_000, 120_000]
const STEP_MS = [0, 10_000, 20_000];

// 시작 시각으로부터 경과 시간으로 현재 단계(0~2)를 계산
function stageIndex(startTs: number, now: number) {
  const t = now - startTs;
  if (t >= STEP_MS[2]) return 2;
  if (t >= STEP_MS[1]) return 1;
  return 0;
}

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
  const { orders, ordersLoaded, loadOrders, cancelOrder, products } = useGoodsStore();

  // 새로고침 없이 단계가 자동으로 넘어가도록 주기적으로 현재 시각을 갱신
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

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
            <div className="shop-empty__emoji"><ShopIcon name="box" size={48} /></div>
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

            const handleCancel = async () => {
              const ok = await cancelOrder(o.orderId);
              showToast(ok ? "주문이 취소되었어요" : "주문 취소에 실패했어요");
            };

            return (
              <div className="order-card" key={o.orderId}>
                <div className="order-card__head">
                  <span className="order-card__date">{formatDate(o.createdAt)}</span>
                  <span className={`order-card__status${canceled ? " is-canceled" : ""}`}>
                    {rightLabel}
                  </span>
                </div>

                {/* 왼쪽 3단계 스테퍼 — 결제완료: 주문완료·주문배송·배송완료 / 주문취소: 취소신청·환불배송·취소완료 */}
                <div className={`order-steps${canceled ? " is-cancel-flow" : ""}`}>
                  {stages.map((label, i) => (
                    <span
                      key={label}
                      className={`order-step${i <= activeIdx ? " is-done" : ""}${i === activeIdx ? " is-current" : ""}`}
                    >
                      {label}
                    </span>
                  ))}
                  {canCancel && (
                    <button type="button" className="order-cancel-btn" onClick={handleCancel}>
                      주문 취소
                    </button>
                  )}
                </div>

                {o.items.map((it, i) => {
                  const meta = categoryMeta(it.category);
                   const thumbUrl = it.thumbUrl ?? products.find((p) => p.id === it.productId)?.thumbUrl;
                  return (
                    <div className="order-item" key={`${it.productId}-${it.option ?? ""}-${i}`}>
                      <OrderThumb thumbUrl={thumbUrl} gradient={meta.gradient} iconKey={meta.iconKey} />
                      {/* <div className="order-item__thumb" style={{ background: meta.gradient }}>
                        <CategoryIcon name={meta.iconKey} size={28} />
                      </div> */}
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
