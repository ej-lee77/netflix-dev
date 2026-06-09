"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./TopButton.module.scss";

export default function TopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  if (!visible) return null;

  return (
    <button className={styles.topBtn} onClick={scrollToTop} aria-label="맨 위로">
      <Image src="/images/icon/top-icon-white.svg" alt="top" width={24} height={24} />
    </button>
  );
}
