import type { GoodsProduct, GoodsCategory } from "@/types/goods";

// 카테고리 메타 (라벨/이모지/그라데이션) — 카드 비주얼에 사용
export const GOODS_CATEGORIES: {
  key: GoodsCategory;
  label: string;
  emoji: string;
  gradient: string;
}[] = [
  { key: "apparel", label: "의류", emoji: "👕", gradient: "linear-gradient(135deg,#3a1c1c,#5b2330)" },
  { key: "figure", label: "피규어·키링", emoji: "🧸", gradient: "linear-gradient(135deg,#1c2a3a,#23405b)" },
  { key: "poster", label: "포스터·아트", emoji: "🖼️", gradient: "linear-gradient(135deg,#2a1c3a,#42235b)" },
  { key: "stationery", label: "문구", emoji: "✏️", gradient: "linear-gradient(135deg,#1c3a2a,#235b3f)" },
  { key: "lifestyle", label: "리빙·잡화", emoji: "🏠", gradient: "linear-gradient(135deg,#3a341c,#5b5223)" },
];

export function categoryMeta(category: GoodsCategory) {
  return GOODS_CATEGORIES.find((c) => c.key === category) ?? GOODS_CATEGORIES[0];
}

// ── 더미 상품 카탈로그 (포인트 교환 + 배송비) ─────────
// 추후 Firestore 전환 시: fetchProducts() 본문만 컬렉션 조회로 교체.
const GOODS_PRODUCTS: GoodsProduct[] = [
  {
    id: "g-poster-01",
    name: "오리지널 시리즈 메인 포스터 (A2)",
    category: "poster",
    points: 800,
    shippingFee: 3000,
    themeTitle: "시즌2 메인 비주얼",
    badge: "BEST",
    description: "시즌2 키 비주얼을 고급 무광 아트지에 인쇄한 A2(420×594mm) 포스터. 액자는 별매입니다.",
    stock: 230,
  },
  {
    id: "g-poster-02",
    name: "한정판 컨셉 아트 3종 세트",
    category: "poster",
    points: 1500,
    shippingFee: 3500,
    themeTitle: "오리지널 컬렉션",
    badge: "LIMITED",
    description: "프로덕션 컨셉 아트 3종을 일련번호와 함께 제공하는 한정판 세트. 1,000부 한정.",
    stock: 47,
  },
  {
    id: "g-apparel-01",
    name: "오리지널 로고 오버핏 티셔츠",
    category: "apparel",
    points: 1200,
    shippingFee: 3000,
    themeTitle: "베이직 라인",
    badge: "NEW",
    optionLabel: "사이즈",
    options: ["S", "M", "L", "XL"],
    description: "20수 헤비코튼 오버핏 실루엣에 오리지널 로고를 실크 프린트한 데일리 티셔츠.",
    stock: 180,
  },
  {
    id: "g-apparel-02",
    name: "시즌 엠블럼 후드 집업",
    category: "apparel",
    points: 2500,
    shippingFee: 3000,
    themeTitle: "윈터 컬렉션",
    optionLabel: "사이즈",
    options: ["M", "L", "XL"],
    description: "기모 안감의 따뜻한 후드 집업. 가슴 엠블럼 자수와 소매 라벨 디테일.",
    stock: 64,
  },
  {
    id: "g-apparel-03",
    name: "캐릭터 라인 양말 4종 세트",
    category: "apparel",
    points: 500,
    shippingFee: 3000,
    themeTitle: "캐릭터 라인",
    optionLabel: "색상",
    options: ["블랙 믹스", "화이트 믹스"],
    description: "오리지널 캐릭터를 자카드로 짠 발목 양말 4켤레 세트.",
    stock: 320,
  },
  {
    id: "g-figure-01",
    name: "메인 캐릭터 아트 피규어",
    category: "figure",
    points: 3000,
    shippingFee: 4000,
    themeTitle: "프리미엄 라인",
    badge: "LIMITED",
    description: "약 22cm 높이의 PVC 아트 피규어. 디테일한 채색과 전용 베이스 포함. 박스 일련번호 부여.",
    stock: 28,
  },
  {
    id: "g-figure-02",
    name: "미니 캐릭터 블라인드 박스",
    category: "figure",
    points: 400,
    shippingFee: 3000,
    themeTitle: "캐릭터 라인",
    badge: "NEW",
    optionLabel: "옵션",
    options: ["랜덤 1개", "랜덤 6개 세트"],
    description: "8종 중 무엇이 나올지 모르는 미니 피규어 블라인드 박스. 시크릿 1종 포함.",
    stock: 410,
  },
  {
    id: "g-figure-03",
    name: "아크릴 스탠드 콜라보 세트",
    category: "figure",
    points: 700,
    shippingFee: 3000,
    themeTitle: "콜라보 굿즈",
    description: "메인 캐릭터 4종 아크릴 스탠드 세트. 책상·진열장에 어울리는 사이즈.",
    stock: 156,
  },
  {
    id: "g-station-01",
    name: "명대사 떡메모지",
    category: "stationery",
    points: 200,
    shippingFee: 2500,
    themeTitle: "명장면 컬렉션",
    optionLabel: "디자인",
    options: ["A 타입", "B 타입"],
    description: "작중 명대사를 담은 100매 떡메모지. 데일리 메모와 다꾸에 활용하기 좋아요.",
    stock: 280,
  },
  {
    id: "g-station-02",
    name: "시나리오북 (감독 코멘터리)",
    category: "stationery",
    points: 1500,
    shippingFee: 3000,
    themeTitle: "오리지널 컬렉션",
    badge: "BEST",
    description: "각본 전문과 감독·작가 코멘터리, 미공개 스틸을 담은 양장 시나리오북.",
    stock: 90,
  },
  {
    id: "g-station-03",
    name: "스티커 & 키링 3종 팩",
    category: "stationery",
    points: 300,
    shippingFee: 2500,
    themeTitle: "콜라보 굿즈",
    description: "방수 스티커 시트 2장과 아크릴 키링 1종으로 구성된 콜라보 팩.",
    stock: 0,
  },
  {
    id: "g-life-01",
    name: "오리지널 캐릭터 머그컵",
    category: "lifestyle",
    points: 600,
    shippingFee: 3000,
    themeTitle: "캐릭터 라인",
    optionLabel: "캐릭터",
    options: ["캐릭터 A", "캐릭터 B", "캐릭터 C", "캐릭터 D"],
    description: "350ml 세라믹 머그. 전자레인지·식기세척기 사용 가능.",
    stock: 210,
  },
  {
    id: "g-life-02",
    name: "OST 한정판 컬러 LP",
    category: "lifestyle",
    points: 2000,
    shippingFee: 3500,
    themeTitle: "사운드트랙",
    badge: "LIMITED",
    description: "오리지널 사운드트랙을 담은 10인치 컬러 바이닐. 게이트폴드 슬리브 + 라이너 노트.",
    stock: 35,
  },
  {
    id: "g-life-03",
    name: "시그니처 담요 & 쿠션 세트",
    category: "lifestyle",
    points: 1800,
    shippingFee: 3500,
    themeTitle: "윈터 컬렉션",
    description: "극세사 담요와 쿠션 커버 세트. 집에서 정주행할 때 딱 좋은 포근함.",
    stock: 88,
  },
];

// ── 데이터 접근 (Firestore 전환 지점) ───────────────
export async function fetchProducts(): Promise<GoodsProduct[]> {
  return GOODS_PRODUCTS;
  // 예) Firestore 전환 시:
  // const snap = await getDocs(collection(db, "goodsProducts"));
  // return snap.docs.map((d) => d.data() as GoodsProduct);
}

export function fetchProductsSync(): GoodsProduct[] {
  return GOODS_PRODUCTS;
}

// 표기 헬퍼
export function won(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}
export function pts(n: number): string {
  return n.toLocaleString("ko-KR") + "P";
}
