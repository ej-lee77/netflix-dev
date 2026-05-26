import { create } from "zustand";
import type { MovieState } from "@/types/movie";

//TMBD키
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY

export const useMovieStore = create<MovieState>((set, get) => ({
    //인기영화를 저장할 변수
    popMovies: [],
    //영화를 불러올 메서드
    onFetchPopular: async () => {
        const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=ko-KR&page=1`);
        const data = await res.json();
        console.log("인기영화?", data.results);
        set({ popMovies: data.results });
    },

    //==============최신 영화 받아오기==============
    //최신영화를 저장할 변수
    newMovies: [],
    //최신 영화 불러오기
    onFetchNewest: async () => {
        const res = await fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_KEY}&language=ko-KR&page=1`);
        const data = await res.json();
        console.log("최신영화?", data.results);
        set({ newMovies: data.results });
    },

    //==============급상승 영화 받아오기==============
    //급상승 영화를 저장할 변수
    trendingMovies: [],
    //최신 영화 불러오기 (day기준)
    onFetchTrending: async () => {
        const res = await fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_KEY}&language=ko-KR&page=1`);
        const data = await res.json();
        console.log("급상승 영화?", data.results);
        set({ trendingMovies: data.results });
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
    onFetchTvs: async () => {
        const res = await fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_KEY}&language=ko-KR&page=1`);
        const data = await res.json();
        console.log("인기영화?", data.results);
        set({ tvs: data.results });
    },
    onFetchTvVideos: async (id) => {
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
    onFetchSeasons: async (id) => {
        const res = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_KEY}&language=ko-KR`);
        const data = await res.json();
        console.log("시즌?", data.results);
        set({ seasons: data.seasons });
    },
    episodes: [],
    onFetchEpisodes: async (id, season) => {
        const res = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=${TMDB_KEY}&language=ko-KR`);
        const data = await res.json();
        console.log("에피소드", data.results);
        set({ episodes: data.episodes });
    },
    upcomings: [],
    onFetchUpcoming: async () => {
        const res = await fetch(`https://api.themoviedb.org/3/movie/upcoming?api_key=${TMDB_KEY}&language=ko-KR`);
        const data = await res.json();
        console.log("공개예정", data.results);
        set({ upcomings: data.results });
    },
    //넷플릭스 오리지널: TMDB discover 사용, with_networks=213 (Netflix)
    netflixOriginals: [],
    onFetchNetflixOriginals: async () => {
        //페이지를 1~3 사이에서 랜덤으로 뽑아서 매번 다른 결과가 나오도록
        const randomPage = Math.floor(Math.random() * 3) + 1;
        const res = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_KEY}&language=ko-KR&with_networks=213&sort_by=popularity.desc&page=${randomPage}`);
        const data = await res.json();
        //가져온 결과를 한 번 더 셔플 해서 랜덤성 강화
        const shuffled = [...(data.results || [])].sort(() => Math.random() - 0.5);
        console.log("넷플릭스 오리지널", shuffled);
        set({ netflixOriginals: shuffled });
    },
    //스틸컷(백드롭) 가져오기
    tvImages: {},
    onFetchTvImages: async (id) => {
        const tvId = Number(id);
        const { tvImages } = get();
        if (tvImages[tvId]) return;
        //include_image_language=null,en,ko 로 다양한 이미지 확보
        const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/images?api_key=${TMDB_KEY}&include_image_language=null,en,ko`);
        const data = await res.json();
        console.log("스틸컷", tvId, data.backdrops);
        set((state) => ({
            tvImages: {
                ...state.tvImages,
                [tvId]: data.backdrops || []
            }
        }))
    },
    //추천작: 인기 영화 + 인기 TV 를 합쳐서 셔플
    recommended: [],
    onFetchRecommended: async () => {
        //영화/TV 인기 페이지를 랜덤으로 한 페이지씩 받아오기 (1~3)
        const moviePage = Math.floor(Math.random() * 3) + 1;
        const tvPage = Math.floor(Math.random() * 3) + 1;

        const [movieRes, tvRes] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=ko-KR&page=${moviePage}`),
            fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_KEY}&language=ko-KR&page=${tvPage}`)
        ]);
        const movieData = await movieRes.json();
        const tvData = await tvRes.json();

        //영화는 title/release_date 그대로, TV는 name->title / first_air_date->release_date 로 통일
        const movies = (movieData.results || []).map((m: any) => ({
            ...m,
            media_type: "movie" as const,
            title: m.title,
            release_date: m.release_date
        }));
        const tvs = (tvData.results || []).map((t: any) => ({
            ...t,
            media_type: "tv" as const,
            title: t.name,
            release_date: t.first_air_date
        }));

        //영화/TV 합치고 셔플 후 상위 N개만 사용
        const merged = [...movies, ...tvs].sort(() => Math.random() - 0.5).slice(0, 12);
        console.log("추천작", merged);
        set({ recommended: merged });
    },
    //작품 출연진/감독 캐시
    casts: {},
    onFetchCredits: async (id, mediaType) => {
        const key = `${mediaType}-${id}`;
        const { casts } = get();
        if (casts[key]) return;
        const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/${id}/credits?api_key=${TMDB_KEY}&language=ko-KR`);
        const data = await res.json();
        console.log("출연진", key, data.cast);
        set((state) => ({
            casts: {
                ...state.casts,
                [key]: data.cast || []
            }
        }));
    }
}))