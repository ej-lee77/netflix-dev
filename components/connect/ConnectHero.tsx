"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "./scss/connectHero.scss";

const KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const IMG = "https://image.tmdb.org/t/p";

const GENRE_MAP: Record<number, string> = {
  28: "액션", 12: "모험", 16: "애니메이션", 35: "코미디",
  80: "범죄", 99: "다큐", 18: "드라마", 10751: "가족",
  14: "판타지", 27: "공포", 9648: "미스터리", 10749: "로맨스",
  878: "SF", 53: "스릴러", 10759: "액션", 10765: "SF·판타지",
};

function withParticle(title: string) {
  const last = title.charCodeAt(title.length - 1);
  if (last >= 0xac00 && last <= 0xd7a3) {
    return (last - 0xac00) % 28 !== 0 ? `"${title}"과` : `"${title}"와`;
  }
  return `"${title}"와`;
}

type HeroItem = {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  backdropPath: string;
  logoPath: string | null;
  logoIsVector: boolean;
  genre: string;
  ageRating: string;
  rating: number;
  directorName: string;
  recTitle: string;
  videoKey: string | null;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function fetchHeroItems(): Promise<HeroItem[]> {
  const NETFLIX_PROVIDER = 8;
  const EXCLUDED_TITLES = ["케이프 피어", "Cape Fear"];

  // 넷플릭스 제공 콘텐츠만 discover API로 직접 조회
  const [movieRes, tvRes] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${KEY}&language=ko-KR&with_watch_providers=${NETFLIX_PROVIDER}&watch_region=KR&sort_by=popularity.desc`),
    fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${KEY}&language=ko-KR&with_watch_providers=${NETFLIX_PROVIDER}&watch_region=KR&sort_by=popularity.desc`),
  ]);
  const [movieData, tvData] = await Promise.all([movieRes.json(), tvRes.json()]);

  const pool = [
    ...(movieData.results as any[]).map((r: any) => ({ ...r, media_type: "movie" })),
    ...(tvData.results as any[]).map((r: any) => ({ ...r, media_type: "tv" })),
  ].filter(
    (r: any) =>
      r.backdrop_path &&
      !EXCLUDED_TITLES.includes(r.title ?? r.name)
  );
  const candidates = shuffle(pool).slice(0, 12);

  const detailed = await Promise.all(
    candidates.map(async (item: any) => {
      const mt = item.media_type as "movie" | "tv";
      const certParam = mt === "movie" ? "release_dates" : "content_ratings";

      // 상세 정보 + 영상 병렬 fetch
      const [detailRes, videoRes] = await Promise.all([
        fetch(
          `https://api.themoviedb.org/3/${mt}/${item.id}` +
          `?api_key=${KEY}&language=ko-KR` +
          `&append_to_response=images,${certParam},credits` +
          `&include_image_language=ko,en,null`
        ),
        fetch(
          `https://api.themoviedb.org/3/${mt}/${item.id}/videos?api_key=${KEY}&language=en-US`
        ),
      ]);
      const [d, vd] = await Promise.all([detailRes.json(), videoRes.json()]);

      // 로고: 한국어 > 영어 > 첫 번째
      const logos: any[] = d.images?.logos ?? [];
      const logo =
        logos.find((l: any) => l.iso_639_1 === "ko") ||
        logos.find((l: any) => l.iso_639_1 === "en") ||
        logos[0] ||
        null;

      // 연령 등급
      let ageRating = "전체";
      if (mt === "movie") {
        const kr = d.release_dates?.results?.find((r: any) => r.iso_3166_1 === "KR");
        const cert = kr?.release_dates?.[0]?.certification;
        if (cert) ageRating = cert;
      } else {
        const kr = d.content_ratings?.results?.find((r: any) => r.iso_3166_1 === "KR");
        if (kr?.rating) ageRating = kr.rating;
      }

      // 감독 / 창작자
      let directorName = "";
      if (mt === "movie") {
        directorName = d.credits?.crew?.find((c: any) => c.job === "Director")?.name ?? "";
      } else {
        directorName =
          d.created_by?.[0]?.name ??
          d.credits?.crew?.find((c: any) => c.job === "Series Director")?.name ??
          "";
      }

      // 비디오 키: Trailer > Teaser > Clip > 기타
      const ytVideos = (vd.results ?? []).filter((v: any) => v.site === "YouTube");
      const video =
        ytVideos.find((v: any) => v.type === "Trailer") ||
        ytVideos.find((v: any) => v.type === "Teaser") ||
        ytVideos.find((v: any) => v.type === "Clip") ||
        ytVideos[0] ||
        null;

      return {
        id: item.id,
        mediaType: mt,
        title: (item.title ?? item.name) as string,
        backdropPath: item.backdrop_path as string,
        logoPath: logo?.file_path ?? null,
        logoIsVector: logo?.file_type === ".svg",
        genre: GENRE_MAP[item.genre_ids?.[0]] ?? "드라마",
        ageRating,
        rating: Math.round(item.vote_average * 10) / 10,
        directorName,
        recTitle: "",
        videoKey: video?.key ?? null,
      };
    })
  );

  // 로고 있는 작품 우선, 각 그룹 내에서도 셔플 유지
  const withLogo = detailed.filter((d) => d.logoPath);
  const withoutLogo = detailed.filter((d) => !d.logoPath);
  const picked = [...withLogo, ...withoutLogo].slice(0, 4);

  return picked.map((item, i) => ({
    ...item,
    recTitle: picked[(i + 1) % picked.length].title,
  }));
}

export default function ConnectHero() {
  const router = useRouter();
  const swiperRef = useRef<SwiperType | null>(null);
  const [items, setItems] = useState<HeroItem[]>([]);
  const [realIndex, setRealIndex] = useState(0);      // 실제 콘텐츠 인덱스 (0~TOTAL-1)
  const [swiperIdx, setSwiperIdx] = useState(0);      // Swiper 절대 인덱스 (loopItems 기준)
  const [showVideo, setShowVideo] = useState(false);
  const [failedLogos, setFailedLogos] = useState<Set<number>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchHeroItems().then(setItems).catch(console.error);
  }, []);

  // 슬라이드 변경 시 영상 리셋 → 2초 후 재생
  useEffect(() => {
    setShowVideo(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    const item = items[realIndex];
    if (item?.videoKey) {
      timerRef.current = setTimeout(() => setShowVideo(true), 2000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [realIndex, items]);

  const TOTAL = items.length;

  if (TOTAL === 0) {
    return <section className="connect-hero connect-hero--loading" aria-label="커넥트 컬렉션" />;
  }

  // ─────────────────────────────────────────────────────────
  // Swiper 내장 loop 대신 아이템 3배 복제로 직접 무한 루프 구현
  // → initialSlide를 중간 셋 시작점으로 명시 → 타이밍 무관하게 항상 1번 슬라이드 시작
  // ─────────────────────────────────────────────────────────
  const loopItems = [...items, ...items, ...items];  // 총 TOTAL*3 슬라이드
  const LOOP_CENTER = TOTAL;                          // 중간 셋의 첫 번째 슬라이드 인덱스

  return (
    <section className="connect-hero" aria-label="커넥트 컬렉션">
      {/* 배경 블러: overflow:hidden 래퍼 안에서 클리핑 */}
      <div className="connect-hero__bg-layer">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="connect-hero__section-bg"
            style={{
              backgroundImage: `url(${IMG}/w1280${item.backdropPath})`,
              opacity: i === realIndex ? 1 : 0,
            }}
          />
        ))}
      </div>

      <Swiper
        className="connect-hero__swiper"
        centeredSlides
        slidesPerView="auto"
        spaceBetween={14}
        initialSlide={LOOP_CENTER}   // 중간 셋 첫 슬라이드 → 타이밍과 무관하게 항상 1번 시작
        speed={520}
        modules={[Navigation]}
        navigation
        onSwiper={(s) => {
          swiperRef.current = s;
          setSwiperIdx(s.activeIndex); // Swiper 마운트 시 초기 인덱스 동기화
        }}
        onSlideChange={(s) => {
          const ai = s.activeIndex;
          setSwiperIdx(ai);
          setRealIndex(ai % TOTAL);  // 실제 콘텐츠 인덱스 (0~TOTAL-1)
        }}
        onTransitionEnd={(s) => {
          // 첫 번째 셋(0~TOTAL-1) 또는 세 번째 셋(TOTAL*2~)에 도달하면
          // 중간 셋의 동일 위치로 조용히 점프 → 무한 루프 효과
          const ai = s.activeIndex;
          if (ai < TOTAL) {
            s.slideTo(ai + TOTAL, 0, false);
          } else if (ai >= TOTAL * 2) {
            s.slideTo(ai - TOTAL, 0, false);
          }
        }}
      >
        {loopItems.map((item, i) => (
          <SwiperSlide key={`loop-${i}`} className="connect-hero__slide">
            <div
              className="connect-hero__bg"
              style={{ backgroundImage: `url(${IMG}/original${item.backdropPath})` }}
            />

            {/* 현재 활성 슬라이드에만 영상 마운트 (2초 후 fade-in) */}
            {i === swiperIdx && showVideo && item.videoKey && (
              <div className="connect-hero__video">
                <iframe
                  src={
                    `https://www.youtube.com/embed/${item.videoKey}` +
                    `?autoplay=1&mute=1&controls=0&loop=1&playlist=${item.videoKey}` +
                    `&modestbranding=1&showinfo=0&rel=0`
                  }
                  allow="autoplay; encrypted-media"
                  title={item.title}
                />
              </div>
            )}

            <div className="connect-hero__dim" />
            <div className="connect-hero__gradient" />

            <div className="connect-hero__badge">
              <span className="connect-hero__badge-heart">♥</span>
              취향 맞춤작
            </div>

            <div className="connect-hero__content">
              {item.logoPath && !failedLogos.has(item.id) ? (
                <div className="connect-hero__logo">
                  <img
                    src={`${IMG}/${item.logoIsVector ? "original" : "w300"}${item.logoPath}`}
                    alt={item.title}
                    onError={() =>
                      setFailedLogos((prev) => new Set(prev).add(item.id))
                    }
                  />
                </div>
              ) : (
                <h2 className="connect-hero__title">{item.title}</h2>
              )}

              <p className="connect-hero__rec-reason">
                {withParticle(item.recTitle)} 함께 감상된 콘텐츠
              </p>
              {item.directorName && (
                <p className="connect-hero__rec-director">
                  당신이 좋아할 [{item.directorName}] 감독
                </p>
              )}
              <p className="connect-hero__meta">
                평균 {item.rating}
                <span className="connect-hero__dot">•</span>
                {item.genre}
                <span className="connect-hero__dot">•</span>
                {item.ageRating}
              </p>
              <div className="connect-hero__btns">
                <button
                  className="connect-hero__btn-play"
                  type="button"
                  onClick={() => router.push(`/detail/${item.mediaType}/${item.id}?play=1`)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  재생하기
                </button>
                <button
                  className="connect-hero__btn-info"
                  type="button"
                  onClick={() => router.push(`/detail/${item.mediaType}/${item.id}`)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  상세정보
                </button>
              </div>
            </div>

            {/* 카운터: 루프 인덱스를 실제 번호로 변환 (i % TOTAL + 1) */}
            <div className="connect-hero__counter">
              {(i % TOTAL) + 1} <span>|</span> {TOTAL}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
