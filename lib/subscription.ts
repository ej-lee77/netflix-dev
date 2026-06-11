import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * 비회원이거나 planType이 없으면 unsubscribed로 판단합니다.
 *
 * isUnsubscribed: true  → 구독 차단 대상
 * isLoggedIn:     true  → 로그인은 되어 있지만 미구독
 */
export function useSubscriptionGuard() {
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();
  const [planType, setPlanType] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.userId) {
      setPlanType(null);
      return;
    }
    getDoc(doc(db, "users", user.userId)).then((snap) => {
      if (!snap.exists()) return;
      setPlanType(snap.data().planType ?? "");
    });
  }, [user?.userId, pathname]);

  const isLoggedIn = Boolean(user);
  const hasSubscription = user ? Boolean(planType) : false;
  const isUnsubscribed = !hasSubscription;

  return { isLoggedIn, hasSubscription, isUnsubscribed };
}