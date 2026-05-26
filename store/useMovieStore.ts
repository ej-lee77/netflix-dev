import { create } from "zustand";
import type { MovieState } from "@/types/movie";

//TMBD키
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY

export const useMovieStore = create<MovieState>((set,get) => ({
    //인기영화를 저장할 변수
    popMovies: [],
    //영화를 불러올 메서드
    onFetchPopular: async () => {
        const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=ko-KR&page=1`);
        const data = await res.json();
        console.log("인기영화?", data.results);
        set({ popMovies: data.results });
    },
    //티비
    //영화의 영상을 저장할 변수 popVideos
    popVideos: {},
    //영화의 영상을 불러올 메서드 onFetchVideo id
    onFetchVideo: async (id) => {
        const movieId = Number(id);
        const { popVideos } = get();

        console.log(movieId)
        if (popVideos[movieId]) return;

        const res = await fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${TMDB_KEY}&language=ko-KR`);
        const data = await res.json();
        console.log("비디오?", id, data.results);
        set((state) => ({
            popVideos: {
                ...state.popVideos,
                [id]: data.results
            }
        }))
    },
    tvs: [],
    tvVideos: {},
    onFetchTvs: async()=>{
        const res = await fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_KEY}&language=ko-KR&page=1`);
        const data = await res.json();
        console.log("인기영화?", data.results);
        set({ tvs: data.results });
    },
    onFetchTvVideos: async(id)=>{
        const tvId = Number(id);
        const { tvVideos } = get();

        console.log("티비아이디", tvId);
        if (tvVideos[tvId]) return;

        const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/videos?api_key=${TMDB_KEY}&language=en-US`);
        const data = await res.json();
        console.log("비디오?", id, data.results);
        set((state) => ({
            tvVideos: {
                ...state.tvVideos,
                [tvId]: data.results
            }
        }))
    },
    seasons: [],
    onFetchSeasons: async(id)=>{
        const res = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_KEY}&language=ko-KR`);
        const data = await res.json();
        console.log("시즌?", data.results);
        set({seasons: data.seasons});
    },
    episodes: [],
    onFetchEpisodes: async(id, season)=>{
        const res = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=${TMDB_KEY}&language=ko-KR`);
        const data = await res.json();
        console.log("에피소드", data.results);
        set({episodes: data.episodes});
    },
    upcomings: [],
    onFetchUpcoming: async()=>{
        const res = await fetch(`https://api.themoviedb.org/3/movie/upcoming?api_key=${TMDB_KEY}&language=ko-KR`);
        const data = await res.json();
        console.log("공개예정", data.results);
        set({upcomings: data.results});
    }
}))