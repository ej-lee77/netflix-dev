import { create } from "zustand";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase/firebase";
import type { UserDocument, PayInfo } from "@/types/auth";

// ─── Firestore 저장 함수 ───────────────────────────────────────────────────────

/**
 * 회원가입 함수
 * 1. Firebase Auth로 계정 생성
 * 2. Firestore users 컬렉션에 유저 문서 저장
 * 3. 이메일 인증 메일 발송
 * @returns 생성된 유저의 uid
 */
export const signUp = async (
  email: string,
  password: string,
): Promise<string> => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  const userDoc: UserDocument = {
    userId: user.uid,
    email: user.email!,
    planType: "",
    payment: {
      pay: "",
      bank: "",
      num: "",
      payDate: "",
      nextDate: "",
    },
    profile: [
      {
        id: 1,
        nickname: "",
        imgUrl: "/images/profile/image/default_icons/17.png",
        viewAge: "",
        movies: {
          watchingVideos: [],
          wishlist: [],
          playlist: {
            playlistVideos: [],
            customPlaylists: [],
          },
          genreStats: {},
          moodStats: {},
        },
        community: {
          followers: [],
          following: [],
          reviews: [],
          feeds: [],
        },
        headerMenus: [],
        bages: {
          earnedBadges: [],
          equippedBadges: "",
        },
        alarm: [],
        isCommunity: true,
      },
    ],
  };

  await setDoc(doc(db, "users", user.uid), {
    ...userDoc,
    createdAt: serverTimestamp(),
  });

  await sendEmailVerification(user);

  return user.uid;
};

/**
 * 결제 수단 저장 함수
 * StepPayment에서 결제 완료 후 호출
 * 카드 번호는 보안상 마지막 4자리만 저장
 */
export const updatePayment = async (
  uid: string,
  payment: PayInfo,
): Promise<void> => {
  await updateDoc(doc(db, "users", uid), {
    payment,
    updatedAt: serverTimestamp(),
  });
};

/**
 * 플랜 업데이트 함수
 * StepPlan, 플랜 변경 페이지에서 호출
 */
export const updatePlan = async (
  uid: string,
  planType: string,
  billing: string
): Promise<void> => {
  await updateDoc(doc(db, "users", uid), {
    planType,
    billing,
    updatedAt: serverTimestamp(),
  });
};

// ─── uid 임시 저장 스토어 ──────────────────────────────────────────────────────

/**
 * 회원가입/플랜선택 단계 사이에서 데이터를 임시로 공유하기 위한 스토어
 * StepRegister에서 uid 저장 → StepPlan, StepPayment 등에서 꺼내 씀
 * 구독 완료(StepComplete) 시점에 clear()로 초기화
 */
interface SignUpState {
  uid: string | null;
  payInfo: PayInfo | null;
  pendingPlan: { planType: string; billing: string } | null;  // 비구독자 플랜 임시 저장
  setUid: (uid: string) => void;
  setPayInfo: (payInfo: PayInfo) => void;
  setPendingPlan: (plan: { planType: string; billing: string }) => void;  // 비구독자 플랜 선택 후 저장
  clear: () => void;
}

export const useSignUpStore = create<SignUpState>((set) => ({
  uid: null,
  payInfo: null,
  pendingPlan: null,
  setUid: (uid) => set({ uid }),
  setPayInfo: (payInfo) => set({ payInfo }),
  setPendingPlan: (plan) => set({ pendingPlan: plan }),
  clear: () => set({ uid: null, payInfo: null, pendingPlan: null }),
}));