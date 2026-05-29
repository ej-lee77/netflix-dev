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

export interface PlayList {
  playlistVideos: string[];
  customPlaylists: string[];
}

export interface MovieList {
  watchingVideos: string[];
  wishlist: string[];
  playlist: PlayList;
  genreStats: UserGenreStats;
}

export interface CommunityList {
  earnedBadges: string[];
  equippedBadges: string;
}

export interface BadgeList {
  followers: string[];
  following: string[];
  reviews: string[];
  feeds: string[];
}

export interface UserDocument {
  userId: string;
  email: string;
  name: string;
  phoneNumber: string;
  planType: string;
  profile: UserProfile;
  movies: MovieList;
  community: CommunityList;
  headerMenus: string[];
  bages: BadgeList;
}
