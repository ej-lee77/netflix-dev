import { create } from "zustand";
import type { Movie, TV } from "@/types/movie";
import type { PlayListItem, PlayListState } from "@/types/playList";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useAuthStore } from "./useAuthStore";
import { PlaylistDocument } from "@/types/playList";
import { useMovieStore } from "./useMovieStore";

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

export const getMediaType = (item: Movie | TV): MediaType => (
    "title" in item ? "movie" : "tv"
);

const makePlayListItem = (item: Movie | TV): PlayListItem => ({
    id: item.id,
    title: ("title" in item ? item.title : item.name) as string,
    poster_path: item.poster_path ?? "",
    backdrop_path: item.backdrop_path ?? "",
    mediaType: getMediaType(item),
    playTime: new Date().toISOString(),
    progress:  0, 
    episodeProgress: {},
});

export const getItemKey = (item: Pick<PlayListItem, "id" | "mediaType">) => (
    `${item.mediaType}-${item.id}`
);

export const getKeyFromParts = (id: number, mediaType: MediaType) => (
    `${mediaType}-${id}`
);

const putLatestFirst = (items: PlayListItem[], newItem: PlayListItem) => {
    const existing = items.find((item) => getItemKey(item) === getItemKey(newItem));
    const filtered = items.filter((item) => getItemKey(item) !== getItemKey(newItem));
    const merged = existing
        ? { ...newItem, progress: existing.progress, episodeProgress: existing.episodeProgress }
        : newItem;

    return [merged, ...filtered].slice(0, MAX_LIST_COUNT);
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
    playHist: [],
    myList: [],
    customPlaylists: [],
    onAddPlayList: async (item) => {
        try {
            const authState = useAuthStore.getState();
            const userId = authState.user?.userId;
            const currentProfile = authState.currentProfile;
            if (!userId || !currentProfile) return false;

            const userDocRef = doc(db, "users", userId);
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) return false;

            const userData = userDocSnap.data();
            const profiles = userData.profile || [];
            const profileIndex = profiles.findIndex((p: any) => p.id === currentProfile.id);
            if (profileIndex === -1) return false;

            // 1. 필요한 데이터 생성
            const playItem = makePlayListItem(item);
            const itemKey = `${playItem.mediaType}-${playItem.id}`;

            // 2. 프로필 복사본 및 데이터 업데이트
            const updatedProfiles = [...profiles];
            const targetProfile = { ...updatedProfiles[profileIndex] };
            
            // --- watchingVideos 처리 (객체 전체 저장) ---
            const prevList = targetProfile.movies?.watchingVideos || [];
            const newWatchingVideos = putLatestFirst(prevList, playItem);

            const prevHist = targetProfile.movies?.histMovies || [];
            const newHistMovies = [itemKey, ...prevHist.filter((k: string) => k !== itemKey)].slice(0, 50);

            // 3. 데이터 구조 반영
            targetProfile.movies = {
                ...targetProfile.movies,
                watchingVideos: newWatchingVideos,
                histMovies: newHistMovies
            };

            updatedProfiles[profileIndex] = targetProfile;
            await updateDoc(userDocRef, { profile: updatedProfiles });

            // 4. [핵심] playList와 playHist 상태 동시 업데이트
            set({ 
                playList: newWatchingVideos,
                playHist: newHistMovies 
            });
            return true;
        } catch (err) {
            console.error("데이터 저장 실패:", err);
            return false;
        }
    },
    onRemovePlayList: async (id: number) => {
        try {
            const authState = useAuthStore.getState();
            const userId = authState.user?.userId;
            const currentProfile = authState.currentProfile;
            if (!userId || !currentProfile) return false;

            const userDocRef = doc(db, "users", userId);
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) return false;

            const profiles = userDocSnap.data().profile;
            const profileIndex = profiles.findIndex((p: any) => p.id === currentProfile.id);
            
            const updatedProfiles = [...profiles];
            const targetProfile = { ...updatedProfiles[profileIndex] };
            
            // ID가 일치하지 않는 것들만 필터링
            const nextList = (targetProfile.movies?.watchingVideos || []).filter((p: any) => p.id !== id);

            targetProfile.movies = { ...targetProfile.movies, watchingVideos: nextList };
            updatedProfiles[profileIndex] = targetProfile;

            await updateDoc(userDocRef, { profile: updatedProfiles });
            set({ playList: nextList });
            return true;
        } catch (err) {
            console.error("삭제 실패:", err);
            return false;
        }
    },
    onLoadPlayList: async () => {
        const authState = useAuthStore.getState();
        const userId = authState.user?.userId;
        const currentProfile = authState.currentProfile;

        if (!userId || !currentProfile) {
            set({ playList: [] });
            return;
        }

        try {
            const userDocSnap = await getDoc(doc(db, "users", userId));
            if (!userDocSnap.exists()) return set({ playList: [] });

            const profiles = userDocSnap.data()?.profile || [];
            const targetProfile = profiles.find((p: any) => p.id === currentProfile.id);
            
            // 저장된 객체 배열을 그대로 가져옴
            set({ 
                playList: targetProfile?.movies?.watchingVideos ?? [],
                playHist: targetProfile?.movies?.histMovies ?? []
            });
        } catch (err) {
            console.error("데이터 로드 실패:", err);
            set({ playList: [] });
        }
    },
    fetchMyCustomPlaylists: async () => {
        const { user } = useAuthStore.getState();
        if (!user?.userId) return;

        try {
            const q = query(
                collection(db, "playlists"), 
                where("userId", "==", user.userId),
                where("isDelete", "==", false)
            );
            
            const snapshot = await getDocs(q);
            const playlists = snapshot.docs.map(doc => ({ 
                ...doc.data(), 
                listId: doc.id 
            })) as PlaylistDocument[];
            
            set({ customPlaylists: playlists });
            
            // 가져온 모든 플레이리스트의 비디오 아이디들에 대해 
            // 상세 정보 미리 캐싱하기 (선택 사항)
            playlists.forEach(list => {
                list.videoIds.forEach(key => {
                    const [type, id] = key.split('-');
                    get().fetchMediaDetail(id, type as "movie" | "tv");
                });
            });
        } catch (error) {
            console.error("플레이리스트 로드 실패:", error);
        }
    },
    createMyCustomPlaylist: async (data) => {
        const { user } = useAuthStore.getState();
        if (!user?.userId) return;

        try {
            const newDoc: Omit<PlaylistDocument, 'listId'> = {
                ...data,
                userId: user.userId,
                likesCount: 0,
                createdAt: new Date().toISOString(),
                isDelete: false
            };
            
            const docRef = await addDoc(collection(db, "playlists"), newDoc);
            
            set((state) => ({ 
                customPlaylists: [{ ...newDoc, listId: docRef.id }, ...state.customPlaylists] 
            }));
        } catch (error) {
            console.error("플레이리스트 생성 실패:", error);
            throw error; // 컴포넌트에서 에러 핸들링을 위해 던져줌
        }
    },
    onAddMyList: async (item) => {
        try {
            const authState = useAuthStore.getState();
            const userId = authState.user?.userId;
            const currentProfile = authState.currentProfile;

            if (!userId || !currentProfile) return false;

            const userDocRef = doc(db, "users", userId);
            
            // 1. 현재 파이어스토어의 전체 유저 문서를 가져옵니다.
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) return false;

            const userData = userDocSnap.data();
            const profiles = userData.profile || [];

            // 2. 현재 프로필의 인덱스를 찾습니다.
            const profileIndex = profiles.findIndex((p: any) => p.id === currentProfile.id);
            if (profileIndex === -1) return false;

            // 3. 기존 프로필 데이터는 그대로 유지하고, movies.playlist.playlistVideos만 업데이트합니다.
            const itemKey = getItemKey(makePlayListItem(item));
            
            // 기존 배열에 안전하게 값을 추가
            const updatedProfiles = [...profiles];
            const targetProfile = { ...updatedProfiles[profileIndex] }; // 프로필 복사
            
            // movies와 playlist 객체가 없을 경우를 대비해 구조 보존
            targetProfile.movies = {
                ...targetProfile.movies,
                playlist: {
                    ...targetProfile.movies?.playlist,
                    playlistVideos: [
                        ...(targetProfile.movies?.playlist?.playlistVideos || []),
                        itemKey
                    ]
                }
            };

            updatedProfiles[profileIndex] = targetProfile;

            // 4. 전체 프로필 배열을 업데이트
            await updateDoc(userDocRef, {
                profile: updatedProfiles
            });

            set({ myList: targetProfile.movies?.playlist?.playlistVideos });

            console.log("프로필 데이터 보존하며 성공적으로 업데이트");
            return true;
        } catch (err) {
            console.error("업데이트 실패:", err);
            return false;
        }
    },
    onRemoveMyList: async (id, mediaType) => {
        try {
            const authState = useAuthStore.getState();
            const userId = authState.user?.userId;
            const currentProfile = authState.currentProfile;

            if (!userId || !currentProfile) return false;

            const userDocRef = doc(db, "users", userId);
            const itemKey = getKeyFromParts(id, mediaType);

            // 1. 파이어스토어에서 현재 유저 데이터 전체를 가져옵니다. (데이터 보존을 위해 필수)
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) return false;
            
            const userData = userDocSnap.data();
            const profiles = userData.profile || [];

            // 2. 현재 프로필의 인덱스를 찾습니다.
            const profileIndex = profiles.findIndex((p: any) => p.id === currentProfile.id);
            if (profileIndex === -1) return false;

            // 3. 기존 프로필 배열 복사 및 해당 프로필의 playlistVideos만 수정
            const updatedProfiles = [...profiles];
            const targetProfile = { ...updatedProfiles[profileIndex] };

            // 기존 배열에서 해당 itemKey만 제거
            const currentVideos = targetProfile.movies?.playlist?.playlistVideos || [];
            targetProfile.movies = {
                ...targetProfile.movies,
                playlist: {
                    ...targetProfile.movies?.playlist,
                    playlistVideos: currentVideos.filter((key: string) => key !== itemKey)
                }
            };

            updatedProfiles[profileIndex] = targetProfile;

            // 4. 전체 프로필 배열을 업데이트 (데이터가 사라지지 않도록 전체 배열을 다시 저장)
            await updateDoc(userDocRef, {
                profile: updatedProfiles
            });

            // 5. 로컬 상태(Zustand) 업데이트 (객체 형태 유지)
            set((state) => ({
                myList: state.myList.filter((item) => item !== itemKey)
            }));

            console.log("기존 프로필 정보 보존하며 삭제 완료");
            return true;
        } catch (err) {
            console.error("삭제 실패:", err);
            return false;
        }
    },
    onLoadMyList: async () => {
        try {
            const { user, currentProfile } = useAuthStore.getState();
            if (!user?.userId || !currentProfile) {
                set({ myList: [] }); // 비로그인 시 빈 배열
                return;
            }

            const userDocRef = doc(db, "users", user.userId);
            const snap = await getDoc(userDocRef);
            
            if (snap.exists()) {
                const userData = snap.data();
                const profile = userData.profile.find((p: any) => p.id === currentProfile.id);
                const keys = profile?.movies?.playlist?.playlistVideos || [];
                
                set({ myList: keys });
            }
        } catch (err) {
            console.error("Load failed:", err);
            set({ myList: [] }); // 에러 시 초기화
        }
    },
    onUpdateProgress: async (id, mediaType, progress) => {
        const authState = useAuthStore.getState();
        const userId = authState.user?.userId;
        const currentProfile = authState.currentProfile;
        if (!userId || !currentProfile) return;

        try {
            const userDocRef = doc(db, "users", userId);
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) return;

            const profiles = userDocSnap.data().profile;
            const profileIndex = profiles.findIndex((p: any) => p.id === currentProfile.id);
            const targetProfile = { ...profiles[profileIndex] };

            // 1. progress 업데이트 또는 100% 시 삭제 필터링
            let updatedList = (targetProfile.movies?.watchingVideos || []).map((item: any) => 
                item.id === id && item.mediaType === mediaType 
                    ? { ...item, progress } 
                    : item
            );

            if (progress >= 100) {
                updatedList = updatedList.filter((item: any) => !(item.id === id && item.mediaType === mediaType));
            }

            // 2. 프로필 업데이트
            targetProfile.movies = { ...targetProfile.movies, watchingVideos: updatedList };
            const updatedProfiles = [...profiles];
            updatedProfiles[profileIndex] = targetProfile;

            await updateDoc(userDocRef, { profile: updatedProfiles });
            set({ playList: updatedList });
        } catch (err) {
            console.error("Progress 업데이트 및 자동 삭제 실패:", err);
        }
    },
    onUpdateEpisodeProgress: async (id, mediaType, episodeId, progress) => {
        // 1. Zustand 상태 업데이트
        const updated = get().playList.map((item) =>
            item.id === id && item.mediaType === mediaType
                ? { ...item, episodeProgress: { ...(item.episodeProgress ?? {}), [episodeId]: progress } }
                : item
        );
        set({ playList: updated });

        // 2. Firestore 동기화
        const authState = useAuthStore.getState();
        const userId = authState.user?.userId;
        const currentProfile = authState.currentProfile;
        if (!userId || !currentProfile) return;

        try {
            const userDocRef = doc(db, "users", userId);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) return;

            const profiles = userDoc.data().profile;
            const profileIndex = profiles.findIndex((p: any) => p.id === currentProfile.id);
            
            const updatedProfiles = [...profiles];
            updatedProfiles[profileIndex].movies.watchingVideos = updated;

            await updateDoc(userDocRef, { profile: updatedProfiles });
        } catch (err) {
            console.error("Episode Progress Firestore 동기화 실패:", err);
        }
    },
}));
