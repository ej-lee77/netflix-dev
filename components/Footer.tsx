'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'
import { useLangStore, LANG_LABELS, labelToLang } from '@/store/useLangStore'
import { useT, type TKey } from '@/lib/i18n'
import AppIcon from '@/components/common/AppIcon'
import "./scss/footer.scss"

// 링크는 번역 키로 관리
const LINK_COLS: { titleKey: TKey; links: TKey[] }[] = [
  { titleKey: "footer.companyInfo", links: ["footer.audioGuide", "footer.ir", "footer.legal"] },
  { titleKey: "footer.customerCenter", links: ["footer.center", "footer.jobs", "footer.cookies"] },
  { titleKey: "footer.service", links: ["footer.giftcard", "footer.terms", "footer.company"] },
  { titleKey: "footer.media", links: ["footer.mediaCenter", "footer.privacy", "footer.contact"] },
];

// 각 푸터 링크의 목적지. 전용 페이지가 있는 항목만 매핑하고,
// 나머지는 모두 FAQ(/faq)로 연결한다. (footer.contact 는 로그인 여부에 따라 별도 처리)
const FOOTER_LINK_HREF: Partial<Record<TKey, string>> = {
  "footer.center": "/faq",       // 고객 센터 → FAQ
  "footer.jobs": "/faq",         // 입사 정보 → FAQ
  "footer.giftcard": "/plan",    // 기프트카드 → 플랜
};
const FOOTER_LINK_FALLBACK = "/faq"; // 전용 페이지가 없는 나머지 항목

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

const LANGUAGES = ["한국어", "English"];

export default function Footer() {
  const [langOpen, setLangOpen] = useState(false);
  const { user } = useAuthStore();
  const { lang, setLang } = useLangStore();
  const t = useT();
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
          {LINK_COLS.flatMap(({ links }) => links).map((key) => (
            <li key={key}>
              {key === "footer.contact" ? (
                <Link href={contactHref} className="footer-link">{t(key)}</Link>
              ) : (
                <Link
                  href={FOOTER_LINK_HREF[key] ?? FOOTER_LINK_FALLBACK}
                  className="footer-link"
                >
                  {t(key)}
                </Link>
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
            <p>{t("footer.disclaimer")}</p>
          </div>

          <div className="lang-wrap">
            {langOpen && (
              <ul className="lang-dropdown">
                {LANGUAGES.map((label) => (
                  <li key={label}>
                    <button
                      className={LANG_LABELS[lang] === label ? "active" : ""}
                      onClick={() => { setLang(labelToLang(label)); setLangOpen(false); }}
                    >
                      {label}
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
              <span className="lang-globe">
                <AppIcon name="globe" size={16} color="currentColor" />
              </span>
              <span>{LANG_LABELS[lang]}</span>
              <span className={`lang-arrow${langOpen ? " open" : ""}`}>
                <AppIcon name="chevron" size={14} color="currentColor" />
              </span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  )
}
