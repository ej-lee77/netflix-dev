"use client";

import { create } from "zustand";
import { db } from "@/firebase/firebase";
import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
  query,
  orderBy,
  arrayUnion,
  type Unsubscribe,
} from "firebase/firestore";

export interface PartyDoc {
  partyId: string;
  hostId: string;
  hostNickname: string;
  type: "movie" | "tv";
  mediaId: number;
  title: string;
  isPlaying: boolean;
  positionPct: number; // 0~100 (호스트 진행 위치)
  updatedAt: number;
  participants: string[];
  createdAt: number;
}

export interface PartyMessage {
  id: string;
  userId: string;
  nickname: string;
  badge?: string;
  text: string;
  createdAt: number;
}

interface PartyUser {
  userId: string;
  nickname: string;
  badge?: string;
}

interface WatchPartyState {
  partyId: string | null;
  party: PartyDoc | null;
  messages: PartyMessage[];
  isHost: boolean;
  createParty: (args: {
    type: "movie" | "tv";
    mediaId: number;
    title: string;
    host: PartyUser;
  }) => Promise<string | null>;
  subscribe: (partyId: string) => void;
  join: (partyId: string, user: PartyUser) => Promise<void>;
  sendMessage: (text: string, user: PartyUser) => Promise<void>;
  updatePlayback: (data: { positionPct: number; isPlaying: boolean }) => Promise<void>;
  leave: () => void;
}

let unsubParty: Unsubscribe | null = null;
let unsubMessages: Unsubscribe | null = null;
let lastPlaybackPush = 0;

function randomCode() {
  return Math.random().toString(36).slice(2, 8);
}

export const useWatchPartyStore = create<WatchPartyState>((set, get) => ({
  partyId: null,
  party: null,
  messages: [],
  isHost: false,

  createParty: async ({ type, mediaId, title, host }) => {
    try {
      const partyId = randomCode();
      const now = Date.now();
      const data: PartyDoc = {
        partyId,
        hostId: host.userId,
        hostNickname: host.nickname,
        type,
        mediaId,
        title,
        isPlaying: true,
        positionPct: 0,
        updatedAt: now,
        participants: [host.userId],
        createdAt: now,
      };
      await setDoc(doc(db, "watchParties", partyId), data);
      return partyId;
    } catch (e) {
      console.error("[watchParty] createParty 실패:", e);
      return null;
    }
  },

  subscribe: (partyId) => {
    // 기존 구독 정리
    get().leave();
    set({ partyId, messages: [] });

    unsubParty = onSnapshot(doc(db, "watchParties", partyId), (snap) => {
      if (snap.exists()) set({ party: snap.data() as PartyDoc });
      else set({ party: null });
    });

    unsubMessages = onSnapshot(
      query(collection(db, "watchParties", partyId, "messages"), orderBy("createdAt", "asc")),
      (snap) => {
        const list: PartyMessage[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PartyMessage, "id">),
        }));
        set({ messages: list });
      },
    );
  },

  join: async (partyId, user) => {
    try {
      await updateDoc(doc(db, "watchParties", partyId), {
        participants: arrayUnion(user.userId),
      });
    } catch (e) {
      console.error("[watchParty] join 실패:", e);
    }
  },

  sendMessage: async (text, user) => {
    const { partyId } = get();
    const trimmed = text.trim();
    if (!partyId || !trimmed) return;
    try {
      await addDoc(collection(db, "watchParties", partyId, "messages"), {
        userId: user.userId,
        nickname: user.nickname,
        badge: user.badge ?? "",
        text: trimmed,
        createdAt: Date.now(),
      });
    } catch (e) {
      console.error("[watchParty] sendMessage 실패:", e);
    }
  },

  updatePlayback: async ({ positionPct, isPlaying }) => {
    const { partyId } = get();
    if (!partyId) return;
    // 너무 잦은 쓰기 방지: 3초에 한 번만 동기화
    const now = Date.now();
    if (now - lastPlaybackPush < 3000) return;
    lastPlaybackPush = now;
    try {
      await updateDoc(doc(db, "watchParties", partyId), {
        positionPct: Math.round(positionPct),
        isPlaying,
        updatedAt: now,
      });
    } catch (e) {
      console.error("[watchParty] updatePlayback 실패:", e);
    }
  },

  leave: () => {
    if (unsubParty) {
      unsubParty();
      unsubParty = null;
    }
    if (unsubMessages) {
      unsubMessages();
      unsubMessages = null;
    }
    set({ partyId: null, party: null, messages: [], isHost: false });
  },
}));
