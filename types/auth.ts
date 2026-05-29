import { type User } from "firebase/auth";

export interface Profile {
  id: number;
  name: string | null;
  imgUrl: string | null;
}

export interface UserInfo extends User {
  profiles?: Profile[] | null;
}

export type FamilyMember = "엄마" | "아빠" | "아들" | "딸";

export interface AuthState {
  user: UserInfo | null;
  currentProfile: Profile | null;
  currentMember: FamilyMember | null;
  onInitAuth: () => void;
  onLogin: (user: UserInfo) => void;
  onLogout: () => Promise<void>;
  onSetProfile: (profile: Profile | null) => void;
  onAddProfile: (profile: Omit<Profile, "id">) => void;
  onUpdateProfile: (profile: Profile) => void;
  onDeleteProfile: (profileId: number) => void;
  onSetMember: (member: FamilyMember) => void;
}

export interface UserProfile {
  nickname: string;
  imgUrl: string;
  viewAge: string;
}

export interface UserGenreStats {
  [genreName: string]: number;
}

export interface PlayList{
  playlistVideos: string[]; // 플레이리스트 영상 ID 목록
  customPlaylists: string[]; // 커스텀 플레이리스트 ID 목록 - 필요없음
}

export interface MovieList {
  watchingVideos: string[];
  wishlist: string[];
  playlist: PlayList;
  genreStats: UserGenreStats;
}

export interface BadgeInfo{
  id: string; //뱃지 아이디
  progress: number; //진행도
  isComplete: boolean; //획득유무
}

export interface BadgeList{
  earnedBadges: BadgeInfo[];   // 획득 뱃지 ID 목록
  equippedBadges: string;  // 장착 뱃지 ID 하나만
}

export interface CommunityList{
  followers: string[];   // 팔로워 유저 ID 목록
  following: string[]; // 팔로잉 유저 ID 목록
  reviews: string[]; //리뷰 ID 목록 내 리뷰 말고 좋아요한거 싫어요 한거 신고한거
  feeds: string[]; //피드 ID 목록 내 피드 말고 
}

export interface UserDocument {
    userId: string; // 문서 ID로 사용됨
    
    // 기본정보
    email: string;
    name: string;
    phoneNumber: string;
    planType: string;
    profile: UserProfile;

    // 영상관련 (기본 필드 형태)
    movies: MovieList;

    // 커뮤니티관련
    community: CommunityList;

    // 메뉴 및 뱃지
    headerMenus: string[];    // 헤더 표시 메뉴 ID 목록
    bages: BadgeList;

    alarm: string[]; //위시리스트에 있는거 빼고 알림 설정한거 영상 리스트
}
