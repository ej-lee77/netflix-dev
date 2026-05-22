import { mainMenus } from '@/data/mainMenu'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function HeaderMenu() {
    return (
        <nav>
            <ul className="main-menu">
                {mainMenus.map((menu)=>(
                    <li key={menu.title}>
                        <Link href={menu.path}>
                            <Image src={menu.imgUrl} alt={menu.title} width="80" height="80" />
                            <span>{menu.title}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
