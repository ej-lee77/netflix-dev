"use client";
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import HeaderMenu from './HeaderMenu'
import { useAuthStore } from '@/store/useAuthStore'
import { Profile } from '@/types/authStore';

export default function Header() {
    const {user, onLogout} = useAuthStore();
    const [currentProfile, setCurrentProfile] = useState(user?.profiles?.[0] || null);

    // 프로필을 변경하는 함수
    const handleProfileChange = (selectedProfile:Profile) => {
        setCurrentProfile(selectedProfile);
    };

    return (
        <header>
            <div className='inner'>
                <div>
                    <h1>
                        <Link href="/"><Image src="/images/logo-icon.svg" alt="netflix" width="150" height="150" /></Link>
                    </h1>
                    <HeaderMenu />
                </div>
                <div>
                    <ul>
                        <li>
                            <Link href="/search"><Image src="/images/header/search.svg" alt="검색" width="150" height="150" /></Link>
                        </li>
                        <li>
                            <Link href="/alarm"><Image src="/images/header/alarm.svg" alt="알림" width="150" height="150" /></Link>
                        </li>
                        {!user ? (
                            <li>
                                <Link href="/login">로그인</Link>
                            </li>
                        ):(
                            <li>
                                {/* 메인: 현재 선택된 프로필 */}
                                <div className="main-profile">
                                    <Image 
                                        src={currentProfile?.imgUrl ?? "/images/profile/normal.svg"} 
                                        alt={currentProfile?.name ?? "프로필이름"} 
                                        width="100" 
                                        height="100" 
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
            </div>
        </header>
    )
}
