"use client";
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import HeaderMenu from './HeaderMenu'
import { useAuthStore } from '@/store/useAuthStore'
import { Profile } from '@/types/auth';
import "./css/header.css"

export default function Header() {
    const {user, onLogout} = useAuthStore();
    const [currentProfile, setCurrentProfile] = useState(user?.profiles?.[0] || null);

    // 프로필을 변경하는 함수
    const handleProfileChange = (selectedProfile:Profile) => {
        setCurrentProfile(selectedProfile);
    };

    return (
        <>
            <header>
            <div className='flex-item'>
                <div  className='flex-item gap-4'>
                    <h1>
                        <Link href="/"><Image src="/images/logo-icon.svg" alt="netflix" width="40" height="40" /></Link>
                    </h1>
                    <ul className='mode-menu flex-item gap-4'>
                        <li>방구석모드</li>
                        <li>커넥트모드</li>
                    </ul>
                </div>
                <ul className='gnb-menu flex-item gap-4'>
                    <li>
                        <Link href="/search"><Image src="/images/header/search.svg" alt="검색" width="24" height="24" /></Link>
                    </li>
                    <li>
                        <Link href="/alarm"><Image src="/images/header/alarm.svg" alt="알림" width="24" height="24" /></Link>
                    </li>
                    {!user ? (
                        <li>
                            <Link href="/login">
                                <Image src="/images/header/login.svg"  alt="로그인" width="24" height="24"/>
                                {/* <span>로그인</span> */}
                            </Link>
                        </li>
                    ):(
                        <li>
                            {/* 메인: 현재 선택된 프로필 */}
                            <div className="main-profile">
                                <Image 
                                    src={currentProfile?.imgUrl ?? "/images/profile/normal.svg"} 
                                    alt={currentProfile?.name ?? "프로필이름"} 
                                    width="40" 
                                    height="40" 
                                />
                                <strong>{currentProfile?.name}</strong>
                            </div>

                            {/* 서브 리스트 */}
                            <ul>
                                {/* 전체 프로필 중에서 '현재 선택된 프로필의 id'와 다른 것만 필터링 */}
                                {user.profiles
                                ?.filter((pro) => pro.id !== currentProfile?.id)
                                ?.map((pro) => (
                                    <li key={pro.name}>
                                    {/* 클릭 시 handleProfileChange 함수를 실행하여 state를 업데이트합니다 */}
                                    <button type="button" onClick={() => handleProfileChange(pro)}>
                                        <img 
                                        src={pro.imgUrl ?? "/images/profile/normal.svg"} 
                                        alt={pro.name?? "프로필이름"} 
                                        width="40" 
                                        height="40" 
                                        />
                                        <span>{pro.name}</span>
                                    </button>
                                    </li>
                                ))}
                                
                                <li className="logout-item">
                                    <button type="button" onClick={onLogout}>로그아웃</button>
                                </li>
                            </ul>
                        </li>                     
                    )}
                </ul>
            </div>
            </header>
            <HeaderMenu />
        </>

    )
}
