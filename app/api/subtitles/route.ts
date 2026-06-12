import { NextResponse } from "next/server";

/**
 * 유튜브 자막 프록시 API
 * - 브라우저에서 직접 가져오면 CORS 에 막히므로 서버에서 대신 가져온다
 * - 1차: watch 페이지의 captionTracks 추출 (괄호 균형 파싱)
 * - 2차: innertube player API (ANDROID 클라이언트) 폴백
 * - GET /api/subtitles?v=VIDEO_ID&lang=ko
 */

interface Cue {
  start: number;
  end: number;
  text: string;
}

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string; // "asr" = 자동 생성
}

// 간단한 인메모리 캐시 (1시간)
const cache = new Map<string, { cues: Cue[]; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** "captionTracks": 뒤의 JSON 배열을 괄호 균형으로 안전하게 추출
 *  (이름이 runs 배열 형태인 경우 정규식 lazy 매칭이 중간 ] 에서 끊기는 문제 방지) */
function extractCaptionTracks(html: string): CaptionTrack[] | null {
  const key = '"captionTracks":';
  const idx = html.indexOf(key);
  if (idx === -1) return null;
  const start = html.indexOf("[", idx);
  if (start === -1) return null;

  let depth = 0;
  for (let j = start; j < html.length; j++) {
    const ch = html[j];
    if (ch === '"') {
      // 문자열 내부 스킵 (이스케이프 고려)
      j += 1;
      while (j < html.length && html[j] !== '"') {
        if (html[j] === "\\") j += 1;
        j += 1;
      }
    } else if (ch === "[") {
      depth += 1;
    } else if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, j + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/** 1차: watch 페이지에서 자막 트랙 추출 */
async function tracksFromWatchPage(videoId: string): Promise<CaptionTrack[]> {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=ko`, {
    headers: { "user-agent": UA, "accept-language": "ko,en;q=0.8" },
    cache: "no-store",
  });
  const html = await res.text();
  return extractCaptionTracks(html) ?? [];
}

/** 2차: innertube player API (ANDROID 클라이언트) 폴백 */
async function tracksFromInnertube(videoId: string): Promise<CaptionTrack[]> {
  const res = await fetch(
    "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
    {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": UA },
      body: JSON.stringify({
        videoId,
        context: {
          client: {
            clientName: "ANDROID",
            clientVersion: "20.10.38",
            androidSdkVersion: 30,
            hl: "ko",
          },
        },
      }),
      cache: "no-store",
    },
  );
  const data = await res.json();
  return (
    data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
  );
}

/** json3 자막 다운로드 + 큐 변환 */
async function fetchCues(track: CaptionTrack): Promise<Cue[]> {
  const url = `${track.baseUrl.replace(/\\u0026/g, "&")}&fmt=json3`;
  const res = await fetch(url, {
    headers: { "user-agent": UA },
    cache: "no-store",
  });
  const data = await res.json();

  return (data.events ?? [])
    .filter((e: any) => e.segs)
    .map((e: any) => ({
      start: e.tStartMs / 1000,
      end: (e.tStartMs + (e.dDurationMs ?? 2000)) / 1000,
      text: e.segs
        .map((s: any) => s.utf8 ?? "")
        .join("")
        .replace(/\n/g, " ")
        .trim(),
    }))
    .filter((c: Cue) => c.text.length > 0);
}

/** 언어 우선순위: 요청 언어(수동) > 요청 언어(자동) > 영어 > 첫 트랙 */
function pickTrack(
  tracks: CaptionTrack[],
  lang: string,
): CaptionTrack | undefined {
  return (
    tracks.find((t) => t.languageCode === lang && t.kind !== "asr") ??
    tracks.find((t) => t.languageCode === lang) ??
    tracks.find((t) => t.languageCode === "en") ??
    tracks[0]
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("v");
  const lang = searchParams.get("lang") ?? "ko";

  if (!videoId || !/^[\w-]{5,20}$/.test(videoId)) {
    return NextResponse.json({ cues: [], source: "invalid" }, { status: 400 });
  }

  const cacheKey = `${videoId}:${lang}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    return NextResponse.json({ cues: hit.cues, source: "cache" });
  }

  let source = "none";
  let cues: Cue[] = [];

  // 1차: watch 페이지
  try {
    const tracks = await tracksFromWatchPage(videoId);
    const track = pickTrack(tracks, lang);
    if (track?.baseUrl) {
      cues = await fetchCues(track);
      source = "watch";
    }
  } catch {
    /* 폴백 진행 */
  }

  // 2차: innertube ANDROID 폴백
  if (cues.length === 0) {
    try {
      const tracks = await tracksFromInnertube(videoId);
      const track = pickTrack(tracks, lang);
      if (track?.baseUrl) {
        cues = await fetchCues(track);
        source = "innertube";
      }
    } catch {
      /* 자막 없음 */
    }
  }

  cache.set(cacheKey, { cues, ts: Date.now() });
  return NextResponse.json({ cues, source });
}
