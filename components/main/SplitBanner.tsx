"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "./scss/splitBanner.scss";
import SectionTitle from "@/components/common/SectionTitle";

const PANEL_COUNT = 7;
const IMAGE_URL = "/images/banner/If-Wishes-Could-Kill-img.png";
const TITLE = "넷플릭스 화제작";
const LOGO_URL = "https://image.tmdb.org/t/p/w500/yxwiC5BpJ5UVBY6BtguH0DwBVTA.png";
const RIGHT_LOGO_URL = "/images/banner/If-Wishes-Could-Kill-right-logo.png";

const STILLS = [
  "/images/banner/If-Wishes-Could-Kill-01.jpg",
  "/images/banner/If-Wishes-Could-Kill-02.jpg",
  "/images/banner/If-Wishes-Could-Kill-03.jpg",
  "/images/banner/If-Wishes-Could-Kill-04.jpg",
  "/images/banner/If-Wishes-Could-Kill-05.jpg",
  "/images/banner/If-Wishes-Could-Kill-06.jpg",
  "/images/banner/If-Wishes-Could-Kill-07.jpg",
];

export default function SplitBanner() {
  const router = useRouter();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="split-banner">
      <SectionTitle title={TITLE} showMore={false} />
      <div className="split-panels">
        {Array.from({ length: PANEL_COUNT }).map((_, i) => {
          const stillUrl = STILLS[i % STILLS.length];
          return (
            <div
              key={i}
              className="split-panel-wrap"
              style={{
                backgroundImage: `url(${IMAGE_URL})`,
                backgroundSize: `${PANEL_COUNT * 100}% auto`,
                backgroundPosition: `${(i / (PANEL_COUNT - 1)) * 100}% center`,
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => router.push("/detail/tv/285838")}
            >
              <div
                className="split-panel-still"
                style={{
                  backgroundImage: `url(${stillUrl})`,
                  opacity: hoveredIndex === i ? 1 : 0,
                }}
              />
              {i === 0 && (
                <div className="split-panel-logo">
                  <Image src="/images/logo/Netflix_Logo_RGB.png" alt="Netflix" width={80} height={22} style={{ objectFit: "contain" }} />
                  <Image src={LOGO_URL} alt={TITLE} width={160} height={80} style={{ objectFit: "contain" }} />
                </div>
              )}
              {i === PANEL_COUNT - 2 && (
                <div className="split-panel-right-logo" style={{ opacity: hoveredIndex === PANEL_COUNT - 2 ? 0 : 1 }}>
                  <Image src={RIGHT_LOGO_URL} alt={TITLE} width={228} height={114} style={{ objectFit: "contain" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
