// 굿즈샵(포인트 교환) 도메인 타입
// 굿즈값은 포인트로 교환(차감), 배송비만 실제 결제

export type GoodsCategory = "apparel" | "figure" | "poster" | "stationery" | "lifestyle";

export type GoodsBadge = "NEW" | "BEST" | "LIMITED" | null;

export interface GoodsProduct {
  id: string;
  name: string;
  category: GoodsCategory;
  points: number; // 교환에 필요한 포인트
  shippingFee: number; // 배송비 (실제 결제 금액, KRW)
  themeTitle?: string; // 연관 작품/테마
  badge?: GoodsBadge;
  optionLabel?: string; // "사이즈" | "색상" 등
  options?: string[]; // 선택 옵션 목록 (없으면 단일 상품)
  description: string;
  stock: number;
}

export interface CartItem {
  productId: string;
  qty: number;
  option?: string;
}

// 주문 시점 스냅샷
export interface OrderItem {
  productId: string;
  name: string;
  points: number; // 개당 필요 포인트
  qty: number;
  option?: string;
  category: GoodsCategory;
  shippingFee: number; // 개당(라인당) 배송비
}

export interface ShippingInfo {
  name: string;
  phone: string;
  zipcode: string;
  address: string;
  addressDetail: string;
  memo?: string;
}

export interface GoodsOrder {
  orderId: string;
  uid: string;
  items: OrderItem[];
  pointsUsed: number; // 교환에 사용한 포인트 합계
  shippingFee: number; // 실제 결제한 배송비 합계
  shipping: ShippingInfo;
  payLabel: string; // 배송비 결제 수단
  payStatus: string; // "결제완료" 등
  createdAt: number;
}
