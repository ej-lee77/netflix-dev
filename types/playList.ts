import type { Movie, TV } from "./movie";

export interface PlayListItem{
    id: number;
    title: string;
    // name?: string;
    poster_path: string;
    mediaType: "movie" | "tv";
    playTime: string;
}

export interface PlayListState{
    playList: PlayListItem[],
    onAddPlayList: (item: Movie | TV)=>Promise<void>,
    onLoadPlayList: ()=>Promise<void>
}