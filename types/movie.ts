//공통타입
export interface MediaBase {
    id: number;
    overview: string;
    backdrop_path: string;
    poster_path: string;
    vote_average: number;
    genre_ids?: number[];
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
    runtime?: number;
    air_date?: string;
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
export interface HighlightItem {
    id: number;
    movieId: number;
    title: string;
    poster_path: string;
    backdrop_path: string;
    videoKey: string;
    videoName: string;
    videoType: string;
}

export interface StillImage {
    file_path: string;
    width: number;
    height: number;
}

//추천작 통합 아이템 (영화/TV 섞어서 다루기 위함)
export interface RecommendedItem extends MediaBase {
    media_type: "movie" | "tv";
    title: string;          //영화: title, TV: name 을 통일해서 담음
    release_date?: string;  //영화 개봉일 or TV 첫방영일
    genre_ids?: number[];   //장르 id 배열 (TMDB)
}

//출연자 (TMDB credits.cast)
export interface CastMember {
    id: number;
    name: string;          //배우 이름
    character: string;     //배역명
    profile_path: string | null;
    order: number;
}

//인기 인물 (TMDB person/popular)
export interface PopularPerson {
    id: number;
    name: string;
    profile_path: string | null;
    known_for_department: string;  // "Acting", "Directing" 등
    popularity: number;
    //가장 유명한 작품들 (첫 번째 작품의 제목을 배역 자리에 표시할 용도)
    known_for: Array<{
        id: number;
        title?: string;       //영화면 title
        name?: string;        //TV면 name
        media_type: "movie" | "tv";
    }>;
}

//전역변수 타입정의
export interface MovieState {
    popMovies: Movie[],
    newMovies: Movie[],
    trendingMovies: Movie[],
    koreanMovies: Movie[],
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
    //각 영화별 스틸컷 백드롭 이미지 캐시
    movieImages: { [movieId: number]: StillImage[] },

    //추천작 (인기 영화 + 인기 TV 섞어서 랜덤)
    recommended: RecommendedItem[],
    //작품별 연관 추천작 캐시: "movie-123" or "tv-456" 키
    mediaRecommended: { [key: string]: RecommendedItem[] },
    mediaDetails: { [key: string]: Movie | TV },
    //작품별 출연진 캐시: "movie-123" or "tv-456" 키
    casts: { [key: string]: CastMember[] },
    //전 세계 인기 인물 (배우/감독) 리스트
    popularPeople: PopularPerson[],
    netflixHighlights: HighlightItem[],

    onFetchPopular: () => Promise<void>,
    onFetchNewest: () => Promise<void>,
    onFetchTrending: () => Promise<void>,
    onFetchKoreanMovies: () => Promise<void>,
    onFetchVideo: (id: string | number) => Promise<void>,

    onFetchTvs: () => Promise<void>,
    onFetchTvVideos: (id: string | number) => Promise<void>,

    onFetchSeasons: (id: string | number) => Promise<void>,
    onFetchEpisodes: (id: number, season: number) => Promise<void>,

    onFetchUpcoming: () => Promise<void>

    onFetchNetflixOriginals: () => Promise<void>,
    onFetchTvImages: (id: string | number) => Promise<void>,
    onFetchMovieImages: (id: string | number) => Promise<void>,

    onFetchRecommended: () => Promise<void>,
    onFetchMediaRecommended: (id: number, mediaType: "movie" | "tv") => Promise<void>,
    onFetchMediaDetail: (id: string | number, mediaType: "movie" | "tv") => Promise<void>,
    onFetchCredits: (id: number, mediaType: "movie" | "tv") => Promise<void>,
    onFetchPopularPeople: () => Promise<void>,
    onFetchNetflixHighlights: () => Promise<void>,

    certifications: { [key: string]: string },
    onFetchCertification: (id: number, mediaType: "movie" | "tv") => Promise<void>,
}
