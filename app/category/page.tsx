"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { customMenus } from "@/data/mainMenu";
import "../scss/explore.scss";

type SubTab = "genre" | "country" | "curation";

const countries = [
  { code: "kr", name: "한국", icon: "🇰🇷" },
  { code: "us", name: "미국", icon: "🇺🇸" },
  { code: "jp", name: "일본", icon: "🇯🇵" },
  { code: "uk", name: "영국", icon: "🇬🇧" },
  { code: "fr", name: "프랑스", icon: "🇫🇷" },
  { code: "es", name: "스페인", icon: "🇪🇸" },
  { code: "de", name: "독일", icon: "🇩🇪" },
  { code: "in", name: "인도", icon: "🇮🇳" },
  { code: "cn", name: "중국", icon: "🇨🇳" },
  { code: "tw", name: "대만", icon: "🇹🇼" },
];

const curations = [
  { id: "weekend", name: "주말에 보기 좋은", desc: "긴 시간 몰입하기 좋은 작품들", icon: "📅" },
  { id: "shortcoms", name: "짧고 재밌는", desc: "1시간 안에 끝나는 매력적인 작품", icon: "⏱" },
  { id: "binge", name: "정주행 추천", desc: "한 번 시작하면 멈출 수 없는 시리즈", icon: "📺" },
  { id: "underrated", name: "숨겨진 명작", desc: "잘 알려지지 않은 보석 같은 작품", icon: "💎" },
  { id: "award", name: "수상작", desc: "각종 시상식에서 인정받은 작품", icon: "🏆" },
  { id: "trending", name: "지금 화제작", desc: "사람들이 가장 많이 보는 작품", icon: "🔥" },
];

export default function CategoryPage() {
  const [tab, setTab] = useState<SubTab>("genre");

  const genres = customMenus.filter((m) => m.path.startsWith("/genre/"));

  return (
    <div className="explore-page">
      <div className="inner">
        <div className="page-head">
          <h1>카테고리</h1>
          <p>장르·국가·큐레이션별로 작품을 만나보세요</p>
        </div>

        <div className="sub-tabs">
          <button className={tab === "genre" ? "active" : ""} onClick={() => setTab("genre")}>
            장르
          </button>
          <button className={tab === "country" ? "active" : ""} onClick={() => setTab("country")}>
            국가
          </button>
          <button className={tab === "curation" ? "active" : ""} onClick={() => setTab("curation")}>
            큐레이션
          </button>
        </div>

        {tab === "genre" && (
          <div className="explore-grid">
            {genres.map((g) => (
              <Link key={g.path} href={g.path} className="explore-card">
                <div className="card-icon">
                  <Image src={g.imgUrl} alt={g.title} width={32} height={32} />
                </div>
                <h3>{g.title}</h3>
              </Link>
            ))}
          </div>
        )}

        {tab === "country" && (
          <div className="explore-grid">
            {countries.map((c) => (
              <Link key={c.code} href={`/category/country/${c.code}`} className="explore-card country">
                <div className="card-icon flag">{c.icon}</div>
                <h3>{c.name}</h3>
              </Link>
            ))}
          </div>
        )}

        {tab === "curation" && (
          <div className="curation-grid">
            {curations.map((c) => (
              <Link key={c.id} href={`/category/curation/${c.id}`} className="curation-card">
                <div className="cur-icon">{c.icon}</div>
                <div className="cur-info">
                  <h3>{c.name}</h3>
                  <p>{c.desc}</p>
                </div>
                <span className="arrow">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
