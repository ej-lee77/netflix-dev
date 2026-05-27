import React from 'react'
import Image from 'next/image'
import "./scss/footer.scss"

export default function Footer() {
  return (
    <footer className='relative'>
      {/* <div className='w-full h-40 relative'>
        <Image src="/images/footer/footer-logo.png" alt='netflix' fill />
      </div> */}
      <div className='footer-sns'>
        <div><a href="https://www.youtube.com/channel/UCiEEF51uRAeZeCo8CJFhGWw/featured"><Image src="/images/footer/sns-twitter.svg" alt='twitter' width="24" height="24" /></a></div>
        <div><a href="https://www.facebook.com/NetflixKR"><Image src="/images/footer/sns-facebook.svg" alt='facebook' width="24" height="24" /></a></div>
        <div><a href="https://www.youtube.com/channel/UCiEEF51uRAeZeCo8CJFhGWw/featured"><Image src="/images/footer/sns-youtube.svg" alt='youtube' width="24" height="24" /></a></div>
        <div><a href="https://www.instagram.com/netflixkr/"><Image src="/images/footer/sns-instagram.svg" alt='instagram' width="24" height="24" /></a></div>
      </div>
      <div className='footer-content'>
        <div>
          <p>About Us</p>
          <ul className='content-list'>
            <li>회사정보</li>
            <li>입사정보</li>
            <li>법적고지</li>
          </ul>
        </div>
        <div>
          <p>Business</p>
          <ul className='content-list'>
            <li>투자정보(IR)</li>
            <li>미디어센터</li>
          </ul>
        </div>
        <div>
          <p>Agreement</p>
          <ul className='content-list'>
            <li>개인정보 처리방침</li>
            <li>이용약관</li>
            <li>쿠키설정</li>
          </ul>
        </div>
        <div>
          <p>Contect</p>
          <ul className='content-list'>
            <li>자주 묻는 질문</li>
            <li>문의하기</li>
            <li>전화번호(수신자부담)</li>
            <li>00-308-321-0161</li>
            <li>이메일</li>
            <li>korea@netflix.com</li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
