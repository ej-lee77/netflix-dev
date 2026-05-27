import ConnectBestReviewHero from "@/components/connect/ConnectBestReviewHero";
import ConnectReviewSpotlight from "@/components/connect/ConnectReviewSpotlight";

export default function ConnectPage() {
  return (
    <div className="sub-page">
      <div className="w-full">
        <ConnectBestReviewHero />
        <ConnectReviewSpotlight />
      </div>
    </div>
  );
}
