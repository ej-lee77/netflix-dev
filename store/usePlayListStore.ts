import { create } from "zustand";
import type { Movie, TV } from "@/types/movie";
import type { PlayListItem, PlayListState } from "@/types/playList";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const LOCAL_PLAYLIST_KEY = "netflix-play-list";
const LOCAL_MY_LIST_KEY = "netflix-my-list";
const MAX_LIST_COUNT = 20;

type MediaType = "movie" | "tv";
type UserListField = "watchingVideos" | "playlistVideos";
type UserMovieData = {
    movies?: {
        watchingVideos?: string[];
        playlist?: {
            playlistVideos?: string[];
        };
    };
};

const getMediaType = (item: Movie | TV): MediaType => (
    "title" in item ? "movie" : "tv"
);

const makePlayListItem = (item: Movie | TV): PlayListItem => ({
    id: item.id,
    title: "title" in item ? item.title : item.name,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    mediaType: getMediaType(item),
    playTime: new Date().toISOString()
});

const getItemKey = (item: Pick<PlayListItem, "id" | "mediaType">) => (
    `${item.mediaType}-${item.id}`
);

const getKeyFromParts = (id: number, mediaType: MediaType) => (
    `${mediaType}-${id}`
);

const putLatestFirst = (items: PlayListItem[], newItem: PlayListItem) => {
    const filtered = items.filter((item) => getItemKey(item) !== getItemKey(newItem));

    return [newItem, ...filtered].slice(0, MAX_LIST_COUNT);
};

const removeItem = (items: PlayListItem[], id: number, mediaType: MediaType) => {
    const targetKey = getKeyFromParts(id, mediaType);

    return items.filter((item) => getItemKey(item) !== targetKey);
};

const removeKey = (keys: string[], id: number, mediaType: MediaType) => {
    const targetKey = getKeyFromParts(id, mediaType);

    return keys.filter((key) => key !== targetKey);
};

const loadLocalList = (key: string) => {
    if (typeof window === "undefined") return [];

    try {
        const stored = window.localStorage.getItem(key);
        return stored ? JSON.parse(stored) as PlayListItem[] : [];
    } catch (err) {
        console.log("Failed to load local list", err);
        return [];
    }
};

const saveLocalList = (key: string, items: PlayListItem[]) => {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.setItem(key, JSON.stringify(items));
    } catch (err) {
        console.log("Failed to save local list", err);
    }
};

const getUserMovieIds = (data: UserMovieData, fieldName: UserListField): string[] => {
    if (fieldName === "watchingVideos") {
        return data?.movies?.watchingVideos || [];
    }

    return data?.movies?.playlist?.playlistVideos || [];
};

const getUserMoviePath = (fieldName: UserListField) => (
    fieldName === "watchingVideos"
        ? "movies.watchingVideos"
        : "movies.playlist.playlistVideos"
);

const syncAddUserMovieId = async (fieldName: UserListField, newKey: string) => {
    const user = auth.currentUser;

    if (!user) return true;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) return false;

    const prevKeys = getUserMovieIds(userDoc.data(), fieldName);
    const nextKeys = [newKey, ...prevKeys.filter((key) => key !== newKey)].slice(0, MAX_LIST_COUNT);

    await updateDoc(userDocRef, {
        [getUserMoviePath(fieldName)]: nextKeys
    });

    return true;
};

const loadHydratedList = async (fieldName: UserListField, localKey: string) => {
    const localItems = loadLocalList(localKey);
    const user = auth.currentUser;

    if (!user) return localItems;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) return localItems;

    const storedKeys = getUserMovieIds(userDoc.data(), fieldName);
    if (!storedKeys.length) return localItems;

    const hydratedItems = storedKeys
        .map((key) => localItems.find((item) => getItemKey(item) === key))
        .filter((item): item is PlayListItem => Boolean(item));

    return hydratedItems.length ? hydratedItems : localItems;
};

export const usePlayListStore = create<PlayListState>((set, get) => ({
    playList: [],
    myList: [],
    onAddPlayList: async (item) => {
        const playItem = makePlayListItem(item);
        const currentPlayList = get().playList.length ? get().playList : loadLocalList(LOCAL_PLAYLIST_KEY);
        const newPlayList = putLatestFirst(currentPlayList, playItem);

        saveLocalList(LOCAL_PLAYLIST_KEY, newPlayList);
        set({ playList: newPlayList });

        try {
            return await syncAddUserMovieId("watchingVideos", getItemKey(playItem));
        } catch (err) {
            console.log("Failed to sync watching videos", err);
            return false;
        }
    },
    onRemovePlayList: async (id, mediaType) => {
        const currentPlayList = get().playList.length ? get().playList : loadLocalList(LOCAL_PLAYLIST_KEY);
        const filteredPlayList = removeItem(currentPlayList, id, mediaType);

        saveLocalList(LOCAL_PLAYLIST_KEY, filteredPlayList);
        set({ playList: filteredPlayList });

        try {
            const user = auth.currentUser;
            if (!user) return true;

            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) return false;

            const prevKeys = getUserMovieIds(userDoc.data(), "watchingVideos");
            const nextKeys = removeKey(prevKeys, id, mediaType);

            await updateDoc(userDocRef, {
                [getUserMoviePath("watchingVideos")]: nextKeys
            });

            return true;
        } catch (err) {
            console.log("Failed to remove watching video", err);
            return false;
        }
    },
    onLoadPlayList: async () => {
        try {
            const playList = await loadHydratedList("watchingVideos", LOCAL_PLAYLIST_KEY);
            set({ playList });
        } catch (err) {
            console.log("Failed to load watching videos", err);
            set({ playList: loadLocalList(LOCAL_PLAYLIST_KEY) });
        }
    },
    onAddMyList: async (item) => {
        const listItem = makePlayListItem(item);
        const currentMyList = get().myList.length ? get().myList : loadLocalList(LOCAL_MY_LIST_KEY);
        const newMyList = putLatestFirst(currentMyList, listItem);

        saveLocalList(LOCAL_MY_LIST_KEY, newMyList);
        set({ myList: newMyList });

        try {
            return await syncAddUserMovieId("playlistVideos", getItemKey(listItem));
        } catch (err) {
            console.log("Failed to sync playlist videos", err);
            return false;
        }
    },
    onRemoveMyList: async (id, mediaType) => {
        const currentMyList = get().myList.length ? get().myList : loadLocalList(LOCAL_MY_LIST_KEY);
        const filteredMyList = removeItem(currentMyList, id, mediaType);

        saveLocalList(LOCAL_MY_LIST_KEY, filteredMyList);
        set({ myList: filteredMyList });

        try {
            const user = auth.currentUser;
            if (!user) return true;

            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) return false;

            const prevKeys = getUserMovieIds(userDoc.data(), "playlistVideos");
            const nextKeys = removeKey(prevKeys, id, mediaType);

            await updateDoc(userDocRef, {
                [getUserMoviePath("playlistVideos")]: nextKeys
            });

            return true;
        } catch (err) {
            console.log("Failed to remove playlist video", err);
            return false;
        }
    },
    onLoadMyList: async () => {
        try {
            const myList = await loadHydratedList("playlistVideos", LOCAL_MY_LIST_KEY);
            set({ myList });
        } catch (err) {
            console.log("Failed to load playlist videos", err);
            set({ myList: loadLocalList(LOCAL_MY_LIST_KEY) });
        }
    }
}));
