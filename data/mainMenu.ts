import { mainMenu } from "@/types/mainMenu";

export const mainMenus:mainMenu[] = [
    {
        title: "홈",
        imgUrl: "/images/header/menu/home.svg",
        path: "/"
    },
    {
        title: "재생목록",
        imgUrl: "/images/header/menu/playlist.svg",
        path: "/mypage/playlist"
    },
    {
        title: "위시리스트",
        imgUrl: "/images/header/menu/wishlist.svg",
        path: "/mypage/wishlist"
    },
    {
        title: "시청이력",
        imgUrl: "/images/header/menu/playhist.svg",
        path: "/mypage/playhist"
    },
    {
        title: "마이페이지",
        imgUrl: "/images/header/menu/mypage.svg",
        path: "/mypage"
    }
]