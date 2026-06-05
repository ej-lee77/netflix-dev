export type TrendingMediaType = "movie" | "tv";
export type TrendingMediaTypeFilter = "all" | TrendingMediaType;

export type TrendingMediaItem = {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type: TrendingMediaType;
  popularity: number;
};

type TmdbTrendingCandidate = {
  id?: number;
  media_type?: string;
  title?: string;
  name?: string;
  poster_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  popularity?: number;
  adult?: boolean;
};

type TmdbListResponse<T> = {
  results?: T[];
};

type TmdbVideoCandidate = {
  key?: string;
  site?: string;
  type?: string;
  official?: boolean;
};

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";

const isTrendingMediaType = (
  value: string | undefined,
): value is TrendingMediaType => value === "movie" || value === "tv";

export const getTrendingYear = (item: TrendingMediaItem) =>
  (item.release_date || item.first_air_date || "").slice(0, 4);

export const normalizeTrendingMediaItem = (
  item: TmdbTrendingCandidate,
  fallbackMediaType?: TrendingMediaType,
): TrendingMediaItem | null => {
  const mediaType = isTrendingMediaType(item.media_type)
    ? item.media_type
    : fallbackMediaType;
  const title = item.title || item.name;

  if (!item.id || !mediaType || !title || item.adult) return null;

  return {
    id: item.id,
    title,
    poster_path: item.poster_path ?? null,
    vote_average: item.vote_average ?? 0,
    release_date: item.release_date,
    first_air_date: item.first_air_date,
    media_type: mediaType,
    popularity: item.popularity ?? 0,
  };
};

export const uniqueAndSortTrendingItems = (items: TrendingMediaItem[]) => {
  const itemMap = new Map<string, TrendingMediaItem>();

  items.forEach((item) => {
    const key = `${item.media_type}-${item.id}`;
    const prev = itemMap.get(key);

    if (!prev || item.popularity > prev.popularity) {
      itemMap.set(key, item);
    }
  });

  return Array.from(itemMap.values()).sort((a, b) => b.popularity - a.popularity);
};

export const fetchTrendingMedia = async (
  typeFilter: TrendingMediaTypeFilter,
  signal: AbortSignal,
  limit = 5,
) => {
  if (!TMDB_KEY) return [];

  const endpoint =
    typeFilter === "all"
      ? `${TMDB_BASE}/trending/all/week`
      : `${TMDB_BASE}/${typeFilter}/popular`;
  const params = new URLSearchParams({
    api_key: TMDB_KEY,
    language: "ko-KR",
    page: "1",
  });

  const response = await fetch(`${endpoint}?${params.toString()}`, { signal });
  if (!response.ok) throw new Error("인기 작품을 불러오지 못했습니다.");

  const data = (await response.json()) as TmdbListResponse<TmdbTrendingCandidate>;
  const items = (data.results ?? [])
    .map((item) => normalizeTrendingMediaItem(item, typeFilter === "all" ? undefined : typeFilter))
    .filter((item): item is TrendingMediaItem => Boolean(item));

  return uniqueAndSortTrendingItems(items).slice(0, limit);
};

const pickTrailerKey = (videos: TmdbVideoCandidate[]) => {
  const youtubeVideos = videos.filter((video) => video.site === "YouTube" && video.key);
  const trailer =
    youtubeVideos.find((video) => video.type === "Trailer" && video.official) ??
    youtubeVideos.find((video) => video.type === "Trailer") ??
    youtubeVideos.find((video) => video.type === "Teaser") ??
    youtubeVideos[0];

  return trailer?.key ?? null;
};

export const fetchTrendingTrailerKey = async (
  item: Pick<TrendingMediaItem, "id" | "media_type">,
  signal: AbortSignal,
) => {
  if (!TMDB_KEY) return null;

  const fetchVideos = async (language: string) => {
    const params = new URLSearchParams({
      api_key: TMDB_KEY,
      language,
    });
    const response = await fetch(
      `${TMDB_BASE}/${item.media_type}/${item.id}/videos?${params.toString()}`,
      { signal },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as TmdbListResponse<TmdbVideoCandidate>;
    return pickTrailerKey(data.results ?? []);
  };

  return (await fetchVideos("ko-KR")) ?? (await fetchVideos("en-US"));
};
