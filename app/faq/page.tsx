"use client";
import React, { useState, useMemo } from "react";
import AppIcon, { type AppIconName } from "@/components/common/AppIcon";
import Link from "next/link";
import "../scss/faq.scss";

import { FAQ_CATEGORIES } from "@/data/faq";
import FaqAccordion from "@/components/common/FaqAccordion";

type FaqSearchItem = {
  q: string;
  a: string;
};

export default function FaqAllPage() {
  const [keyword, setKeyword] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all"); // "all" = 전체

  const kw = keyword.trim();

  // 카테고리 + 검색어 필터링된 결과
  const sections = useMemo(() => {
    return FAQ_CATEGORIES
      .filter((c) => activeCat === "all" || c.id === activeCat)
      .map((c) => ({
        ...c,
        items: kw
          ? c.items.filter((f: FaqSearchItem) => f.q.includes(kw) || f.a.includes(kw))
          : c.items,
      }))
      .filter((c) => c.items.length > 0);
  }, [activeCat, kw]);

  const totalCount = sections.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <div className="faq-page">
      <div className="inner">
        <div className="page-head">
          <h1>자주 묻는 질문</h1>
          <p>궁금한 점을 카테고리별로 모아봤어요. 원하는 답을 못 찾으셨다면 1:1 문의를 남겨주세요.</p>
        </div>

        <div className="faq-search">
          <span className="icon">⌕</span>
          <input
            type="text"
            placeholder="궁금한 내용을 검색해보세요 (예: 환불, 자막, 플랜 변경)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <div className="faq-cat-nav">
          <button
            type="button"
            className={`cat-chip ${activeCat === "all" ? "active" : ""}`}
            onClick={() => setActiveCat("all")}
          >
            전체
          </button>
          {FAQ_CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.id}
              className={`cat-chip ${activeCat === c.id ? "active" : ""}`}
              onClick={() => setActiveCat(c.id)}
            >
              <span className="chip-icon"><AppIcon name={c.icon as AppIconName} size={18} /></span>
              {c.name}
            </button>
          ))}
        </div>

        {sections.length > 0 ? (
          <div className="faq-sections">
            {sections.map((c) => (
              <section key={c.id} className="faq-section">
                <div className="faq-section-head">
                  <span className="head-icon"><AppIcon name={c.icon as AppIconName} size={18} /></span>
                  <h2>{c.name}</h2>
                  <span className="count">{c.items.length}개</span>
                </div>
                <FaqAccordion items={c.items} />
              </section>
            ))}
          </div>
        ) : (
          <div className="faq-no-result">
            <p>{`"${kw}" 에 대한 검색 결과가 없어요.`}</p>
          </div>
        )}

        <div className="faq-foot-cta">
          <p>원하는 답변을 찾지 못하셨나요?</p>
          <Link href="/contact?tab=inquiry" className="cta-btn">1:1 문의하기</Link>
        </div>

        {totalCount > 0 && (
          <p className="faq-total-hint">현재 {totalCount}개의 질문을 보고 있어요.</p>
        )}
      </div>
    </div>
  );
}
