import { useCallback, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ArrowRight, CheckCircle2, CircleAlert, EyeOff, LoaderCircle, Send } from "lucide-react";
import { EmptyState, Loading } from "@shared/components";
import { adminTopicBasicInfoPath, adminTopicItemsPath, adminTopicReadSectionPath, topicItemSectionPath } from "@shared/constants";
import { useFetch } from "@shared/hooks";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { TopicApiError, topicManagementService } from "@features/topic/services/topic-management.service";
import type {
  TopicItemManagementSummary,
  TopicItemMetadataInput,
  TopicItemMutationResult,
  TopicManagementResponse,
  TopicReadinessResult,
  TopicPublishResult,
} from "@features/topic/types/topic-management.types";
import { getTopicUpsertSteps } from "@features/topic/types/topic-create.types";
import type { TopicItemOverview } from "@features/topic/types/topic-create.types";
import TopicUpsertWizardHeader from "@features/topic/components/management/upsert/basic-info/TopicUpsertWizardHeader";
import TopicUpsertStepper from "@features/topic/components/management/upsert/basic-info/TopicUpsertStepper";
import TopicItemsHeader from "@features/topic/components/management/upsert/items/TopicItemsHeader";
import TopicItemsList from "@features/topic/components/management/upsert/items/TopicItemsList";
import TopicItemMetadataDialog from "@features/topic/components/management/upsert/items/TopicItemMetadataDialog";
import UnpublishTopicDialog from "@features/topic/components/management/list/UnpublishTopicDialog";
import { classifyReadinessViolation, readinessViolationMessage } from "@features/topic/utils/topic-readiness-presentation";
import { topicPublishRecoveryState } from "@features/topic/utils/topic-publish-recovery";
import { topicRepublishOutcome } from "@features/topic/utils/topic-republish-outcome";
import { topicStatusLabel } from "@features/topic/utils/topic-status-presentation";

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
  const [currentTopic, setCurrentTopic] = useState(topic);
  const [saved, setSaved] = useState({ items: initialItems, revision: topic.revision });
  const [dialog, setDialog] = useState<TopicItemManagementSummary | "create" | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [pending, setPending] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [message, setMessage] = useState("");
  const [readiness, setReadiness] = useState<TopicReadinessResult>();
  const [checkingReadiness, setCheckingReadiness] = useState(false);
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<TopicPublishResult>();
  const [publishOutcome, setPublishOutcome] = useState<ReturnType<typeof topicRepublishOutcome>>();
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [unpublishError, setUnpublishError] = useState("");
  const inFlight = useRef(false);
  const publishInFlight = useRef(false);
  const unpublishInFlight = useRef(false);
  const hasRelease = currentTopic.status !== "draft" && Boolean(currentTopic.latestPublishedVersion ?? currentTopic.publicationVersion?.id);
  const isRepublish = currentTopic.status === "unpublished";
  const pendingCandidates = saved.items.filter((item) => item.status === "DRAFT");
  const visiblePendingCandidates = pendingCandidates.filter((item) => item.status !== "HIDDEN");

  async function mutate(submit: (revision: number) => Promise<TopicItemMutationResult>, feedback: string) {
    if (inFlight.current || unpublishInFlight.current || conflict) throw new Error("Tải lại danh sách trước khi lưu tiếp.");
    inFlight.current = true;
    setPending(true);
    setMessage("");
    try {
      setSaved(await submit(saved.revision));
      setReadiness(undefined);
      setPublishResult(undefined);
      setPublishOutcome(undefined);
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
    if (inFlight.current || unpublishInFlight.current) return;
    inFlight.current = true;
    setPending(true);
    try {
      const latest = await topicManagementService.fetchTopicById(id);
      const items = await topicManagementService.fetchTopicItems(id);
      setCurrentTopic(latest);
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
    if (checkingReadiness || inFlight.current || publishInFlight.current || unpublishInFlight.current || conflict || dialog || unpublishOpen) return;
    setCheckingReadiness(true);
    setMessage("");
    setReadiness(undefined);
    try {
      const result = await topicManagementService.fetchTopicReadiness(id);
      setReadiness(result);
      setReadinessOpen(true);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Không thể kiểm tra điều kiện xuất bản.");
    } finally {
      setCheckingReadiness(false);
    }
  }
  async function confirmPublish() {
    if (publishInFlight.current || unpublishInFlight.current || inFlight.current || checkingReadiness || conflict || dialog || unpublishOpen) return;
    publishInFlight.current = true;
    setPublishing(true);
    setMessage("");
    setPublishResult(undefined);
    setPublishOutcome(undefined);
    const releaseBeforeRequest = currentTopic.latestPublishedVersion ?? currentTopic.publicationVersion?.id ?? null;
    try {
      const result = await topicManagementService.publishTopic(id, saved.revision);
      // A 200 is the commit point. Reflect it immediately from the committed response.
      setCurrentTopic((previous) => ({ ...previous, status: "published", revision: result.revision, latestPublishedVersion: result.topicVersionId, publicationVersion: { id: result.topicVersionId, version: result.version, status: "PUBLISHED", previousVersionId: result.previousTopicVersionId ?? null, publishedAt: result.publishedAt } }));
      setPublishResult(result);
      setReadinessOpen(false);
      setReadiness(undefined);
      const outcome = topicRepublishOutcome(currentTopic.status, releaseBeforeRequest, result.topicVersionId);
      setPublishOutcome(outcome);
      setMessage(outcome === "reused-release"
        ? `Đã xuất bản lại bằng cách dùng lại phiên bản ${result.version}; không tạo release mới.`
        : outcome === "new-release"
          ? `Đã xuất bản lại phiên bản mới ${result.version}.`
          : `Đã xuất bản phiên bản ${result.version}.`);
      try {
        const [latest, items] = await Promise.all([
          topicManagementService.fetchTopicById(id),
          topicManagementService.fetchTopicItems(id),
        ]);
        setCurrentTopic(latest);
        setSaved({ revision: latest.revision, items });
      } catch {
        setConflict(true);
        setMessage("Chủ đề đã được xuất bản. Chưa tải lại được danh sách mới nhất; hãy tải lại danh sách trước khi chỉnh sửa tiếp.");
      }
    } catch (reason) {
      const apiError = reason instanceof TopicApiError ? reason : undefined;
      if (apiError?.status === 409 && apiError.code === "CONFLICT") {
        setConflict(true);
        setReadinessOpen(false);
        setReadiness(undefined);
        setMessage("Dữ liệu đã thay đổi ở phiên khác. Hãy tải lại danh sách và kiểm tra lại trước khi tiếp tục.");
      } else if (apiError?.status === 409 && apiError.code === "NO_EFFECTIVE_CHANGES") {
        setReadinessOpen(false);
        setReadiness(undefined);
        setMessage("Không có thay đổi MAJOR hoặc bài mới để xuất bản. Các bản làm việc vẫn được giữ lại.");
      } else if (apiError?.status === 422 && apiError.code === "PUBLISH_VALIDATION_FAILED") {
        setReadiness({ ready: false, violations: apiError.violations ?? [] });
        setReadinessOpen(true);
        setMessage("Máy chủ yêu cầu bổ sung nội dung đã lưu trước khi xuất bản.");
      } else {
        setMessage(reason instanceof Error ? `Không thể xác nhận kết quả xuất bản: ${reason.message} Tải lại trạng thái trước khi thử lại.` : "Không thể xác nhận kết quả xuất bản. Tải lại trạng thái trước khi thử lại.");
        try {
          const [latest, items] = await Promise.all([topicManagementService.fetchTopicById(id), topicManagementService.fetchTopicItems(id)]);
          setCurrentTopic(latest);
          setSaved({ revision: latest.revision, items });
          const releaseAfterRefresh = latest.latestPublishedVersion ?? latest.publicationVersion?.id ?? null;
          setReadinessOpen(false);
          setReadiness(undefined);
          setConflict(true);
          setMessage(topicPublishRecoveryState(releaseBeforeRequest, releaseAfterRefresh) === "unchanged"
            ? "Chưa xác nhận được kết quả yêu cầu. Bản phát hành hiện tại chưa đổi; hãy tải lại danh sách trước khi thử lại."
            : "Đã có bản phát hành mới kể từ lúc gửi yêu cầu. Không thể xác nhận bản đó có thuộc đợt này; hãy tải lại danh sách trước khi tiếp tục.");
        } catch {
          setMessage("Chưa xác định được trạng thái xuất bản. Hãy tải lại danh sách trước khi có thao tác tiếp theo.");
          setConflict(true);
        }
      }
    } finally {
      publishInFlight.current = false;
      setPublishing(false);
    }
  }

  async function confirmUnpublish() {
    if (unpublishInFlight.current || inFlight.current || publishInFlight.current || checkingReadiness || conflict || !hasRelease) return;
    unpublishInFlight.current = true;
    setUnpublishing(true);
    setUnpublishError("");
    setMessage("");
    try {
      const result = await topicManagementService.unpublishTopic(id, saved.revision);
      setCurrentTopic((previous) => ({
        ...previous,
        status: result.status,
        revision: result.revision,
        latestPublishedVersion: result.latestPublishedVersion,
      }));
      setSaved((previous) => ({ ...previous, revision: result.revision }));
      setUnpublishOpen(false);
      setReadiness(undefined);
      setPublishResult(undefined);
      setPublishOutcome(undefined);
      setConflict(false);
      setMessage("Đã gỡ xuất bản. Lịch sử bản phát hành, tiến trình và các lượt học đã ghim phiên bản vẫn được lưu.");
      try {
        const [latest, items] = await Promise.all([
          topicManagementService.fetchTopicById(id),
          topicManagementService.fetchTopicItems(id),
        ]);
        setCurrentTopic(latest);
        setSaved({ revision: latest.revision, items });
      } catch {
        setConflict(true);
        setMessage("Đã gỡ xuất bản theo phản hồi máy chủ. Chưa tải được trạng thái mới nhất; tải lại trước khi tiếp tục.");
      }
    } catch (reason) {
      const apiError = reason instanceof TopicApiError ? reason : undefined;
      const stale = apiError?.status === 409 && apiError.code === "CONFLICT";
      try {
        const [latest, items] = await Promise.all([
          topicManagementService.fetchTopicById(id),
          topicManagementService.fetchTopicItems(id),
        ]);
        setCurrentTopic(latest);
        setSaved({ revision: latest.revision, items });
        setConflict(true);
        const failureMessage = stale
          ? "Dữ liệu đã thay đổi ở phiên khác. Trạng thái mới đã tải; hãy tải lại danh sách trước khi thử lại."
          : latest.status === "unpublished"
            ? "Máy chủ hiện báo chủ đề đã gỡ xuất bản, nhưng chưa xác nhận được phản hồi của yêu cầu này. Tải lại trước khi tiếp tục."
            : `Không gỡ xuất bản được: ${reason instanceof Error ? reason.message : "yêu cầu thất bại"}`;
        setUnpublishError(failureMessage);
        setMessage(failureMessage);
        setUnpublishOpen(false);
      } catch {
        setConflict(true);
        const failureMessage = `Chưa xác định được kết quả gỡ xuất bản: ${reason instanceof Error ? reason.message : "yêu cầu thất bại"}. Hãy tải lại trạng thái trước khi thử tiếp.`;
        setUnpublishError(failureMessage);
        setMessage(failureMessage);
        setUnpublishOpen(false);
      }
    } finally {
      unpublishInFlight.current = false;
      setUnpublishing(false);
    }
  }

  const violationGroups = readiness?.violations.reduce<Record<string, typeof readiness.violations>>((groups, violation) => {
    const key = classifyReadinessViolation(violation.path, saved.items).group;
    (groups[key] ??= []).push(violation);
    return groups;
  }, {});

  function violationDestination(path: string) {
    const violation = classifyReadinessViolation(path, saved.items);
    if (violation.action === "topic-metadata") return adminTopicBasicInfoPath(id);
    if (violation.action === "item-section" && violation.item) {
      return violation.item.status === "DRAFT" ? topicItemSectionPath(violation.item.id, violation.section, id) : adminTopicReadSectionPath(id, violation.item.id, violation.section);
    }
    return adminTopicItemsPath(id);
  }
  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
      <div className="flex flex-col gap-6 pt-6 lg:pt-8">
        <div className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
          <TopicUpsertWizardHeader title="Bước 2: Danh sách bài học" draftLabel={topicStatusLabel(currentTopic.status)} statusAction={hasRelease && currentTopic.status === "published" && <Button type="button" variant="outline" className="min-h-10" disabled={pending || checkingReadiness || publishing || unpublishing || conflict || !!dialog} onClick={() => { setUnpublishError(""); setUnpublishOpen(true); }}><EyeOff className="mr-2 size-4" />Gỡ xuất bản</Button>} />
          <TopicUpsertStepper steps={getTopicUpsertSteps("update", saved.items.length).map((step) => step.index === 1 ? { ...step, title: "2. Danh sách bài học" } : step.index === 2 ? { ...step, title: "3. Kiểm tra và xuất bản", note: hasRelease ? topicStatusLabel(currentTopic.status) : step.note } : step)} activeStep={hasRelease ? 2 : 1} />
        </div>
        <TopicItemsHeader titleEn={currentTopic.titleEn} cefrBadge={currentTopic.cefr ? `CEFR ${currentTopic.cefr}` : "Chưa chọn CEFR"} draftBadge={topicStatusLabel(currentTopic.status)} countNote={`${saved.items.length} bài học`} onAdd={add} disabled={pending || checkingReadiness || readinessOpen || publishing || unpublishing || conflict || !!dialog} trailingAction={<Button asChild type="button" variant="outline" className="min-h-12 w-fit"><Link to={`/admin/topics/${encodeURIComponent(id)}/speaking-profile`}>Cấu hình Speaking cho chủ đề</Link></Button>} />
        {(!hasRelease || visiblePendingCandidates.length > 0 || isRepublish) && <section className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><CheckCircle2 className="size-5" /></span>
            <div><h2 className="text-headline-sm font-semibold text-on-surface">{isRepublish ? "Xuất bản lại chủ đề" : hasRelease ? "Xuất bản đợt thay đổi Topic" : "Sẵn sàng đưa chủ đề tới người học?"}</h2><p className="mt-1 max-w-2xl text-body-md text-on-surface-variant">{isRepublish ? "Kiểm tra nội dung đã lưu rồi xuất bản lại. Nếu nội dung không đổi, hệ thống dùng lại release hiện có." : hasRelease ? "Kiểm tra các bản làm việc và bài mới, sau đó xuất bản trong một đợt." : "Kiểm tra nội dung đã lưu. Nếu đủ điều kiện, xác nhận để xuất bản lần đầu."}</p>
              {hasRelease && visiblePendingCandidates.length > 0 && <ul className="mt-3 space-y-1 text-label-sm text-on-surface-variant">{visiblePendingCandidates.map((item) => <li key={item.id}>#{item.order ?? "—"} · {item.title || "Bài học chưa có tiêu đề"} · {item.previousItemVersionId ? "MAJOR đang chờ kiểm tra" : "Bài mới đang chờ kiểm tra"}</li>)}</ul>}
              {hasRelease && <p className="mt-2 text-label-sm text-on-surface-variant">Bản nháp chưa được so sánh với phiên bản gốc ở đây; nội dung không đổi có thể được dùng lại mà không tạo version mới.</p>}
            </div>
          </div>
          <Button type="button" disabled={checkingReadiness || pending || conflict || publishing || !!dialog} onClick={() => void checkReadiness()} className="min-h-12 w-full sm:w-auto">
            {checkingReadiness ? <><LoaderCircle className="mr-2 size-4 animate-spin" />Đang kiểm tra…</> : <><CheckCircle2 className="mr-2 size-4" />{isRepublish ? "Kiểm tra và xuất bản lại" : "Kiểm tra và xuất bản"}</>}
          </Button>
        </section>}
        {message && <div role={conflict ? "alert" : "status"} className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-container-lowest p-3 text-label-sm">
          {message}
          {conflict && <Button type="button" variant="outline" disabled={pending} onClick={reload}>Tải lại danh sách</Button>}
        </div>}
        {publishResult && <section role="status" className="space-y-2 rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <h2 className="text-headline-sm font-semibold text-on-surface">{publishOutcome === "reused-release" ? "Đã xuất bản lại bằng release hiện có" : publishOutcome === "new-release" ? "Đã xuất bản lại phiên bản mới" : publishResult.previousTopicVersionId ? "Đã xuất bản đợt thay đổi" : "Đã xuất bản"}: {currentTopic.titleEn}</h2>
          <p className="text-body-md text-on-surface-variant">Phiên bản {publishResult.version} · {publishResult.itemCount} bài học hiển thị · {publishResult.durationMinutes} phút · {new Date(publishResult.publishedAt).toLocaleString("vi-VN")}</p>
          {publishResult.changes?.length ? <ul className="space-y-1 text-label-sm text-on-surface-variant">{publishResult.changes.map((change) => <li key={`${change.topicItemId}:${change.itemVersionId}`}>{change.changeType === "MAJOR" ? "MAJOR" : "Bài mới"} · {saved.items.find((item) => item.id === change.topicItemId)?.title ?? change.topicItemId} · v{change.version}</li>)}</ul> : publishOutcome === "reused-release" ? <p className="text-label-sm text-on-surface-variant">Hệ thống dùng lại release và các phiên bản Item đã phát hành; không tạo version mới.</p> : <p className="text-label-sm text-on-surface-variant">Bài học đang ẩn không được đưa vào bản xuất bản.</p>}
        </section>}
        <TopicItemsList items={saved.items.map(itemOverview)} selectedId={selectedId} onSelect={setSelectedId}
          onEdit={(itemId) => navigate(saved.items.find((item) => item.id === itemId)?.status === "DRAFT"
            ? topicItemSectionPath(itemId, "context", id) : adminTopicReadSectionPath(id, itemId, "context"))}
          onDelete={remove} onVisibility={toggleVisibility}
          onMetadata={(itemId) => setDialog(saved.items.find((item) => item.id === itemId) ?? null)}
          onMove={currentTopic.status === "draft" && saved.items.every((item) => item.status === "DRAFT") ? move : undefined}
          onAdd={add} disabled={pending || checkingReadiness || readinessOpen || publishing || conflict || !!dialog} />
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(adminTopicBasicInfoPath(id))}>Quay lại thông tin chủ đề</Button>
        </div>
      </div>
      {dialog && <TopicItemMetadataDialog item={dialog === "create" ? undefined : dialog} onClose={() => setDialog(null)} onSave={saveMetadata} />}
      <Dialog open={readinessOpen} onOpenChange={(open) => { if (!publishing) setReadinessOpen(open); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-outline-variant bg-surface-container-lowest sm:max-w-2xl" showCloseButton={!publishing}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-headline-md">{readiness?.ready ? <CheckCircle2 className="size-5 text-primary" /> : <CircleAlert className="size-5 text-error" />}{readiness?.ready ? isRepublish ? "Sẵn sàng xuất bản lại" : hasRelease ? "Sẵn sàng xuất bản đợt cập nhật" : "Chủ đề đã sẵn sàng" : "Cần hoàn thiện nội dung"}</DialogTitle>
            <DialogDescription>{readiness?.ready ? isRepublish ? `Chủ đề “${currentTopic.titleEn}” đã sẵn sàng xuất bản lại. Bản đã phát hành không đổi sẽ được dùng lại; thay đổi MAJOR và bài mới đủ điều kiện sẽ tạo release kế tiếp.` : hasRelease ? `Chủ đề “${currentTopic.titleEn}” đã sẵn sàng cho một Topic release mới. Xác nhận để phát hành các bản MAJOR và bài mới cùng một đợt.` : `Chủ đề “${currentTopic.titleEn}” đã đáp ứng điều kiện. Xác nhận để xuất bản các bài học hiển thị lần đầu.` : "Sửa các mục đã lưu rồi kiểm tra lại. Chọn một vấn đề để mở đúng trình soạn thảo."}</DialogDescription>
          </DialogHeader>
          {readiness && !readiness.ready && <div className="max-h-[48vh] space-y-5 overflow-y-auto pr-1">
            {Object.entries(violationGroups ?? {}).map(([group, violations]) => <section key={group} className="space-y-2">
              <h3 className="text-label-lg font-semibold text-on-surface">{group} <span className="text-on-surface-variant">({violations.length})</span></h3>
              <ul className="space-y-2">{violations.map((violation, index) => {
                const presentation = classifyReadinessViolation(violation.path, saved.items);
                const targetItem = presentation.item;
                const itemMetadata = presentation.action === "item-metadata";
                return <li key={`${violation.path}:${violation.code}:${index}`}>
                <Link to={itemMetadata ? adminTopicItemsPath(id) : violationDestination(violation.path)} onClick={(event) => {
                  setReadinessOpen(false);
                  if (itemMetadata && targetItem) { event.preventDefault(); setDialog(targetItem); }
                }} className="flex items-start justify-between gap-3 rounded-xl border border-outline-variant p-3 hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary">
                  <span>{targetItem && <span className="block text-label-sm text-on-surface-variant">Bài {targetItem.order ?? ""}: {targetItem.title || "Chưa có tên"}</span>}<span className="block text-label-sm font-semibold text-on-surface">{presentation.label}: {readinessViolationMessage(violation.path, violation.code)}</span></span><ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" />
                </Link>
              </li>})}</ul>
            </section>)}
            {readiness.violations.length === 0 && <p className="rounded-xl bg-surface-container-low p-4 text-body-md">Máy chủ yêu cầu cập nhật nội dung đã lưu. Đóng cửa sổ, tải lại danh sách và kiểm tra các bài học.</p>}
          </div>}
          {readiness?.ready && <div className="rounded-xl bg-surface-container-low p-4 text-body-md text-on-surface"><p className="font-semibold">Chủ đề: {currentTopic.titleEn}</p>{hasRelease ? <><p>{isRepublish ? "Đợt xuất bản lại" : "Đợt cập nhật"} gồm {visiblePendingCandidates.length} Item đang chờ kiểm tra:</p>{visiblePendingCandidates.length > 0 && <ul className="my-2 space-y-1 text-label-sm">{visiblePendingCandidates.map((item) => <li key={item.id}>{item.title || "Bài học chưa có tiêu đề"} · {item.previousItemVersionId ? "MAJOR" : "Bài mới"}</li>)}</ul>}<p>{saved.items.filter((item) => item.status === "PUBLISHED").length} Item đã phát hành sẽ được giữ hoặc tái sử dụng nếu nội dung không đổi.</p><p className="mt-1 text-on-surface-variant">{isRepublish ? "Nếu không có thay đổi hiệu lực, hệ thống khôi phục trạng thái Published và dùng lại release hiện có." : "Bản nháp trùng với bản phát hành hiện tại có thể không tạo thay đổi hiệu lực."}</p></> : <p>{saved.items.filter((item) => item.status !== "HIDDEN").length} bài học hiển thị sẽ được xuất bản lần đầu</p>}<p className="mt-2 text-on-surface-variant">{saved.items.filter((item) => item.status === "HIDDEN").length} bài học đang ẩn sẽ được loại trừ. Hệ thống sẽ kiểm tra lại phiên bản dữ liệu trước khi ghi nhận.</p></div>}
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="outline" disabled={publishing} onClick={() => setReadinessOpen(false)}>Đóng</Button>
            {readiness?.ready && <Button type="button" disabled={publishing || pending || conflict || unpublishing} onClick={() => void confirmPublish()}>{publishing ? <><LoaderCircle className="mr-2 size-4 animate-spin" />Đang xuất bản…</> : <><Send className="mr-2 size-4" />{isRepublish ? "Xác nhận xuất bản lại" : "Xác nhận xuất bản"}</>}</Button>}
            {!readiness?.ready && readiness && <Button type="button" variant="outline" onClick={() => { setReadinessOpen(false); void checkReadiness(); }} disabled={checkingReadiness || pending || conflict}>Kiểm tra lại</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <UnpublishTopicDialog topic={unpublishOpen ? currentTopic : null} busy={unpublishing} error={unpublishError} onClose={() => setUnpublishOpen(false)} onConfirm={() => void confirmUnpublish()} />
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
