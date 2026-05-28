import { type User } from "firebase/auth"

export interface Profile{
    id: number;
    name: string|null;
    imgUrl: string|null;
}

export interface UserInfo extends User{
    profiles?: Profile[]|null;
}

// 가족 구성원 타입
export type FamilyMember = "엄마" | "아빠" | "아들" | "딸";

// 상태 타입
export interface AuthState{
    user: UserInfo | null;
    currentProfile: Profile | null;
    currentMember: FamilyMember | null;
    onInitAuth: ()=>void;
    onLogin: (user: UserInfo)=>void;
    onLogout: ()=>Promise<void>;
    onSetProfile: (profile: Profile | null)=>void;
    onSetMember: (member:FamilyMember)=>void;
}
