"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usePlayListStore } from "@/store/usePlayListStore";
import "../../../scss/playlistDetail.scss"
import Link from "next/link";

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

  if (!currentPlaylist) return <div>플레이리스트를 찾을 수 없습니다.</div>;

  console.log(currentPlaylist);
  return (
    <div className="playlist-detail-page">
      <div>
        <h1>{currentPlaylist.name}</h1>
        <p>{currentPlaylist.content}</p>
      </div>

      <section className="video-list">
        {currentPlaylist.items?.map((item: any) => (
          <article key={item.id} className="video-item">
            <Link href={`/detail/${item.mediaType}/${item.id}`}>
            {/* 영상 정보 표시 */}
            <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title} />
            <h3>{item.title}</h3>
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}