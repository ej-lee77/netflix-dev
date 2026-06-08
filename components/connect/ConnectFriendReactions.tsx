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
  watchedAt: string;
  matchRate: number;
  likeCount: number;
};

const friendReactions: FriendReaction[] = [
  {
    id: 1,
    userName: "새벽두시",
    avatarUrl: "/images/profile/image/default_icons/3.png",
    movieTitle: "기묘한 이야기",
    posterUrl: "https://image.tmdb.org/t/p/w342/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg",
    comment: "뒤로 갈수록 친구들이랑 같이 추리하는 맛이 살아나요. 혼자 보다가 결국 단톡방 열었어요.",
    reaction: "몰입",
    watchedAt: "방금 전",
    matchRate: 93,
    likeCount: 128,
  },
  {
    id: 2,
    userName: "무비테라스",
    avatarUrl: "/images/profile/image/default_icons/8.png",
    movieTitle: "오징어 게임",
    posterUrl: "https://image.tmdb.org/t/p/w342/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg",
    comment: "한 번 틀면 끊기 힘든 속도감. 주말 정주행으로 딱이에요. 다음 편 생각하면서 잠들었어요.",
    reaction: "정주행",
    watchedAt: "12분 전",
    matchRate: 87,
    likeCount: 96,
  },
  {
    id: 3,
    userName: "엔딩크레딧",
    avatarUrl: "/images/profile/image/default_icons/12.png",
    movieTitle: "블랙 미러",
    posterUrl: "https://image.tmdb.org/t/p/w342/7PRddO7z7mcPi21nZTCMGShAyy1.jpg",
    comment: "보고 나면 바로 누군가랑 얘기하고 싶어지는 에피소드가 많아요. 특히 시즌3 첫 화는 진짜.",
    reaction: "토론",
    watchedAt: "35분 전",
    matchRate: 91,
    likeCount: 84,
  },
  {
    id: 4,
    userName: "시네마중독",
    avatarUrl: "/images/profile/image/default_icons/16.png",
    movieTitle: "아케인",
    posterUrl: "https://image.tmdb.org/t/p/w342/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
    comment: "작화, 음악, 감정선이 다 좋아서 추천 누를 수밖에 없었어요. 애니 안 보는 사람도 빠집니다.",
    reaction: "추천",
    watchedAt: "1시간 전",
    matchRate: 78,
    likeCount: 151,
  },
  {
    id: 5,
    userName: "무드등",
    avatarUrl: "/images/profile/image/default_icons/21.png",
    movieTitle: "웬즈데이",
    posterUrl: "https://image.tmdb.org/t/p/w342/9PFonBhy4cQy7Jz20NpMygczOkv.jpg",
    comment: "분위기가 확실해서 밤에 가볍게 보기 좋았어요. 주인공 연기가 생각보다 훨씬 매력적이에요.",
    reaction: "취향저격",
    watchedAt: "2시간 전",
    matchRate: 85,
    likeCount: 73,
  },
  {
    id: 6,
    userName: "포스터수집가",
    avatarUrl: "/images/profile/image/default_icons/23.png",
    movieTitle: "다크",
    posterUrl: "https://image.tmdb.org/t/p/w342/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg",
    comment: "관계도 정리하면서 보면 훨씬 재밌어요. 복잡한 이야기 좋아하면 강추. 다 보고 나서도 한참 생각했어요.",
    reaction: "두뇌싸움",
    watchedAt: "어제",
    matchRate: 82,
    likeCount: 62,
  },
  {
    id: 7,
    userName: "필름노트",
    avatarUrl: "/images/profile/image/default_icons/5.png",
    movieTitle: "나르코스",
    posterUrl: "https://image.tmdb.org/t/p/w342/uAofYGxO3pPWpwhUfRzkXGuMjvj.jpg",
    comment: "실화 기반이라 더 묵직하게 느껴져요. 중간에 멈추기가 진짜 어려웠어요.",
    reaction: "몰입",
    watchedAt: "어제",
    matchRate: 76,
    likeCount: 47,
  },
  {
    id: 8,
    userName: "야간상영",
    avatarUrl: "/images/profile/image/default_icons/9.png",
    movieTitle: "더 크라운",
    posterUrl: "https://image.tmdb.org/t/p/w342/5qCMNVE5iIGiGnmkNqJGYMdTcqE.jpg",
    comment: "배우들 연기가 너무 좋아서 시즌 내내 빠져들었어요. 영국 왕실 이야기인데 생각보다 드라마틱해요.",
    reaction: "취향저격",
    watchedAt: "2일 전",
    matchRate: 80,
    likeCount: 55,
  },
  {
    id: 9,
    userName: "씨네루틴",
    avatarUrl: "/images/profile/image/default_icons/14.png",
    movieTitle: "오자크",
    posterUrl: "https://image.tmdb.org/t/p/w342/foEJkjDiORCDj8afsSmzqq04rBE.jpg",
    comment: "브레이킹 배드 좋아했으면 바로 시작하세요. 점점 수위가 올라가서 손에 땀이 나요.",
    reaction: "정주행",
    watchedAt: "3일 전",
    matchRate: 88,
    likeCount: 91,
  },
  {
    id: 10,
    userName: "리뷰중독자",
    avatarUrl: "/images/profile/image/default_icons/18.png",
    movieTitle: "종이의 집",
    posterUrl: "https://image.tmdb.org/t/p/w342/bIH4B1PIaQkZk15tJDFBRMgwhhS.jpg",
    comment: "시즌마다 긴장감이 달라서 지루할 틈이 없어요. 한국판도 나왔지만 원작이 역시 최고예요.",
    reaction: "추천",
    watchedAt: "4일 전",
    matchRate: 84,
    likeCount: 113,
  },
];

export default function ConnectFriendReactions() {
  const swiperRef = useRef<SwiperType | null>(null);
  const [swiperKey, setSwiperKey] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setSwiperKey((key) => key + 1), 100);
    return () => clearTimeout(id);
  }, []);

  return (
    <section
      className="connect-section connect-friend-reactions"
      aria-label="친구들의 한줄 리뷰"
    >
      <div className="connect-section__inner connect-friend-reactions__inner">
        <SectionTitle title="친구들의 한줄 리뷰" showMore={false} />

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
            {friendReactions.map((item) => (
              <SwiperSlide className="connect-friend-reactions__slide" key={item.id}>
                <article className="connect-friend-reactions__card">
                  <div className="connect-friend-reactions__glow" />

                  <div className="connect-friend-reactions__poster">
                    <img src={item.posterUrl} alt={`${item.movieTitle} 포스터`} />
                  </div>

                  <div className="connect-friend-reactions__content">
                    <div className="connect-friend-reactions__user">
                      <img
                        className="connect-friend-reactions__avatar"
                        src={item.avatarUrl}
                        alt=""
                        aria-hidden="true"
                      />
                      <div className="connect-friend-reactions__user-info">
                        <strong>{item.userName}</strong>
                        <span>{item.watchedAt}</span>
                      </div>
                    </div>
                    <p className="connect-friend-reactions__predicted">
                      예상 ★{(item.matchRate / 100 * 5).toFixed(1)}
                    </p>
                    <h3>{item.movieTitle}</h3>
                    <p className="connect-friend-reactions__review">
                      {item.comment}
                    </p>
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
