import { useAuthStore } from "@/store/useAuthStore";

/**
 * 비회원이거나 planType이 없으면 unsubscribed로 판단합니다.
 *
 * isUnsubscribed: true  → 구독 차단 대상
 * isLoggedIn:     true  → 로그인은 되어 있지만 미구독
 */
export function useSubscriptionGuard() {
  const user = useAuthStore((state) => state.user);

  const isLoggedIn = Boolean(user);
  const hasSubscription = Boolean(user?.planType);
  const isUnsubscribed = !hasSubscription; // 비회원 포함

  return { isLoggedIn, hasSubscription, isUnsubscribed };
}