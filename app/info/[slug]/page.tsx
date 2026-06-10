"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFooterDoc } from "@/data/footerDocs";
import "../../scss/info.scss";

interface InfoPageProps {
  params: Promise<{ slug: string }>;
}

export default function InfoPage({ params }: InfoPageProps) {
  const { slug } = use(params);
  const doc = getFooterDoc(slug);

  if (!doc) {
    notFound();
  }

  return (
    <div className="info-page">
      <div className="inner">
        <nav className="info-breadcrumb" aria-label="breadcrumb">
          <Link href="/">홈</Link>
          <span className="sep">›</span>
          <span className="current">{doc.title}</span>
        </nav>

        <header className="info-head">
          <h1>{doc.title}</h1>
          <p className="info-intro">{doc.intro}</p>
          <p className="info-updated">최종 개정일 · {doc.updated}</p>
        </header>

        <div className="info-body">
          {doc.sections.map((section, si) => (
            <section className="info-section" key={si}>
              <h2>{section.heading}</h2>
              {section.body.map((block, bi) =>
                Array.isArray(block) ? (
                  <ul className="info-list" key={bi}>
                    {block.map((line, li) => (
                      <li key={li}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={bi}>{block}</p>
                ),
              )}
            </section>
          ))}
        </div>

        <div className="info-foot">
          <p>
            원하는 내용을 찾지 못하셨나요?{" "}
            <Link href="/faq" className="info-link">
              자주 묻는 질문
            </Link>{" "}
            또는{" "}
            <Link href="/contact" className="info-link">
              문의하기
            </Link>
            에서 도움을 받을 수 있어요.
          </p>
        </div>
      </div>
    </div>
  );
}
