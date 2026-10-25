import { useNavigate } from "react-router";
import { EmptyState } from "@shared/components";
import {
  ROUTES,
  adminTopicBasicInfoPath,
  topicItemSectionPath,
} from "@shared/constants";
import { Button } from "@/core/components/shadcn/button";
import { useTopicItemsOverview } from "@features/topic/hooks/useTopicItemsOverview";
import { useTopicUpsertContext } from "@features/topic/hooks/useTopicUpsertContext";
import {
  getTopicUpsertSteps,
  TOPIC_CREATE_CEFR_OPTIONS,
  TOPIC_CREATE_DEFAULT_DRAFT,
  TOPIC_ITEMS_RECOMMENDED_MAX,
} from "@features/topic/types/topic-create.types";
import TopicUpsertFooterBar from "@features/topic/components/management/upsert/basic-info/TopicUpsertFooterBar";
import TopicUpsertStepper from "@features/topic/components/management/upsert/basic-info/TopicUpsertStepper";
import TopicUpsertWizardHeader from "@features/topic/components/management/upsert/basic-info/TopicUpsertWizardHeader";
import TopicItemsHeader from "@features/topic/components/management/upsert/items/TopicItemsHeader";
import TopicItemsList from "@features/topic/components/management/upsert/items/TopicItemsList";
import TopicScriptQualityCard from "@features/topic/components/management/upsert/items/TopicScriptQualityCard";

export default function TopicUpsertItemsView() {
  const navigate = useNavigate();
  const { mode, topicId, snapshot, isMissing } = useTopicUpsertContext();
  const { items, selectedId, quality, selectItem, removeItem } =
    useTopicItemsOverview({
      items: snapshot?.items,
      quality: snapshot?.quality,
      selectedItemId: snapshot?.selectedItemId,
    });

  const isUpdate = mode === "update";
  const basicInfo = snapshot?.basicInfo ?? TOPIC_CREATE_DEFAULT_DRAFT;
  const cefrTitle = TOPIC_CREATE_CEFR_OPTIONS.find(
    (option) => option.value === basicInfo.cefr,
  )?.title;

  const handleBack = () => navigate(adminTopicBasicInfoPath(topicId));

  const handleEditItem = (id: string) => {
    navigate(topicItemSectionPath(id, "context", topicId));
  };

  const handleAddItem = () => {
    // UI-only: dialog tạo Topic Item sẽ gắn khi màn editor landing.
  };

  if (isMissing) {
    return (
      <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
        <div className="mx-auto flex w-full max-w-[940px] flex-col gap-6 pt-6 lg:pt-8">
          <EmptyState
            title="Không tìm thấy chủ đề"
            description="Chủ đề này không tồn tại trong dữ liệu hiện tại."
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTES.ADMIN_TOPICS)}
            className="mx-auto w-full rounded-xl sm:w-auto"
          >
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
      <div className="flex w-full flex-col gap-6 pt-6 pb-12 lg:pt-8">
        <div className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
          <TopicUpsertWizardHeader
            title={
              isUpdate
                ? "Cập nhật danh sách Topic Items"
                : "Bước 2: Danh sách Topic Items"
            }
            draftLabel={isUpdate ? "Đang cập nhật" : undefined}
            autosaveText={
              isUpdate ? (snapshot?.updatedNote ?? "Chế độ cập nhật") : undefined
            }
          />
          <TopicUpsertStepper
            steps={getTopicUpsertSteps(mode, items.length)}
            activeStep={1}
          />
        </div>

        <TopicItemsHeader
          titleEn={basicInfo.titleEn}
          cefrBadge={`CEFR ${basicInfo.cefr} • ${cefrTitle ?? ""}`}
          draftBadge={isUpdate ? "Đang cập nhật" : "Bản nháp"}
          countNote={`${items.length}/${TOPIC_ITEMS_RECOMMENDED_MAX} Bài học tối ưu`}
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

        <TopicUpsertFooterBar
          onBack={handleBack}
          saveLabel={isUpdate ? "Lưu thay đổi" : undefined}
        />
      </div>
    </div>
  );
}
