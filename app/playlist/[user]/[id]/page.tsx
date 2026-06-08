"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { usePlayListStore } from "@/store/usePlayListStore";
import { filters } from "../../../category/page";
import "../../../scss/playlistDetail.scss";
import Link from "next/link";

// 무드 태그가 id(chill 등)로 저장돼 있으면 한글 라벨로 변환, 아니면 그대로 노출
function moodLabel(tag: string): string {
  const m = filters.mood.find((x) => x.id === tag);
  return m ? m.label : tag;
}

export default function PlaylistPage() {
  const params = useParams();
  const userId = params.user as string;
  const listId = params.id as string;

  const { currentPlaylist, fetchPlaylist } = usePlayListStore();

  useEffect(() => {
    if (userId && listId) {
      fetchPlaylist(userId, listId);
    }
  }, [userId, listId, fetchPlaylist]);

  if (!currentPlaylist) {
    return (
      <div className="playlist-detail-page">
        <p className="pl-empty">플레이리스트를 불러오는 중이거나 찾을 수 없습니다.</p>
      </div>
    );
  }

  const tags: string[] = currentPlaylist.tags ?? [];
  const items: any[] = currentPlaylist.items ?? [];

  return (
    <div className="playlist-detail-page">
      {/* 플레이리스트 정보 */}
      <header className="pl-head">
        <div className="pl-head-top">
          <span className="pl-kicker">🎬 플레이리스트</span>
          {currentPlaylist.isShare && <span className="pl-public-badge">피드 공개</span>}
        </div>
        <h1>{currentPlaylist.name}</h1>
        {currentPlaylist.content && <p className="pl-desc">{currentPlaylist.content}</p>}

        {tags.length > 0 && (
          <div className="pl-tags">
            {tags.map((t) => (
              <span key={t} className="pl-tag">
                {moodLabel(t)}
              </span>
            ))}
          </div>
        )}

        <p className="pl-count">{items.length}개 작품</p>
      </header>

      {/* 작품 목록 */}
      <section className="pl-video-list">
        {items.map((item) => (
          <article key={`${item.mediaType}-${item.id}`} className="pl-video-item">
            <Link href={`/detail/${item.mediaType}/${item.id}`} className="pl-video-poster">
              {item.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                  alt={item.title}
                />
              ) : (
                <div className="pl-poster-fallback" />
              )}
            </Link>

            <div className="pl-video-info">
              <Link href={`/detail/${item.mediaType}/${item.id}`} className="pl-video-title">
                <h3>{item.title}</h3>
              </Link>
              {item.overview && <p className="pl-video-overview">{item.overview}</p>}

              <Link href={`/detail/${item.mediaType}/${item.id}`} className="pl-play-btn">
                ▶ 재생하기
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
