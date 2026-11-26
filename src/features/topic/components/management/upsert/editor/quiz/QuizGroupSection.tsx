import { CircleAlert, Plus } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import type { QuizModulePresentation } from "@features/topic/utils/topic-quiz-presentation";
import QuizQuestionCard from "./QuizQuestionCard";

interface QuizGroupSectionProps {
  group: QuizModulePresentation;
  onAdd: (groupId: string) => void;
  onEdit: (questionId: string) => void;
  onDelete: (questionId: string) => void;
  onPreviewAudio: () => void;
  readOnly?: boolean;
  titleControl?: React.ReactNode;
  moduleActions?: React.ReactNode;
  minorMode?: boolean;
}

function ModuleDetails({ group }: { group: QuizModulePresentation }) {
  if (Object.keys(group.details).length === 0) return null;
  return <details className="rounded-lg border border-outline-variant/50 px-3 py-2 text-label-sm text-on-surface-variant"><summary className="cursor-pointer font-medium text-on-surface">Chi tiết module</summary><dl className="mt-2 grid gap-2">{Object.entries(group.details).map(([key, value]) => <div key={key}><dt className="font-medium">{key === "quizId" ? "Mã module" : key === "orderIndex" ? "Thứ tự API" : key === "quizType" ? "Loại đã lưu" : key}</dt><dd>{String(value ?? "Chưa có dữ liệu")}</dd></div>)}</dl></details>;
}

export default function QuizGroupSection({ group, onAdd, onEdit, onDelete, onPreviewAudio, readOnly = false, titleControl, moduleActions, minorMode = false }: QuizGroupSectionProps) {
  const moduleName = group.title || `Module ${group.index + 1}`;
  return <section data-testid="quiz-module" aria-label={`Quiz module ${group.index + 1}: ${group.typeLabel}, ${moduleName}`} className="space-y-4 rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-4 sm:p-5">
    <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 space-y-2">
        <h2 className="text-headline-sm font-semibold text-on-surface">Nhóm {group.index + 1}{titleControl ? "" : `: ${moduleName}`}</h2>
        <p className="text-label-sm font-semibold text-primary">Dạng quiz: {group.typeLabel}</p>
        {!titleControl && group.instructions && <p className="text-body-sm text-on-surface-variant">{group.instructions}</p>}
        {titleControl}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span className="rounded-full bg-surface-container-highest px-3 py-1 text-label-sm text-on-surface-variant" aria-label={`Số câu hỏi trong nhóm: ${group.questions.length}`}>{group.questions.length} câu hỏi</span>
        {!readOnly && !minorMode && group.kind === "supported" && <Button type="button" onClick={() => onAdd(group.id)}><Plus className="mr-1 size-4" aria-hidden="true" />Thêm câu hỏi</Button>}
        {moduleActions}
      </div>
    </header>
    {group.kind === "unsupported" && <p role="status" className="flex items-start gap-2 rounded-lg bg-surface-container-low p-3 text-body-sm text-on-surface-variant"><CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />Module này chưa được hỗ trợ chỉnh sửa; dữ liệu gốc được giữ nguyên.</p>}
    {group.questions.length === 0 ? <p role="status" className="rounded-lg bg-surface-container-low p-3 text-body-sm text-on-surface-variant">Module chưa có câu hỏi.</p> : <div className="grid grid-cols-1 gap-4">{group.questions.map((question) => {
      return <QuizQuestionCard key={question.id} question={question} onEdit={onEdit} onDelete={onDelete} onPreviewAudio={onPreviewAudio} readOnly={readOnly || group.kind === "unsupported"} minorMode={minorMode} />;
    })}</div>}
    <ModuleDetails group={group} />
  </section>;
}
