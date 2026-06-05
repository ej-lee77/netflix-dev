"use client";

import { mainMenus, customMenus } from '@/data/mainMenu';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

// 전체 메뉴 풀 생성 (매핑 처리용)
const CATEGORY_MENU = {
    title: "카테고리",
    imgUrl: "/images/header/menu/category.png",
    path: "/category?tab=all",
};
const allSelectablePool = [...mainMenus, CATEGORY_MENU, ...customMenus];
const DEFAULT_HEADER_MENU_PATHS = [
    "/category",
    "/category?tab=all",
    "/mypage/playlist?tab=playlists",
    "/mypage/playlist?tab=history",
];
const normalizeMenuPath = (path: string) =>
    path === "/mypage/playhist" ? "/mypage/playlist?tab=history" : path;
const uniqueMenuPaths = (paths: string[]) => Array.from(new Set(paths.map(normalizeMenuPath)));
const isCategoryMenuPath = (path: string) => (
    path.startsWith("/category?") || path.startsWith("/genre/") || path.startsWith("/mood/")
);
const ensureCategoryMenuPath = (paths: string[]) => {
    const normalizedPaths = uniqueMenuPaths(paths);
    const hasCategoryMenu = normalizedPaths.includes(CATEGORY_MENU.path);
    const hasCategoryChildren = normalizedPaths.some(
        (path) => path !== CATEGORY_MENU.path && isCategoryMenuPath(path)
    );

    if (hasCategoryMenu || !hasCategoryChildren) {
        return normalizedPaths;
    }

    const firstCategoryIndex = normalizedPaths.findIndex(isCategoryMenuPath);
    const insertIndex = firstCategoryIndex === -1 ? normalizedPaths.length : firstCategoryIndex;
    const nextPaths = [...normalizedPaths];
    nextPaths.splice(insertIndex, 0, CATEGORY_MENU.path);

    return nextPaths;
};

export default function HeaderMenu() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentProfile = useAuthStore((state) => state.currentProfile);
    const [, setStorageRevision] = useState(0);

    const queryString = searchParams.toString();
    const currentUrl = queryString ? `${pathname}?${queryString}` : pathname;

    const isMenuActive = (menuPath: string) => (
        menuPath.includes("?") ? currentUrl === menuPath : pathname === menuPath
    );

    const dynamicMenus = (() => {
        if (currentProfile) {
            const profileMenuPaths = currentProfile.headerMenus?.length
                ? ensureCategoryMenuPath(currentProfile.headerMenus)
                : DEFAULT_HEADER_MENU_PATHS;
            return profileMenuPaths
                .map((path) => allSelectablePool.find((m) => m.path === path))
                .filter((menu): menu is typeof mainMenus[number] => !!menu);
        }

        if (typeof window === "undefined") {
            return DEFAULT_HEADER_MENU_PATHS
                .map((path) => allSelectablePool.find((m) => m.path === path))
                .filter((menu): menu is typeof mainMenus[number] => !!menu);
        }

        const saved = localStorage.getItem("custom_header_menus");
        if (saved) {
            try {
                const savedPaths: string[] = JSON.parse(saved);
                const normalizedPaths = ensureCategoryMenuPath(savedPaths);
                
                // 사용자가 로컬스토리지에 저장한 '순서'대로 헤더에 노출되도록 패스 배열 기준으로 매핑합니다.
                return normalizedPaths
                    .map((path) => allSelectablePool.find((m) => m.path === path))
                    .filter((menu): menu is typeof mainMenus[number] => !!menu);
            } catch (e) {
                console.error("메뉴 동기화 실패:", e);
            }
        }

        // 저장된 내역이 없을 때 보여줄 가변 메뉴 기본값 리스트
        return DEFAULT_HEADER_MENU_PATHS
            .map((path) => allSelectablePool.find((m) => m.path === path))
            .filter((menu): menu is typeof mainMenus[number] => !!menu);
    })();

    useEffect(() => {
        const handleCustomMenuStorageUpdate = () => {
            setStorageRevision((revision) => revision + 1);
        };

        window.addEventListener("customMenuStorageUpdate", handleCustomMenuStorageUpdate);
        return () => {
            window.removeEventListener("customMenuStorageUpdate", handleCustomMenuStorageUpdate);
        };
    }, []);

    // 홈 메뉴 오브젝트만 별도로 상단 고정을 위해 추출
    const homeMenu = mainMenus.find((m) => m.path === "/");
    const categoryChildren = dynamicMenus.filter((menu) =>
        menu.path !== CATEGORY_MENU.path && isCategoryMenuPath(menu.path)
    );
    const defaultCategoryChildren = mainMenus.filter((menu) =>
        menu.path.startsWith("/category?")
    );
    const categoryPanelMenus = categoryChildren.length > 0
        ? categoryChildren
        : defaultCategoryChildren;
    const categoryParent = dynamicMenus.find((menu) => menu.path === CATEGORY_MENU.path);
    const isCategoryActive = categoryParent
        ? isMenuActive(categoryParent.path) || categoryPanelMenus.some((menu) => isMenuActive(menu.path))
        : false;

    return (
        <nav>
            <div className="main-menu sidebar-icons">
                {/* 1. [절대 고정] 언제나 상단에 고정되는 '홈' 메뉴 */}
                {homeMenu && (
                    <div className={`sb-icon ${isMenuActive(homeMenu.path) ? 'active' : ''}`}>
                        <Link href={homeMenu.path}>
                            <Image src={homeMenu.imgUrl} alt={homeMenu.title} width="24" height="24" />
                            <span className='sb-label'>{homeMenu.title}</span>
                        </Link>
                    </div>
                )}
                
                <div className="sb-divider"></div>
                
                {/* 2. [가변 커스텀] 사용자가 활성화한 메뉴 리스트 (큐레이션, 플리, 시청이력, 카테고리 대표가 한곳에 바인딩) */}
                {dynamicMenus.map((menu) => {
                    if (menu.path !== CATEGORY_MENU.path && isCategoryMenuPath(menu.path)) {
                        return null;
                    }

                    if (menu.path === CATEGORY_MENU.path) {
                        return (
                            <div key={menu.path} className={`sb-icon sb-category-group ${isCategoryActive ? 'active' : ''}`}>
                                <Link href={menu.path}>
                                    <Image src={menu.imgUrl} alt={menu.title} width="24" height="24" />
                                    <span className='sb-label'>{menu.title}</span>
                                </Link>

                                {categoryPanelMenus.length > 0 && (
                                    <div className="category-hover-panel">
                                        {categoryPanelMenus.map((childMenu) => {
                                            const isActive = isMenuActive(childMenu.path);

                                            return (
                                                <div key={childMenu.path} className={`category-hover-icon ${isActive ? 'active' : ''}`}>
                                                    <Link href={childMenu.path}>
                                                        <Image src={childMenu.imgUrl} alt={childMenu.title} width="24" height="24" />
                                                        <span className="sb-label">{childMenu.title}</span>
                                                    </Link>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    const isActive = isMenuActive(menu.path);
                    return (
                        <div key={menu.path} className={`sb-icon ${isActive ? 'active' : ''}`}>
                            <Link href={menu.path}>
                                <Image src={menu.imgUrl} alt={menu.title} width="24" height="24" />
                                <span className='sb-label'>{menu.title}</span>
                            </Link>
                        </div>
                    );
                })}
                
                <div className="sb-divider"></div>
                
                {/* 3. [고정] 커스텀 관리 기어 진입 버튼 */}
                <div className={`sb-icon ${pathname === '/menu/custom' ? 'active' : ''}`}>
                    <Link href="/menu/custom">
                        <Image src="/images/header/menu/custom.svg" alt="설정" width="24" height="24" />
                        <span className='sb-label'>커스텀</span>
                    </Link>
                </div>
            </div>
            
            {/* 4. [고정] 최하단 환경 설정 링크 */}
            <div className={`sb-icon sb-bottom ${pathname === '/settings' ? 'active' : ''}`}>
                <Link href="/settings">
                    <Image src="/images/header/menu/setting.svg" alt="설정" width="24" height="24" />
                    <span className='sb-label'>설정</span>
                </Link>
            </div>
        </nav>
    );
}
