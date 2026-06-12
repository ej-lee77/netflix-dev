"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { db } from "@/firebase/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useAuthStore } from "@/store/useAuthStore";
import { earnedBadgePoints } from "@/data/badge";

function uid(): string | null {
  const u = useAuthStore.getState().user;
  return u?.userId ?? (u as { uid?: string } | null)?.uid ?? null;
}

interface PointState {
  usedPoints: number;
  usedLoaded: boolean;
  gamePoints: number;       // 게임으로 적립한 누적 포인트 (Firestore: gamePoints)
  gamePointsLoaded: boolean;
  loadUsed: () => Promise<void>;
  bumpUsed: (delta: number) => void;
  addGamePoints: (delta: number) => Promise<void>;
}

export const usePointStore = create<PointState>((set, get) => ({
  usedPoints: 0,
  usedLoaded: false,
  gamePoints: 0,
  gamePointsLoaded: false,

  loadUsed: async () => {
    const id = uid();
    if (!id) {
      set({ usedPoints: 0, usedLoaded: true, gamePoints: 0, gamePointsLoaded: true });
      return;
    }
    try {
      const snap = await getDoc(doc(db, "users", id));
      const used = snap.exists() ? Number(snap.data().pointsUsed ?? 0) : 0;
      const game = snap.exists() ? Number(snap.data().gamePoints ?? 0) : 0;
      set({
        usedPoints: Number.isFinite(used) ? used : 0,
        usedLoaded: true,
        gamePoints: Number.isFinite(game) ? game : 0,
        gamePointsLoaded: true,
      });
    } catch (e) {
      console.error("[point] 포인트 불러오기 실패:", e);
      set({ usedPoints: 0, usedLoaded: true, gamePoints: 0, gamePointsLoaded: true });
    }
  },

  bumpUsed: (delta) => set({ usedPoints: Math.max(0, get().usedPoints + delta) }),

  addGamePoints: async (delta) => {
    if (delta <= 0) return;
    const id = uid();
    const next = get().gamePoints + delta;
    set({ gamePoints: next });
    if (!id) return;
    try {
      const ref = doc(db, "users", id);
      await updateDoc(ref, { gamePoints: next }).catch(async () => {
        await setDoc(ref, { gamePoints: next }, { merge: true });
      });
    } catch (e) {
      console.error("[point] 게임 포인트 저장 실패:", e);
    }
  },
}));

// 적립(뱃지 + 게임) − 사용 = 보유 포인트
export function useAvailablePoints() {
  const currentProfile = useAuthStore((s) => s.currentProfile);
  const { usedPoints, usedLoaded, gamePoints, loadUsed } = usePointStore();

  useEffect(() => {
    if (!usedLoaded) loadUsed();
  }, [usedLoaded, loadUsed]);

  const badgeEarned = earnedBadgePoints(currentProfile?.badges?.earnedBadges);
  const earned = badgeEarned + gamePoints;
  const available = Math.max(0, earned - usedPoints);
  return { earned, used: usedPoints, available, loaded: usedLoaded };
}
