import { useCallback, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { EmptyState, Loading } from "@shared/components";
import { adminTopicBasicInfoPath, adminTopicReadSectionPath, topicItemSectionPath } from "@shared/constants";
import { useFetch } from "@shared/hooks";
import { Button } from "@/core/components/shadcn/button";
import { TopicApiError, topicManagementService } from "@features/topic/services/topic-management.service";
import type {
  TopicItemManagementSummary,
  TopicItemMetadataInput,
  TopicItemMutationResult,
  TopicManagementResponse,
  TopicReadinessResult,
} from "@features/topic/types/topic-management.types";
import { getTopicUpsertSteps } from "@features/topic/types/topic-create.types";
import type { TopicItemOverview } from "@features/topic/types/topic-create.types";
import TopicUpsertWizardHeader from "@features/topic/components/management/upsert/basic-info/TopicUpsertWizardHeader";
import TopicUpsertStepper from "@features/topic/components/management/upsert/basic-info/TopicUpsertStepper";
import TopicItemsHeader from "@features/topic/components/management/upsert/items/TopicItemsHeader";
import TopicItemsList from "@features/topic/components/management/upsert/items/TopicItemsList";
import TopicItemMetadataDialog from "@features/topic/components/management/upsert/items/TopicItemMetadataDialog";

function itemOverview(item: TopicItemManagementSummary, index: number): TopicItemOverview {
  return {
    id: item.id,
    titleEn: item.title ?? "Bài học chưa có tiêu đề",
    titleVi: "",
    description: item.description ?? "",
    durationMinutes: item.durationMinutes,
    order: item.order ?? index + 1,
    publicationStatus: item.status === "HIDDEN" ? "HIDDEN" : item.status === "DRAFT" ? "DRAFT" : "PUBLISHED",
    steps: [],
    updatedNote: item.updatedAt ? new Date(item.updatedAt).toLocaleString("vi-VN") : undefined,
  };
}

function ItemListEditor({ topic, initialItems }: { topic: TopicManagementResponse; initialItems: TopicItemManagementSummary[] }) {
  const navigate = useNavigate();
  const { id } = topic;
  const [saved, setSaved] = useState({ items: initialItems, revision: topic.revision });
  const [dialog, setDialog] = useState<TopicItemManagementSummary | "create" | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [pending, setPending] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [message, setMessage] = useState("");
  const [readiness, setReadiness] = useState<TopicReadinessResult>();
  const [checkingReadiness, setCheckingReadiness] = useState(false);
  const inFlight = useRef(false);

  async function mutate(submit: (revision: number) => Promise<TopicItemMutationResult>, feedback: string) {
    if (inFlight.current || conflict) throw new Error("Tải lại danh sách trước khi lưu tiếp.");
    inFlight.current = true;
    setPending(true);
    setMessage("");
    try {
      setSaved(await submit(saved.revision));
      setReadiness(undefined);
      setMessage(feedback);
    } catch (reason) {
      if (reason instanceof TopicApiError && reason.status === 409 && reason.code === "CONFLICT") {
        setConflict(true);
        const stale = "Dữ liệu đã thay đổi ở phiên khác. Tải lại danh sách trước khi lưu tiếp.";
        setMessage(stale);
        throw new Error(stale);
      }
      setMessage(reason instanceof Error ? reason.message : "Không thể lưu thay đổi.");
      throw reason;
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  async function reload() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    try {
      const latest = await topicManagementService.fetchTopicById(id);
      const items = await topicManagementService.fetchTopicItems(id);
      setSaved({ revision: latest.revision, items });
      setReadiness(undefined);
      setConflict(false);
      setMessage("Đã tải lại danh sách.");
    } catch {
      setMessage("Không tải được danh sách. Vui lòng thử lại.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  function saveMetadata(input: TopicItemMetadataInput) {
    return mutate((revision) => dialog && dialog !== "create"
      ? topicManagementService.updateTopicItem(id, dialog.id, revision, input)
      : topicManagementService.createTopicItem(id, revision, input), "Đã lưu nháp bài học.");
  }

  function remove(itemId: string) {
    if (window.confirm("Xóa bài học nháp này?")) {
      void mutate((revision) => topicManagementService.deleteTopicItem(id, itemId, revision), "Đã xóa bài học.").catch(() => undefined);
    }
  }

  function toggleVisibility(itemId: string) {
    const hidden = saved.items.find((item) => item.id === itemId)?.status !== "HIDDEN";
    if (hidden && !window.confirm("Ẩn bài học này? Người học sẽ tạm thời mất quyền truy cập.")) return;
    void mutate((revision) => topicManagementService.setTopicItemVisibility(id, itemId, revision, hidden), hidden ? "Đã ẩn bài học." : "Đã hiện bài học.").catch(() => undefined);
  }

  function move(itemId: string, direction: -1 | 1) {
    const order = saved.items.map((item) => item.id);
    const index = order.indexOf(itemId);
    const destination = index + direction;
    if (index < 0 || destination < 0 || destination >= order.length) return;
    order.splice(index, 1);
    order.splice(destination, 0, itemId);
    void mutate((revision) => topicManagementService.reorderTopicItems(id, revision, order), "Đã lưu thứ tự bài học.").catch(() => undefined);
  }

  const add = () => setDialog("create");
  async function checkReadiness() {
    setCheckingReadiness(true);
    setMessage("");
    setReadiness(undefined);
    try {
      setReadiness(await topicManagementService.fetchTopicReadiness(id));
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Không thể kiểm tra điều kiện xuất bản.");
    } finally {
      setCheckingReadiness(false);
    }
  }
  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
      <div className="flex flex-col gap-6 pt-6 lg:pt-8">
        <div className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
          <TopicUpsertWizardHeader title="Bước 2: Danh sách Topic Items" draftLabel={topic.status === "published" ? "Đã xuất bản" : "Bản nháp"} />
          <TopicUpsertStepper steps={getTopicUpsertSteps("update", saved.items.length)} activeStep={1} />
        </div>
        <TopicItemsHeader titleEn={topic.titleEn} cefrBadge={topic.cefr ? `CEFR ${topic.cefr}` : "Chưa chọn CEFR"} draftBadge={topic.status === "published" ? "Đã xuất bản" : "Bản nháp"} countNote={`${saved.items.length} bài học`} onAdd={add} disabled={pending || conflict} />
        {message && <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-container-lowest p-3 text-label-sm">
          {message}
          {conflict && <Button type="button" variant="outline" disabled={pending} onClick={reload}>Tải lại danh sách</Button>}
        </div>}
        <TopicItemsList items={saved.items.map(itemOverview)} selectedId={selectedId} onSelect={setSelectedId}
          onEdit={(itemId) => navigate(saved.items.find((item) => item.id === itemId)?.status === "DRAFT"
            ? topicItemSectionPath(itemId, "context", id) : adminTopicReadSectionPath(id, itemId, "context"))}
          onDelete={remove} onVisibility={toggleVisibility}
          onMetadata={(itemId) => setDialog(saved.items.find((item) => item.id === itemId) ?? null)}
          onMove={topic.status === "draft" && saved.items.every((item) => item.status === "DRAFT") ? move : undefined}
          onAdd={add} disabled={pending || conflict} />
        {readiness && <section role="status" className="space-y-3 rounded-xl bg-surface-container-lowest p-5 shadow-sm">
          <h2 className="text-headline-sm font-semibold">{readiness.ready ? "Đủ điều kiện xuất bản" : "Cần bổ sung trước khi xuất bản"}</h2>
          {!readiness.ready && <ul className="max-h-72 list-disc space-y-1 overflow-auto pl-6 text-body-md">
            {readiness.violations.map(({ path, code, message }) => <li key={`${path}:${code}`}>
              <span className="font-semibold">{path}</span> {message}
            </li>)}
          </ul>}
        </section>}
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(adminTopicBasicInfoPath(id))}>Quay lại thông tin chủ đề</Button>
          <Button type="button" variant="outline" disabled={checkingReadiness || pending || conflict} onClick={checkReadiness}>
            {checkingReadiness ? "Đang kiểm tra…" : "Kiểm tra điều kiện xuất bản"}
          </Button>
        </div>
      </div>
      {dialog && <TopicItemMetadataDialog item={dialog === "create" ? undefined : dialog} onClose={() => setDialog(null)} onSave={saveMetadata} />}
    </div>
  );
}

function TopicItemsRequest({ topicId }: { topicId: string }) {
  const fetchItems = useCallback(async (signal: AbortSignal) => {
    const topic = await topicManagementService.fetchTopicById(topicId, signal);
    return { topic, items: await topicManagementService.fetchTopicItems(topicId, signal) };
  }, [topicId]);
  const { data, loading, error, refetch } = useFetch(fetchItems);
  if (loading) return <div className="py-12"><Loading size="lg" /></div>;
  if (error || !data) return <div className="mx-auto max-w-3xl py-12">
    <EmptyState title="Không thể tải danh sách bài học" description={error?.message ?? "Vui lòng thử lại."} />
    <Button type="button" variant="outline" onClick={refetch}>Thử lại</Button>
  </div>;
  return <ItemListEditor topic={data.topic} initialItems={data.items} />;
}

export default function TopicUpsertItemsView() {
  const { topicId } = useParams();
  return topicId ? <TopicItemsRequest key={topicId} topicId={topicId} /> : <Navigate replace to={adminTopicBasicInfoPath()} />;
}
