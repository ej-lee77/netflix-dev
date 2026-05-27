"use client";

import SectionTitle from "@/components/common/SectionTitle";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/free-mode";
import "./scss/connectSection.scss";
import "./scss/connectFollowingPlaylists.scss";

type FollowingPlaylist = {
  user: string;
  title: string;
  badge: string;
  posters: string[];
};

const followingPlaylists: FollowingPlaylist[] = [
  {
    user: "이진민",
    title: "Action",
    badge: "Top 10 In",
    posters: [
      "https://image.tmdb.org/t/p/w342/uyiALGPVtVsrTY4YHSq2osSYls5.jpg",
      "https://image.tmdb.org/t/p/w342/4LaJseYluZxp4Odlisd1Zb4RWHR.jpg",
      "https://image.tmdb.org/t/p/w342/9gaN2j0yWeS7Te9Wjia7Pw3EBq1.jpg",
      "https://image.tmdb.org/t/p/w342/u2aVXft5GLBQnjzWVNda7sdDpdu.jpg",
    ],
  },
  {
    user: "김시선",
    title: "Comedy",
    badge: "Top 10 In",
    posters: [
      "https://image.tmdb.org/t/p/w342/f1i6kynpQDXcXxyZU5fpG9AwbKz.jpg",
      "https://image.tmdb.org/t/p/w342/i1pkFRi96SsIqat5vIoFHCwysv1.jpg",
      "https://image.tmdb.org/t/p/w342/ty2BX4V4ZBAg2ApG2WMmVYKwB1t.jpg",
      "https://image.tmdb.org/t/p/w342/5NJmR3IA7Rk3inlA4AeQy5ZC5cA.jpg",
    ],
  },
  {
    user: "쥬시가십",
    title: "Adventure",
    badge: "Top 10 In",
    posters: [
      "https://image.tmdb.org/t/p/w342/u2aVXft5GLBQnjzWVNda7sdDpdu.jpg",
      "https://image.tmdb.org/t/p/w342/t7F6s18frvtkCnciCQeIOqzz9Tu.jpg",
      "https://image.tmdb.org/t/p/w342/9gaN2j0yWeS7Te9Wjia7Pw3EBq1.jpg",
      "https://image.tmdb.org/t/p/w342/hpxeGXdaXKqRdyZOjo1GhVEAtRp.jpg",
    ],
  },
  {
    user: "차지훈",
    title: "Drama",
    badge: "Top 10 In",
    posters: [
      "https://image.tmdb.org/t/p/w342/4LaJseYluZxp4Odlisd1Zb4RWHR.jpg",
      "https://image.tmdb.org/t/p/w342/ty2BX4V4ZBAg2ApG2WMmVYKwB1t.jpg",
      "https://image.tmdb.org/t/p/w342/i1pkFRi96SsIqat5vIoFHCwysv1.jpg",
      "https://image.tmdb.org/t/p/w342/uyiALGPVtVsrTY4YHSq2osSYls5.jpg",
    ],
  },
  {
    user: "무비로그",
    title: "Thriller",
    badge: "Top 10 In",
    posters: [
      "https://image.tmdb.org/t/p/w342/t7F6s18frvtkCnciCQeIOqzz9Tu.jpg",
      "https://image.tmdb.org/t/p/w342/hpxeGXdaXKqRdyZOjo1GhVEAtRp.jpg",
      "https://image.tmdb.org/t/p/w342/5NJmR3IA7Rk3inlA4AeQy5ZC5cA.jpg",
      "https://image.tmdb.org/t/p/w342/f1i6kynpQDXcXxyZU5fpG9AwbKz.jpg",
    ],
  },
  {
    user: "씨네마켓",
    title: "Romance",
    badge: "Top 10 In",
    posters: [
      "https://image.tmdb.org/t/p/w342/ty2BX4V4ZBAg2ApG2WMmVYKwB1t.jpg",
      "https://image.tmdb.org/t/p/w342/5NJmR3IA7Rk3inlA4AeQy5ZC5cA.jpg",
      "https://image.tmdb.org/t/p/w342/4LaJseYluZxp4Odlisd1Zb4RWHR.jpg",
      "https://image.tmdb.org/t/p/w342/f1i6kynpQDXcXxyZU5fpG9AwbKz.jpg",
    ],
  },
  {
    user: "필름토크",
    title: "Mystery",
    badge: "Top 10 In",
    posters: [
      "https://image.tmdb.org/t/p/w342/i1pkFRi96SsIqat5vIoFHCwysv1.jpg",
      "https://image.tmdb.org/t/p/w342/t7F6s18frvtkCnciCQeIOqzz9Tu.jpg",
      "https://image.tmdb.org/t/p/w342/u2aVXft5GLBQnjzWVNda7sdDpdu.jpg",
      "https://image.tmdb.org/t/p/w342/hpxeGXdaXKqRdyZOjo1GhVEAtRp.jpg",
    ],
  },
  {
    user: "리뷰온",
    title: "Family",
    badge: "Top 10 In",
    posters: [
      "https://image.tmdb.org/t/p/w342/5NJmR3IA7Rk3inlA4AeQy5ZC5cA.jpg",
      "https://image.tmdb.org/t/p/w342/uyiALGPVtVsrTY4YHSq2osSYls5.jpg",
      "https://image.tmdb.org/t/p/w342/ty2BX4V4ZBAg2ApG2WMmVYKwB1t.jpg",
      "https://image.tmdb.org/t/p/w342/i1pkFRi96SsIqat5vIoFHCwysv1.jpg",
    ],
  },
];

export default function ConnectFollowingPlaylists() {
  return (
    <section
      className="connect-section connect-following-playlists"
      aria-label="팔로우 유저의 플레이리스트"
    >
      <div className="connect-section__inner connect-following-playlists__inner">
        <SectionTitle title="팔로우 유저의 플레이리스트" showMore={false} />

        <Swiper
          className="connect-following-playlists__list"
          freeMode
          modules={[FreeMode]}
          slidesPerView="auto"
          spaceBetween={22}
          breakpoints={{
            0: {
              spaceBetween: 14,
            },
            861: {
              spaceBetween: 22,
            },
          }}
        >
          {followingPlaylists.map((playlist) => (
            <SwiperSlide
              className="connect-following-playlists__slide"
              key={`${playlist.user}-${playlist.title}`}
            >
              <button
                className="connect-following-playlists__card"
                type="button"
              >
                <span className="connect-following-playlists__poster-grid">
                  {playlist.posters.map((poster, index) => (
                    <img
                      src={poster}
                      alt=""
                      aria-hidden="true"
                      key={`${poster}-${index}`}
                    />
                  ))}
                </span>

                <span className="connect-following-playlists__meta">
                  <span className="connect-following-playlists__badge">
                    {playlist.user}
                  </span>
                  <span className="connect-following-playlists__title">
                    {playlist.user}님의 추천작품
                  </span>
                  <span
                    className="connect-following-playlists__arrow"
                    aria-hidden="true"
                  >
                    ↗
                  </span>
                </span>
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
