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
const uniqueMenuPaths = (paths: string[]) =>
  Array.from(new Set(paths.map(normalizeMenuPath)));

export default function MenuCustomPage() {
  const [selectedMenuPaths, setSelectedMenuPaths] = useState<string[]>([]);
  const baseOpen = true;
  const categoryOpen = true;
  const [genreVisible, setGenreVisible] = useState(true);
  const [moodVisible, setMoodVisible] = useState(true);
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
        localStorage.setItem(
          "custom_header_menus",
          JSON.stringify(normalizedPaths),
        );
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
    localStorage.setItem(
      "custom_header_menus",
      JSON.stringify(normalizedPaths),
    );
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

  const handleReorderMenu = async (path: string, direction: -1 | 1) => {
    const currentIndex = selectedMenuPaths.indexOf(path);
    if (currentIndex === -1) return;

    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= selectedMenuPaths.length) return;

    const nextPaths = [...selectedMenuPaths];
    const [movedItem] = nextPaths.splice(currentIndex, 1);
    nextPaths.splice(targetIndex, 0, movedItem);

    await saveHeaderMenus(nextPaths);
  };

  const handleReset = async () => {
    await saveHeaderMenus(DEFAULT_HEADER_MENU_PATHS);
  };

  // 데이터 그룹 분리
  const baseOptions = mainMenus.filter((m) => m.path !== "/");
  const genreOptions = customMenus.filter((m) => m.path.startsWith("/genre/"));
  const moodOptions = customMenus.filter((m) => m.path.startsWith("/mood/"));

  const selectedGenres = genreOptions.filter((menu) =>
    selectedMenuPaths.includes(menu.path),
  );
  const selectedMoods = moodOptions.filter((menu) =>
    selectedMenuPaths.includes(menu.path),
  );

  // 🌟 선택된 순서대로 정렬된 실제 메뉴 오브젝트 배열 추출
  const orderedSelectedMenus = selectedMenuPaths
    .map((path) => allSelectablePool.find((m) => m.path === path))
    .filter((menu): menu is (typeof mainMenus)[number] => !!menu);

  const selectedBaseMenus = orderedSelectedMenus.filter((menu) =>
    baseOptions.some((base) => base.path === menu.path),
  );
  const selectedCategoryMenus = orderedSelectedMenus.filter(
    (menu) => !baseOptions.some((base) => base.path === menu.path),
  );

  const renderMenuButton = (menu: (typeof mainMenus)[number]) => {
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
          <p>
            왼쪽 사이드바 메뉴 구성을 내 취향대로 변경합니다. 선택하신 순서대로
            배치됩니다.
          </p>
        </div>

        <section className="menu-flow-panel">
          <div className="menu-flow-panel__header">
            <h3>👀 사이드바 메뉴 나열 순서 프리뷰</h3>
            <span>
              홈과 설정은 고정, 추가된 메뉴만 가운데에서 스크롤됩니다.
            </span>
          </div>

          <div className="menu-flow-container">
            <div className="flow-summary">
              <div className="flow-row">
                <div className="flow-row-label">기본</div>
                <div className="flow-row-items">
                  {selectedBaseMenus.length > 0 ? (
                    selectedBaseMenus.map((menu, index) => (
                      <div key={menu.path} className="flow-chip dynamic">
                        <span className="order-number">{index + 1}</span>
                        <Image
                          src={menu.imgUrl}
                          alt=""
                          width={16}
                          height={16}
                        />
                        <span>{menu.title}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flow-empty">기본 메뉴를 선택해 주세요</div>
                  )}
                </div>
              </div>

              <div className="flow-row">
                <div className="flow-row-label">카테고리</div>
                <div className="flow-row-items">
                  {selectedCategoryMenus.length > 0 ? (
                    selectedCategoryMenus.map((menu, index) => (
                      <div key={menu.path} className="flow-chip dynamic">
                        <span className="order-number">
                          {selectedBaseMenus.length + index + 1}
                        </span>
                        <Image
                          src={menu.imgUrl}
                          alt=""
                          width={16}
                          height={16}
                        />
                        <span>{menu.title}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flow-empty">카테고리를 선택해 주세요</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className={`custom-panel custom-panel--section ${baseOpen ? "is-open" : "is-closed"}`}
        >
          <div className="custom-panel__header custom-panel__toggle-header">
            <div>
              <h2>
                기본 메뉴 설정 <span>Core Menus</span>
              </h2>
              <p>
                플랫폼의 핵심 대메뉴를 사이드바로 바로가기 링크로 배치하거나
                숨길 수 있습니다.
              </p>
            </div>
          </div>
          {baseOpen && (
            <div className="genre-grid co">
              {baseOptions.map(renderMenuButton)}
            </div>
          )}
        </section>

        <section className="custom-panel custom-panel--section is-open">
          <div className="custom-panel__header custom-panel__toggle-header">
            <div>
              <h2>
                카테고리 메뉴 설정 <span>Genres / Moods</span>
              </h2>
              <p>장르와 무드를 각각 보이기 또는 숨기기로 설정할 수 있습니다.</p>
            </div>
          </div>

          <div className="category-columns">
            <div className="category-box">
              <div className="category-box__header">
                <h3>🎭 장르</h3>
                <button
                  type="button"
                  className="category-toggle"
                  onClick={() => setGenreVisible((prev) => !prev)}
                >
                  {genreVisible ? "숨기기" : "보이기"}
                </button>
              </div>
              <p className="category-summary">
                선택된 장르:{" "}
                {selectedGenres.length > 0
                  ? selectedGenres.map((item) => item.title).join(", ")
                  : "없음"}
              </p>
              {genreVisible ? (
                <div className="genre-grid ct">
                  {genreOptions.map(renderMenuButton)}
                </div>
              ) : (
                <div className="category-hidden">
                  장르 카테고리가 숨김 상태입니다.
                </div>
              )}
            </div>

            <div className="category-box">
              <div className="category-box__header">
                <h3>🍿 무드</h3>
                <button
                  type="button"
                  className="category-toggle"
                  onClick={() => setMoodVisible((prev) => !prev)}
                >
                  {moodVisible ? "숨기기" : "보이기"}
                </button>
              </div>
              <p className="category-summary">
                선택된 무드:{" "}
                {selectedMoods.length > 0
                  ? selectedMoods.map((item) => item.title).join(", ")
                  : "없음"}
              </p>
              {moodVisible ? (
                <div className="genre-grid ct">
                  {moodOptions.map(renderMenuButton)}
                </div>
              ) : (
                <div className="category-hidden">
                  무드 카테고리가 숨김 상태입니다.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 초기화 바 */}
        <section className="reset-panel">
          <p>모든 설정을 초기 레이아웃 상태(기본 메뉴 3개)로 되돌릴까요?</p>
          <button type="button" onClick={handleReset}>
            기본값 복원
          </button>
        </section>
      </div>
    </section>
  );
}
