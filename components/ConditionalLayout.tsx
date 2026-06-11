"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginBanner from "@/components/LoginBanner";
import MobileBottomNav from "@/components/MobileBottomNav";
import Toaster from "@/components/common/Toaster";
import SubscribeModal from "@/components/SubscribeModal";
import { useSubscribeModalStore } from "@/store/useSubscribeModalStore";

// 헤더/푸터/배너를 숨길 경로 목록
const HIDE_LAYOUT_PATHS = ["/signin", "/onboarding"];

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideLayout = HIDE_LAYOUT_PATHS.some((path) => pathname.startsWith(path));
  const { isOpen, closeModal } = useSubscribeModalStore();

  return (
    <>
      {!hideLayout && <Header />}
      <main className={hideLayout ? undefined : "has-nav"}>{children}</main>
      <Footer />
      {!hideLayout && <LoginBanner />}
      {!hideLayout && <MobileBottomNav />}
      <Toaster />
      {isOpen && <SubscribeModal onClose={closeModal} />}
    </>
  );
}