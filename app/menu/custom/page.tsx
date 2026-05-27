"use client";
import React, { useState } from "react";
import Image from "next/image";
import { customMenus } from "@/data/mainMenu";
import "../../scss/custom.scss";

interface HomeSection {
  id: string;
  name: string;
  desc: string;
  enabled: boolean;
}

export default function MenuCustomPage() {
  // 홈 섹션 토글 + 순서
  const [sections, setSections] = useState<HomeSection[]>([
    { id: "ranking", name: "TOP 10 랭킹", desc: "이번 주 가장 인기있는 작품", enabled: true },
    { id: "watching", name: "최근 시청 이어보기", desc: "시청 중인 작품 빠른 진입", enabled: true },
    { id: "netflix", name: "넷플릭스 오리지널", desc: "넷플릭스만의 독점 콘텐츠", enabled: true },
    { id: "new", name: "신작", desc: "최근 공개된 작품", enabled: true },
    { id: "rising", name: "급상승 작품", desc: "지금 사람들이 많이 보는 작품", enabled: true },
    { id: "recommend", name: "맞춤 추천", desc: "취향 기반 추천 작품", enabled: true },
    { id: "topcast", name: "TOP 출연자", desc: "주목받는 배우들", enabled: false },
    { id: "release", name: "공개 예정", desc: "곧 공개될 작품", enabled: true },
  ]);

  // 알고리즘 슬라이더
  const [algoTaste, setAlgoTaste] = useState(80);
  const [algoFriend, setAlgoFriend] = useState(50);
  const [algoNew, setAlgoNew] = useState(70);

  // 선호/제외 장르 + 무드
  const [genreTab, setGenreTab] = useState<"preferred" | "excluded">("preferred");
  const [moodTab, setMoodTab] = useState<"preferred" | "excluded">("preferred");

  // 장르 분리
  const allGenres = customMenus.filter((m) => m.path.startsWith("/genre/"));
  const allMoods = customMenus.filter((m) => m.path.startsWith("/mood/"));

  const [preferredGenres, setPreferredGenres] = useState<string[]>(["스릴러", "미스터리", "SF", "드라마", "로맨스"]);
  const [excludedGenres, setExcludedGenres] = useState<string[]>(["공포", "전쟁"]);

  const [preferredMoods, setPreferredMoods] = useState<string[]>(["잔잔한", "감성적인", "심오한"]);
  const [excludedMoods, setExcludedMoods] = useState<string[]>(["무서운"]);

  const toggleSection = (id: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const toggleGenre = (genre: string) => {
    if (genreTab === "preferred") {
      if (preferredGenres.includes(genre)) {
        setPreferredGenres(preferredGenres.filter((g) => g !== genre));
      } else {
        // 제외 장르에 있으면 제외 해제 후 선호로
        setExcludedGenres(excludedGenres.filter((g) => g !== genre));
        setPreferredGenres([...preferredGenres, genre]);
      }
    } else {
      if (excludedGenres.includes(genre)) {
        setExcludedGenres(excludedGenres.filter((g) => g !== genre));
      } else {
        setPreferredGenres(preferredGenres.filter((g) => g !== genre));
        setExcludedGenres([...excludedGenres, genre]);
      }
    }
  };

  const toggleMood = (mood: string) => {
    if (moodTab === "preferred") {
      if (preferredMoods.includes(mood)) {
        setPreferredMoods(preferredMoods.filter((m) => m !== mood));
      } else {
        setExcludedMoods(excludedMoods.filter((m) => m !== mood));
        setPreferredMoods([...preferredMoods, mood]);
      }
    } else {
      if (excludedMoods.includes(mood)) {
        setExcludedMoods(excludedMoods.filter((m) => m !== mood));
      } else {
        setPreferredMoods(preferredMoods.filter((m) => m !== mood));
        setExcludedMoods([...excludedMoods, mood]);
      }
    }
  };

  const moveSection = (id: string, direction: "up" | "down") => {
    const idx = sections.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const newSections = [...sections];
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= newSections.length) return;
    [newSections[idx], newSections[target]] = [newSections[target], newSections[idx]];
    setSections(newSections);
  };

  const getAlgoLabel = (val: number) => {
    if (val < 30) return "약함";
    if (val < 70) return "중간";
    return "강함";
  };

  const handleReset = () => {
    if (!confirm("모든 설정을 기본값으로 되돌릴까요?")) return;
    setSections(sections.map((s) => ({ ...s, enabled: true })));
    setAlgoTaste(80);
    setAlgoFriend(50);
    setAlgoNew(70);
    setPreferredGenres(["스릴러", "미스터리", "SF", "드라마", "로맨스"]);
    setExcludedGenres(["공포", "전쟁"]);
    setPreferredMoods(["잔잔한", "감성적인", "심오한"]);
    setExcludedMoods(["무서운"]);
  };

  return (
    <div className="custom-page">
      <div className="inner">
        <div className="page-head">
          <h1>메뉴 커스텀</h1>
          <p>홈 화면에 표시할 섹션과 추천 강도, 선호 장르를 직접 설정할 수 있어요</p>
        </div>

        {/* 홈 섹션 ON/OFF */}
        <section className="custom-section">
          <h2>홈 섹션 표시</h2>
          <p className="desc">▲▼ 버튼으로 순서를 변경하거나, 스위치로 표시 여부를 조절하세요</p>

          <ul className="toggle-list">
            {sections.map((section, idx) => (
              <li key={section.id} className="toggle-row">
                <div className="order-controls">
                  <button
                    onClick={() => moveSection(section.id, "up")}
                    disabled={idx === 0}
                  >▲</button>
                  <button
                    onClick={() => moveSection(section.id, "down")}
                    disabled={idx === sections.length - 1}
                  >▼</button>
                </div>
                <div className="info">
                  <h3>{section.name}</h3>
                  <p>{section.desc}</p>
                </div>
                <button
                  className={`toggle-switch ${section.enabled ? "on" : ""}`}
                  onClick={() => toggleSection(section.id)}
                >
                  <span className="thumb"></span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* 추천 알고리즘 */}
        <section className="custom-section">
          <h2>추천 알고리즘 조정</h2>
          <p className="desc">취향 학습 강도를 직접 조절하세요. 강할수록 익숙한 작품, 약할수록 새로운 발견</p>

          <div className="slider-block">
            <div className="head">
              <span className="name">취향 일치도</span>
              <span className="value">{getAlgoLabel(algoTaste)} ({algoTaste}%)</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={algoTaste}
              onChange={(e) => setAlgoTaste(Number(e.target.value))}
            />
            <div className="labels">
              <span>새로운 발견</span>
              <span>익숙한 취향</span>
            </div>
          </div>

          <div className="slider-block">
            <div className="head">
              <span className="name">친구 활동 반영도</span>
              <span className="value">{getAlgoLabel(algoFriend)} ({algoFriend}%)</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={algoFriend}
              onChange={(e) => setAlgoFriend(Number(e.target.value))}
            />
            <div className="labels">
              <span>개인 추천만</span>
              <span>친구 활동 우선</span>
            </div>
          </div>

          <div className="slider-block">
            <div className="head">
              <span className="name">신작 노출</span>
              <span className="value">{getAlgoLabel(algoNew)} ({algoNew}%)</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={algoNew}
              onChange={(e) => setAlgoNew(Number(e.target.value))}
            />
            <div className="labels">
              <span>거의 안 보임</span>
              <span>가장 많이</span>
            </div>
          </div>
        </section>

        {/* 장르 설정 */}
        <section className="custom-section">
          <h2>장르 설정</h2>
          <p className="desc">선호하는 장르와 추천에서 제외할 장르를 설정하세요</p>

          <div className="tab-bar">
            <button
              className={genreTab === "preferred" ? "active" : ""}
              onClick={() => setGenreTab("preferred")}
            >
              선호 장르 ({preferredGenres.length})
            </button>
            <button
              className={genreTab === "excluded" ? "active" : ""}
              onClick={() => setGenreTab("excluded")}
            >
              제외 장르 ({excludedGenres.length})
            </button>
          </div>

          <div className="chip-grid">
            {allGenres.map((g) => {
              const isPreferred = preferredGenres.includes(g.title);
              const isExcluded = excludedGenres.includes(g.title);
              const isActive = genreTab === "preferred" ? isPreferred : isExcluded;
              const otherActive = genreTab === "preferred" ? isExcluded : isPreferred;

              return (
                <button
                  key={g.title}
                  className={`pref-chip ${isActive ? "selected" : ""} ${otherActive ? "other" : ""}`}
                  onClick={() => toggleGenre(g.title)}
                >
                  <Image src={g.imgUrl} alt={g.title} width={20} height={20} />
                  <span>{g.title}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 무드 설정 */}
        <section className="custom-section">
          <h2>무드 설정</h2>
          <p className="desc">기분에 따라 보고 싶은 분위기를 선택하세요</p>

          <div className="tab-bar">
            <button
              className={moodTab === "preferred" ? "active" : ""}
              onClick={() => setMoodTab("preferred")}
            >
              선호 무드 ({preferredMoods.length})
            </button>
            <button
              className={moodTab === "excluded" ? "active" : ""}
              onClick={() => setMoodTab("excluded")}
            >
              제외 무드 ({excludedMoods.length})
            </button>
          </div>

          <div className="chip-grid">
            {allMoods.map((m) => {
              const isPreferred = preferredMoods.includes(m.title);
              const isExcluded = excludedMoods.includes(m.title);
              const isActive = moodTab === "preferred" ? isPreferred : isExcluded;
              const otherActive = moodTab === "preferred" ? isExcluded : isPreferred;

              return (
                <button
                  key={m.title}
                  className={`pref-chip ${isActive ? "selected" : ""} ${otherActive ? "other" : ""}`}
                  onClick={() => toggleMood(m.title)}
                >
                  <Image src={m.imgUrl} alt={m.title} width={20} height={20} />
                  <span>{m.title}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 저장 / 초기화 */}
        <div className="action-bar">
          <button className="btn-reset" onClick={handleReset}>기본값 복원</button>
          <button className="btn-save">설정 저장</button>
        </div>
      </div>
    </div>
  );
}
