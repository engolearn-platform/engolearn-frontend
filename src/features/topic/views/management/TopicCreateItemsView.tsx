import { useNavigate } from "react-router";
import { ROUTES, topicItemSectionPath } from "@shared/constants";
import { useTopicItemsOverview } from "../../hooks/useTopicItemsOverview";
import TopicCreateFooterBar from "../../components/create/TopicCreateFooterBar";
import TopicCreateStepper from "../../components/create/TopicCreateStepper";
import TopicCreateWizardHeader from "../../components/create/TopicCreateWizardHeader";
import TopicItemsHeader from "../../components/create/items/TopicItemsHeader";
import TopicItemsList from "../../components/create/items/TopicItemsList";
import TopicScriptQualityCard from "../../components/create/items/TopicScriptQualityCard";

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
          <TopicCreateWizardHeader title="Bước 2: Danh sách Topic Items" />
          <TopicCreateStepper activeStep={1} />
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

        <TopicCreateFooterBar onBack={handleBack} />
      </div>
    </div>
  );
}
