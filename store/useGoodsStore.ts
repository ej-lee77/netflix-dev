"use client";

import { create } from "zustand";
import { db } from "@/firebase/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useAuthStore } from "@/store/useAuthStore";
import { usePointStore } from "@/store/usePointStore";
import { fetchProductsSync } from "@/data/goods";
import { earnedBadgePoints } from "@/data/badge";
import type {
  GoodsProduct,
  CartItem,
  OrderItem,
  ShippingInfo,
  GoodsOrder,
} from "@/types/goods";

function uid(): string | null {
  const u = useAuthStore.getState().user;
  return u?.userId ?? (u as { uid?: string } | null)?.uid ?? null;
}

function sameLine(a: CartItem, productId: string, option?: string) {
  return a.productId === productId && (a.option ?? "") === (option ?? "");
}

export type CreateOrderResult =
  | { ok: true; orderId: string; pointsUsed: number; shippingFee: number }
  | { ok: false; reason: "insufficient" | "error" };

interface GoodsState {
  products: GoodsProduct[];
  cart: CartItem[];
  cartLoaded: boolean;
  orders: GoodsOrder[];
  ordersLoaded: boolean;

  loadProducts: () => void;
  getProduct: (id: string) => GoodsProduct | undefined;

  loadCart: () => Promise<void>;
  addToCart: (productId: string, qty: number, option?: string) => Promise<boolean>;
  updateQty: (productId: string, option: string | undefined, qty: number) => Promise<void>;
  removeFromCart: (productId: string, option?: string) => Promise<void>;
  clearCart: () => Promise<void>;

  createOrder: (shipping: ShippingInfo, payLabel: string) => Promise<CreateOrderResult | null>;
  loadOrders: () => Promise<void>;
}

async function persistCart(items: CartItem[]) {
  const id = uid();
  if (!id) return;
  try {
    await setDoc(doc(db, "goodsCarts", id), { items, updatedAt: Date.now() });
  } catch (e) {
    console.error("[goods] 장바구니 저장 실패:", e);
  }
}

export const useGoodsStore = create<GoodsState>((set, get) => ({
  products: [],
  cart: [],
  cartLoaded: false,
  orders: [],
  ordersLoaded: false,

  loadProducts: () => {
    if (get().products.length) return;
    set({ products: fetchProductsSync() });
  },

  getProduct: (id) => get().products.find((p) => p.id === id),

  loadCart: async () => {
    const id = uid();
    if (!id) {
      set({ cart: [], cartLoaded: true });
      return;
    }
    try {
      const snap = await getDoc(doc(db, "goodsCarts", id));
      const items = snap.exists() ? ((snap.data().items as CartItem[]) ?? []) : [];
      set({ cart: items, cartLoaded: true });
    } catch (e) {
      console.error("[goods] 장바구니 불러오기 실패:", e);
      set({ cart: [], cartLoaded: true });
    }
  },

  addToCart: async (productId, qty, option) => {
    if (!uid()) return false; // 로그인 필요
    const cart = [...get().cart];
    const idx = cart.findIndex((c) => sameLine(c, productId, option));
    if (idx >= 0) cart[idx] = { ...cart[idx], qty: cart[idx].qty + qty };
    else {
      // 옵션이 없는 상품은 option 필드를 아예 넣지 않는다.
      // (Firestore는 undefined 필드 값을 허용하지 않아 setDoc이 실패함)
      const line: CartItem = option ? { productId, qty, option } : { productId, qty };
      cart.push(line);
    }
    set({ cart });
    await persistCart(cart);
    return true;
  },

  updateQty: async (productId, option, qty) => {
    if (qty < 1) return;
    const cart = get().cart.map((c) =>
      sameLine(c, productId, option) ? { ...c, qty } : c,
    );
    set({ cart });
    await persistCart(cart);
  },

  removeFromCart: async (productId, option) => {
    const cart = get().cart.filter((c) => !sameLine(c, productId, option));
    set({ cart });
    await persistCart(cart);
  },

  clearCart: async () => {
    set({ cart: [] });
    await persistCart([]);
  },

  createOrder: async (shipping, payLabel) => {
    const id = uid();
    if (!id) return null;
    const { cart, products } = get();
    if (cart.length === 0) return null;

    const items: OrderItem[] = cart.map((c) => {
      const p = products.find((pp) => pp.id === c.productId);
      const item: OrderItem = {
        productId: c.productId,
        name: p?.name ?? "상품",
        points: p?.points ?? 0,
        qty: c.qty,
        category: p?.category ?? "lifestyle",
        shippingFee: p?.shippingFee ?? 0,
      };
      if (p?.thumbUrl) item.thumbUrl = p.thumbUrl;
      // 옵션이 있을 때만 필드 추가 (undefined 저장 방지)
      if (c.option) item.option = c.option;
      return item;
    });

    const pointsUsed = items.reduce((s, it) => s + it.points * it.qty, 0);
    const shippingFee = items.reduce((s, it) => s + it.shippingFee, 0); // 라인당 1회

    try {
      const userRef = doc(db, "users", id);
      const snap = await getDoc(userRef);
      const curUsed = snap.exists() ? Number(snap.data().pointsUsed ?? 0) : 0;

      // 적립(뱃지) − 사용 = 보유 포인트. 보유 < 필요 시 교환 불가.
      const earned = earnedBadgePoints(useAuthStore.getState().currentProfile?.badges?.earnedBadges);
      const available = earned - curUsed;
      if (pointsUsed > available) return { ok: false, reason: "insufficient" };

      const ref = await addDoc(collection(db, "goodsOrders"), {
        uid: id,
        items,
        pointsUsed,
        shippingFee,
        shipping,
        payLabel,
        payStatus: "결제완료",
        createdAt: Date.now(),
      });

      const newUsed = curUsed + pointsUsed;
      await updateDoc(userRef, { pointsUsed: newUsed }).catch(async () => {
        await setDoc(userRef, { pointsUsed: newUsed }, { merge: true });
      });
      usePointStore.getState().bumpUsed(pointsUsed);

      await get().clearCart();
      return { ok: true, orderId: ref.id, pointsUsed, shippingFee };
    } catch (e) {
      console.error("[goods] 주문 생성 실패:", e);
      return { ok: false, reason: "error" };
    }
  },

  loadOrders: async () => {
    const id = uid();
    if (!id) {
      set({ orders: [], ordersLoaded: true });
      return;
    }
    try {
      const snap = await getDocs(query(collection(db, "goodsOrders"), where("uid", "==", id)));
      const list = snap.docs
        .map((d) => ({ orderId: d.id, ...(d.data() as Omit<GoodsOrder, "orderId">) }))
        .sort((a, b) => b.createdAt - a.createdAt);
      set({ orders: list, ordersLoaded: true });
    } catch (e) {
      console.error("[goods] 주문내역 불러오기 실패:", e);
      set({ orders: [], ordersLoaded: true });
    }
  },
}));
