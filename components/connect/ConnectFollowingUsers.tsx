"use client";

import SectionTitle from "@/components/common/SectionTitle";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/free-mode";
import "./scss/connectSection.scss";
import "./scss/connectFollowingUsers.scss";

const followingUsers = [
  { name: "이진민", theme: "orange", mark: "DE" },
  { name: "김시선", theme: "mono", mark: "KS" },
  { name: "쥬시가십", theme: "poster", mark: "J" },
  { name: "차지훈", theme: "portrait", mark: "C" },
  { name: "무비로그", theme: "orange", mark: "ML" },
  { name: "씨네마켓", theme: "mono", mark: "CM" },
  { name: "필름토크", theme: "poster", mark: "F" },
  { name: "리뷰온", theme: "portrait", mark: "R" },
  { name: "이동진", theme: "orange", mark: "DJ" },
  { name: "왓챠피디아", theme: "poster", mark: "W" },
  { name: "시네필", theme: "mono", mark: "CF" },
  { name: "무비팬", theme: "portrait", mark: "MF" },
];

export default function ConnectFollowingUsers() {
  return (
    <section
      className="connect-section connect-following-users"
      aria-label="팔로우하는 유저"
    >
      <div className="connect-section__inner connect-following-users__inner">
        <SectionTitle title="팔로우하는 유저" showMore={false} />

        <Swiper
          className="connect-following-users__list"
          freeMode
          modules={[FreeMode]}
          slidesPerView="auto"
          spaceBetween={30}
          breakpoints={{
            0: {
              spaceBetween: 15,
            },
            861: {
              spaceBetween: 30,
            },
          }}
        >
          {followingUsers.map((user, index) => (
            <SwiperSlide
              className="connect-following-users__slide"
              key={`${user.name}-${index}`}
            >
              <button className="connect-following-users__item" type="button">
                <span
                  className={`connect-following-users__avatar connect-following-users__avatar--${user.theme}`}
                >
                  <span>{user.mark}</span>
                </span>
                <strong>{user.name}</strong>
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
