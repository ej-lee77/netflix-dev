import { create } from "zustand";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"; // updateDoc 추가
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
  try {
    // Firebase Auth 계정 생성
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    // Firestore에 저장할 초기 유저 데이터
    // planType, profile 등 미입력 필드는 이후 단계에서 업데이트
    const userDoc: UserDocument = {
      userId: user.uid,
      email: user.email!,
      planType: "", // 플랜 선택 단계에서 채워짐
      payment: {
        pay: "",
        bank: "",
        num: "",
        payDate: "",
        nextDate: "",
      },
      profile: [
        {
          id: Date.now(),
          nickname: "나",
          imgUrl: "/images/profile/image/default_icons/17.png",
          viewAge: "19",
          movies: {
            watchingVideos: [], // 시청 중인 영상 ID 목록
            wishlist: [], // 찜한 영상 ID 목록
            playlist: {
              playlistVideos: [], // 플레이리스트 영상 ID 목록
              customPlaylists: [], // 커스텀 플레이리스트 ID 목록
            },
            genreStats: {}, // 장르별 시청 횟수 통계
            countryStats: {},
          },
          community: {
            followers: [], // 나를 팔로우하는 유저 ID 목록
            following: [], // 내가 팔로우하는 유저 ID 목록
            reviews: [], // 좋아요/싫어요/신고한 리뷰 ID 목록
            // 다른 피드에 남긴 댓글/좋아요 활동 기록 (신고 추가해야함)
            likedfeeds: [],
            commentfeeds:[],
            reportfeeds:[]
          },
          headerMenus: [], // 헤더에 표시할 메뉴 ID 목록
          badges: {
            earnedBadges: [], // 획득한 뱃지 목록
            equippedBadges: "", // 현재 장착 중인 뱃지 ID
          },
          alarm: [], // 알림 설정한 영상 ID 목록
          isCommunity: true,
        },
      ],
    };

    // Firestore users 컬렉션에 문서 저장 (문서 ID = uid)
    await setDoc(doc(db, "users", user.uid), {
      ...userDoc,
      createdAt: serverTimestamp(), // 서버 기준 생성 시각
    });

    // 이메일 인증 메일 발송
    await sendEmailVerification(user);

    return user.uid;
  } catch (error) {
    console.error("signUp error:", error);
    throw error;
  }
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
 * 회원가입 단계 사이에서 uid를 임시로 공유하기 위한 스토어
 * StepRegister에서 저장 → StepPlan, StepPayment 등에서 꺼내 씀
 * 구독 완료(StepComplete) 시점에 clear()로 초기화
 */
interface SignUpState {
  uid: string | null;
  payInfo: PayInfo | null; // ← 추가
  setUid: (uid: string) => void;
  setPayInfo: (payInfo: PayInfo) => void; // ← 추가
  clear: () => void;
}

export const useSignUpStore = create<SignUpState>((set) => ({
  uid: null,
  payInfo: null, // ← 추가
  setUid: (uid) => set({ uid }),
  setPayInfo: (payInfo) => set({ payInfo }), // ← 추가
  clear: () => set({ uid: null, payInfo: null }), // ← payInfo도 초기화
}));
