"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import "./scss/connectAI.scss";

const ConnectAIPanel = dynamic(() => import("./ConnectAIPanel"), { ssr: false });

export default function ConnectAIButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className={`connect-ai-btn${isOpen ? " connect-ai-btn--open" : ""}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Netflix AI 열기"
      >
        <Image src="/images/icon/NetflixAi.png" alt="Netflix AI" width={44} height={44} />
      </button>

      {isOpen && <ConnectAIPanel onClose={() => setIsOpen(false)} />}
    </>
  );
}
