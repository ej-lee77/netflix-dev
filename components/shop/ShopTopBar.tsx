"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useGoodsStore } from "@/store/useGoodsStore";
import { useAvailablePoints } from "@/store/usePointStore";
import { pts } from "@/data/goods";

export default function ShopTopBar({ title }: { title: string }) {
  const { cart, cartLoaded, loadCart } = useGoodsStore();
  const { available } = useAvailablePoints();

  useEffect(() => {
    if (!cartLoaded) loadCart();
  }, [cartLoaded, loadCart]);

  const count = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <div className="shop-topbar">
      <div className="shop-topbar__brand">
        <b>NETFLIX</b>
        <h2 className="shop-topbar__title">{title}</h2>
      </div>
      <div className="shop-topbar__actions">
        <span className="shop-point-chip" title="보유 포인트 (적립 − 사용)">
          {pts(available)}
        </span>
        <Link href="/shop/orders" className="shop-topbar__link">
          교환내역
        </Link>
        <Link href="/shop/cart" className="shop-topbar__link shop-cart-btn">
          장바구니
          {count > 0 && <span className="shop-cart-badge">{count}</span>}
        </Link>
      </div>
    </div>
  );
}
