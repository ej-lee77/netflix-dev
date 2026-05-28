import { AuthState, type UserInfo } from "@/types/auth";
import { create } from "zustand";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/firebase/firebase"

export const DEFAULT_PROFILES = Array.from({ length: 6 }, (_, index) => ({
    id: index + 1,
    name: `유저 ${index + 1}`,
    imgUrl: `/images/profile/default_icons/${17 + index}.png`,
}));

const PROFILE_STORAGE_KEY = "netflix-current-profile";

const withDefaultProfiles = (user: UserInfo): UserInfo => ({
    ...user,
    profiles: DEFAULT_PROFILES,
});

const getSavedProfile = () => {
    if (typeof window === "undefined") return null;

    try {
        const savedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
        if (!savedProfile) return null;

        const parsedProfile = JSON.parse(savedProfile);
        return DEFAULT_PROFILES.find((profile) => profile.id === parsedProfile?.id) ?? null;
    } catch {
        return null;
    }
};

export const useAuthStore = create<AuthState>((set, get)=>({
    user: null,

    currentProfile: null,

    currentMember: null,

    onInitAuth: ()=>{
        onAuthStateChanged(auth, (user:UserInfo|null) =>{
            set({user: user ? withDefaultProfiles(user) : null,
                currentProfile: user ? getSavedProfile() : null,
                currentMember: null
            })
        });
    },

    onLogin: (user)=>{
        set({user: withDefaultProfiles(user), currentProfile: null})
    },

    onLogout: async()=>{
        try{
            await signOut(auth);
            if (typeof window !== "undefined") {
                window.localStorage.removeItem(PROFILE_STORAGE_KEY);
            }
            set({user: null, currentProfile: null, currentMember: null});
        }catch(err){
            console.log(err);
        }
    },

    onSetProfile: (profile)=>{
        if (typeof window !== "undefined") {
            if (profile) {
                window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
            } else {
                window.localStorage.removeItem(PROFILE_STORAGE_KEY);
            }
        }
        set({currentProfile: profile});
    },

    onSetMember: (member)=>{
        set({currentMember: member});
    },
}));
