"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "./scss/connectReviewList.scss";

import RisingReviewCard from "./RisingReviewCard";
import { connectUsers } from "@/data/connectUser";
import SectionTitle from "../common/SectionTitle";

export default function ConnectReviewList() {
    return (
        <section className="connect-review-list">
            <div className="connect-review-list__inner">

                <SectionTitle
                    title="나와 취향이 비슷한 유저(가제)"
                    subTitle="취향 매칭률이 높은 유저를 팔로우해보세요" />


                <div className="connect-review-list__swiper-shell">
                    <Swiper
                        modules={[Navigation]}
                        navigation
                        slidesPerView="auto"
                        spaceBetween={24}
                        className="connect-review-list__swiper"
                    >
                        {connectUsers.map((user) => (
                            <SwiperSlide key={user.id} className="connect-review-list__slide">
                                <RisingReviewCard user={user} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </section>
    );
}
