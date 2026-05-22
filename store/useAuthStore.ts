import { AuthStore } from "@/types/authStore";
import { create } from "zustand";

export const useAuthStore = create<AuthStore>((set, get)=>({
    user: null,
    onLogin: (user)=>{
        set({user: user})
    },
    onLogout: ()=>{
        set({user: null})
    }
}));