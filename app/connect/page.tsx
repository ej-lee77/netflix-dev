import ConnectReviewList from "@/components/connect/ConnectReviewList";
import ConnectReviewSpotlight from "@/components/connect/ConnectReviewSpotlight";
import HighlightSection from "@/components/connect/HighlightSection";

export default function ConnectPage() {
  return (
    <div className="sub-page pt-25">
      <div className="w-full">
        <ConnectReviewList />
        <ConnectReviewSpotlight />
        <HighlightSection />
      </div>
    </div>
  );
}
