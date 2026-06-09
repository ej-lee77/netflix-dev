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

  return createPortal(
    <div className="app-toaster" aria-live="polite">
      {toasts.map((t, i) => {
        // 모든 토스트를 하단 중앙에 표시 (여러 개면 위로 쌓임)
        const style: React.CSSProperties = {
          left: "50%",
          bottom: 32 + i * 56,
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
