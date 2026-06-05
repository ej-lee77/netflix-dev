'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'
import "./scss/footer.scss"

const LINK_COLS = [
  {
    title: "회사 정보",
    links: ["화면 해설", "투자 정보(IR)", "법적 고지"],
  },
  {
    title: "고객 센터",
    links: ["고객 센터", "입사 정보", "쿠키 설정"],
  },
  {
    title: "서비스",
    links: ["기프트카드", "이용 약관", "회사 정보"],
  },
  {
    title: "미디어",
    links: ["미디어 센터", "개인정보", "문의하기"],
  },
];

const BUSINESS_INFO = [
  "넷플릭스서비스코리아 유한회사  통신판매업신고번호: 제2018-서울종로-0426호  전화번호: 00-308-321-0161 (수신자 부담)  대표: 레지널드 숀 톰프슨",
  "주소: 대한민국 서울특별시 종로구 우정국로 26, 센트로폴리스 A동 20층 우편번호 03161  사업자등록번호: 165-87-00119",
  "이메일 주소: korea@netflix.com  클라우드 호스팅: Amazon Web Services Inc.  공정거래위원회 웹사이트",
];

const SOCIAL = [
  { src: "/images/footer/sns-youtube.svg", alt: "YouTube", href: "https://www.youtube.com/channel/UCiEEF51uRAeZeCo8CJFhGWw/featured" },
  { src: "/images/footer/sns-twitter.svg", alt: "Twitter", href: "https://twitter.com/NetflixKR" },
  { src: "/images/footer/sns-instagram.svg", alt: "Instagram", href: "https://www.instagram.com/netflixkr/" },
  { src: "/images/footer/sns-facebook.svg", alt: "Facebook", href: "https://www.facebook.com/NetflixKR" },
];

const LANGUAGES = ["한국어", "English", "日本語", "中文"];

export default function Footer() {
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("한국어");
  const { user } = useAuthStore();
  // 로그인 전이면 로그인 페이지로, 로그인 후엔 문의 작성 탭으로 이동
  const contactHref = user ? "/contact?tab=inquiry" : "/login";

  return (
    <footer>
      <div className="footer-inner">

        {/* 로고 + SNS */}
        <div className="footer-sns-row">
          <Image
            src="/images/logo/Netflix_Logo_RGB.png"
            alt="Netflix"
            width={100}
            height={27}
            className="footer-logo"
          />
          <div className="footer-sns">
            {SOCIAL.map(({ src, alt, href }) => (
              <a key={alt} href={href} aria-label={alt} target="_blank" rel="noreferrer" className="sns-icon">
                <Image src={src} alt={alt} width={20} height={20} />
              </a>
            ))}
          </div>
        </div>

        <hr className="footer-divider" />

        {/* 링크 1열 */}
        <ul className="footer-links">
          {LINK_COLS.flatMap(({ links }) => links).map((link) => (
            <li key={link}>
              {link === "문의하기" ? (
                <Link href={contactHref} className="footer-link">{link}</Link>
              ) : (
                <a href="#" className="footer-link">{link}</a>
              )}
            </li>
          ))}
        </ul>

        {/* 사업자 정보 */}
        <div className="footer-biz">
          {BUSINESS_INFO.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <hr className="footer-divider" />

        {/* 하단 바 */}
        <div className="footer-bottom-bar">
          <div className="footer-copyright">
            <p>© 2026 NETFLIX, Inc. All rights reserved.</p>
            <p>NETFLIX는 가상의 스트리밍 서비스로, 실제 Netflix와 무관합니다.</p>
          </div>

          <div className="lang-wrap">
            {langOpen && (
              <ul className="lang-dropdown">
                {LANGUAGES.map((lang) => (
                  <li key={lang}>
                    <button
                      className={lang === selectedLang ? "active" : ""}
                      onClick={() => { setSelectedLang(lang); setLangOpen(false); }}
                    >
                      {lang}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              className="lang-btn"
              onClick={() => setLangOpen((o) => !o)}
              aria-expanded={langOpen}
            >
              <span className="lang-globe">🌐</span>
              <span>{selectedLang}</span>
              <span className="lang-arrow">{langOpen ? "▲" : "▼"}</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  )
}
