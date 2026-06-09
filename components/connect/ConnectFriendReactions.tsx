"use client";

import SectionTitle from "@/components/common/SectionTitle";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FreeMode, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { useFeedStore } from "@/store/useFeedStore";
import { getPosterUrl, getRelativeTime } from "@/types/feedData";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "./scss/connectSection.scss";
import "./scss/connectFriendReactions.scss";

export default function ConnectFriendReactions() {
  const swiperRef = useRef<SwiperType | null>(null);
  const [swiperKey, setSwiperKey] = useState(0);
  const { feeds, onHydrateFeeds } = useFeedStore();

  useEffect(() => {
    const id = setTimeout(() => setSwiperKey((key) => key + 1), 100);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (feeds.length === 0) {
      void onHydrateFeeds();
    }
  }, [feeds.length, onHydrateFeeds]);

  const visibleFeeds = feeds
    .filter((f) => f.isPublic && !f.isSpoiler && f.content)
    .slice(0, 10);

  if (visibleFeeds.length === 0) return null;

  return (
    <section
      className="connect-section connect-friend-reactions"
      aria-label="지금 뜨는 코멘트"
    >
      <div className="connect-section__inner connect-friend-reactions__inner">
        <SectionTitle title="지금 뜨는 코멘트" showMore href="/feed" />

        <div className="connect-friend-reactions__swiper-shell">
          <Swiper
            key={swiperKey}
            className="connect-friend-reactions__list"
            freeMode
            navigation
            modules={[FreeMode, Navigation]}
            slidesPerView="auto"
            spaceBetween={24}
            observer
            observeParents
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            breakpoints={{
              0: { spaceBetween: 14 },
              861: { spaceBetween: 24 },
            }}
          >
            {visibleFeeds.map((item) => (
              <SwiperSlide className="connect-friend-reactions__slide" key={item.feedId}>
                <Link href={`/feed/${item.feedId}`} className="connect-friend-reactions__card-link">
                  <article className="connect-friend-reactions__card">
                    <div className="connect-friend-reactions__glow" />

                    <div className="connect-friend-reactions__poster">
                      <img
                        src={getPosterUrl(item.mediaPoster)}
                        alt={`${item.mediaTitle} 포스터`}
                      />
                    </div>

                    <div className="connect-friend-reactions__content">
                      <div className="connect-friend-reactions__user">
                        {item.authorImage ? (
                          <img
                            className="connect-friend-reactions__avatar"
                            src={item.authorImage}
                            alt=""
                            aria-hidden="true"
                          />
                        ) : (
                          <span className="connect-friend-reactions__avatar connect-friend-reactions__avatar--initial" aria-hidden="true">
                            {item.author.charAt(0)}
                          </span>
                        )}
                        <div className="connect-friend-reactions__user-info">
                          <strong>{item.author}</strong>
                          <span>{getRelativeTime(item.createdAt)}</span>
                        </div>
                      </div>
                      <p className="connect-friend-reactions__predicted">
                        ★{item.rating.toFixed(1)}
                      </p>
                      <h3>{item.mediaTitle}</h3>
                      <p className="connect-friend-reactions__review">
                        {item.content}
                      </p>
                    </div>
                  </article>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
