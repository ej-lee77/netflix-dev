// 커넥트 모드 "추천하는 플레이리스트" 더미 데이터
// - 카드 콜라주는 posters 사용
// - 카드 클릭 시 /playlist/{userId}/{listId} 상세로 이동하며, videoIds(실제 TMDB ID)로 작품을 resolve
//   videoIds 형식: "movie-{id}" / "tv-{id}"  (유명 작품 ID라 상세/재생하기까지 연결됨. 필요시 교체 가능)

const IMG = "https://image.tmdb.org/t/p/w342";

export interface DummyPlaylist {
  userId: string;
  listId: string;
  nickname: string;
  category: "영화" | "시리즈" | "애니메이션";
  name: string;
  content: string;
  featuredMovieTitle: string;
  tags: string[];
  isShare: boolean;
  posters: string[];
  videoIds: string[];
}

export const dummyPlaylists: DummyPlaylist[] = [
  {
    userId: "dummy-1",
    listId: "dummy-list-1",
    nickname: "햅번공주",
    category: "영화",
    name: "햅번공주님의 추천작품",
    content: "여운이 오래 남는 인생 영화 모음.",
    featuredMovieTitle: "기생충",
    tags: ["감성적인", "심오한"],
    isShare: true,
    posters: [
      `${IMG}/z7dGO98VGECQiYzR1cD9PHaQWJS.jpg`,
      `${IMG}/qJ2tW6WMUDux911r6m7haRef0WH.jpg`,
      `${IMG}/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg`,
      `${IMG}/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg`,
    ],
    videoIds: ["movie-496243", "movie-155", "movie-27205", "movie-157336"],
  },
  {
    userId: "dummy-2",
    listId: "dummy-list-2",
    nickname: "시네마중독",
    category: "시리즈",
    name: "시네마중독님의 추천작품",
    content: "정주행 각 나오는 시리즈만 모았어요.",
    featuredMovieTitle: "기묘한 이야기",
    tags: ["어두운", "신나는"],
    isShare: true,
    posters: [
      `${IMG}/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg`,
      `${IMG}/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg`,
      `${IMG}/9PFonBhy4cQy7Jz20NpMygczOkv.jpg`,
      `${IMG}/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg`,
    ],
    videoIds: ["tv-66732", "tv-93405", "tv-119051", "tv-70523"],
  },
  {
    userId: "dummy-3",
    listId: "dummy-list-3",
    nickname: "새벽두시",
    category: "애니메이션",
    name: "새벽두시님의 추천작품",
    content: "잠 안 오는 밤에 보는 애니메이션.",
    featuredMovieTitle: "아케인",
    tags: ["감성적인", "잔잔한"],
    isShare: true,
    posters: [
      `${IMG}/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg`,
      `${IMG}/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg`,
      `${IMG}/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg`,
      `${IMG}/jDQPkgzerGophKRRn7MKm071vCU.jpg`,
    ],
    videoIds: ["tv-94605", "movie-569094", "movie-129", "movie-508883"],
  },
  {
    userId: "dummy-4",
    listId: "dummy-list-4",
    nickname: "필름고양이",
    category: "영화",
    name: "필름고양이님의 추천작품",
    content: "한 번쯤은 꼭 봐야 할 명작들.",
    featuredMovieTitle: "조커",
    tags: ["어두운", "심오한"],
    isShare: true,
    posters: [
      `${IMG}/2CAL2433ZeIihfX1Hb2139CX0pW.jpg`,
      `${IMG}/hEjK9A9BkNXejFW4tfacVAEHtkn.jpg`,
      `${IMG}/6DrHO1jr3qVrViUO6s6kFiAGM7.jpg`,
      `${IMG}/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg`,
    ],
    videoIds: ["movie-475557", "movie-603", "movie-550", "movie-238"],
  },
  {
    userId: "dummy-5",
    listId: "dummy-list-5",
    nickname: "무비테라스",
    category: "시리즈",
    name: "무비테라스님의 추천작품",
    content: "몰입감 최고의 화제작 시리즈.",
    featuredMovieTitle: "브레이킹 배드",
    tags: ["어두운", "신나는"],
    isShare: true,
    posters: [
      `${IMG}/7PRddO7z7mcPi21nZTCMGShAyy1.jpg`,
      `${IMG}/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg`,
      `${IMG}/reEMJA1uzscCbkpeRJeTT2bjqUp.jpg`,
      `${IMG}/l2ezB41chGDjXcKo24lseuXYtKP.jpg`,
    ],
    videoIds: ["tv-1396", "tv-1399", "tv-71446", "tv-71912"],
  },
  {
    userId: "dummy-6",
    listId: "dummy-list-6",
    nickname: "엔딩크레딧",
    category: "애니메이션",
    name: "엔딩크레딧님의 추천작품",
    content: "엔딩까지 완벽한 애니메이션.",
    featuredMovieTitle: "너의 이름은.",
    tags: ["신나는", "감성적인"],
    isShare: true,
    posters: [
      `${IMG}/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg`,
      `${IMG}/f4oZTcfGrVTXKTWg157AwikXqmP.jpg`,
      `${IMG}/ygGmAO60t8GyqUo9xYeYxSZAR3b.jpg`,
      `${IMG}/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg`,
    ],
    videoIds: ["movie-372058", "tv-85937", "tv-1429", "tv-95479"],
  },
  {
    userId: "dummy-7",
    listId: "dummy-list-7",
    nickname: "포스터수집가",
    category: "영화",
    name: "포스터수집가님의 추천작품",
    content: "감독의 색깔이 진한 작품들.",
    featuredMovieTitle: "위플래쉬",
    tags: ["감성적인", "심오한"],
    isShare: true,
    posters: [
      `${IMG}/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg`,
      `${IMG}/3bhkrj58Vtu7enYsRolD1fZdja1.jpg`,
      `${IMG}/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg`,
      `${IMG}/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg`,
    ],
    videoIds: ["movie-244786", "movie-313369", "movie-13", "movie-278"],
  },
  {
    userId: "dummy-8",
    listId: "dummy-list-8",
    nickname: "심야상영",
    category: "시리즈",
    name: "심야상영님의 추천작품",
    content: "밤새 정주행하게 되는 시리즈.",
    featuredMovieTitle: "미스터 로봇",
    tags: ["어두운", "무서운"],
    isShare: true,
    posters: [
      `${IMG}/bQLrHIRNEkE3PdIWQrZHynQZazu.jpg`,
      `${IMG}/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg`,
      `${IMG}/6kbAMLteGO8yyewYau6bJ683sw7.jpg`,
      `${IMG}/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg`,
    ],
    videoIds: ["tv-42009", "tv-100088", "tv-119051", "tv-66732"],
  },
  {
    userId: "dummy-9",
    listId: "dummy-list-9",
    nickname: "씨네필",
    category: "애니메이션",
    name: "씨네필님의 추천작품",
    content: "지브리 감성 가득한 명작 모음.",
    featuredMovieTitle: "센과 치히로의 행방불명",
    tags: ["잔잔한", "감성적인"],
    isShare: true,
    posters: [
      `${IMG}/4Y1WNkd88JXmGfhtWR7dmDAo1T2.jpg`,
      `${IMG}/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg`,
      `${IMG}/e1mjopzAS2KNsvpbpahQ1a6SkSn.jpg`,
      `${IMG}/wVflplL5OMy8nD1Z7gM64lIRvwa.jpg`,
    ],
    videoIds: ["movie-129", "movie-4935", "movie-128", "movie-8392"],
  },
  {
    userId: "dummy-10",
    listId: "dummy-list-10",
    nickname: "무드등",
    category: "영화",
    name: "무드등님의 추천작품",
    content: "분위기 잡고 싶을 때 보는 영화.",
    featuredMovieTitle: "인터스텔라",
    tags: ["심오한", "어두운"],
    isShare: true,
    posters: [
      `${IMG}/5KCVkau1HEl7ZzfPsKAPM0sMiKc.jpg`,
      `${IMG}/q719jXXEzOoYaps6babgKnONONX.jpg`,
      `${IMG}/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg`,
      `${IMG}/l8HyObVj8fPrzacAPtGWWLDhcfh.jpg`,
    ],
    videoIds: ["movie-157336", "movie-27205", "movie-577922", "movie-374720"],
  },
];
