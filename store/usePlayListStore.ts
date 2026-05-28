import { create } from "zustand";
import type { Movie, TV } from "@/types/movie";
import type { PlayListItem, PlayListState } from "@/types/playList";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuthStore } from "./useAuthStore";

const LOCAL_PLAYLIST_KEY = "netflix-play-list";
const MAX_PLAYLIST_COUNT = 20;

const getMediaType = (item: Movie | TV): "movie" | "tv" => (
    "title" in item ? "movie" : "tv"
);

const makePlayListItem = (item: Movie | TV): PlayListItem => ({
    id: item.id,
    title: "title" in item ? item.title : item.name,
    poster_path: item.poster_path,
    mediaType: getMediaType(item),
    playTime: new Date().toISOString()
});

const putLatestFirst = (items: PlayListItem[], newItem: PlayListItem) => {
    const filtered = items.filter((item) => (
        item.id !== newItem.id || item.mediaType !== newItem.mediaType
    ));

    return [newItem, ...filtered].slice(0, MAX_PLAYLIST_COUNT);
};

const loadLocalPlayList = () => {
    if (typeof window === "undefined") return [];

    try {
        const stored = window.localStorage.getItem(LOCAL_PLAYLIST_KEY);
        return stored ? JSON.parse(stored) as PlayListItem[] : [];
    } catch (err) {
        console.log("재생목록 로컬 저장소 불러오기 오류", err);
        return [];
    }
};

const saveLocalPlayList = (items: PlayListItem[]) => {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.setItem(LOCAL_PLAYLIST_KEY, JSON.stringify(items));
    } catch (err) {
        console.log("재생목록 로컬 저장소 저장 오류", err);
    }
};

export const usePlayListStore = create<PlayListState>((set, get) => ({
    playList: [],
    onAddPlayList: async (item) => {
        const playItem = makePlayListItem(item);
        const user = auth.currentUser;
        const currentMember = useAuthStore.getState().currentMember;

        if (!user || !currentMember) {
            const currentPlayList = get().playList.length ? get().playList : loadLocalPlayList();
            const newPlayList = putLatestFirst(currentPlayList, playItem);

            saveLocalPlayList(newPlayList);
            set({ playList: newPlayList });
            return true;
        }

        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                return false;
            }

            const prevHistory = userDoc.data()?.familyMembers?.[currentMember]?.watchHistory || [];
            const newHistory = putLatestFirst(prevHistory, playItem);

            await updateDoc(userDocRef, {
                [`familyMembers.${currentMember}.watchHistory`]: newHistory
            });

            set({ playList: newHistory });
            return true;
        } catch (err) {
            console.log("재생목록 추가 오류", err);
            return false;
        }
    },
    onLoadPlayList: async () => {
        const user = auth.currentUser;
        const currentMember = useAuthStore.getState().currentMember;

        if (!user || !currentMember) {
            set({ playList: loadLocalPlayList() });
            return;
        }

        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const history = userDoc.data()?.familyMembers?.[currentMember]?.watchHistory || [];
                set({ playList: history });
            }
        } catch (err) {
            console.log("재생목록 불러오기 오류", err);
        }
    }
}));
