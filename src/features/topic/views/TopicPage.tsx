import MainContent from "../components/MainContent";
import ProgressSummaryPanel from "../components/ProgressSummaryPanel";

export default function TopicPage() {
  return (
    <div className="flex flex-col lg:flex-row">
      <MainContent />
      <ProgressSummaryPanel />
    </div>
  );
}
