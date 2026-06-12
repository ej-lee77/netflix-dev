"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useWatchPartyStore } from "@/store/useWatchPartyStore";
import SectionTitle from "@/components/common/SectionTitle";
import RepBadge from "@/components/common/RepBadge";
import "./scss/connectWatchParties.scss";

const TMDB_IMG = "https://image.tmdb.org/t/p";
const DEFAULT_PROFILE_IMAGE = "/images/profile/image/default_icons/17.png";

export default function ConnectWatchParties() {
  const router = useRouter();
  const { openParties, subscribeOpenParties, unsubscribeOpenParties } =
    useWatchPartyStore();

  useEffect(() => {
    subscribeOpenParties();
    return () => unsubscribeOpenParties();
  }, [subscribeOpenParties, unsubscribeOpenParties]);

  if (openParties.length === 0) return null;

  const enterParty = (
    type: "movie" | "tv",
    mediaId: number,
    partyId: string,
  ) => {
    router.push(`/watch/${type}/${mediaId}?party=${partyId}`);
  };

  return (
    <section
      className="connect-section connect-watch-parties"
      aria-label="지금 열린 같이보기 파티"
    >
      <div className="connect-section__inner">
        <SectionTitle title="지금 열린 같이보기 파티" showMore={false} />

        <div className="cwp-list">
          {openParties.map((party) => {
            const thumbnail = party.backdropPath
              ? `${TMDB_IMG}/w780${party.backdropPath}`
              : party.posterPath
                ? `${TMDB_IMG}/w500${party.posterPath}`
                : "";
            const participantCount = party.participants?.length ?? 1;

            return (
              <article
                key={party.partyId}
                className="cwp-card"
                role="button"
                tabIndex={0}
                aria-label={`${party.title}, ${party.hostNickname}님의 같이보기 파티 입장`}
                onClick={() =>
                  enterParty(party.type, party.mediaId, party.partyId)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    enterParty(party.type, party.mediaId, party.partyId);
                  }
                }}
              >
                <div
                  className="cwp-thumb"
                  style={
                    thumbnail
                      ? { backgroundImage: `url(${thumbnail})` }
                      : undefined
                  }
                >
                  <div className="cwp-thumb__shade" />
                  <span className="cwp-status">
                    <span className="cwp-status__dot" />
                    같이 보는 중
                  </span>
                  <span className="cwp-enter" aria-hidden="true">
                    입장하기 <span>→</span>
                  </span>
                </div>

                <div className="cwp-body">
                  <span className="cwp-kicker">
                    {party.type === "tv"
                      ? "SERIES WATCH PARTY"
                      : "MOVIE WATCH PARTY"}
                  </span>
                  <h3 className="cwp-title">{party.title}</h3>

                  <div className="cwp-meta">
                    <div className="cwp-host-block">
                      <span className="cwp-host__label">HOST</span>
                      <div className="cwp-host">
                        <Image
                          className="cwp-host__avatar"
                          src={party.hostImgUrl || DEFAULT_PROFILE_IMAGE}
                          alt=""
                          width={34}
                          height={34}
                          unoptimized
                        />
                        <strong>{party.hostNickname}</strong>
                        <RepBadge badge={party.hostBadge} size="sm" />
                      </div>
                    </div>

                    <div className="cwp-participants">
                      <span
                        className="cwp-participants__avatars"
                        aria-hidden="true"
                      >
                        <i />
                        <i />
                        <i />
                      </span>
                      <span>
                        <strong>{participantCount}</strong>명 참여 중
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
