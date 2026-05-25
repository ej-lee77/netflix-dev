"use client";

import { auth, googleProvider } from '@/firebase/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'

export default function LoginPage() {
    const router = useRouter();
    const {onLogin} = useAuthStore();
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const handleGoogleLogin = async()=>{
        try{
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            onLogin({
                ...user,
                profiles: [
                    {    
                        id: 1,
                        name: "나",
                        imgUrl: "images/profile/1.png"
                    }
                ]
            })
            router.push("/");//로그인 성공하면 메인이동
        }catch(err){
            console.log(err);
        }
    }

  return (
    <div className='inner'>
        <h2>로그인</h2>
        <form>
            <p><input type="email" placeholder='email' value={email} onChange={(e)=>setEmail(e.target.value)}/></p>
            <p><input type="password" placeholder='password' value={password} onChange={(e)=>setPassword(e.target.value)}/></p>
            <button>로그인</button>
        </form>
        <p><button onClick={handleGoogleLogin}>구글 로그인</button></p>
    </div>
  )
}
