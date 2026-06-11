"use client";

import { useEffect, useState } from "react";
import ConnectAIButton from "./ConnectAIButton";

export default function ConnectAIWrapper() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 마운트 전에는 빈 상태로 두어 서버 HTML과 클라이언트 HTML 불일치 방지
  if (!isMounted) return null;

  return <ConnectAIButton />;
}