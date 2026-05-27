"use client";

import React, { useEffect, useState } from "react";
import { useMovieStore } from "@/store/useMovieStore";
import { usePlayListStore } from "@/store/usePlayListStore";
import type { CastMember, Movie, RecommendedItem, TV, Video } from "@/types/movie";

interface DetailClientProps {
  type: "movie" | "tv";
  mediaId: number;
}

type DetailMedia = (Movie | TV) & {
  created_by?: { id: number; name: string }[];
  first_air_date?: string;
  genres?: { id: number; name: string }[];
  number_of_episodes?: number;
  number_of_seasons?: number;
  production_countries?: { iso_3166_1: string; name: string }[];
  runtime?: number;
  status?: string;
  tagline?: string;
};

type DetailTab = "episodes" | "info" | "cast" | "director" | "review" | "related";

const MAIN_COLOR = "#e50914";
const PAGE_BG = "#141414";

function getTitle(item?: DetailMedia) {
  if (!item) return "";
  return "name" in item ? item.name : item.title;
}

function imageUrl(path?: string | null, size = "w500") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : "";
}

export default function DetailClient({ type, mediaId }: DetailClientProps) {
  const isTv = type === "tv";

  const {
    tvs, tvVideos, onFetchTvs, onFetchTvVideos,
    seasons, onFetchSeasons,
    episodes, onFetchEpisodes,
    popMovies, popVideos, onFetchPopular, onFetchVideo,
    mediaDetails, onFetchMediaDetail,
    casts, onFetchCredits,
    recommended, onFetchRecommended
  } = useMovieStore();

  const { onAddPlayList } = usePlayListStore();

  const [showPopup, setShowPopup] = useState(false);
  const [popupVideoKey, setPopupVideoKey] = useState<string | null>(null);
  const [selectSeason, setSelectSeason] = useState(1);
  const [selectEpisodeId, setSelectEpisodeId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>(isTv ? "episodes" : "info");

  useEffect(() => {
    setActiveTab(isTv ? "episodes" : "info");
  }, [isTv]);

  useEffect(() => {
    if (isTv && tvs.length === 0) {
      onFetchTvs();
    } else if (!isTv && popMovies.length === 0) {
      onFetchPopular();
    }
  }, [isTv, tvs.length, popMovies.length, onFetchTvs, onFetchPopular]);

  useEffect(() => {
    if (!mediaId) return;
    onFetchMediaDetail(mediaId, type);
    onFetchCredits(mediaId, type);
    if (isTv) {
      onFetchTvVideos(mediaId);
    } else {
      onFetchVideo(mediaId);
    }
  }, [type, isTv, mediaId, onFetchMediaDetail, onFetchCredits, onFetchTvVideos, onFetchVideo]);

  useEffect(() => {
    if (recommended.length === 0) {
      onFetchRecommended();
    }
  }, [recommended.length, onFetchRecommended]);

  useEffect(() => {
    if (isTv && mediaId) {
      onFetchSeasons(mediaId);
    }
  }, [isTv, mediaId, onFetchSeasons]);

  useEffect(() => {
    if (isTv && mediaId) {
      onFetchEpisodes(mediaId, selectSeason);
    }
  }, [isTv, mediaId, selectSeason, onFetchEpisodes]);

  const mediaItem = (mediaDetails[`${type}-${mediaId}`] ?? (
    isTv
      ? tvs.find((item) => item.id === mediaId)
      : popMovies.find((item) => item.id === mediaId)
  )) as DetailMedia | undefined;

  const title = getTitle(mediaItem);
  const releaseDate = isTv ? mediaItem?.first_air_date : (mediaItem as Movie | undefined)?.release_date;
  const releaseYear = releaseDate?.split("-")[0] ?? "";
  const genreText = mediaItem?.genres?.slice(0, 3).map((genre) => genre.name).join(", ") ?? "";
  const countryText = mediaItem?.production_countries?.slice(0, 2).map((country) => country.name).join(", ") ?? "";
  const castKey = `${type}-${mediaId}`;
  const castList = casts[castKey] ?? [];
  const directorList = isTv
    ? mediaItem?.created_by ?? []
    : castList.filter((member: CastMember) => member.order <= 2).slice(0, 3);
  const videos = isTv
    ? (mediaItem ? tvVideos[mediaItem.id] : undefined)
    : (mediaItem ? popVideos[mediaItem.id] : undefined);
  const trailer = videos?.find((video) => video.type === "Trailer" || video.type === "Teaser");
  const selectedEpisode = isTv
    ? (episodes.find((ep) => ep.id === selectEpisodeId) ?? episodes[0] ?? null)
    : null;
  const activeEpisodeId = selectedEpisode?.id ?? null;
  const selectedEpisodeImage = selectedEpisode?.still_path
    ? imageUrl(selectedEpisode.still_path, "original")
    : imageUrl(mediaItem?.backdrop_path, "original") || imageUrl(mediaItem?.poster_path, "original");
  const detailBackdrop = imageUrl(mediaItem?.backdrop_path, "original") || selectedEpisodeImage;
  const posterUrl = imageUrl(mediaItem?.poster_path, "w500");
  const relatedItems = recommended
    .filter((item: RecommendedItem) => item.id !== mediaId)
    .slice(0, 6);

  const tabItems: { id: DetailTab; label: string; meta?: string }[] = [
    ...(isTv ? [{ id: "episodes" as const, label: "회차", meta: episodes.length ? `${episodes.length}` : undefined }] : []),
    { id: "info", label: "작품 정보" },
    { id: "cast", label: "출연진", meta: castList.length ? `${castList.length}` : undefined },
    { id: "director", label: "감독" },
    { id: "review", label: "리뷰", meta: isTv ? "12.8k" : "4.2k" },
    { id: "related", label: "관련 콘텐츠" },
  ];

  const handleSeasonSelect = (seasonNumber: number) => {
    setSelectSeason(seasonNumber);
    setSelectEpisodeId(null);
  };

  const openVideo = async (key?: string | null) => {
    if (!mediaItem) return;
    if (isTv) {
      await onFetchTvVideos(mediaId);
    } else {
      await onFetchVideo(mediaId);
    }
    setPopupVideoKey(key ?? trailer?.key ?? null);
    setShowPopup(true);
  };

  const handlePlay = async () => {
    if (!mediaItem) return;
    await onAddPlayList(mediaItem);
    await openVideo();
  };

  const renderRelatedGrid = () => (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {relatedItems.map((item) => (
        <a
          className="group overflow-hidden rounded-lg border border-white/5 bg-white/6 transition hover:-translate-y-1 hover:border-[#e50914]/45"
          href={`/detail/${item.media_type}/${item.id}`}
          key={`${item.media_type}-${item.id}`}
        >
          <div className="aspect-[2/3] bg-zinc-900">
            {item.poster_path && (
              <img
                src={imageUrl(item.poster_path)}
                alt={item.title}
                className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
              />
            )}
          </div>
          <p className="line-clamp-1 px-4 py-3 text-sm font-semibold text-white/80">{item.title}</p>
        </a>
      ))}
    </div>
  );

  const renderCastGrid = (limit = 12) => (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-4 xl:grid-cols-6">
      {castList.slice(0, limit).map((member: CastMember) => (
        <div className="text-center" key={member.id}>
          <div className="mx-auto mb-4 aspect-square overflow-hidden rounded-full bg-white/8">
            {member.profile_path && (
              <img src={imageUrl(member.profile_path, "w300")} alt={member.name} className="h-full w-full object-cover" />
            )}
          </div>
          <p className="line-clamp-1 font-bold text-white">{member.name}</p>
          <p className="line-clamp-1 text-sm text-white/45">{member.character}</p>
        </div>
      ))}
    </div>
  );

  const renderVideoSection = () => {
    const displayVideos = (videos ?? []).slice(0, 3);
    const placeholders = Math.max(0, 3 - displayVideos.length);

    return (
      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-2xl font-black text-white">예고편 및 영상</h3>
          <button className="text-sm text-white/45 hover:text-white">전체보기 →</button>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {displayVideos.map((video: Video) => (
            <button
              className="group relative min-h-[180px] overflow-hidden rounded-lg border border-white/8 bg-white/8 text-left transition hover:border-[#e50914]/45"
              key={video.id}
              onClick={() => openVideo(video.key)}
            >
              <div className="absolute inset-0 flex items-center justify-center text-4xl text-white transition group-hover:scale-110">▶</div>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                <span className="line-clamp-1 text-sm text-white/58">{video.name}</span>
                <span className="rounded bg-black/70 px-2 py-1 text-xs text-white/80">{video.type}</span>
              </div>
            </button>
          ))}
          {Array.from({ length: placeholders }).map((_, index) => (
            <div className="relative min-h-[180px] rounded-lg border border-white/8 bg-white/8" key={`placeholder-${index}`}>
              <div className="absolute inset-0 flex items-center justify-center text-4xl text-white/80">▶</div>
              <p className="absolute bottom-4 left-4 text-sm text-white/42">영상 준비중</p>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderInfoGrid = () => {
    const rows = [
      ["공개연도", releaseYear || "-"],
      ["장르", genreText || "-"],
      ["국가", countryText || "-"],
      ["상태", mediaItem?.status || "-"],
      ...(isTv
        ? [
            ["시즌", mediaItem?.number_of_seasons ? `${mediaItem.number_of_seasons}개` : "-"],
            ["에피소드", mediaItem?.number_of_episodes ? `${mediaItem.number_of_episodes}개` : "-"],
          ]
        : [["상영시간", mediaItem?.runtime ? `${mediaItem.runtime}분` : "-"]]),
    ];

    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {rows.map(([label, value]) => (
          <div className="rounded-lg border border-white/8 bg-white/5 p-6" key={label}>
            <p className="mb-2 text-sm text-white/45">{label}</p>
            <p className="text-lg font-bold text-white">{value}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderDirectorPanel = () => (
    <div className="rounded-lg border border-white/8 bg-white/5 p-7">
      <p className="mb-5 text-sm font-semibold text-[#e50914]">Creative</p>
      <div className="flex flex-wrap gap-3">
        {directorList.length > 0 ? directorList.map((person) => (
          <span className="rounded-full border border-white/15 px-5 py-2 text-white/80" key={person.id}>{person.name}</span>
        )) : <p className="text-white/50">등록된 감독 정보가 없습니다.</p>}
      </div>
    </div>
  );

  const renderRatingSection = () => (
    <section className="mt-12 rounded-lg border border-white/8 bg-white/5 p-7">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h3 className="mb-2 text-2xl font-black text-white">{isTv ? "시리즈 평가" : "이 작품을 평가해보세요"}</h3>
          <p className="text-white/45">별점으로 평가하고 다음 감상 목록에 추가해보세요.</p>
        </div>
        <p className="text-3xl text-[#e50914]">★★★★☆</p>
      </div>
    </section>
  );

  const renderEpisodesPanel = () => (
    <div className="grid gap-10 lg:grid-cols-[minmax(340px,480px)_1fr]">
      <div className="relative min-h-[520px] overflow-hidden rounded-lg bg-zinc-950">
        {selectedEpisodeImage && (
          <img
            src={selectedEpisodeImage}
            alt={selectedEpisode?.name ?? title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-8">
          <p className="mb-3 text-sm font-semibold text-white/65">Season {selectSeason}</p>
          <h4 className="mb-4 text-4xl font-black leading-tight text-white">{title}</h4>
          {selectedEpisode && (
            <p className="line-clamp-3 text-sm leading-6 text-white/70">
              E{selectedEpisode.episode_number}. {selectedEpisode.name}
            </p>
          )}
          <button className="mt-7 bg-[#e50914] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#b00710]" onClick={handlePlay}>재생하기</button>
        </div>
      </div>

      <div className="relative">
        <div className="mb-5 flex flex-wrap gap-2">
          {seasons.map((season) => {
            const isSelected = selectSeason === season.season_number;

            return (
              <button
                className={`rounded-full border px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                  isSelected
                    ? "border-[#e50914] bg-[#e50914] text-white shadow-[0_0_18px_rgba(229,9,20,0.32)]"
                    : "border-white/15 bg-transparent text-white/60 hover:border-white/40 hover:text-white"
                }`}
                key={season.id}
                onClick={() => handleSeasonSelect(season.season_number)}
              >
                {season.name}
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-12 z-10 h-10 bg-gradient-to-b from-[#141414] to-transparent" />
        <ul className="flex max-h-[720px] flex-col gap-6 overflow-y-auto overflow-x-hidden py-8 pl-2 pr-5 [scrollbar-color:rgba(229,9,20,0.35)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#e50914]/35">
          {episodes.map((ep) => {
            const isActive = ep.id === activeEpisodeId;
            const stillUrl = imageUrl(ep.still_path, "w500") || imageUrl(mediaItem?.backdrop_path, "w500");

            return (
              <li
                className={`group grid min-h-[190px] cursor-pointer grid-cols-[260px_minmax(0,1fr)] overflow-hidden rounded-lg border transition-all duration-300 ${
                  isActive
                    ? "z-10 scale-[1.015] border-[#e50914]/45 bg-white/12 text-white shadow-[0_0_24px_rgba(229,9,20,0.38)]"
                    : "border-white/5 bg-black/55 text-white opacity-70 hover:scale-[1.01] hover:opacity-100"
                }`}
                key={ep.id}
                onClick={() => setSelectEpisodeId(ep.id)}
              >
                <div className="h-full min-h-[190px] overflow-hidden bg-zinc-900">
                  {stillUrl && (
                    <img
                      src={stillUrl}
                      alt={ep.name}
                      className={`h-full w-full object-cover object-center transition duration-300 ${isActive ? "opacity-100" : "opacity-75 group-hover:opacity-100"}`}
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-col justify-center" style={{ padding: "28px 32px" }}>
                  <div className="mb-3 flex items-center justify-between gap-5">
                    <strong className="line-clamp-1 text-base font-black uppercase tracking-wide">
                      {ep.episode_number}. {ep.name}
                    </strong>
                    <span className={`shrink-0 text-xs font-semibold ${isActive ? "text-white/60" : "text-white/45"}`}>
                      E{ep.episode_number}
                    </span>
                  </div>
                  <p className={`line-clamp-3 text-sm leading-7 ${isActive ? "text-white/72" : "text-white/55"}`}>{ep.overview}</p>
                  <div className={`mt-5 h-1 w-full overflow-hidden rounded-full ${isActive ? "bg-white/12" : "bg-white/10"}`}>
                    <span className={`block h-full w-1/3 rounded-full ${isActive ? "bg-[#e50914]/80" : "bg-[#e50914]/55"}`} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#141414] to-transparent" />
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (activeTab === "episodes" && isTv) return renderEpisodesPanel();
    if (activeTab === "cast") return renderCastGrid();
    if (activeTab === "director") return renderDirectorPanel();
    if (activeTab === "review") return renderRatingSection();
    if (activeTab === "related") return renderRelatedGrid();
    return renderInfoGrid();
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-[#181820]">
        {detailBackdrop && (
          <img src={detailBackdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#1b1720]/92 to-[#e50914]/18" />
        <div className="relative grid min-h-[440px] gap-10 px-12 py-16 lg:grid-cols-[240px_1fr]">
          <div className="hidden overflow-hidden rounded-lg bg-white/8 shadow-2xl lg:block">
            {posterUrl && <img src={posterUrl} alt={title} className="h-full w-full object-cover" />}
          </div>
          <div className="flex max-w-4xl flex-col justify-center">
            <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-white/55">
              <span className="rounded bg-[#e50914] px-3 py-1 font-bold text-white">{isTv ? "시리즈" : "영화"}</span>
              {releaseYear && <span>{releaseYear}</span>}
              {mediaItem?.number_of_seasons && <span>시즌 {mediaItem.number_of_seasons}</span>}
              {mediaItem?.number_of_episodes && <span>{mediaItem.number_of_episodes}부작</span>}
              {mediaItem?.runtime && <span>{mediaItem.runtime}분</span>}
              {genreText && <span>{genreText}</span>}
            </div>
            <h2 className="mb-3 text-5xl font-black leading-tight text-white">{title}</h2>
            {mediaItem?.tagline && <p className="mb-3 text-white/45">{mediaItem.tagline}</p>}
            <div className="mb-6 flex items-end gap-3">
              <strong className="text-4xl font-black text-white">{mediaItem?.vote_average?.toFixed(1) ?? "-"}</strong>
              <span className="pb-1 text-white/45">/10</span>
              <span className="pb-1 text-[#e50914]">★★★★★</span>
            </div>
            <p className="mb-8 line-clamp-3 max-w-3xl leading-7 text-white/70">{mediaItem?.overview}</p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-[#e50914] px-8 py-4 font-bold text-white transition hover:bg-[#b00710]" onClick={handlePlay}>
                ▶ {isTv ? "이어보기" : "재생하기"}
              </button>
              <button className="h-14 w-14 rounded-full border border-[#e50914] text-[#e50914]">♡</button>
              <button className="h-14 w-14 rounded-full border border-white/15 text-white/70">＋</button>
            </div>
          </div>
        </div>
      </section>

      <section className="season w-[calc(100vw-120px)] max-w-[1480px] overflow-x-hidden">
        <div className="flex border-b border-white/10" style={{ gap: "32px", padding: "0 48px" }}>
          {tabItems.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                className={`relative text-sm font-bold transition ${isActive ? "text-white" : "text-white/42 hover:text-white/75"}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ padding: "20px 0" }}
              >
                {tab.label}
                {tab.meta && <span className="ml-2 text-xs text-white/35">{tab.meta}</span>}
                {isActive && <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#e50914]" />}
              </button>
            );
          })}
        </div>

        <div style={{ padding: "40px 48px" }}>
          {renderTabContent()}

          <section className="mt-14">
            <h3 className="mb-5 text-2xl font-black text-white">{isTv ? "시리즈 줄거리" : "줄거리"}</h3>
            <p className="max-w-5xl leading-8 text-white/68">{mediaItem?.overview}</p>
          </section>

          {!isTv && renderVideoSection()}

          {renderRatingSection()}

          {!isTv && (
            <section className="mt-12">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-2xl font-black text-white">출연진</h3>
                <button className="text-sm text-white/45 hover:text-white" onClick={() => setActiveTab("cast")}>전체보기 →</button>
              </div>
              {renderCastGrid(6)}
            </section>
          )}

          <section className="mt-12">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-2xl font-black text-white">함께 보면 좋은 작품</h3>
              <button className="text-sm text-white/45 hover:text-white" onClick={() => setActiveTab("related")}>더보기 →</button>
            </div>
            {renderRelatedGrid()}
          </section>
        </div>
      </section>

      {showPopup && popupVideoKey && (
        <div className="fixed bg-black z-[10000] w-full h-full top-0 left-0">
          <button className="absolute right-5 top-5 bg-white/10 px-4 py-2 text-white z-50" onClick={() => setShowPopup(false)}>닫기</button>
          <div className="flex h-full items-center justify-center">
            <iframe className="h-[90vh] w-full" src={`https://www.youtube.com/embed/${popupVideoKey}?autoplay=1&mute=1`} title="Trailer"></iframe>
          </div>
        </div>
      )}
    </>
  );
}
