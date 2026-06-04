"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { mainMenus, customMenus } from "@/data/mainMenu";
import { useAuthStore } from "@/store/useAuthStore";
import "../../scss/menuCustom.scss";

// 전체 선택 풀 생성 (순서 매핑용)
const allSelectablePool = [...mainMenus, ...customMenus];
const DEFAULT_HEADER_MENU_PATHS = [
  "/category",
  "/mypage/playlist?tab=playlists",
  "/mypage/playlist?tab=history",
];
const normalizeMenuPath = (path: string) =>
  path === "/mypage/playhist" ? "/mypage/playlist?tab=history" : path;
const uniqueMenuPaths = (paths: string[]) => Array.from(new Set(paths.map(normalizeMenuPath)));

export default function MenuCustomPage() {
  const [selectedMenuPaths, setSelectedMenuPaths] = useState<string[]>([]);
  const { currentProfile, onUpdateProfile } = useAuthStore();
  const currentProfileId = currentProfile?.id;
  const currentProfileHeaderMenus = currentProfile?.headerMenus;

  // 1. 초기 세팅값 LocalStorage 로드
  useEffect(() => {
    if (currentProfileId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedMenuPaths(
        currentProfileHeaderMenus?.length
          ? uniqueMenuPaths(currentProfileHeaderMenus)
          : DEFAULT_HEADER_MENU_PATHS,
      );
      return;
    }

    const saved = localStorage.getItem("custom_header_menus");
    if (saved) {
      try {
        const normalizedPaths = uniqueMenuPaths(JSON.parse(saved) as string[]);
        setSelectedMenuPaths(normalizedPaths);
        localStorage.setItem("custom_header_menus", JSON.stringify(normalizedPaths));
      } catch (e) {
        console.error(e);
      }
    } else {
      const defaultPaths = DEFAULT_HEADER_MENU_PATHS;
      setSelectedMenuPaths(defaultPaths);
      localStorage.setItem("custom_header_menus", JSON.stringify(defaultPaths));
    }
  }, [currentProfileId, currentProfileHeaderMenus]);

  // 2. 토글 핸들러 (클릭한 순서대로 배열 끝에 추가됨)
  const saveHeaderMenus = async (paths: string[]) => {
    const normalizedPaths = uniqueMenuPaths(paths);

    setSelectedMenuPaths(normalizedPaths);
    localStorage.setItem("custom_header_menus", JSON.stringify(normalizedPaths));
    window.dispatchEvent(new Event("customMenuStorageUpdate"));

    if (!currentProfile) return;

    await onUpdateProfile({
      ...currentProfile,
      headerMenus: normalizedPaths,
    });
  };

  const handleToggleMenu = async (path: string) => {
    let updatedPaths: string[];

    if (selectedMenuPaths.includes(path)) {
      updatedPaths = selectedMenuPaths.filter((p) => p !== path);
    } else {
      if (selectedMenuPaths.length >= 8) {
        alert("사이드 메뉴는 최대 8개까지만 등록하는 것을 권장합니다.");
        return;
      }
      updatedPaths = [...selectedMenuPaths, path];
    }

    await saveHeaderMenus(updatedPaths);
  };

  const handleReset = async () => {
    await saveHeaderMenus(DEFAULT_HEADER_MENU_PATHS);
  };

  // 데이터 그룹 분리
  const baseOptions = mainMenus.filter((m) => m.path !== "/");
  const genreOptions = customMenus.filter((m) => m.path.startsWith("/genre/"));
  const moodOptions = customMenus.filter((m) => m.path.startsWith("/mood/"));

  // 🌟 선택된 순서대로 정렬된 실제 메뉴 오브젝트 배열 추출
  const orderedSelectedMenus = selectedMenuPaths
    .map((path) => allSelectablePool.find((m) => m.path === path))
    .filter((menu): menu is typeof mainMenus[number] => !!menu);

  const renderMenuButton = (menu: typeof mainMenus[number]) => {
    const orderIndex = selectedMenuPaths.indexOf(menu.path);
    const isSelected = orderIndex !== -1;

    return (
      <button
        key={menu.path}
        className={`genre-button ${isSelected ? "active" : ""}`}
        type="button"
        onClick={() => handleToggleMenu(menu.path)}
      >
        <Image src={menu.imgUrl} alt="" width={22} height={22} />
        <span>{menu.title}</span>
        
        {/* 🌟 기존 '✓' 대신 선택된 순서(숫자 번호)를 명시하여 순서 인지 제공 */}
        {isSelected && <strong aria-hidden="true">{orderIndex + 1}</strong>}
      </button>
    );
  };

  return (
    <section className="menu-custom-page">
      <div className="menu-custom-page__inner">
        
        {/* 헤더 타이틀 */}
        <div className="menu-custom-page__hero">
          <h1>메뉴 커스텀 설정</h1>
          <p>왼쪽 사이드바 메뉴 구성을 내 취향대로 변경합니다. 선택하신 순서대로 배치됩니다.</p>
        </div>

        {/* 🌟 🗺️ [신설] 현재 메뉴 나열 순서 실시간 미리보기 흐름 바 */}
        <section className="menu-flow-panel">
          <div className="menu-flow-panel__header">
            <h3>👀 사이드바 메뉴 나열 순서 프리뷰</h3>
            <span>(홈 메뉴 바로 아래에 순서대로 장착됩니다)</span>
          </div>
          
          <div className="menu-flow-container">
            {/* 고정 홈 표시 */}
            <div className="flow-chip home-fixed">
              <Image src="/images/header/menu/home.svg" alt="" width={16} height={16} />
              <span>홈 (고정)</span>
            </div>

            {/* 유저가 추가한 메뉴들의 순서도 화살표 나열 */}
            {orderedSelectedMenus.map((menu, index) => (
              <div key={menu.path} className="flow-item-wrapper">
                <div className="flow-arrow">→</div>
                <div className="flow-chip dynamic" onClick={() => handleToggleMenu(menu.path)} title="클릭 시 해제">
                  <span className="order-number">{index + 1}</span>
                  <Image src={menu.imgUrl} alt="" width={16} height={16} />
                  <span>{menu.title}</span>
                  <span className="remove-x">×</span>
                </div>
              </div>
            ))}

            {selectedMenuPaths.length === 0 && (
              <div className="flow-item-wrapper">
                <div className="flow-arrow">→</div>
                <div className="flow-chip empty">아래에서 메뉴를 선택해 주세요</div>
              </div>
            )}
          </div>
        </section>

        {/* 📦 박스 1. 기본 서비스 메뉴 설정 */}
        <section className="custom-panel">
          <div className="custom-panel__header">
            <h2>기본 메뉴 설정 <span>Core Menus</span></h2>
            <p>플랫폼의 핵심 대메뉴를 사이드바로 바로가기 링크로 배치하거나 숨길 수 있습니다.</p>
          </div>
          <div className="genre-grid">
            {baseOptions.map(renderMenuButton)}
          </div>
        </section>

        {/* 📦 박스 2. 장르 메뉴 설정 */}
        <section className="custom-panel">
          <div className="custom-panel__header">
            <h2>🎭 장르별 추천 <span>Genres</span></h2>
            <p>자주 탐색하는 카테고리 장르를 즐겨찾기 형태로 추가해보세요.</p>
          </div>
          <div className="genre-grid">
            {genreOptions.map(renderMenuButton)}
          </div>
        </section>

        {/* 📦 박스 3. 무드 메뉴 설정 */}
        <section className="custom-panel">
          <div className="custom-panel__header">
            <h2>🍿 무드 태그 설정 <span>Moods</span></h2>
            <p>오늘 기분과 분위기에 맞춰 골라볼 수 있는 무드 전용 링크를 바로가기로 세팅합니다.</p>
          </div>
          <div className="genre-grid">
            {moodOptions.map(renderMenuButton)}
          </div>
        </section>

        {/* 초기화 바 */}
        <section className="reset-panel">
          <p>모든 설정을 초기 레이아웃 상태(기본 메뉴 3개)로 되돌릴까요?</p>
          <button type="button" onClick={handleReset}>기본값 복원</button>
        </section>

      </div>
    </section>
  );
}
