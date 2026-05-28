import type { Movie, TV } from "./movie";

export interface PlayListItem{
    id: number;
    title: string;
    // name?: string;
    poster_path: string;
    backdrop_path?: string;
    mediaType: "movie" | "tv";
    playTime: string;
}

export interface PlayListState{
    playList: PlayListItem[],
    myList: PlayListItem[],
    onAddPlayList: (item: Movie | TV)=>Promise<boolean>,
    onRemovePlayList: (id: number, mediaType: "movie" | "tv")=>Promise<boolean>,
    onLoadPlayList: ()=>Promise<void>,
    onAddMyList: (item: Movie | TV)=>Promise<boolean>,
    onRemoveMyList: (id: number, mediaType: "movie" | "tv")=>Promise<boolean>,
    onLoadMyList: ()=>Promise<void>
}
