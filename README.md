# 🎬 Netflix Dev - Netflix 클론 프로젝트

> Netflix를 클론한 **동영상 스트리밍 플랫폼** 개발 프로젝트
>
> **라이브 배포**: https://netflix-ejone.vercel.app

---

## 📊 프로젝트 구성

### 기술 스택 분석

```
┌─────────────────────────────────────┐
│     NETFLIX-DEV 기술 스택           │
├─────────────────────────────────────┤
│  TypeScript    71.1%  ████████      │
│  SCSS/CSS      28.3%  ███           │
│  JavaScript    0.6%   •             │
└─────────────────────────────────────┘
```

### 주요 기술 스택

| 분류 | 기술 |
|------|------|
| **Frontend** | Next.js 16.2.6, React 19.2.4, TypeScript |
| **스타일링** | SCSS, Tailwind CSS |
| **상태관리** | Zustand 5.0.13 |
| **UI 라이브러리** | Swiper 12.1.4 |
| **백엔드/DB** | Firebase 12.13.0 |
| **AI/LLM** | OpenAI, Google Generative AI |
| **PWA** | next-pwa 5.6.0 |
| **기타** | ESLint, Sass |

---

## 🎯 주요 기능

### 1. **콘텐츠 검색 & 발견**
- 🎥 TMDB API 연동으로 수천 개의 영화/드라마 데이터
- 🌍 다양한 카테고리별 필터링 (장르, 국가, 언어)
- 📊 실시간 트렌드 & 인기 순위
- 🔄 개인화된 추천 알고리즘

### 2. **상세 정보 페이지**
- 📺 포스터, 배경, 제목, 설명, 출연진 정보
- ⭐ 평점 및 사용자 평가
- 🎞️ 에피소드 목록 (드라마)
- 🔗 관련 콘텐츠 추천

### 3. **시청 관리**
- 👁️ 시청 중인 콘텐츠 목록
- ⏱️ 재생 진행도 추적
- 💚 찜하기/위시리스트
- 📝 보고 싶은 목록 관리

### 4. **AI 기반 기능**
- 🤖 OpenAI & Google Gemini 연동
- 💬 영화/드라마 AI 분석 및 설명
- 🎨 스마트 콘텐츠 추천

### 5. **사용자 프로필**
- 👤 다중 프로필 지원
- 🎨 프로필 커스터마이징
- 🔐 Firebase Authentication
- ⚙️ 개인화 설정

### 6. **PWA 기능**
- 📱 모바일 앱처럼 설치 가능
- 🌐 오프라인 지원
- ⚡ 빠른 로딩 속도

---

## 📁 프로젝트 구조

```
netflix-dev/
├── 📂 app/                    # Next.js App Router
│   ├── page.tsx              # 메인 페이지
│   ├── layout.tsx            # 전체 레이아웃
│   └── [pages].tsx           # 동적 페이지
│
├── 📂 components/            # React 컴포넌트
│   ├── main/                 # 메인 페이지 컴포넌트
│   │   ├── Hero.tsx
│   │   ├── ThemeRow.tsx
│   │   ├── RankingSection.tsx
│   │   └── ...
│   ├── common/               # 재사용 가능한 공통 컴포넌트
│   │   ├── TopButton.tsx
│   │   ├── LazyRender.tsx
│   │   └── ...
│   └── detail/               # 상세페이지 컴포넌트
│
├── 📂 lib/                   # 유틸리티 & 로직
│   ├── i18n.ts              # 다국어 지원
│   ├── netflix.ts           # Netflix 데이터 처리
│   └── ...
│
├── 📂 store/                 # Zustand 상태 관리
│   └── movieStore.ts
│
├── 📂 firebase/              # Firebase 설정
│   ├── config.ts
│   ├── auth.ts
│   └── db.ts
│
├── 📂 data/                  # 정적 데이터
│   ├── excludedGenres.ts     # 장르 필터링
│   └── ...
│
├── 📂 types/                 # TypeScript 타입 정의
│   └── index.ts
│
├── 📂 hooks/                 # 커스텀 React Hooks
│   └── ...
│
├── 📂 public/                # 정적 리소스
│   ├── subtitles/            # 로컬 자막 파일
│   └── ...
│
├── 📂 scripts/               # 빌드/배포 스크립트
│   └── ...
│
├── 📄 package.json           # 패키지 의존성
├── 📄 tsconfig.json          # TypeScript 설정
├── 📄 next.config.ts         # Next.js 설정
├── 📄 DESIGN_SYSTEM.md       # 디자인 시스템 문서
└── 📄 README.md              # 본 문서
```

---

## 🚀 시작하기

### 1️⃣ 환경 설정

```bash
# 저장소 클론
git clone https://github.com/ej-lee77/netflix-dev.git
cd netflix-dev

# 패키지 설치
npm install
```

### 2️⃣ 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
# TMDB API
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# OpenAI / Gemini
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
```

### 3️⃣ 개발 서버 실행

```bash
npm run dev
```

개발 서버: **http://localhost:3000**

### 4️⃣ 빌드 & 배포

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# ESLint 검사
npm run lint
```

---

## 🎨 디자인 시스템

본 프로젝트는 **Netflix의 공식 디자인 시스템을 기준**으로 제작되었습니다.

### 색상 팔레트

| 용도 | 색상 | HEX |
|------|------|-----|
| **배경 Primary** | 어두운 검정 | `#141414` |
| **배경 Secondary** | 짙은 회색 | `#1a1a1a` |
| **배경 Card** | 중간 회색 | `#222222` |
| **강조색** | Netflix Red | `#E50914` |
| **강조색 (Hover)** | Red Dark | `#B00710` |
| **텍스트 Primary** | 흰색 | `#FFFFFF` |
| **텍스트 Secondary** | 회색 | `#999999` |

### 타이포그래피

| 레벨 | 크기 | 굵기 | 용도 |
|------|------|------|------|
| **Hero Title** | 40px | 900 | 상세페이지 제목 |
| **Section Title** | 18px | 700 | 섹션 제목 |
| **Body / Button** | 16px | 400–700 | 본문, 버튼 |
| **Info** | 14px | 400–500 | 메타데이터 |
| **Badge** | 12px | 500–700 | 뱃지, 라벨 |

### 간격 규칙

```
페이지 좌우 패딩: 40px
섹션 간 세로 간격: 40px
카드 그리드 gap: 8px
```

더 자세한 디자인 시스템은 [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) 참고

---

## 📊 주요 페이지별 기능

### 🏠 홈 페이지 (`/`)
```
┌─────────────────────────────────┐
│       Hero Banner               │  <- 자동 슬라이드
│       (추천 콘텐츠)              │
├─────────────────────────────────┤
│  💯 오늘의 인기 순위            │
├─────────────────────────────────┤
│  😊 기분에 맞는 추천             │
├─────────────────────────────────┤
│  👁️ 시청 중인 콘텐츠 이어보기   │
├─────────────────────────────────┤
│  📺 카테고리별 테마 행           │
│     - 한국 액션 시리즈           │
│     - 아시아 시리즈              │
│     - 일본 애니                   │
│     - 미국 TV 프로그램            │
│     - 액션 영화                   │
│     - 스릴러 영화                 │
│     ... (11개 테마)               │
├─────────────────────────────────┤
│  🔥 신작 & 트렌드               │
├─────────────────────────────────┤
│  🎬 상세 정보 및 평가           │
└─────────────────────────────────┘
```

### 🔍 검색 페이지 (`/search`)
- 키워드 기반 영화/드라마 검색
- 검색 결과 필터링
- 최근 검색 기록 저장

### 📺 상세 페이지 (`/detail/[id]`)
```
┌─────────────────────────────────┐
│   배경 이미지 & 히어로 정보      │
│   - 포스터, 제목, 평점, 연령     │
│   - 재생 & 찜하기 버튼           │
├─────────────────────────────────┤
│   📖 줄거리                      │
├─────────────────────────────────┤
│   ⭐ 평점 & 평가                │
├─────────────────────────────────┤
│   🎬 에피소드 목록 (드라마 전용) │
├─────────────────────────────────┤
│   👨‍🎤 출연진 정보               │
├─────────────────────────────────┤
│   🔗 관련 콘텐츠 추천            │
└─────────────────────────────────┘
```

### 🎯 카테고리 페이지 (`/category`)
- 장르별 필터링
- 국가별 필터링
- 정렬 옵션 (인기도, 평점, 최신순)
- 무한 스크롤

### 👤 프로필 페이지 (`/profile`)
- 시청 이력 관리
- 찜한 콘텐츠
- 프로필 설정
- 개인화 기본 설정

---

## 🔌 API 연동

### TMDB (The Movie Database)
- 영화/드라마 데이터 소싱
- 이미지 리소스 제공
- 트렌드 정보 수집
- 장르, 국가, 언어별 필터링

### Firebase
- 사용자 인증 (Authentication)
- 실시간 데이터베이스 (Realtime Database)
- 사용자 프로필, 찜한 콘텐츠, 시청 기록 저장

### OpenAI & Google Gemini
- 콘텐츠 설명 & 분석
- AI 기반 추천 설명
- 자연어 처리

---

## 🎬 자막 시스템

로컬 자막을 지원하여 완전히 커스터마이징된 자막을 제공합니다.

**위치**: `public/subtitles/`

**형식**:
```json
[
  { "start": 1.2, "end": 3.8, "text": "첫 번째 자막" },
  { "start": 4.0, "end": 7.5, "text": "두 번째 자막" }
]
```

**사용 방법**:
1. 영상의 YouTube videoId 확인 (콘솔에서 자동 출력)
2. `public/subtitles/{videoId}.json` 파일 생성
3. 위 형식에 맞춰 자막 작성

더 자세한 내용은 [`public/subtitles/README.md`](./public/subtitles/README.md) 참고

---

## 📈 성능 최적화

### 적용된 최적화 기법

| 기법 | 설명 |
|------|------|
| **Dynamic Import** | 컴포넌트 분할 로딩 (SSR 비활성화) |
| **Lazy Loading** | 이미지 & 콘텐츠 지연 로딩 |
| **Image Optimization** | Next.js `next/image`로 최적화된 이미지 서빙 |
| **PWA** | 캐싱 및 오프라인 지원 |
| **Code Splitting** | 번들 크기 최소화 |
| **Intersection Observer** | 스크롤 기반 렌더링 |

---

## 🛠️ 개발 가이드

### TypeScript 설정
```bash
# 타입 체크
npm run lint
```

### 컴포넌트 작성 규칙
- 모든 컴포넌트는 TypeScript로 작성
- Props는 명시적인 타입 정의 필수
- 디자인 시스템 준수

### 스타일 작성 규칙
- SCSS 모듈 사용 (`.module.scss`)
- CSS 변수 사용 (예: `var(--red)`, `var(--bg-color)`)
- 반응형 디자인 필수 (모바일 우선)

### 커밋 메시지
```
feat: 새 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 추가
```

---

## 📱 브라우저 지원

- Chrome (최신)
- Safari (최신)
- Firefox (최신)
- Edge (최신)
- 모바일 (iOS 13+, Android 9+)

---

## 📝 라이센스

본 프로젝트는 **교육 목적**으로 제작되었습니다.
Netflix는 미국의 Netflix, Inc.의 상표입니다.

---

## 👨‍💻 작성자

- **개발자**: [@ej-lee77](https://github.com/ej-lee77)
- **배포**: [Vercel](https://netflix-ejone.vercel.app)

---

## 📞 연락처 & 지원

- 🐛 버그 리포트: [GitHub Issues](https://github.com/ej-lee77/netflix-dev/issues)
- 💡 기능 제안: [GitHub Discussions](https://github.com/ej-lee77/netflix-dev/discussions)

---

## 🙏 감사의 말

- [TMDB](https://www.themoviedb.org/) - 영화 데이터 제공
- [Firebase](https://firebase.google.com/) - 백엔드 인프라
- [Vercel](https://vercel.com/) - 배포 플랫폼
- [Next.js](https://nextjs.org/) - React 프레임워크

---

**마지막 업데이트**: 2026년 6월 21일 | **버전**: 0.1.0

