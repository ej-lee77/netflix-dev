'use cilent';

import { mainMenus, customMenus } from '@/data/mainMenu'
import React, { useState, useEffect } from 'react';
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation';

export default function HeaderMenu() {
    const pathname = usePathname();

    // 🌟 랜덤으로 뽑힌 3개의 메뉴를 저장할 상태(State)
    const [randomMenus, setRandomMenus] = useState<typeof customMenus>([]);

    // 🌟 컴포넌트가 마운트될 때(처음 로드될 때) 딱 한 번만 실행
    useEffect(() => {
        const shuffled = [...customMenus]
        .sort(() => Math.random() - 0.5) // 배열 순서를 무작위로 섞기
        .slice(0, 3);                    // 앞에서부터 3개만 자르기
        
        setRandomMenus(shuffled);
    }, []);

    return (
        <nav>
            <div className="main-menu sidebar-icons">
                {mainMenus.map((menu)=>{
                    const isActive = pathname === menu.path;
                    return(
                    <div key={menu.title} className={`sb-icon ${isActive ? 'active' : ''}`}>
                        <Link href={menu.path}>
                            <Image src={menu.imgUrl} alt={menu.title} width="24" height="24" />
                            <span className='sb-label'>{menu.title}</span>
                        </Link>
                    </div>
                )})}
                <div className="sb-divider"></div>
                {randomMenus.map((menu)=>{
                    const isActive = pathname === menu.path;
                    return(
                    <div key={menu.title} className={`sb-icon ${isActive ? 'active' : ''}`}>
                        <Link href={menu.path}>
                            <Image src={menu.imgUrl} alt={menu.title} width="24" height="24" />
                            <span className='sb-label'>{menu.title}</span>
                        </Link>
                    </div>
                )})}
                <div className="sb-divider"></div>
                <div className={`sb-icon ${pathname === '/menu/custom' ? 'active' : ''}`}>
                    <Link href="/menu/custom">
                        <Image src="/images/header/menu/custom.svg" alt="설정" width="24" height="24" />
                        <span className='sb-label'>커스텀</span>
                    </Link>
                </div>
            </div>
            <div className={`sb-icon sb-bottom ${pathname === '/settings' ? 'active' : ''}`}>
                <Link href="/">
                    <Image src="/images/header/menu/setting.svg" alt="설정" width="24" height="24" />
                    <span className='sb-label'>설정</span>
                </Link>
            </div>
        </nav>
    )
}
