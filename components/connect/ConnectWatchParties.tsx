"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWatchPartyStore } from "@/store/useWatchPartyStore";
import SectionTitle from "@/components/common/SectionTitle";
import "./scss/connectWatchParties.scss";

const TMDB_IMG = "https://image.tmdb.org/t/p";

export default function ConnectWatchParties() {
  const router = useRouter();
  const { openParties, subscribeOpenParties, unsubscribeOpenParties } = useWatchPartyStore();

  useEffect(() => {
    subscribeOpenParties();
    return () => unsubscribeOpenParties();
  }, [subscribeOpenParties, unsubscribeOpenParties]);

  // 6시간 이상 지난 파티는 숨김 (데모 정리용)
  const now = Date.now();
  const parties = openParties.filter((p) => now - (p.createdAt ?? 0) < 6 * 60 * 60 * 1000);

  if (parties.length === 0) return null;

  return (
    <section className="connect-section connect-watch-parties" aria-label="지금 열린 같이보기 파티">
      <div className="connect-section__inner">
        <SectionTitle title="지금 열린 같이보기 파티" showMore={false} />

        <div className="cwp-list">
          {parties.map((p) => {
            const thumb = p.backdropPath
              ? `${TMDB_IMG}/w300${p.backdropPath}`
              : p.posterPath
                ? `${TMDB_IMG}/w300${p.posterPath}`
                : "";
            const count = p.participants?.length ?? 1;
            return (
              <article key={p.partyId} className="cwp-card">
                <div
                  className="cwp-thumb"
                  style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}
                >
                  <span className="cwp-live">● LIVE</span>
                  <span className="cwp-count">👥 {count}</span>
                </div>
                <div className="cwp-body">
                  <h3 className="cwp-title">{p.title}</h3>
                  <p className="cwp-host">{p.hostNickname}님의 파티</p>
                  <button
                    type="button"
                    className="cwp-join"
                    onClick={() => router.push(`/watch/${p.type}/${p.mediaId}?party=${p.partyId}`)}
                  >
                    참여하기
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
