"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useToastStore } from "@/store/useToastStore";
import "./toaster.scss";

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;

  return createPortal(
    <div className="app-toaster" aria-live="polite">
      {toasts.map((t, i) => {
        const anchored = !!t.anchor;
        const style: React.CSSProperties = anchored
          ? {
              // 클릭한 버튼 바로 위, 가로 중앙 정렬 (화면 밖으로 나가지 않게 클램프)
              left: Math.min(Math.max(t.anchor!.x, 100), vw - 100),
              top: t.anchor!.y,
              transform: "translate(-50%, calc(-100% - 12px))",
            }
          : {
              // 앵커 없는 알림은 상단 중앙에 쌓임
              left: "50%",
              top: 88 + i * 56,
              transform: "translateX(-50%)",
            };
        return (
          <div
            key={t.id}
            className={`app-toast${t.hiding ? " app-toast--hiding" : ""}`}
            style={style}
          >
            {t.icon && <img src={t.icon} alt="" width={18} height={18} />}
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
