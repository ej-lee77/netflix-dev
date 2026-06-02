"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import "./scss/moodBanner.scss";

export default function MoodBanner() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();

    if (rect.top < window.innerHeight) {
      // 이미 뷰포트 안에 있으면 트랜지션 없이 즉시 표시
      section.classList.add("is-visible--instant");
      return;
    }

    // 뷰포트 밖(아래)에 있을 때만 스크롤 애니메이션 등록
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="mood-banner-section" ref={sectionRef}>
      <Link href="/mood" className="mood-banner">
        <div className="mood-banner__bg" aria-hidden="true">
          <span className="mood-banner__orb mood-banner__orb--1" />
          <span className="mood-banner__orb mood-banner__orb--2" />
          <span className="mood-banner__orb mood-banner__orb--3" />
        </div>

        <div className="mood-banner__inner">
          <div className="mood-banner__content">
            <p className="mood-banner__eyebrow">오늘 어떤 기분이에요?</p>
            <h2 className="mood-banner__title">
              지금 기분에 딱 맞는 <em>분위기</em> 골라보기
            </h2>
            <p className="mood-banner__desc">
              내 감정을 선택하면 딱 맞는 콘텐츠를 추천해드려요
            </p>
          </div>

          <div className="mood-banner__image" aria-hidden="true">
            <Image
              src="/images/banner/moodBanner-img-02.png"
              alt=""
              width={400}
              height={260}
            />
          </div>
        </div>
      </Link>
    </section>
  );
}
