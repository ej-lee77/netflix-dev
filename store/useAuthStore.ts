import { auth, db } from "@/firebase/firebase"; 
import { AuthState, type Profile, type UserInfo, type UserDocument } from "@/types/auth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"; 
import { create } from "zustand";
import { persist } from "zustand/middleware"; // 💡 persist 미들웨어 임포트

const FALLBACK_PROFILE_IMAGE = "/images/profile/image/default_icons/17.png";

// 이미지 경로 정규화 함수
const normalizeProfileImage = (imgUrl: string | null | undefined) => {
  if (!imgUrl || imgUrl === "/images/profile/normal.svg" || imgUrl === "images/profile/1.png") {
    return FALLBACK_PROFILE_IMAGE;
  }
  if (imgUrl.startsWith("/images/profile/default_icons/")) {
    return imgUrl.replace("/images/profile/default_icons/", "/images/profile/image/default_icons/");
  }
  if (imgUrl.startsWith("/images/profile/") && !imgUrl.startsWith("/images/profile/image/")) {
    return imgUrl.replace("/images/profile/", "/images/profile/image/");
  }
  return imgUrl;
};

// 프로필 데이터 내부 이미지 주소 정규화
const normalizeProfile = (profile: any): any => ({
  ...profile,
  imgUrl: normalizeProfileImage(profile.imgUrl),
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,           // Firestore에서 가져온 순수 데이터
      currentProfile: null, // 현재 선택하여 시청 중인 프로필 (persist가 자동 저장함)

      // 1. 앱 초기화 및 로그인 상태 실시간 감지 (Fetch)
      onInitAuth: () => {
        onAuthStateChanged(auth, async (firebaseUser) => {
          if (!firebaseUser) {
            set({ user: null, currentProfile: null });
            return;
          }

          // 이메일 인증 가드
          const isEmailProvider = firebaseUser.providerData[0]?.providerId === "password";
          if (isEmailProvider && !firebaseUser.emailVerified) {
            set({ user: null, currentProfile: null });
            return;
          }

          try {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data() as UserDocument;
              
              if (userData.profile && userData.profile.length > 0) {
                userData.profile = userData.profile.map(normalizeProfile);
              }

              // 💡 수정: 확실하게 기존에 쓰던 프로필(로컬 영속화 데이터)이 매칭될 때만 유지하고,
              // 아예 첫 로그인이거나 정보가 없으면 null로 비워두어 프로필 선택 화면을 띄우게 만듭니다.
              const existingProfile = get().currentProfile;
              const savedProfile = userData.profile?.find((p) => p.id === existingProfile?.id) || null; // 👈 || null 로 변경!

              set({
                user: userData, 
                currentProfile: savedProfile, // 기존 시청 프로필이 없으면 null이 됨
              });
            } else {
              console.warn("Firestore 유저 문서가 없어 기본 문서를 자동으로 생성합니다.");
              
              const defaultProfile = normalizeProfile({
                id: 1,
                nickname: "나",
                imgUrl: FALLBACK_PROFILE_IMAGE,
                movies: { watchingVideos: [], wishlist: [], playlist: { playlistVideos: [], customPlaylists: [] }, genreStats: {} },
                community: { followers: [], following: [], reviews: [], feeds: [] },
                bages: { equippedBadges: null, earnedBadges: [] }
              });

              const newUserData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || "",
                profile: [defaultProfile]
              };

              await setDoc(userDocRef, newUserData);

              set({
                user: newUserData as any,
                currentProfile: get().currentProfile || defaultProfile,
              });
            }
          } catch (error) {
            console.error("유저 정보 로드 중 오류 발생:", error);
            set({ user: null, currentProfile: null });
          }
        });
      },

      // 2. 수동 로그인 혹은 결제 완료 직후 세팅 시 호출
      onLogin: async (firebaseUser) => {
        if (!firebaseUser) return;
        
        const targetUid = firebaseUser.uid || firebaseUser.userId;
        if (!targetUid) return;
        
        try {
          const userDocRef = doc(db, "users", targetUid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as UserDocument;
            if (userData.profile) userData.profile = userData.profile.map(normalizeProfile);
            
            set({ 
              user: userData, 
              currentProfile: userData.profile?.[0] || null,
            });
          } else {
            const fallbackProfiles = (firebaseUser as any).profiles || (firebaseUser as any).profile || [];
            
            const fixedProfiles = fallbackProfiles.length > 0 
              ? fallbackProfiles.map((p: any) => ({
                  id: p.id,
                  nickname: p.nickname || "나",
                  imgUrl: p.imgUrl
                }))
              : [{ id: 1, nickname: "나", imgUrl: FALLBACK_PROFILE_IMAGE }];

            const normalizedFallback = fixedProfiles.map(normalizeProfile);

            set({
              user: {
                uid: targetUid,
                email: firebaseUser.email || "",
                profile: normalizedFallback,
              } as any,
              currentProfile: normalizedFallback[0] || null,
            });
          }
        } catch (error) {
          console.error("onLogin 에러:", error);
        }
      },

      // 3. 프로필 선택 (시청 프로필 전환)
      onSetProfile: (profile) => {
        // 💡 [수정] localStorage 관련 코드가 전부 빠지고 순수 상태만 변경합니다. 미들웨어가 알아서 감지하여 저장합니다.
        set({ currentProfile: profile });
      },

      // 4. 새로운 프로필 추가 (Firestore DB 저장)
      onAddProfile: async (newProfile) => {
        const currentUser = get().user;
        const uid = auth.currentUser?.uid;

        if (!uid || !currentUser) return;

        const currentProfiles = currentUser.profile?.length ? currentUser.profile : [];
        const nextId = Math.max(0, ...currentProfiles.map((item) => item.id)) + 1;
        
        const formattedProfile = normalizeProfile({ 
          ...newProfile, 
          id: nextId,
          movies: { watchingVideos: [], wishlist: [], playlist: { playlistVideos: [], customPlaylists: [] }, genreStats: {} },
          community: { followers: [], following: [], reviews: [], feeds: [] },
          bages: { equippedBadges: null, earnedBadges: [] }
        });
        
        const nextProfiles = [...currentProfiles, formattedProfile];

        try {
          const userDocRef = doc(db, "users", uid);
          await updateDoc(userDocRef, { profile: nextProfiles });
          set({ user: { ...currentUser, profile: nextProfiles } });
        } catch (error) {
          console.error("프로필 추가 실패:", error);
        }
      },

      // 5. 기존 프로필 수정 (Firestore DB 반영)
      onUpdateProfile: async (updatedProfile) => {
        const currentUser = get().user;
        const uid = auth.currentUser?.uid;

        if (!uid || !currentUser) return;

        const currentProfiles = currentUser.profile?.length ? currentUser.profile : [];
        const nextNormalizedProfile = normalizeProfile(updatedProfile);
        
        const nextProfiles = currentProfiles.map((item) => 
          item.id === updatedProfile.id ? { ...item, ...nextNormalizedProfile } : item
        );
        
        const isCurrentActive = get().currentProfile?.id === updatedProfile.id;
        const nextCurrentProfile = isCurrentActive ? { ...get().currentProfile, ...nextNormalizedProfile } : get().currentProfile;

        try {
          const userDocRef = doc(db, "users", uid);
          await updateDoc(userDocRef, { profile: nextProfiles });

          set({
            user: { ...currentUser, profile: nextProfiles },
            currentProfile: nextCurrentProfile,
          });
        } catch (error) {
          console.error("프로필 수정 실패:", error);
        }
      },

      // 6. 프로필 삭제 (Firestore DB 반영)
      onDeleteProfile: async (profileId) => {
        const currentUser = get().user;
        const uid = auth.currentUser?.uid;

        if (!uid || !currentUser) return;

        const currentProfiles = currentUser.profile?.length ? currentUser.profile : [];
        if (currentProfiles.length <= 1) {
          alert("최소 하나의 프로필은 유지해야 합니다.");
          return;
        }

        const nextProfiles = currentProfiles.filter((profile) => profile.id !== profileId);
        const isDeletingCurrent = get().currentProfile?.id === profileId;
        const nextCurrentProfile = isDeletingCurrent ? null : get().currentProfile;

        try {
          const userDocRef = doc(db, "users", uid);
          await updateDoc(userDocRef, { profile: nextProfiles });

          set({
            user: { ...currentUser, profile: nextProfiles },
            currentProfile: nextCurrentProfile,
          });
        } catch (error) {
          console.error("프로필 삭제 실패:", error);
        }
      },

      // 7. 로그아웃
      onLogout: async () => {
        try {
          await signOut(auth);
          set({ user: null, currentProfile: null });
        } catch (err) {
          console.error("로그아웃 실패:", err);
        }
      },

      toggleCommunity: async () => {
        const { user, currentProfile } = get();
        if (!user || !currentProfile) return;
        const targetUid = user.uid || user.userId || auth.currentUser?.uid;

        if (!targetUid) {
          console.warn("커뮤니티 설정 변경 실패: 사용자 문서 ID를 찾을 수 없습니다.");
          return;
        }

        // 1. 상태 반전 (UI 즉시 반영용)
        const newStatus = !currentProfile.isCommunity;
        
        // 2. Zustand 스토어 업데이트
        set((state) => ({
          user: {
            ...state.user!,
            profile: state.user!.profile.map((p) => 
              p.id === currentProfile.id ? { ...p, isCommunity: newStatus } : p
            ),
          },
          currentProfile: { ...currentProfile, isCommunity: newStatus }
        }));

        // 3. Firestore 업데이트 (비동기 처리)
        try {
          const userDocRef = doc(db, "users", targetUid);
          await updateDoc(userDocRef, {
            profile: get().user?.profile // 전체 프로필 배열을 업데이트
          });
        } catch (error) {
          console.error("커뮤니티 설정 변경 실패:", error);
          // 에러 발생 시 원상복구 로직 필요하면 추가
        }
      },
    }),
    {
      name: "netflix-auth-storage", // 💡 로컬 스토리지에 저장될 Key 이름입니다.
      
      // 💡 [중요] 전체 스토어 상태 중에서 오직 'currentProfile'만 로컬 스토리지에 저장되도록 필터링합니다.
      // 이렇게 해야 유저 정보가 꼬이거나 불필요한 대용량 데이터가 스토리지에 쌓이지 않습니다.
      partialize: (state) => ({ currentProfile: state.currentProfile }), 
    }
  )
);
