import { mainMenus } from '@/data/mainMenu'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function HeaderMenu() {
    return (
        <nav>
            <ul className="main-menu sidebar-icons">
                {mainMenus.map((menu)=>(
                    <li key={menu.title} className='sb-icon'>
                        <Link href={menu.path}>
                            <Image src={menu.imgUrl} alt={menu.title} width="24" height="24" />
                            <span className='sb-label'>{menu.title}</span>
                        </Link>
                    </li>
                ))}
                <li className='sb-icon sb-bottom'>
                    <Link href="/">
                        <Image src="/images/header/menu/wishlist.svg" alt="설정" width="24" height="24" />
                        <span className='sb-label'>설정</span>
                    </Link>
                </li>
            </ul>
        </nav>
    )
}
