"use client";

import { useLangStore, type Lang } from "@/store/useLangStore";

// ────────────────────────────────────────────────────────────────────────────
// UI 문구 번역 사전 (단일 소스)
// 새 문구를 번역할 땐 여기 키-값만 추가하고 컴포넌트에서 t("키")로 쓰면 됩니다.
// ────────────────────────────────────────────────────────────────────────────
export const dictionary = {
  ko: {
    // 공통 / 버튼
    "common.play": "재생하기",
    "common.resume": "이어보기",
    "common.detail": "상세정보",
    "common.detailMore": "상세보기",
    "common.wishlist": "위시리스트",
    "common.search": "검색",
    "common.login": "로그인",
    "common.logout": "로그아웃",
    "common.loading": "불러오는 중...",

    // 헤더
    "header.cinema": "시네마 모드",
    "header.connect": "커넥트 모드",
    "header.mypage": "마이페이지",
    "header.profileEdit": "프로필 편집",
    "header.settings": "설정",

    // 푸터
    "footer.companyInfo": "회사 정보",
    "footer.customerCenter": "고객 센터",
    "footer.service": "서비스",
    "footer.media": "미디어",
    "footer.audioGuide": "화면 해설",
    "footer.ir": "투자 정보(IR)",
    "footer.legal": "법적 고지",
    "footer.center": "고객 센터",
    "footer.jobs": "입사 정보",
    "footer.cookies": "쿠키 설정",
    "footer.giftcard": "기프트카드",
    "footer.terms": "이용 약관",
    "footer.company": "회사 정보",
    "footer.mediaCenter": "미디어 센터",
    "footer.privacy": "개인정보",
    "footer.contact": "문의하기",
    "footer.disclaimer": "NETFLIX는 가상의 스트리밍 서비스로, 실제 Netflix와 무관합니다.",

    // 홈 섹션 제목
    "home.top10": "오늘의 넷플릭스 TOP 10",
    "home.koreanSeries": "한국 시리즈 TOP 10",
    "home.koreanVariety": "오늘의 대한민국 TOP 10 예능",
  },
  en: {
    // common / buttons
    "common.play": "Play",
    "common.resume": "Resume",
    "common.detail": "More Info",
    "common.detailMore": "Details",
    "common.wishlist": "Wishlist",
    "common.search": "Search",
    "common.login": "Sign In",
    "common.logout": "Sign Out",
    "common.loading": "Loading...",

    // header
    "header.cinema": "Cinema Mode",
    "header.connect": "Connect Mode",
    "header.mypage": "My Page",
    "header.profileEdit": "Edit Profile",
    "header.settings": "Settings",

    // footer
    "footer.companyInfo": "Company",
    "footer.customerCenter": "Help Center",
    "footer.service": "Service",
    "footer.media": "Media",
    "footer.audioGuide": "Audio Description",
    "footer.ir": "Investor Relations",
    "footer.legal": "Legal Notices",
    "footer.center": "Help Center",
    "footer.jobs": "Jobs",
    "footer.cookies": "Cookie Preferences",
    "footer.giftcard": "Gift Cards",
    "footer.terms": "Terms of Use",
    "footer.company": "Company Info",
    "footer.mediaCenter": "Media Center",
    "footer.privacy": "Privacy",
    "footer.contact": "Contact Us",
    "footer.disclaimer": "NETFLIX is a fictional streaming service and is not affiliated with the real Netflix.",

    // home section titles
    "home.top10": "Today's Netflix TOP 10",
    "home.koreanSeries": "Korean Series TOP 10",
    "home.koreanVariety": "Korea's TOP 10 Variety Shows Today",
  },
} as const;

export type TKey = keyof (typeof dictionary)["ko"];

// 현재 언어로 번역 문자열을 돌려주는 헬퍼 (컴포넌트에서 const t = useT())
export function useT() {
  const lang = useLangStore((s) => s.lang);
  return (key: TKey): string => {
    const table = dictionary[lang] as Record<string, string>;
    return table[key] ?? (dictionary.ko as Record<string, string>)[key] ?? key;
  };
}

// 컴포넌트 밖(스토어/유틸)에서 쓰는 비-Hook 버전
export function translate(key: TKey, lang?: Lang): string {
  const l = lang ?? useLangStore.getState().lang;
  const table = dictionary[l] as Record<string, string>;
  return table[key] ?? (dictionary.ko as Record<string, string>)[key] ?? key;
}

// TMDB API 언어 코드 (콘텐츠 제목/줄거리 언어 전환용)
export function getTmdbLang(): string {
  return useLangStore.getState().lang === "en" ? "en-US" : "ko-KR";
}

// ────────────────────────────────────────────────────────────────────────────
// 사이드 메뉴 라벨 번역 (data/mainMenu.ts 의 한국어 title 을 그대로 키로 사용)
// 데이터 구조를 안 바꾸고, 렌더 시점에 한국어 → 영어로 치환
// ────────────────────────────────────────────────────────────────────────────
const MENU_LABELS_EN: Record<string, string> = {
  "홈": "Home",
  "큐레이션": "Curation",
  "플레이리스트": "Playlist",
  "위시리스트": "Wishlist",
  "시청이력": "Watch History",
  "영화": "Movies",
  "시리즈": "Series",
  "애니메이션": "Animation",
  "커스텀": "Custom",
  "설정": "Settings",
  // 장르
  "액션": "Action",
  "코미디": "Comedy",
  "다큐멘터리": "Documentary",
  "드라마": "Drama",
  "판타지": "Fantasy",
  "공포": "Horror",
  "미스터리": "Mystery",
  "로맨스": "Romance",
  "SF": "Sci-Fi",
  "스릴러": "Thriller",
  "전쟁": "War",
  // 무드
  "잔잔한": "Chill",
  "어두운": "Dark",
  "감성적인": "Emotional",
  "신나는": "Exciting",
  "유쾌한": "Funny",
  "낭만적인": "Romantic",
  "무서운": "Scary",
  "심오한": "Thoughtful",
};

// 한국어 메뉴 title 을 현재 언어로 변환하는 함수 반환
export function useMenuLabel() {
  const lang = useLangStore((s) => s.lang);
  return (koTitle: string): string =>
    lang === "en" ? MENU_LABELS_EN[koTitle] ?? koTitle : koTitle;
}
