// 자주 묻는 질문(FAQ) 공통 타입
// 모든 페이지의 FAQ 는 data/faq.ts 한 곳에서만 관리합니다.

export interface FaqItem {
  q: string; // 질문
  a: string; // 답변
}

export interface FaqCategory {
  id: string;       // 카테고리 식별자 (문의 유형 value 와 동일하게 사용)
  icon: string;     // 카테고리 아이콘 (이모지)
  name: string;     // 카테고리 표시 이름
  items: FaqItem[]; // 해당 카테고리의 질문/답변 목록
}
