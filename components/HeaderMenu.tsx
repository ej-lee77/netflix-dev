"use client";

import { mainMenus, customMenus } from '@/data/mainMenu';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';

// 전체 메뉴 풀 생성 (매핑 처리용)
const allSelectablePool = [...mainMenus, ...customMenus];

export default function HeaderMenu() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const queryString = searchParams.toString();
    const currentUrl = queryString ? `${pathname}?${queryString}` : pathname;

    const isMenuActive = (menuPath: string) => (
        menuPath.includes("?") ? currentUrl === menuPath : pathname === menuPath
    );

    // 사용자가 커스텀 페이지에서 채택하여 빌드한 동적 메뉴 데이터 상태
    const [dynamicMenus, setDynamicMenus] = useState<typeof customMenus>([]);

    const loadCustomMenus = () => {
        const saved = localStorage.getItem("custom_header_menus");
        if (saved) {
            try {
                const savedPaths: string[] = JSON.parse(saved);
                
                // 사용자가 로컬스토리지에 저장한 '순서'대로 헤더에 노출되도록 패스 배열 기준으로 매핑합니다.
                const mapped = savedPaths
                    .map((path) => allSelectablePool.find((m) => m.path === path))
                    .filter((menu): menu is typeof mainMenus[number] => !!menu);

                setDynamicMenus(mapped);
            } catch (e) {
                console.error("메뉴 동기화 실패:", e);
            }
        } else {
            // 저장된 내역이 없을 때 보여줄 가변 메뉴 기본값 리스트
            const defaultPaths = [
                "/category",
                "/mypage/playlist?tab=playlists",
                "/mypage/playhist",
            ];
            const defaultFiltered = allSelectablePool.filter((m) => defaultPaths.includes(m.path));
            setDynamicMenus(defaultFiltered);
        }
    };

    useEffect(() => {
        loadCustomMenus();
        window.addEventListener("customMenuStorageUpdate", loadCustomMenus);
        return () => {
            window.removeEventListener("customMenuStorageUpdate", loadCustomMenus);
        };
    }, []);

    // 홈 메뉴 오브젝트만 별도로 상단 고정을 위해 추출
    const homeMenu = mainMenus.find((m) => m.path === "/");

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
                
                {/* 2. [가변 커스텀] 사용자가 활성화한 메뉴 리스트 (큐레이션, 플리, 시청이력, 장르, 무드가 한곳에 바인딩) */}
                {dynamicMenus.map((menu) => {
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