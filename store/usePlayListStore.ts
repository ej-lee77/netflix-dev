import { create } from "zustand";
import type { PlayListItem, PlayListState } from "@/types/playList";
import { auth, db } from "../firebase/firebase";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuthStore } from "./useAuthStore";

export const usePlayListStore = create<PlayListState>((set, get)=>({
    playList: [],
    onAddPlayList: async (item) => {
        const user = auth.currentUser;
        if (!user) return;
        const currentMember = useAuthStore.getState().currentMember;
        if (!currentMember) return;
        try {
            const playItem: PlayListItem = {
                id: item.id,
                title: "title" in item ? item.title : item.name,
                poster_path: item.poster_path,
                mediaType: "title" in item ? "movie" : "tv",
                playTime: new Date().toISOString()
            };

            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const prevHistory = userDoc.data()?.familyMembers?.[currentMember]?.watchHistory || [];
                const filtered = prevHistory.filter((h: PlayListItem) => h.id !== item.id
                );

                // 최신순
                const newHistory = [
                    playItem,
                    ...filtered].slice(0, 20);

                await updateDoc(
                    userDocRef, {
                    [`familyMembers.${currentMember}.watchHistory`]: newHistory
                }
                );

                set({
                    playList:
                        newHistory
                });
            }

        } catch (err) {
            console.log("재생리스트 에러", err);
        }
    },
    onLoadPlayList: async()=>{
        const user = auth.currentUser;
        if(!user) return;
        const currentMember = useAuthStore.getState().currentMember;
        if(!currentMember) return;

        try{
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            if(userDoc.exists()){
                const history = userDoc.data()?.familyMembers?.[currentMember]?.watchHistory || [];
                set({playList: history})
            }
        }catch(err){
            console.log("재생영상불러오기 오류",err);
        }
    }
}))