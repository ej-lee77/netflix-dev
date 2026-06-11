"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { db } from "@/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuthStore } from "@/store/useAuthStore";
import { earnedBadgePoints } from "@/data/badge";

function uid(): string | null {
  const u = useAuthStore.getState().user;
  return u?.userId ?? (u as { uid?: string } | null)?.uid ?? null;
}

// 사용(차감) 포인트 누적값만 Firestore에 저장. 적립 포인트는 뱃지에서 산출.
interface PointState {
  usedPoints: number;
  usedLoaded: boolean;
  loadUsed: () => Promise<void>;
  bumpUsed: (delta: number) => void; // 교환 직후 로컬 갱신
}

export const usePointStore = create<PointState>((set, get) => ({
  usedPoints: 0,
  usedLoaded: false,
  loadUsed: async () => {
    const id = uid();
    if (!id) {
      set({ usedPoints: 0, usedLoaded: true });
      return;
    }
    try {
      const snap = await getDoc(doc(db, "users", id));
      const used = snap.exists() ? Number(snap.data().pointsUsed ?? 0) : 0;
      set({ usedPoints: Number.isFinite(used) ? used : 0, usedLoaded: true });
    } catch (e) {
      console.error("[point] 사용 포인트 불러오기 실패:", e);
      set({ usedPoints: 0, usedLoaded: true });
    }
  },
  bumpUsed: (delta) => set({ usedPoints: Math.max(0, get().usedPoints + delta) }),
}));

// 적립(뱃지) − 사용 = 보유 포인트. 컴포넌트에서 이 훅으로 일관 계산.
export function useAvailablePoints() {
  const currentProfile = useAuthStore((s) => s.currentProfile);
  const { usedPoints, usedLoaded, loadUsed } = usePointStore();

  useEffect(() => {
    if (!usedLoaded) loadUsed();
  }, [usedLoaded, loadUsed]);

  const earned = earnedBadgePoints(currentProfile?.badges?.earnedBadges);
  const available = Math.max(0, earned - usedPoints);
  return { earned, used: usedPoints, available, loaded: usedLoaded };
}
