import ConnectReviewList from "@/components/connect/ConnectReviewList";
import ConnectBestReviewHero from "@/components/connect/ConnectBestReviewHero";
import ConnectFollowingUsers from "@/components/connect/ConnectFollowingUsers";
import ConnectFollowingPlaylists from "@/components/connect/ConnectFollowingPlaylists";
import ConnectReviewSpotlight from "@/components/connect/ConnectReviewSpotlight";
import HighlightSection from "@/components/connect/HighlightSection";

export default function ConnectPage() {
  return (
    <div className="sub-page">
      <div className="w-full">
        <ConnectBestReviewHero />
        <ConnectFollowingUsers />
        <ConnectFollowingPlaylists />
        <ConnectReviewList />
        <ConnectReviewSpotlight />
        <HighlightSection />
      </div>
    </div>
  );
}
