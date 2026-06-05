"use client";

import SectionTitle from "@/components/common/SectionTitle";
import { useEffect, useRef, useState } from "react";
import { FreeMode, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "./scss/connectSection.scss";
import "./scss/connectFriendReactions.scss";

type FriendReaction = {
  id: number;
  userName: string;
  avatarUrl: string;
  movieTitle: string;
  posterUrl: string;
  comment: string;
  reaction: string;
  likeCount: number;
  watchedAt: string;
};

const friendReactions: FriendReaction[] = [
  {
    id: 1,
    userName: "새벽두시",
    avatarUrl: "/images/profile/image/default_icons/3.png",
    movieTitle: "기묘한 이야기",
    posterUrl: "https://image.tmdb.org/t/p/w342/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg",
    comment: "뒤로 갈수록 친구들이랑 같이 추리하는 맛이 살아나요.",
    reaction: "몰입",
    likeCount: 128,
    watchedAt: "방금 전",
  },
  {
    id: 2,
    userName: "무비테라스",
    avatarUrl: "/images/profile/image/default_icons/8.png",
    movieTitle: "오징어 게임",
    posterUrl: "https://image.tmdb.org/t/p/w342/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg",
    comment: "한 번 틀면 끊기 힘든 속도감. 주말 정주행으로 딱이에요.",
    reaction: "정주행",
    likeCount: 96,
    watchedAt: "12분 전",
  },
  {
    id: 3,
    userName: "엔딩크레딧",
    avatarUrl: "/images/profile/image/default_icons/12.png",
    movieTitle: "블랙 미러",
    posterUrl: "https://image.tmdb.org/t/p/w342/7PRddO7z7mcPi21nZTCMGShAyy1.jpg",
    comment: "보고 나면 바로 누군가랑 얘기하고 싶어지는 에피소드가 많아요.",
    reaction: "토론",
    likeCount: 84,
    watchedAt: "35분 전",
  },
  {
    id: 4,
    userName: "시네마중독",
    avatarUrl: "/images/profile/image/default_icons/16.png",
    movieTitle: "아케인",
    posterUrl: "https://image.tmdb.org/t/p/w342/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
    comment: "작화, 음악, 감정선이 다 좋아서 추천 누를 수밖에 없었어요.",
    reaction: "추천",
    likeCount: 151,
    watchedAt: "1시간 전",
  },
  {
    id: 5,
    userName: "무드등",
    avatarUrl: "/images/profile/image/default_icons/21.png",
    movieTitle: "웬즈데이",
    posterUrl: "https://image.tmdb.org/t/p/w342/9PFonBhy4cQy7Jz20NpMygczOkv.jpg",
    comment: "분위기가 확실해서 밤에 가볍게 보기 좋았어요.",
    reaction: "취향저격",
    likeCount: 73,
    watchedAt: "2시간 전",
  },
  {
    id: 6,
    userName: "포스터수집가",
    avatarUrl: "/images/profile/image/default_icons/23.png",
    movieTitle: "다크",
    posterUrl: "https://image.tmdb.org/t/p/w342/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg",
    comment: "관계도 정리하면서 보면 훨씬 재밌어요. 복잡한 이야기 좋아하면 추천.",
    reaction: "두뇌싸움",
    likeCount: 62,
    watchedAt: "어제",
  },
];

export default function ConnectFriendReactions() {
  const swiperRef = useRef<SwiperType | null>(null);
  const [swiperKey, setSwiperKey] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setSwiperKey((key) => key + 1));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section
      className="connect-section connect-friend-reactions"
      aria-label="친구들의 한줄 리뷰"
    >
      <div className="connect-section__inner connect-friend-reactions__inner">
        <SectionTitle
          title="친구들의 한줄 리뷰"
          showMore={false}
        />

        <div className="connect-friend-reactions__swiper-shell">
          <Swiper
            key={swiperKey}
            className="connect-friend-reactions__list"
            freeMode
            navigation
            modules={[FreeMode, Navigation]}
            slidesPerView="auto"
            spaceBetween={18}
            observer
            observeParents
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            breakpoints={{
              0: { spaceBetween: 14 },
              861: { spaceBetween: 18 },
            }}
          >
            {friendReactions.map((item) => (
              <SwiperSlide className="connect-friend-reactions__slide" key={item.id}>
                <article className="connect-friend-reactions__card">
                  <div className="connect-friend-reactions__poster">
                    <img src={item.posterUrl} alt={`${item.movieTitle} 포스터`} />
                  </div>

                  <div className="connect-friend-reactions__content">
                    <div className="connect-friend-reactions__user">
                      <img src={item.avatarUrl} alt="" aria-hidden="true" />
                      <div>
                        <strong>{item.userName}</strong>
                        <span>{item.watchedAt}</span>
                      </div>
                    </div>

                    <span className="connect-friend-reactions__badge">
                      {item.reaction}
                    </span>

                    <h3>{item.movieTitle}</h3>
                    <p>{item.comment}</p>

                    <div className="connect-friend-reactions__footer">
                      <span>좋아요 {item.likeCount}</span>
                      <button type="button">보고 싶어요</button>
                    </div>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
