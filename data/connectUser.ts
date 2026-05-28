export type ConnectUser = {
    id: number;
    nickname: string;
    profileImage: string;
    matchRate: number;
    tags: string[];
    favoriteMovie: {
        title: string;
        poster: string;
        description: string;
    };
};

export const connectUsers: ConnectUser[] = [
    {
        id: 1,
        nickname: "햅번공주",
        profileImage: "https://api.dicebear.com/7.x/notionists/png?seed=audrey",
        matchRate: 92,
        tags: ["따뜻한", "관계", "잔잔한", "현실적인"],
        favoriteMovie: {
            title: "메기",
            poster: "https://image.tmdb.org/t/p/w500/z7dGO98VGECQiYzR1cD9PHaQWJS.jpg",
            description: "좀 더 재미있게 본 작품",
        },
    },
    {
        id: 2,
        nickname: "필름고양이",
        profileImage: "https://api.dicebear.com/7.x/notionists/png?seed=catfilm",
        matchRate: 89,
        tags: ["감성적인", "힐링", "일상", "고요한"],
        favoriteMovie: {
            title: "리틀 포레스트",
            poster: "https://image.tmdb.org/t/p/w500/adoiOpcuBUKeEqfzLqY47VBZN86.jpg",
            description: "반복해서 보게 되는 작품",
        },
    },
    {
        id: 3,
        nickname: "시네마중독",
        profileImage: "https://api.dicebear.com/7.x/notionists/png?seed=cinema",
        matchRate: 84,
        tags: ["미스터리", "몰입감", "반전", "서늘한"],
        favoriteMovie: {
            title: "헤어질 결심",
            poster: "https://image.tmdb.org/t/p/w500/rXEJ28XDQsogIGqwVEgwM2oDdpl.jpg",
            description: "가장 취향에 가까운 작품",
        },
    },
    {
        id: 4,
        nickname: "새벽두시",
        profileImage: "https://api.dicebear.com/7.x/notionists/png?seed=dawn",
        matchRate: 81,
        tags: ["우울한", "여운", "독립영화", "감각적인"],
        favoriteMovie: {
            title: "애프터 양",
            poster: "https://image.tmdb.org/t/p/w500/tDeH8dFeKpHQCRFbs6So05qp6ZJ.jpg",
            description: "오래 기억에 남은 작품",
        },
    },
    {
        id: 5,
        nickname: "무비테라스",
        profileImage: "https://api.dicebear.com/7.x/notionists/png?seed=terrace",
        matchRate: 79,
        tags: ["청춘", "로맨스", "따뜻한", "대화"],
        favoriteMovie: {
            title: "비포 선셋",
            poster: "https://image.tmdb.org/t/p/w500/2k4KFbEeknXmHbNP0qt7lp2p3Y3.jpg",
            description: "가장 많이 추천한 작품",
        },
    },
    {
        id: 6,
        nickname: "엔딩크레딧",
        profileImage: "https://api.dicebear.com/7.x/notionists/png?seed=ending",
        matchRate: 77,
        tags: ["현실적인", "사회문제", "묵직한", "드라마"],
        favoriteMovie: {
            title: "버닝",
            poster: "https://image.tmdb.org/t/p/w500/AlKlezuaJkP2lDEWbJxYv47GeDf.jpg",
            description: "생각이 많아졌던 작품",
        },
    },
    {
        id: 7,
        nickname: "포스터수집가",
        profileImage: "https://api.dicebear.com/7.x/notionists/png?seed=poster",
        matchRate: 74,
        tags: ["비주얼", "예술영화", "몽환적인", "컬러감"],
        favoriteMovie: {
            title: "그랜드 부다페스트 호텔",
            poster: "https://image.tmdb.org/t/p/w500/vsibrPwiJlZHhlrX5f4xFptX3q4.jpg",
            description: "비주얼적으로 가장 좋았던 작품",
        },
    },
    {
        id: 8,
        nickname: "심야상영",
        profileImage: "https://api.dicebear.com/7.x/notionists/png?seed=midnight",
        matchRate: 71,
        tags: ["스릴러", "긴장감", "다크", "몰입"],
        favoriteMovie: {
            title: "나이트 크롤러",
            poster: "https://image.tmdb.org/t/p/w500/wVflplL5OMy8nD1Z7gM64lIRvwa.jpg",
            description: "숨막히게 몰입한 작품",
        },
    },
];
