//공통타입
export interface MediaBase {
    id: number;
    overview: string;
    backdrop_path: string;
    poster_path: string;
    vote_average: number;
}
//영화타입
export interface Movie extends MediaBase {
    title: string;
    release_date: string;
}
//TV타입
export interface TV extends MediaBase {
    name: string;
}
//시즌
export interface Season {
    id: number;
    name: string;
    overview: string;
    season_number: number;
    poster_path: string;
}
//에피소드
export interface Episodes {
    id: number;
    name: string;
    overview: string;
    still_path: string;
    episode_number: number;
}
//비디오타입
export interface Video {
    id: string;
    key: string;//youtube key
    name: string;
    site: string; //youtube, vimeo
    type: string;
    //Trailer(정식 홍보 영상)
    //Teaser(맛보기 영상),
    //Featurette(메이킹, 비하인드 장면)
    //Behind th Scenes(찰영스태프)
}

//스틸컷 (TMDB images 응답의 backdrops 배열의 한 항목)
export interface StillImage {
    file_path: string;
    width: number;
    height: number;
}

//전역변수 타입정의
export interface MovieState {
    popMovies: Movie[],
    // #####수정됨
    popVideos: { [movieId: number]: Video[] },

    tvs: TV[],
    tvVideos: { [tvId: number]: Video[] },

    seasons: Season[],
    episodes: Episodes[],

    upcomings: Movie[],
    //넷플릭스 오리지널(provider id 213) TV 리스트
    netflixOriginals: TV[],
    //각 TV별 스틸컷 백드롭 이미지 캐시
    tvImages: { [tvId: number]: StillImage[] },

    onFetchPopular: () => Promise<void>,
    onFetchVideo: (id: string | number) => Promise<void>,

    onFetchTvs: () => Promise<void>,
    onFetchTvVideos: (id: string | number) => Promise<void>,

    onFetchSeasons: (id: string | number)=>Promise<void>,
    onFetchEpisodes: (id: number, season: number)=>Promise<void>,

    onFetchUpcoming: ()=>Promise<void>

    onFetchNetflixOriginals: () => Promise<void>,
    onFetchTvImages: (id: string | number) => Promise<void>
}