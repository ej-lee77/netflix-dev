import type { Movie, TV } from "./movie";

export interface PlayListItem{
    id: number;
    title?: string;
    // name?: string;
    poster_path: string;
    backdrop_path?: string;
    mediaType: "movie" | "tv";
    playTime: string;
    progress?: number; // 0~100
    episodeProgress?: Record<number, number>; // episodeId → 0~100
}

export interface PlayListState{
    playList: PlayListItem[],
    myList: string[],
    customPlaylists: PlaylistDocument[],
    onAddPlayList: (item: Movie | TV)=>Promise<boolean>,
    onRemovePlayList: (id: number, mediaType: "movie" | "tv")=>Promise<boolean>,
    onLoadPlayList: ()=>Promise<void>,
    onAddMyList: (item: Movie | TV, mediaType?: "movie" | "tv")=>Promise<boolean>,
    onRemoveMyList: (id: number, mediaType: "movie" | "tv")=>Promise<boolean>,
    onLoadMyList: ()=>Promise<void>,
    onUpdateProgress: (id: number, mediaType: "movie" | "tv", progress: number)=>void,
    onUpdateEpisodeProgress: (id: number, mediaType: "movie" | "tv", episodeId: number, progress: number)=>void,
    createMyCustomPlaylist: (data: any)=>Promise<void>,
}

// 플리 타입
export interface PlaylistDocument {
  listId: string;          // 플레이리스트 고유 ID (Firestore Document ID)
  name: string;            // 리스트 이름
  content: string;         // 리스트 설명
  videoIds: string[];      // 영상 아이디 리스트 (배열 형태)
  isShare: boolean;        // 공개여부
  tags: string[];          // 태그 (장르, 무드)
  likesCount: number;      // 좋아요
  createdAt: string;
  isDelete: boolean;

  // 파이어베이스 연동 및 관리를 위한 필수 확장 필드
  userId: string;         // 플레이리스트 생성자 (유저 ID)
}
