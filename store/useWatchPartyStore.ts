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
  limit,
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
  posterPath?: string;
  backdropPath?: string;
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
  openParties: PartyDoc[];
  createParty: (args: {
    type: "movie" | "tv";
    mediaId: number;
    title: string;
    posterPath?: string;
    backdropPath?: string;
    host: PartyUser;
  }) => Promise<string | null>;
  subscribe: (partyId: string) => void;
  join: (partyId: string, user: PartyUser) => Promise<void>;
  sendMessage: (text: string, user: PartyUser) => Promise<void>;
  updatePlayback: (data: { positionPct: number; isPlaying: boolean }) => Promise<void>;
  updatePlaybackNow: (data: { positionPct: number; isPlaying: boolean }) => Promise<void>;
  subscribeOpenParties: () => void;
  unsubscribeOpenParties: () => void;
  leave: () => void;
}

let unsubParty: Unsubscribe | null = null;
let unsubMessages: Unsubscribe | null = null;
let unsubOpen: Unsubscribe | null = null;
let lastPlaybackPush = 0;
let lastNowPush = 0;

function randomCode() {
  return Math.random().toString(36).slice(2, 8);
}

export const useWatchPartyStore = create<WatchPartyState>((set, get) => ({
  partyId: null,
  party: null,
  messages: [],
  isHost: false,
  openParties: [],

  createParty: async ({ type, mediaId, title, posterPath, backdropPath, host }) => {
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
        posterPath: posterPath ?? "",
        backdropPath: backdropPath ?? "",
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

  updatePlaybackNow: async ({ positionPct, isPlaying }) => {
    const { partyId } = get();
    if (!partyId) return;
    // 즉시 동기화(재생/정지/탐색). 드래그 연타 방지로 0.5초 스로틀
    const now = Date.now();
    if (now - lastNowPush < 500) return;
    lastNowPush = now;
    lastPlaybackPush = now; // 주기 동기화 타이머도 함께 밀어줌
    try {
      await updateDoc(doc(db, "watchParties", partyId), {
        positionPct: Math.round(positionPct),
        isPlaying,
        updatedAt: now,
      });
    } catch (e) {
      console.error("[watchParty] updatePlaybackNow 실패:", e);
    }
  },

  subscribeOpenParties: () => {
    if (unsubOpen) {
      unsubOpen();
      unsubOpen = null;
    }
    unsubOpen = onSnapshot(
      query(collection(db, "watchParties"), orderBy("createdAt", "desc"), limit(20)),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as PartyDoc);
        set({ openParties: list });
      },
      (e) => console.error("[watchParty] openParties 구독 실패:", e),
    );
  },

  unsubscribeOpenParties: () => {
    if (unsubOpen) {
      unsubOpen();
      unsubOpen = null;
    }
    set({ openParties: [] });
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
