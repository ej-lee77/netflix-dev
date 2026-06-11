"use client";

import { useRouter } from "next/navigation";
import type { GoodsProduct } from "@/types/goods";
import { categoryMeta, pts, won } from "@/data/goods";

export default function GoodsCard({
  product,
  affordable,
}: {
  product: GoodsProduct;
  affordable: boolean;
}) {
  const router = useRouter();
  const meta = categoryMeta(product.category);
  const soldOut = product.stock <= 0;

  return (
    <button
      type="button"
      className="goods-card"
      onClick={() => router.push(`/shop/${product.id}`)}
    >
      <div className="goods-card__thumb" style={{ background: meta.gradient }}>
        <span aria-hidden>{meta.emoji}</span>
        {product.badge && (
          <span className={`goods-card__badge goods-card__badge--${product.badge}`}>
            {product.badge}
          </span>
        )}
        {soldOut && <span className="goods-card__sold">품절</span>}
        {!soldOut && affordable && <span className="goods-card__ok">교환 가능</span>}
      </div>
      <div className="goods-card__body">
        <div className="goods-card__cat">{meta.label}</div>
        <div className="goods-card__name">{product.name}</div>
        <div className="goods-card__points">{pts(product.points)}</div>
        <div className="goods-card__ship">배송비 {won(product.shippingFee)}</div>
      </div>
    </button>
  );
}
