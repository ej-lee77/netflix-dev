"use client";

import { useEffect, useMemo, useState } from "react";
import { useGoodsStore } from "@/store/useGoodsStore";
import { useAvailablePoints } from "@/store/usePointStore";
import { GOODS_CATEGORIES, pts } from "@/data/goods";
import type { GoodsCategory } from "@/types/goods";
import ShopTopBar from "./ShopTopBar";
import GoodsCard from "./GoodsCard";
import "./scss/shop.scss";

type SortKey = "recommend" | "pointLow" | "pointHigh";

export default function ShopListClient() {
  const { products, loadProducts } = useGoodsStore();
  const { available } = useAvailablePoints();
  const [cat, setCat] = useState<GoodsCategory | "all">("all");
  const [sort, setSort] = useState<SortKey>("recommend");

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const list = useMemo(() => {
    let arr = products;
    if (cat !== "all") arr = arr.filter((p) => p.category === cat);
    arr = [...arr];
    if (sort === "pointLow") arr.sort((a, b) => a.points - b.points);
    else if (sort === "pointHigh") arr.sort((a, b) => b.points - a.points);
    return arr;
  }, [products, cat, sort]);

  return (
    <div className="shop-page">
      <div className="shop-shell">
        <ShopTopBar title="굿즈샵" />

        <div className="shop-hero">
          <div className="shop-hero__eyebrow">POINT EXCHANGE</div>
          <h1 className="shop-hero__title">
            모은 포인트로<br />
            굿즈를 받아보세요
          </h1>
          <p className="shop-hero__sub">
            뱃지로 모은 포인트로 교환 · 배송비만 결제하면 끝 (보유 {pts(available)})
          </p>
        </div>

        <div className="shop-toolbar">
          <div className="shop-chips">
            <button
              className={`shop-chip${cat === "all" ? " active" : ""}`}
              onClick={() => setCat("all")}
            >
              전체
            </button>
            {GOODS_CATEGORIES.map((c) => (
              <button
                key={c.key}
                className={`shop-chip${cat === c.key ? " active" : ""}`}
                onClick={() => setCat(c.key)}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <select
            className="shop-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="recommend">추천순</option>
            <option value="pointLow">포인트 낮은순</option>
            <option value="pointHigh">포인트 높은순</option>
          </select>
        </div>

        {list.length === 0 ? (
          <div className="shop-loading">상품을 불러오는 중…</div>
        ) : (
          <div className="shop-grid">
            {list.map((p) => (
              <GoodsCard key={p.id} product={p} affordable={available >= p.points} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
