"use client";
import React, { useEffect, useState } from 'react';
import { useMovieStore } from '@/store/useMovieStore';
import { usePlayListStore } from '@/store/usePlayListStore';

interface DetailClientProps {
  type: 'movie' | 'tv';
  mediaId: number;
}

export default function DetailClient({ type, mediaId }: DetailClientProps) {
  const isTv = type === 'tv';

  const {
    tvs, tvVideos, onFetchTvs, onFetchTvVideos,
    seasons, onFetchSeasons,
    episodes, onFetchEpisodes,
    popMovies, popVideos, onFetchPopular, onFetchVideo
  } = useMovieStore();

  const { onAddPlayList } = usePlayListStore();

  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [selectSeason, setSelectSeason] = useState<number>(1);
  const [selectEpisodeId, setSelectEpisodeId] = useState<number | null>(null);

  useEffect(() => {
    if (isTv && tvs.length === 0) {
      onFetchTvs();
    } else if (!isTv && popMovies.length === 0) {
      onFetchPopular();
    }
  }, [isTv, tvs, popMovies, onFetchTvs, onFetchPopular]);

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

  const mediaItem = isTv 
    ? tvs.find((t) => t.id === mediaId) 
    : popMovies.find((m) => m.id === mediaId);

  const videos = isTv 
    ? (mediaItem ? tvVideos[mediaItem.id] : undefined) 
    : (mediaItem ? popVideos[mediaItem.id] : undefined);

  const trailer = videos?.find((v) => v.type === 'Trailer' || v.type === 'Teaser');
  const videoKey = trailer?.key ?? null;

  const selectedEpisode = isTv 
    ? (episodes.find((ep) => ep.id === selectEpisodeId) ?? episodes[0] ?? null)
    : null;

  const title = mediaItem 
    ? ('name' in mediaItem ? mediaItem.name : (mediaItem as any).title) 
    : '';

  const handleSeasonSelect = (seasonNumber: number) => {
    setSelectSeason(seasonNumber);
  };

  const handlePlay = async () => {
    if (!mediaItem) return;
    if (isTv) {
      await onFetchTvVideos(mediaId);
    } else {
      await onFetchVideo(mediaId);
    }
    await onAddPlayList(mediaItem);
    setShowPopup(true);
  };

  return (
    <>
      {/* 상단 상세 정보 영역 */}
      <div className='flex'>
        <div className="w-2/5">
          {mediaItem?.poster_path && (
            <img src={`https://image.tmdb.org/t/p/w500${mediaItem.poster_path}`} alt={title} />
          )}
        </div>
        <div className='w-3/5'>
          <h2 className='text-4xl font-bold'>{title}</h2>
          <p>{mediaItem?.vote_average}</p>
          <p className='mt-10 mb-10'>{mediaItem?.overview}</p>
          <div className='flex gap-5'>
            <button className='bg-black text-white p-4' onClick={handlePlay}>재생하기</button>
            <button className='border border-black p-4'>찜하기</button>
          </div>
        </div>
      </div>

      {/* TV 시즌/에피소드 영역 */}
      {isTv && (
        <div className='season mt-10'>
          <div className='bg-slate-100 p-6 rounded-3xl'>
            <h3 className='text-2xl font-semibold'>시즌 선택하기</h3>
            <div className='flex gap-3 flex-wrap'>
              {seasons.map((season) => (
                <button
                  className={`rounded-full px-5 py-2 text-sm ${selectSeason === season.season_number ? 'bg-black text-white' : 'bg-white shadow-sm'}`}
                  key={season.id}
                  onClick={() => handleSeasonSelect(season.season_number)}
                >
                  {season.name}
                </button>
              ))}
            </div>
          </div>

          <div className='mt-10 flex gap-8'>
            <div className='bg-slate-100 p-6 rounded-3xl w-3/5'>
              <h3 className='text-2xl font-semibold'>에피소드 목록</h3>
              <ul>
                {episodes.map((ep) => (
                  <li className='flex gap-2 px-5 py-4 cursor-pointer' key={ep.id} onClick={() => setSelectEpisodeId(ep.id)}>
                    <div className='w-30'><img src={`https://image.tmdb.org/t/p/w200${ep.still_path}`} alt={ep.name} /></div>
                    <div className='flex-1'>
                      <strong>E{ep.episode_number}. {ep.name}</strong>
                      <p className='text-sm text-gray-600 line-clamp-2'>{ep.overview}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className='bg-slate-100 p-6 rounded-3xl w-2/5'>
              <h3 className='text-2xl font-semibold'>선택된 에피소드</h3>
              {selectedEpisode && (
                <>
                  <div className='w-full'><img src={`https://image.tmdb.org/t/p/original${selectedEpisode.still_path}`} alt={selectedEpisode.name} /></div>
                  <p className='text-lg font-semibold mt-2'>E{selectedEpisode.episode_number}. {selectedEpisode.name}</p>
                  <p className='text-sm mt-1'>{selectedEpisode.overview}</p>
                </>
              )}
              <button className='mt-6 bg-black text-white p-4 w-full' onClick={handlePlay}>재생하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 비디오 팝업 */}
      {showPopup && videoKey && (
        <div className='fixed bg-black z-[10000] w-full h-full top-0 left-0'>
          <button className='absolute right-5 top-5 bg-white/10 px-4 py-2 text-white z-50' onClick={() => setShowPopup(false)}>닫기</button>
          <div className='flex h-full items-center justify-center'>
            <iframe className='h-[90vh] w-full' src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&mute=1`} title="Trailer"></iframe>
          </div>
        </div>
      )}
    </>
  );
}