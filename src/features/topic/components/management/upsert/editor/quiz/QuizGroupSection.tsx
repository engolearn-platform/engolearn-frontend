import { Plus } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import type { TopicQuizGroup } from "@features/topic/types/topic-create.types";
import FillBlankQuestionCard from "./FillBlankQuestionCard";
import SituationalQuestionCard from "./SituationalQuestionCard";

interface QuizGroupSectionProps {
  group: TopicQuizGroup;
  groupIndex: number;
  onAdd: (groupId: string) => void;
  onEdit: (questionId: string) => void;
  onDelete: (questionId: string) => void;
  onPreviewAudio: () => void;
}

export default function QuizGroupSection({
  group,
  groupIndex,
  onAdd,
  onEdit,
  onDelete,
  onPreviewAudio,
}: QuizGroupSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 px-1 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-[12px] font-bold text-on-primary">
            {groupIndex + 1}
          </div>
          <div>
            <h2 className="text-headline-md font-semibold text-on-surface">
              Nhóm {groupIndex + 1}: {group.title}
            </h2>
            <p className="text-label-sm text-on-surface-variant">
              {group.instructions} ({group.questions.length} câu hỏi)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-surface-container-highest px-3 py-1 text-label-sm text-on-surface-variant">
            {group.questions.length} câu hỏi
          </span>
          <Button
            type="button"
            onClick={() => onAdd(group.id)}
            className="rounded-xl bg-surface-container-lowest text-primary shadow-sm hover:bg-surface-container-high"
          >
            <Plus className="size-[18px]" aria-hidden="true" />
            Thêm câu hỏi
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {group.questions.map((question, index) =>
          question.kind === "SITUATIONAL_CHOICE" ? (
            <SituationalQuestionCard
              key={question.id}
              question={question}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
              onPreviewAudio={onPreviewAudio}
            />
          ) : (
            <FillBlankQuestionCard
              key={question.id}
              question={question}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
              onPreviewAudio={onPreviewAudio}
            />
          ),
        )}
      </div>
    </section>
  );
}
