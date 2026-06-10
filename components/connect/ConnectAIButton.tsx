"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import "./scss/connectAI.scss";

const ConnectAIPanel = dynamic(() => import("./ConnectAIPanel"), { ssr: false });

export default function ConnectAIButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 280);
  };

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      setIsOpen(true);
    }
  };

  return (
    <>
      <button
        className={`connect-ai-btn${isOpen ? " connect-ai-btn--open" : ""}`}
        onClick={handleToggle}
        aria-label="Netflix AI 열기"
      >
        <Image src="/images/icon/NetflixAi2.png" alt="Netflix AI" width={44} height={44} quality={70} />
      </button>

      {isOpen && <ConnectAIPanel onClose={handleClose} isClosing={isClosing} />}
    </>
  );
}
