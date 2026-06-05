import { create } from "zustand";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { ContactDocument, ContactInput, ContactStore } from "@/types/contact";

// users 컬렉션과 분리된 별도 문의 컬렉션
const CONTACTS_COLLECTION = "contacts";

export const useContactStore = create<ContactStore>((set, get) => ({
  myContacts: [],
  loading: false,
  submitting: false,

  // 1. 문의 등록 — contacts 컬렉션에 새 문서 추가
  submitContact: async (input) => {
    set({ submitting: true });
    try {
      const newDoc = {
        ...input, // userId, profileId, category, title, content, email
        status: "pending" as const,
        createdAt: new Date().toISOString(),
      };

      const ref = await addDoc(collection(db, CONTACTS_COLLECTION), newDoc);

      // 낙관적 갱신: 방금 등록한 문의를 목록 맨 앞에 끼워넣어 즉시 보이게 함
      set((state) => ({
        myContacts: [{ id: ref.id, ...newDoc }, ...state.myContacts],
        submitting: false,
      }));
      return true;
    } catch (error) {
      console.error("문의 등록 실패:", error);
      set({ submitting: false });
      return false;
    }
  },

  // 2. 내 문의 내역 조회 — userId 로만 쿼리(복합 인덱스 불필요), 정렬은 클라이언트에서
  fetchMyContacts: async (userId, profileId) => {
    if (!userId) return;
    set({ loading: true });
    try {
      const q = query(
        collection(db, CONTACTS_COLLECTION),
        where("userId", "==", userId),
      );

      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as ContactDocument),
      );

      // 특정 프로필로 한정해서 보고 싶을 때만 필터링
      if (profileId !== undefined) {
        data = data.filter((c) => c.profileId === profileId);
      }

      // 최신순 정렬
      data.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

      set({ myContacts: data, loading: false });
    } catch (error) {
      console.error("문의 내역 조회 실패:", error);
      set({ loading: false });
    }
  },
}));
