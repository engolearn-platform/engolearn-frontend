import { useNavigate } from "react-router";
import { ROUTES, topicItemSectionPath } from "@shared/constants";
import { useTopicItemsOverview } from "@features/topic/hooks/useTopicItemsOverview";
import TopicUpsertFooterBar from "@features/topic/components/management/upsert/basic-info/TopicUpsertFooterBar";
import TopicUpsertStepper from "@features/topic/components/management/upsert/basic-info/TopicUpsertStepper";
import TopicUpsertWizardHeader from "@features/topic/components/management/upsert/basic-info/TopicUpsertWizardHeader";
import TopicItemsHeader from "@features/topic/components/management/upsert/items/TopicItemsHeader";
import TopicItemsList from "@features/topic/components/management/upsert/items/TopicItemsList";
import TopicScriptQualityCard from "@features/topic/components/management/upsert/items/TopicScriptQualityCard";

export default function TopicCreateItemsView() {
  const navigate = useNavigate();
  const { items, selectedId, quality, selectItem, removeItem } =
    useTopicItemsOverview();

  const handleBack = () => navigate(ROUTES.ADMIN_TOPIC_CREATE);

  const handleEditItem = (id: string) => {
    navigate(topicItemSectionPath(id, "context"));
  };

  const handleAddItem = () => {
    // UI-only: dialog tạo Topic Item sẽ gắn khi màn editor landing.
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
      <div className="flex w-full flex-col gap-6 pt-6 pb-12 lg:pt-8">
        <div className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
          <TopicUpsertWizardHeader title="Bước 2: Danh sách Topic Items" />
          <TopicUpsertStepper activeStep={1} />
        </div>

        <TopicItemsHeader
          titleEn="Ordering Food at a Restaurant"
          cefrBadge="CEFR A2 • Sơ cấp"
          draftBadge="Bản nháp"
          countNote="4/5 Bài học tối ưu"
          onAdd={handleAddItem}
        />

        <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <TopicItemsList
              items={items}
              selectedId={selectedId}
              onSelect={selectItem}
              onEdit={handleEditItem}
              onDelete={removeItem}
              onInit={handleEditItem}
              onAdd={handleAddItem}
            />
          </div>
          <div className="xl:col-span-4">
            <TopicScriptQualityCard quality={quality} />
          </div>
        </div>

        <TopicUpsertFooterBar onBack={handleBack} />
      </div>
    </div>
  );
}
