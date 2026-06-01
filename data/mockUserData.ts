import { UserDocument } from "@/types/auth";

export const mockUserData: UserDocument = {
  userId: "test_user_123",
  email: "developer@example.com",
  planType: "Premium",
  payment: {
      pay: "", 
      bank: "",  
      num: "", 
      payDate: "",
      nextDate: "" 
    },
  profile:[ {
    id: 1,
    nickname: "방구석시네필",
    imgUrl: "/images/avatar/default.png",
    viewAge: "19",
    // 영상 및 커뮤니티 관련 리스트 (기존 설계용 빈 객체 처리)
    movies: {
        watchingVideos: [],
        wishlist: [], 
        playlist: {
          playlistVideos: [],
          customPlaylists: [] 
        },
        genreStats: { "action": 12, "comedy": 5 }
    }, 
    community: {
      followers: [],
      following: [],
      reviews: [], 
      feeds: []
    },

    // 메뉴 리스트
    headerMenus: ["home", "movies", "my-list"],

    // 💡 실시간 뱃지 진행 상태 데이터 (테스트의 핵심!)
    bages: {
      // 현재 대표 칭호로 장착한 뱃지 ID (정주행 마스터)
      equippedBadges: "binge_master", 

      earnedBadges: [
        // 1. 이미 획득 완료한 뱃지들 (isComplete: true)
        {
          id: "first_streaming",
          progress: 1,
          isComplete: true
        },
        {
          id: "binge_master", // 💡 장착까지 된 상태
          progress: 12, // 이미 많이 완주함
          isComplete: true
        },
        {
          id: "genre_action",
          progress: 25, // 목표치인 20을 넘긴 상태
          isComplete: true
        },
        {
          id: "social_reviewer",
          progress: 1,
          isComplete: true
        },

        // 2. 현재 열심히 달성 중인 뱃지들 (isComplete: false, 게이지 바 노출 테스트용)
        {
          id: "7days_attendance",
          progress: 5, // 💡 UI에서 5 / 7 진행 중으로 표시됨
          isComplete: false
        },
        {
          id: "genre_animation",
          progress: 12, // 💡 UI에서 12 / 20 진행 중으로 표시됨
          isComplete: false
        },
        {
          id: "genre_horror",
          progress: 2, // 💡 UI에서 2 / 20 진행 중으로 표시됨
          isComplete: false
        },
        {
          id: "culture_k_drama",
          progress: 18, // 💡 완료 임박! 18 / 20 진행 중
          isComplete: false
        },
        {
          id: "social_connect_star",
          progress: 45, // 💡 커뮤니티 활동 진행 중 (목표치 total 설정에 따라 게이지 노출)
          isComplete: false
        },

        // 3. 아직 시작도 안 한 뱃지 (progress: 0, 게이지 바 0% 테스트용)
        {
          id: "genre_war",
          progress: 0,
          isComplete: false
        }
      ]
    },
    
    alarm: ["movie_id_999", "movie_id_888"]

  }]
};