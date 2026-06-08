"use client";
import React, { useState, useEffect } from "react";
import "../scss/friends.scss";
import { db } from "@/firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuthStore } from "@/store/useAuthStore";
import { useFollowStore } from "@/store/useFollowStore";
import BackButton from "@/components/common/BackButton";

type TabType = "all" | "following" | "followers";

interface UserCard {
  userId: string;
  nickname: string;
  imgUrl: string;
  watchedCount: number;
}

export default function FriendsPage() {
  const [tab, setTab] = useState<TabType>("all");
  const [allUsers, setAllUsers] = useState<UserCard[]>([]);
  const [search, setSearch] = useState("");

  const { user, currentProfile } = useAuthStore();
  const { follow, unfollow } = useFollowStore();

  const followingIds: string[] = currentProfile?.community?.following ?? [];
  const followerIds: string[] = currentProfile?.community?.followers ?? [];

  useEffect(() => {
    if (!user) return;
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      const list: UserCard[] = [];
      querySnapshot.forEach((docSnap) => {
        if (docSnap.id === user.userId) return;
        const data = docSnap.data();
        const firstProfile = data.profile?.[0];
        if (!firstProfile) return;
        list.push({
          userId: docSnap.id,
          nickname: firstProfile.nickname ?? "유저",
          imgUrl: firstProfile.imgUrl ?? "",
          watchedCount: firstProfile.movies?.watchingVideos?.length ?? 0,
        });
      });
      setAllUsers(list);
    };
    fetchUsers();
  }, [user?.userId]);

  const filtered = allUsers.filter((u) =>
    u.nickname.toLowerCase().includes(search.toLowerCase())
  );

  const displayList =
    tab === "following"
      ? filtered.filter((u) => followingIds.includes(u.userId))
      : tab === "followers"
      ? filtered.filter((u) => followerIds.includes(u.userId))
      : filtered;

  const handleFollowToggle = async (userId: string) => {
    if (followingIds.includes(userId)) {
      await unfollow(userId);
    } else {
      await follow(userId);
    }
  };

  return (
    <div className="friends-page follow-variant">
      <div className="inner">
        <BackButton fallback="/mypage" />
        <div className="page-head">
          <h1>팔로우</h1>
          <p>
            팔로잉 {followingIds.length}명 · 팔로워 {followerIds.length}명
          </p>
        </div>

        <div className="search-input">
          <span className="icon">⌕</span>
          <input
            type="text"
            placeholder="닉네임으로 찾기"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="tab-bar">
          <button
            className={tab === "all" ? "tab active" : "tab"}
            onClick={() => setTab("all")}
          >
            전체 <span className="num">{allUsers.length}</span>
          </button>
          <button
            className={tab === "following" ? "tab active" : "tab"}
            onClick={() => setTab("following")}
          >
            팔로잉 <span className="num">{followingIds.length}</span>
          </button>
          <button
            className={tab === "followers" ? "tab active" : "tab"}
            onClick={() => setTab("followers")}
          >
            팔로워 <span className="num">{followerIds.length}</span>
          </button>
        </div>

        <ul className="follow-list">
          {displayList.length === 0 ? (
            <li className="follow-item" style={{ justifyContent: "center", opacity: 0.5 }}>
              유저가 없습니다.
            </li>
          ) : (
            displayList.map((u) => {
              const isFollowing = followingIds.includes(u.userId);
              const initials = u.nickname.slice(0, 2).toUpperCase();
              return (
                <li key={u.userId} className="follow-item">
                  <div className="avatar">
                    {u.imgUrl ? (
                      <img
                        src={u.imgUrl}
                        alt={u.nickname}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                      />
                    ) : (
                      <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>{initials}</span>
                    )}
                  </div>
                  <div className="info">
                    <h3>{u.nickname}</h3>
                    <p>시청 {u.watchedCount}편</p>
                  </div>
                  <button
                    className="follow-btn"
                    onClick={() => handleFollowToggle(u.userId)}
                    style={isFollowing ? { opacity: 0.6 } : {}}
                  >
                    {isFollowing ? "팔로잉" : "팔로우"}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
