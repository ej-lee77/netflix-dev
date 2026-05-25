import { AuthState, type UserInfo } from "@/types/auth";
import { create } from "zustand";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/firebase/firebase"

export const useAuthStore = create<AuthState>((set, get)=>({
    user: null,

    currentMember: null,

    onInitAuth: ()=>{
        onAuthStateChanged(auth, (user:UserInfo|null) =>{
            set({user,
                currentMember: null
            })
        });
    },

    onLogin: (user)=>{
        set({user: user})
    },

    onLogout: async()=>{
        try{
            await signOut(auth);
            set({user: null, currentMember: null});
        }catch(err){
            console.log(err);
        }
    },

    onSetMember: (member)=>{
        set({currentMember: member});
    },
}));