"use client";

import SectionTitle from "@/components/common/SectionTitle";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { useAuthStore } from "@/store/useAuthStore";
import { useFollowStore } from "@/store/useFollowStore";

import "swiper/css";
import "swiper/css/free-mode";
import "./scss/connectSection.scss";
import "./scss/connectFollowingUsers.scss";

export default function ConnectFollowingUsers() {
  const router = useRouter();
  const { currentProfile } = useAuthStore();
  const { followingUsers, isLoadingFollowing, fetchFollowingUsers } = useFollowStore();
  const swiperRef = useRef<SwiperType | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const [swiperKey, setSwiperKey] = useState(0);

  const followingIds = currentProfile?.community?.following ?? [];

  useEffect(() => {
    fetchFollowingUsers();
  }, [currentProfile?.id, followingIds.length]);

  useEffect(() => {
    const id = setTimeout(() => setSwiperKey((k) => k + 1), 100);
    return () => {
      clearTimeout(id);
      roRef.current?.disconnect();
    };
  }, []);

  if (!currentProfile) return null;

  if (isLoadingFollowing) {
    return (
      <section className="connect-section connect-following-users" aria-label="팔로우하는 유저">
        <div className="connect-section__inner connect-following-users__inner">
          <SectionTitle title="팔로우하는 유저" showMore={false} />
          <div className="connect-following-users__skeleton">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="connect-following-users__skeleton-item">
                <div className="connect-following-users__skeleton-avatar skeleton-pulse" />
                <div className="connect-following-users__skeleton-name skeleton-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (followingUsers.length === 0) {
    return (
      <section className="connect-section connect-following-users" aria-label="팔로우하는 유저">
        <div className="connect-section__inner connect-following-users__inner">
          <SectionTitle title="팔로우하는 유저" showMore={false} />
          <div className="connect-following-users__empty">
            <p className="connect-following-users__empty-desc">아직 팔로우하는 유저가 없어요</p>
            <button type="button" className="connect-following-users__empty-btn" onClick={() => router.push("/friends")}>
              나에게 맞는 팔로우 찾기
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="connect-section connect-following-users"
      aria-label="팔로우하는 유저"
    >
      <div className="connect-section__inner connect-following-users__inner">
        <SectionTitle title="팔로우하는 유저" showMore={false} />

        <Swiper
          key={swiperKey}
          className="connect-following-users__list"
          freeMode
          modules={[FreeMode]}
          slidesPerView="auto"
          spaceBetween={30}
          observer
          observeParents
          onSwiper={(s) => { swiperRef.current = s; }}
          breakpoints={{
            0: { spaceBetween: 15 },
            861: { spaceBetween: 30 },
          }}
        >
          {followingUsers.map((user) => {
            const initials = user.nickname.slice(0, 2).toUpperCase();
            return (
              <SwiperSlide
                className="connect-following-users__slide"
                key={user.userId}
              >
                <button className="connect-following-users__item" type="button">
                  <span className="connect-following-users__avatar">
                    {user.imgUrl ? (
                      <img
                        src={user.imgUrl}
                        alt={user.nickname}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </span>
                  <strong>{user.nickname}</strong>
                </button>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}
