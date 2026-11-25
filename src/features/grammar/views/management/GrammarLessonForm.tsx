import { useCallback, useState } from "react";
import { Plus, X } from "lucide-react";
import { useParams } from "react-router";
import { useFetch } from "@shared/hooks";
import { cn } from "@shared/utils";
import {
  EntryButton as Button, EntryChecklist, EntryConfirmation, EntryError, EntryField, EntryFooter, EntryHeader, EntrySteps, EntryTextInput,
  grammarEntryInput, grammarEntryPage,
} from "@features/grammar/components/management/GrammarEntryUi";
import { grammarPaths } from "@features/grammar/constants/management-paths";
import { grammarEditorGrid, grammarEntryCard, grammarLessonStatus } from "@features/grammar/constants/management-entry";
import { useGrammarEntryForm, useGrammarEntryNavigation } from "@features/grammar/hooks/useGrammarEntryForm";
import { grammarManagement } from "@features/grammar/services/grammar-management.service";
import type { GrammarLesson, GrammarLessonInput, GrammarTopic } from "@features/grammar/types/grammar-content.types";

const blankLesson = { titleVi: "", titleEn: "", objective: "", tags: [] as string[], order: "" };
type LessonFields = typeof blankLesson;

function toLessonFields(lesson: GrammarLesson): LessonFields {
  return { titleVi: lesson.titleVi, titleEn: lesson.titleEn, objective: lesson.objective, tags: lesson.tags, order: "" };
}

function lessonInfoValid(fields: LessonFields) {
  return Boolean(fields.titleVi.trim() && fields.titleVi.length <= 150 && fields.titleEn.trim() && fields.titleEn.length <= 150
    && fields.objective.trim() && fields.objective.length <= 300
    && (fields.order === "" || (Number.isInteger(Number(fields.order)) && Number(fields.order) > 0 && Number(fields.order) <= 10)));
}

function LessonForm({ topic, lesson, reload }: { topic: GrammarTopic; lesson?: GrammarLesson; reload: () => void }) {
  const [tagEntry, setTagEntry] = useState("");
  const archived = topic.status === "ARCHIVED" || lesson?.status === "ARCHIVED";
  const validate = useCallback((fields: LessonFields) => !archived && lessonInfoValid(fields), [archived]);
  const persist = useCallback((fields: LessonFields, current?: GrammarLesson) => {
    const input: GrammarLessonInput = {
      titleVi: fields.titleVi.trim(),
      titleEn: fields.titleEn.trim(),
      objective: fields.objective.trim(),
      tags: fields.tags,
    };
    return current ? grammarManagement.saveLesson(topic.id, current.id, {
      ...input, version: current.version, blocks: current.blocks, questions: current.questions,
    }) : grammarManagement.createLesson(topic.id, {
      ...input, version: topic.version, ...(fields.order ? { order: Number(fields.order) } : {}),
    });
  }, [topic.id, topic.version]);
  const editor = useGrammarEntryForm({ initialFields: lesson ? toLessonFields(lesson) : blankLesson, initialRecord: lesson, validate, persist });
  const { fields, record, update, error } = editor;
  const navigation = useGrammarEntryNavigation({
    ...editor, readOnly: archived, canAutosave: Boolean(record), conflict: Boolean(error?.conflict), saveFailed: Boolean(error),
  });
  const lockFields = archived || navigation.leaving;
  const errors = error?.fields ?? {};

  function commitTags() {
    if (!tagEntry.trim() || lockFields) return;
    const tags = [...fields.tags];
    const existing = new Set(tags.map((tag) => tag.toLocaleLowerCase()));
    for (const name of tagEntry.split(",")) {
      const tag = name.trim().replace(/^#+/, "").trim();
      if (tag && !existing.has(tag.toLocaleLowerCase())) {
        tags.push(tag);
        existing.add(tag.toLocaleLowerCase());
      }
    }
    if (tags.length !== fields.tags.length) update({ tags });
    setTagEntry("");
  }

  const blockCount = record?.blocks.length ?? 0;
  const questionCount = record?.questions.length ?? 0;
  const basePath = grammarPaths.lessons(topic.id);
  const steps = [
    { label: "Thông tin bài học" },
    { label: "Nội dung", onClick: record ? () => void navigation.go(grammarPaths.blocks(topic.id, record.id), editor.flush) : undefined },
    { label: "Luyện tập", onClick: record ? () => void navigation.go(grammarPaths.questions(topic.id, record.id), editor.flush) : undefined },
    { label: "Kiểm tra & hoàn thiện", onClick: record ? () => void navigation.go(grammarPaths.lessonReview(topic.id, record.id), editor.flush) : undefined },
  ];

  return (
    <div className={grammarEntryPage}>
      <EntryHeader title="Thông tin bài học" description="Nhập tên, mục tiêu và thẻ cho bài học." status={record ? grammarLessonStatus(record) : "DRAFT"} />
      <p className="mb-3 text-xs text-on-surface-variant">{topic.titleVi} › {record?.order ? `Bài ${String(record.order).padStart(2, "0")} · ` : ""}{record?.titleVi ?? "Bài học mới"}</p>
      <EntrySteps steps={steps} current={0} />
      <div className={cn(grammarEditorGrid, "mb-6")}>
        <form ref={navigation.formElement} id="grammar-lesson-form" className={cn(grammarEntryCard, "space-y-4 p-5 text-sm")} onSubmit={(event) => {
          event.preventDefault();
          void navigation.go(archived && record ? grammarPaths.blocks(topic.id, record.id) : (saved: GrammarLesson) => grammarPaths.blocks(topic.id, saved.id), editor.flush);
        }}>
          {record?.hasDraft ? <p className="rounded-lg border border-learning-mint-border bg-learning-mint px-3 py-2 text-primary">Có thay đổi chưa xuất bản</p> : null}
          <div className="grid gap-3 xl:grid-cols-2">
            <EntryField id="grammar-lesson-title-vi" label="Tên bài học tiếng Việt" required count={`${fields.titleVi.length}/150`} error={errors.titleVi}>
              <EntryTextInput id="grammar-lesson-title-vi" value={fields.titleVi} maxLength={150} required disabled={lockFields}
                aria-invalid={Boolean(errors.titleVi)} aria-describedby={errors.titleVi ? "grammar-lesson-title-vi-error" : undefined}
                onChange={(event) => update({ titleVi: event.target.value })} />
            </EntryField>
            <EntryField id="grammar-lesson-title-en" label="Tên bài học tiếng Anh" required count={`${fields.titleEn.length}/150`} error={errors.titleEn}>
              <EntryTextInput id="grammar-lesson-title-en" lang="en" value={fields.titleEn} maxLength={150} required disabled={lockFields}
                aria-invalid={Boolean(errors.titleEn)} aria-describedby={errors.titleEn ? "grammar-lesson-title-en-error" : undefined}
                onChange={(event) => update({ titleEn: event.target.value })} />
            </EntryField>
          </div>
          <EntryField id="grammar-lesson-objective" label="Mục tiêu bài học" required count={`${fields.objective.length}/300`} hint="Học viên làm được gì sau bài học?" error={errors.objective}>
            <textarea id="grammar-lesson-objective" className={cn(grammarEntryInput, "min-h-24 resize-y")} value={fields.objective} required maxLength={300}
              disabled={lockFields} aria-invalid={Boolean(errors.objective)} aria-describedby={errors.objective ? "grammar-lesson-objective-hint grammar-lesson-objective-error" : "grammar-lesson-objective-hint"}
              onChange={(event) => update({ objective: event.target.value })} />
          </EntryField>
          <EntryField id="grammar-lesson-tag" label="Thẻ nội dung" error={errors.tags}>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-outline bg-surface-container-lowest p-2">
              {fields.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-semibold">
                  #{tag}
                  {!lockFields ? <button type="button" className="rounded-full p-0.5 focus-visible:outline-2 focus-visible:outline-primary"
                    aria-label={`Bỏ thẻ ${tag}`} onClick={() => update({ tags: fields.tags.filter((item) => item !== tag) })}><X aria-hidden="true" className="size-3" /></button> : null}
                </span>
              ))}
              <input id="grammar-lesson-tag" type="text" value={tagEntry} disabled={lockFields}
                aria-invalid={Boolean(errors.tags)} aria-describedby={errors.tags ? "grammar-lesson-tag-error" : undefined}
                className="min-w-32 flex-1 rounded-md border-0 bg-transparent px-1.5 py-1 text-sm placeholder:text-on-surface-variant focus-visible:outline-2 focus-visible:outline-primary"
                placeholder={lockFields && !fields.tags.length ? "Chưa có thẻ" : undefined}
                onChange={(event) => setTagEntry(event.target.value)} onBlur={commitTags}
                onKeyDown={(event) => {
                  if (!event.nativeEvent.isComposing && (event.key === "Enter" || event.key === ",")) {
                    event.preventDefault();
                    commitTags();
                  }
                }} />
              {!lockFields ? <Button type="button" variant="ghost" size="sm" onClick={commitTags}><Plus aria-hidden="true" /> Thêm thẻ</Button> : null}
            </div>
          </EntryField>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-surface-container-low px-3 py-2.5 text-on-surface-variant">
            <span>Mã bài <strong className="text-on-surface">{record?.code ?? "Tự tạo khi lưu"}</strong></span>
            {record ? <span>· Thứ tự <strong className="text-on-surface">{record.order !== null ? `Bài ${record.order}/${topic.lessonCount}` : "—"}</strong></span> :
              <label className="flex flex-wrap items-center gap-2">Thứ tự
                <EntryTextInput type="number" className="w-24 py-1.5" min={1} max={10} step={1}
                  value={fields.order} placeholder={String(topic.lessonCount + 1)} disabled={lockFields}
                  aria-invalid={Boolean(errors.order)} aria-describedby={errors.order ? "grammar-lesson-order-error" : undefined}
                  onChange={(event) => update({ order: event.target.value })} />
              </label>}
            {errors.order ? <p id="grammar-lesson-order-error" className="w-full text-xs font-semibold text-error">{errors.order}</p> : null}
          </div>
          {navigation.showValidation && !archived ? <EntryError message="Kiểm tra tên song ngữ, mục tiêu và thứ tự trước khi tiếp tục." /> : null}
          {error ? <EntryError message={error.message} onRetry={error.conflict ? reload : record && editor.valid ? () => void editor.save() : undefined}
            retryLabel={error.conflict ? "Tải lại" : "Thử lưu lại"} /> : null}
        </form>
        <EntryChecklist title="Tiến độ bài" rows={[
          { label: "Thông tin bài học", passed: lessonInfoValid(fields) },
          { label: `Nội dung: ${blockCount} khối (1–7)`, passed: blockCount >= 1 && blockCount <= 7 },
          { label: `Luyện tập: ${questionCount}/5 câu`, passed: questionCount === 5 },
        ]} />
      </div>
      <EntryFooter back={basePath} backLabel="Danh sách bài học" onBack={() => navigation.back(basePath)} status={archived ? "Bài học lưu trữ · Chỉ xem" : editor.status}
        next={<Button type="submit" form="grammar-lesson-form" disabled={navigation.leaving || Boolean(error?.conflict)}>Tiếp tục: Nội dung</Button>} />
      {navigation.discardPath ? <EntryConfirmation title="Rời khỏi thông tin bài học?" description="Các thay đổi chưa lưu sẽ bị bỏ." confirmLabel="Rời khỏi" pending={false} onClose={navigation.cancelDiscard} onConfirm={navigation.discard} /> : null}
    </div>
  );
}

function LoadLessonForm({ topicId, lessonId }: { topicId: string; lessonId?: string }) {
  const fetchDetails = useCallback(async (signal: AbortSignal) => {
    const [topic, lesson] = await Promise.all([
      grammarManagement.getTopic(topicId, signal),
      lessonId ? grammarManagement.getLesson(topicId, lessonId, signal) : undefined,
    ]);
    return { topic, lesson };
  }, [topicId, lessonId]);
  const { data, loading, error, refetch } = useFetch(fetchDetails);
  const blocked = !lessonId && data && (data.topic.status === "ARCHIVED" || data.topic.lessonCount >= 10);
  if (data && !loading && !blocked) return <LessonForm topic={data.topic} lesson={data.lesson} reload={refetch} />;
  return (
    <div className={grammarEntryPage}>
      <EntryHeader title="Thông tin bài học" />
      {error ? <EntryError message={error.message} onRetry={refetch} />
        : blocked ? <EntryError message={data.topic.status === "ARCHIVED" ? "Khôi phục chủ đề trước khi thêm bài học." : "Chủ đề đã có 10 bài học đang hoạt động."} />
        : <p className="text-sm" role="status">Đang tải thông tin bài học…</p>}
      <EntryFooter back={grammarPaths.lessons(topicId)} backLabel="Danh sách bài học" />
    </div>
  );
}

export function GrammarLessonFormView() {
  const { topicId, lessonId } = useParams();
  return topicId ? <LoadLessonForm key={`${topicId}/${lessonId ?? "new"}`} topicId={topicId} lessonId={lessonId} /> : null;
}
