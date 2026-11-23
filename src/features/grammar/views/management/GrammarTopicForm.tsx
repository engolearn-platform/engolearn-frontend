import { useCallback, useState } from "react";
import { Copy } from "lucide-react";
import { useParams } from "react-router";
import { useFetch } from "@shared/hooks";
import { cn } from "@shared/utils";
import {
  EntryButton as Button, EntryChecklist, EntryConfirmation, EntryError, EntryField, EntryFooter, EntryHeader, EntrySteps, EntryTextInput,
  grammarEntryInput, grammarEntryPage,
} from "@features/grammar/components/management/GrammarEntryUi";
import { grammarEditorGrid, grammarEntryCard } from "@features/grammar/constants/management-entry";
import { grammarPaths } from "@features/grammar/constants/management-paths";
import { useGrammarEntryForm, useGrammarEntryNavigation } from "@features/grammar/hooks/useGrammarEntryForm";
import { grammarManagement } from "@features/grammar/services/grammar-management.service";
import type { GrammarLevel, GrammarTopic, GrammarTopicInput } from "@features/grammar/types/grammar-content.types";

const levelNames: Record<GrammarLevel, string> = { A1: "Sơ cấp", A2: "Cơ bản", B1: "Trung cấp", B2: "Trung cao" };
const levels = Object.keys(levelNames) as GrammarLevel[];
const blankTopic = { titleVi: "", titleEn: "", level: "" as GrammarLevel | "", description: "", order: "" };
type TopicFields = typeof blankTopic;

function toTopicFields(topic: GrammarTopic): TopicFields {
  return {
    titleVi: topic.titleVi,
    titleEn: topic.titleEn,
    level: topic.level,
    description: topic.description,
    order: String(topic.order ?? ""),
  };
}

function reconcileTopicOrder(topic: GrammarTopic, submitted: TopicFields): TopicFields {
  return { ...submitted, order: String(topic.order ?? "") };
}

function topicFieldsValid(fields: TopicFields, minimum: number) {
  return Boolean(fields.titleVi.trim() && fields.titleVi.length <= 120 && fields.titleEn.trim() && fields.titleEn.length <= 120
    && fields.level && fields.description.trim().length >= minimum && fields.description.length <= 250
    && (fields.order === "" || (Number.isInteger(Number(fields.order)) && Number(fields.order) > 0 && Number(fields.order) <= 2147483647)));
}

function TopicForm({ topic, reload }: { topic?: GrammarTopic; reload?: () => void }) {
  const [copyStatus, setCopyStatus] = useState<string>();
  const archived = topic?.status === "ARCHIVED";
  const minDescription = topic?.status === "PUBLISHED" ? 80 : 1;
  const validate = useCallback((fields: TopicFields) => !archived && topicFieldsValid(fields, minDescription), [archived, minDescription]);
  const persist = useCallback((fields: TopicFields, current?: GrammarTopic) => {
    const input: GrammarTopicInput = {
      titleVi: fields.titleVi.trim(),
      titleEn: fields.titleEn.trim(),
      level: fields.level as GrammarLevel,
      description: fields.description.trim(),
      ...(fields.order ? { order: Number(fields.order) } : {}),
    };
    return current ? grammarManagement.saveTopic(current.id, { ...input, version: current.version }) : grammarManagement.createTopic(input);
  }, []);
  const editor = useGrammarEntryForm({ initialFields: topic ? toTopicFields(topic) : blankTopic, initialRecord: topic, reconcile: reconcileTopicOrder, validate, persist });
  const { fields, record, update, error } = editor;
  const navigation = useGrammarEntryNavigation({
    ...editor, readOnly: archived, canAutosave: Boolean(record), conflict: Boolean(error?.conflict), saveFailed: Boolean(error),
  });
  const lockFields = archived || navigation.leaving;
  const lockLevel = lockFields || Boolean(record?.firstPublishedAt) || record?.status === "PUBLISHED";
  const back = grammarPaths.root;
  const nextPath = record ? grammarPaths.lessons(record.id) : undefined;
  const errors = error?.fields ?? {};
  const steps = [
    { label: "Thông tin chủ đề" },
    { label: "Bài học", onClick: nextPath ? () => void navigation.go(nextPath, editor.flush) : undefined },
    { label: "Kiểm tra & xuất bản", onClick: record ? () => void navigation.go(grammarPaths.topicPublish(record.id), editor.flush) : undefined },
  ];

  async function copyCode() {
    if (!record) return;
    try {
      await navigator.clipboard.writeText(record.code);
      setCopyStatus("Đã sao chép mã chủ đề.");
    } catch {
      setCopyStatus("Không thể sao chép tự động. Bạn có thể chọn và sao chép mã.");
    }
  }

  return (
    <div className={grammarEntryPage}>
      <EntryHeader title="Thông tin chủ đề" description="Nhập thông tin cơ bản trước khi thêm bài học." status={record?.status ?? "DRAFT"} />
      <EntrySteps steps={steps} current={0} />
      <div className={cn(grammarEditorGrid, "mb-6")}>
        <form ref={navigation.formElement} id="grammar-topic-form" className={cn(grammarEntryCard, "space-y-4 p-5 text-sm")} onSubmit={(event) => {
          event.preventDefault();
          void navigation.go(archived && nextPath ? nextPath : (saved: GrammarTopic) => grammarPaths.lessons(saved.id), editor.flush);
        }}>
          <div className="grid gap-3 xl:grid-cols-2">
            <EntryField id="grammar-topic-title-vi" label="Tên chủ đề tiếng Việt" required count={`${fields.titleVi.length}/120`} error={errors.titleVi}>
              <EntryTextInput id="grammar-topic-title-vi" value={fields.titleVi} maxLength={120} required disabled={lockFields}
                aria-invalid={Boolean(errors.titleVi)} aria-describedby={errors.titleVi ? "grammar-topic-title-vi-error" : undefined}
                onChange={(event) => update({ titleVi: event.target.value })} />
            </EntryField>
            <EntryField id="grammar-topic-title-en" label="Tên chủ đề tiếng Anh" required count={`${fields.titleEn.length}/120`} error={errors.titleEn}>
              <EntryTextInput id="grammar-topic-title-en" lang="en" value={fields.titleEn} maxLength={120} required disabled={lockFields}
                aria-invalid={Boolean(errors.titleEn)} aria-describedby={errors.titleEn ? "grammar-topic-title-en-error" : undefined}
                onChange={(event) => update({ titleEn: event.target.value })} />
            </EntryField>
          </div>
          <fieldset disabled={lockLevel} aria-invalid={Boolean(errors.level)} aria-describedby={errors.level ? "grammar-topic-level-error" : undefined}>
            <legend className="mb-1.5 font-semibold">Trình độ CEFR <span className="text-error" aria-hidden="true">*</span></legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {levels.map((level) => (
                <label key={level} className={cn(
                  "relative rounded-lg border border-outline px-2 py-2 text-center has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary",
                  lockLevel ? "cursor-not-allowed" : "cursor-pointer hover:border-primary",
                  fields.level === level ? "border-primary-container bg-primary-container text-on-primary" : "bg-surface-container-lowest",
                )}>
                  <input type="radio" name="grammar-topic-level" value={level} className="sr-only" checked={fields.level === level} required
                    onChange={() => { if (fields.level !== level) update({ level, order: "" }); }} />
                  <span className="block font-bold">{level}</span><span className="block text-xs">{levelNames[level]}</span>
                </label>
              ))}
            </div>
            {errors.level ? <p id="grammar-topic-level-error" className="mt-1.5 text-xs font-semibold text-error">{errors.level}</p> : null}
            {lockLevel && !archived && !navigation.leaving ? <p className="mt-1.5 text-xs text-on-surface-variant">Trình độ đã được khóa sau lần xuất bản đầu tiên.</p> : null}
          </fieldset>
          <EntryField id="grammar-topic-description" label="Mô tả ngắn" required count={`${fields.description.length}/250`} hint="Cần ít nhất 80 ký tự để xuất bản." error={errors.description}>
            <textarea id="grammar-topic-description" className={cn(grammarEntryInput, "min-h-24 resize-y")} value={fields.description} required minLength={minDescription} maxLength={250} disabled={lockFields}
              aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "grammar-topic-description-hint grammar-topic-description-error" : "grammar-topic-description-hint"}
              onChange={(event) => update({ description: event.target.value })} />
          </EntryField>
          <div className="space-y-2 rounded-lg bg-surface-container-low px-3 py-2.5 text-on-surface-variant">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Mã chủ đề <strong className="text-on-surface">{record?.code ?? "Tự tạo khi lưu"}</strong></span>
              {record && <Button type="button" size="icon" variant="ghost" className="size-7 min-h-7" aria-label="Sao chép mã chủ đề" onClick={() => void copyCode()}><Copy aria-hidden="true" /></Button>}
              <span>· Vị trí trên lộ trình <strong className="text-on-surface">{archived ? "—" : fields.order || "Cuối cấp độ"}</strong></span>
            </div>
            {!archived && <details>
              <summary className="w-fit cursor-pointer text-xs font-semibold text-primary">Đổi vị trí</summary>
              <label className="mt-2 flex flex-wrap items-center gap-2">Vị trí trên lộ trình
                <EntryTextInput type="number" className="w-32 py-1.5" min={1} max={2147483647} step={1}
                  value={fields.order} placeholder="Cuối cấp độ" disabled={lockFields}
                  aria-invalid={Boolean(errors.order)} aria-describedby={errors.order ? "grammar-topic-order-error" : undefined}
                  onChange={(event) => update({ order: event.target.value })} />
              </label>
            </details>}
            {copyStatus ? <span className="w-full text-xs" role="status">{copyStatus}</span> : null}
            {errors.order ? <p id="grammar-topic-order-error" className="w-full text-xs font-semibold text-error">{errors.order}</p> : null}
          </div>
          {navigation.showValidation && !archived ? <EntryError message="Kiểm tra tên song ngữ, trình độ, mô tả và vị trí trước khi tiếp tục." /> : null}
          {error ? <EntryError message={error.message} onRetry={error.conflict ? reload : record && editor.valid ? () => void editor.save() : undefined}
            retryLabel={error.conflict ? "Tải lại" : "Thử lưu lại"} /> : null}
        </form>
        <EntryChecklist title="Cần hoàn thành" rows={[
          { label: "Tên chủ đề song ngữ", passed: Boolean(fields.titleVi.trim() && fields.titleEn.trim()) },
          { label: "Trình độ CEFR", passed: Boolean(fields.level) },
          { label: "Mô tả từ 80 ký tự", passed: fields.description.trim().length >= 80 },
        ]} />
      </div>
      <EntryFooter back={back} backLabel="Danh sách chủ đề" onBack={() => navigation.back(back)} status={archived ? "Chủ đề lưu trữ · Chỉ xem" : editor.status}
        next={<Button type="submit" form="grammar-topic-form" disabled={navigation.leaving || Boolean(error?.conflict)}>Tiếp tục: Bài học</Button>} />
      {navigation.discardPath ? <EntryConfirmation title="Rời khỏi thông tin chủ đề?" description="Các thay đổi chưa lưu sẽ bị bỏ." confirmLabel="Rời khỏi" pending={false} onClose={navigation.cancelDiscard} onConfirm={navigation.discard} /> : null}
    </div>
  );
}

function ExistingTopicForm({ id }: { id: string }) {
  const fetchTopic = useCallback((signal: AbortSignal) => grammarManagement.getTopic(id, signal), [id]);
  const { data, loading, error, refetch } = useFetch(fetchTopic);
  if (data && !loading) return <TopicForm topic={data} reload={refetch} />;
  return (
    <div className={grammarEntryPage}>
      <EntryHeader title="Thông tin chủ đề" />
      {error ? <EntryError message={error.message} onRetry={refetch} /> : <p role="status" className="text-sm">Đang tải chủ đề…</p>}
      <EntryFooter back={grammarPaths.root} backLabel="Danh sách chủ đề" />
    </div>
  );
}

export function GrammarTopicFormView() {
  const { topicId } = useParams();
  return topicId ? <ExistingTopicForm key={topicId} id={topicId} /> : <TopicForm key="new" />;
}
