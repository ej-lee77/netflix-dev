"use client";
import React, { useState } from "react";
import "../scss/friends.scss";

type TabType = "all" | "recommend" | "watchTogether";

interface Friend {
  name: string;
  watched: number;
  reviews: number;
  lastActivity: string;
  affinity: number;
  sharedGenres: string[];
  otherGenres: string[];
}

const sampleFriends: Friend[] = [
  {
    name: "친구A",
    watched: 234,
    reviews: 45,
    lastActivity: "1시간 전",
    affinity: 92,
    sharedGenres: ["스릴러", "미스터리", "한국 드라마"],
    otherGenres: ["SF"],
  },
  {
    name: "친구B",
    watched: 189,
    reviews: 32,
    lastActivity: "3시간 전",
    affinity: 85,
    sharedGenres: ["로맨스", "코미디"],
    otherGenres: ["드라마"],
  },
  {
    name: "친구C",
    watched: 312,
    reviews: 67,
    lastActivity: "어제",
    affinity: 78,
    sharedGenres: ["애니메이션", "SF"],
    otherGenres: ["판타지"],
  },
  {
    name: "친구D",
    watched: 156,
    reviews: 21,
    lastActivity: "2일 전",
    affinity: 71,
    sharedGenres: ["다큐멘터리"],
    otherGenres: ["역사", "드라마"],
  },
];

const recommendFriends: Friend[] = [
  {
    name: "추천친구1",
    watched: 412,
    reviews: 89,
    lastActivity: "30분 전",
    affinity: 94,
    sharedGenres: ["스릴러", "미스터리", "공포"],
    otherGenres: [],
  },
  {
    name: "추천친구2",
    watched: 278,
    reviews: 54,
    lastActivity: "2시간 전",
    affinity: 88,
    sharedGenres: ["SF", "판타지"],
    otherGenres: ["애니메이션"],
  },
];

export default function FriendsPage() {
  const [tab, setTab] = useState<TabType>("all");

  const displayFriends = tab === "recommend" ? recommendFriends : sampleFriends;

  return (
    <div className="friends-page">
      <div className="inner">
        <div className="page-head">
          <h1>팔로워 • 팔로잉</h1>
          <p>취향이 비슷한 팔로워를 찾고 함께 공유해보세요</p>
        </div>

        {/* 검색 바 */}
        <div className="search-input">
          <span className="icon">⌕</span>
          <input type="text" placeholder="이름·이메일로 찾기" />
        </div>

        {/* 탭 */}
        <div className="tab-bar">
          <button className={tab === "all" ? "tab active" : "tab"} onClick={() => setTab("all")}>
            팔로워 <span className="num">{sampleFriends.length}</span>
          </button>
          <button
            className={tab === "watchTogether" ? "tab active" : "tab"}
            onClick={() => setTab("watchTogether")}
          >
            팔로잉 <span className="num">3</span>
          </button>
          <button
            className={tab === "recommend" ? "tab active" : "tab"}
            onClick={() => setTab("recommend")}
          >
            추천 유저 <span className="num">{recommendFriends.length}</span>
          </button>
        </div>

        {/* 친구 카드 그리드 */}
        <div className="friend-grid">
          {displayFriends.map((friend) => (
            <article key={friend.name} className="friend-card">
              <div className="friend-head">
                <div className="avatar"></div>
                <div className="info">
                  <h3>{friend.name}</h3>
                  <p>
                    시청 {friend.watched}편 · 리뷰 {friend.reviews}개 · 활동 {friend.lastActivity}
                  </p>
                </div>
              </div>

              <div className="affinity-row">
                <div className="affinity-head">
                  <span className="label">취향 유사도</span>
                  <span className="value">{friend.affinity}%</span>
                </div>
                {/* <div className="affinity-bar">
                  <div className="fill" style={{ width: `${friend.affinity}%` }}></div>
                </div> */}
              </div>

              <div className="common-genres">
                {friend.sharedGenres.map((g) => (
                  <span key={g} className="genre-tag shared">{g}</span>
                ))}
                {friend.otherGenres.map((g) => (
                  <span key={g} className="genre-tag">{g}</span>
                ))}
              </div>

              <div className="actions">
                
                  {tab === "recommend" ? <button className="btn">＋ 팔로우</button> : ""}
                
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
