"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import "./shareButton.scss";

interface ShareButtonProps {
  mediaType: "movie" | "tv";
  id: number;
  className?: string;
  stopPropagation?: boolean;
}

export default function ShareButton({ mediaType, id, className, stopPropagation }: ShareButtonProps) {
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    e.preventDefault();

    const url = `${window.location.origin}/detail/${mediaType}/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setVisible(true);
      setHiding(false);
      setTimeout(() => setHiding(true), 1750);
      setTimeout(() => setVisible(false), 2000);
    });
  };

  return (
    <>
      <button
        type="button"
        className={`share-btn ${className ?? ""}`}
        onClick={handleClick}
        title="공유하기"
        aria-label="공유하기"
      >
        <img src="/images/header/menu/share.svg" alt="공유" width={18} height={18} />
      </button>
      {visible && createPortal(
        <div className={`share-toast${hiding ? " share-toast--hiding" : ""}`}>
          <img src="/images/icon/link.svg" alt="" width={18} height={18} />
          링크가 복사되었습니다.
        </div>,
        document.body
      )}
    </>
  );
}
