import { Navigate, useNavigate, useParams } from "react-router";
import { ROUTES, topicItemSectionPath } from "@shared/constants";
import { EmptyState } from "@shared/components";
import { Button } from "@/core/components/shadcn/button";
import type { TopicItemStepKey } from "@features/topic/types/topic-create.types";
import { isTopicItemSectionKey } from "@features/topic/types/topic-create.types";
import TopicCreateFooterBar from "@features/topic/components/create/TopicCreateFooterBar";
import TopicCreateStepper from "@features/topic/components/create/TopicCreateStepper";
import TopicCreateWizardHeader from "@features/topic/components/create/TopicCreateWizardHeader";
import TopicItemSectionTabRail from "@features/topic/components/create/editor/TopicItemSectionTabRail";

const SECTION_COPY: Record<
  Exclude<TopicItemStepKey, "context" | "vocabulary">,
  { title: string; description: string }
> = {
  expressions: {
    title: "Biên soạn Mẫu câu giao tiếp",
    description:
      "Màn biên soạn mẫu câu đang được phát triển. Quay lại Bối cảnh để tiếp tục hoàn thiện nội dung.",
  },
  quiz: {
    title: "Biên soạn Bài tập & Quiz",
    description:
      "Màn biên soạn bài tập đang được phát triển. Quay lại Bối cảnh để tiếp tục hoàn thiện nội dung.",
  },
};

function sectionTitle(section: string): string {
  switch (section) {
    case "vocabulary":
      return "Từ vựng";
    case "expressions":
      return "Mẫu câu giao tiếp";
    case "quiz":
      return "Bài tập & Quiz";
    default:
      return section;
  }
}

export default function TopicItemSectionPlaceholderView() {
  const navigate = useNavigate();
  const { itemId, sectionKey } = useParams();

  if (!itemId || !sectionKey || !isTopicItemSectionKey(sectionKey)) {
    return (
      <Navigate
        to={itemId ? topicItemSectionPath(itemId, "context") : ROUTES.ADMIN_TOPIC_CREATE_ITEMS}
        replace
      />
    );
  }

  if (sectionKey === "context" || sectionKey === "vocabulary") {
    return <Navigate to={topicItemSectionPath(itemId, sectionKey)} replace />;
  }

  const copy = SECTION_COPY[sectionKey];

  const handleSelectSection = (section: TopicItemStepKey) => {
    navigate(topicItemSectionPath(itemId, section));
  };

  const handleBack = () => navigate(topicItemSectionPath(itemId, "context"));

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
      <div className="mx-auto flex w-full max-w-[940px] flex-col gap-6 pt-6 lg:pt-8">
        <div className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
          <TopicCreateWizardHeader title={`Bước 2: ${copy.title}`} />
          <TopicCreateStepper activeStep={1} />
        </div>

        <TopicItemSectionTabRail
          activeSection={sectionKey}
          vocabNote=""
          expressionsNote=""
          quizNote=""
          quizEmpty={false}
          onSelect={handleSelectSection}
        />

        <div className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
          <EmptyState title={copy.title} description={copy.description} />
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="mx-auto w-full rounded-xl sm:w-auto"
          >
            Quay lại Bối cảnh
          </Button>
        </div>

        <p className="sr-only">Mục hiện tại: {sectionTitle(sectionKey)}</p>

        <TopicCreateFooterBar onBack={handleBack} />
      </div>
    </div>
  );
}
