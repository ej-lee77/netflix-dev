import { auth } from "@/firebase/firebase";
import { AuthState, type Profile, type UserInfo } from "@/types/auth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { create } from "zustand";

export const DEFAULT_PROFILES: Profile[] = [
  {
    id: 1,
    name: "나",
    imgUrl: "/images/profile/image/default_icons/17.png",
  },
];

const PROFILE_STORAGE_KEY = "netflix-current-profile";
const PROFILE_LIST_STORAGE_KEY = "netflix-profile-list";
const FALLBACK_PROFILE_IMAGE = "/images/profile/image/default_icons/17.png";

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

const normalizeProfile = (profile: Profile): Profile => ({
  ...profile,
  imgUrl: normalizeProfileImage(profile.imgUrl),
});

const getStoredProfiles = (): Profile[] | null => {
  if (typeof window === "undefined") return null;

  try {
    const savedProfiles = window.localStorage.getItem(PROFILE_LIST_STORAGE_KEY);
    if (!savedProfiles) return null;

    const parsedProfiles = JSON.parse(savedProfiles);
    if (!Array.isArray(parsedProfiles) || parsedProfiles.length === 0) return null;

    return parsedProfiles.map(normalizeProfile);
  } catch {
    return null;
  }
};

const saveProfiles = (profiles: Profile[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_LIST_STORAGE_KEY, JSON.stringify(profiles));
};

const isNewAuthUser = (user: UserInfo) =>
  Boolean(user.metadata?.creationTime && user.metadata?.creationTime === user.metadata?.lastSignInTime);

const withDefaultProfiles = (user: UserInfo, preferProvidedProfiles = false): UserInfo => {
  const providedProfiles = user.profiles?.map(normalizeProfile);
  const storedProfiles = getStoredProfiles();

  return {
    ...user,
    profiles: preferProvidedProfiles
      ? providedProfiles ?? storedProfiles ?? DEFAULT_PROFILES
      : storedProfiles ?? providedProfiles ?? DEFAULT_PROFILES,
  };
};

const getSavedProfile = (profiles: Profile[]) => {
  if (typeof window === "undefined") return null;

  try {
    const savedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!savedProfile) return null;

    const parsedProfile = JSON.parse(savedProfile);
    return profiles.find((profile) => profile.id === parsedProfile?.id) ?? null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  currentProfile: null,
  currentMember: null,

  onInitAuth: () => {
    onAuthStateChanged(auth, (user: UserInfo | null) => {
      if (!user) {
        set({ user: null, currentProfile: null, currentMember: null });
        return;
      }

      // 이메일/비밀번호 가입인데 아직 인증 안 된 경우 → 로그인 상태로 인식 안 함
      const isEmailProvider = user.providerData[0]?.providerId === "password";
      if (isEmailProvider && !user.emailVerified) {
        set({ user: null, currentProfile: null, currentMember: null });
        return;
      }

      const userWithProfiles = withDefaultProfiles(user);
      set({
        user: userWithProfiles,
        currentProfile: getSavedProfile(userWithProfiles.profiles ?? DEFAULT_PROFILES),
        currentMember: null,
      });
    });
  },
  onLogin: (user) => {
    const userWithProfiles = withDefaultProfiles(user, isNewAuthUser(user));
    saveProfiles(userWithProfiles.profiles ?? DEFAULT_PROFILES);
    set({ user: userWithProfiles, currentProfile: null });
  },

  onLogout: async () => {
    try {
      await signOut(auth);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(PROFILE_STORAGE_KEY);
      }
      set({ user: null, currentProfile: null, currentMember: null });
    } catch (err) {
      console.log(err);
    }
  },

  onSetProfile: (profile) => {
    if (typeof window !== "undefined") {
      if (profile) {
        window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      } else {
        window.localStorage.removeItem(PROFILE_STORAGE_KEY);
      }
    }
    set({ currentProfile: profile });
  },

  onAddProfile: (profile) => {
    const user = get().user;
    const profiles = user?.profiles?.length ? user.profiles : DEFAULT_PROFILES;
    const nextId = Math.max(0, ...profiles.map((item) => item.id)) + 1;
    const nextProfiles = [...profiles, normalizeProfile({ ...profile, id: nextId })];

    saveProfiles(nextProfiles);
    set({ user: user ? { ...user, profiles: nextProfiles } : user });
  },

  onUpdateProfile: (profile) => {
    const user = get().user;
    const profiles = user?.profiles?.length ? user.profiles : DEFAULT_PROFILES;
    const nextProfile = normalizeProfile(profile);
    const nextProfiles = profiles.map((item) => (item.id === profile.id ? nextProfile : item));
    const nextCurrentProfile = get().currentProfile?.id === profile.id ? nextProfile : get().currentProfile;

    saveProfiles(nextProfiles);
    if (nextCurrentProfile) {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextCurrentProfile));
    }
    set({
      user: user ? { ...user, profiles: nextProfiles } : user,
      currentProfile: nextCurrentProfile,
    });
  },

  onDeleteProfile: (profileId) => {
    const user = get().user;
    const profiles = user?.profiles?.length ? user.profiles : DEFAULT_PROFILES;
    if (profiles.length <= 1) return;

    const nextProfiles = profiles.filter((profile) => profile.id !== profileId);
    const nextCurrentProfile = get().currentProfile?.id === profileId ? null : get().currentProfile;

    saveProfiles(nextProfiles);
    if (!nextCurrentProfile && typeof window !== "undefined") {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
    set({
      user: user ? { ...user, profiles: nextProfiles } : user,
      currentProfile: nextCurrentProfile,
    });
  },

  onSetMember: (member) => {
    set({ currentMember: member });
  },
}));
