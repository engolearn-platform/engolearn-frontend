import { Drama, ListChecks, MessagesSquare, SpellCheck } from "lucide-react";
import { cn } from "@shared/utils";
import type { TopicItemStepKey } from "../../../types/topic-create.types";

interface TopicItemSectionTabRailProps {
  activeSection: TopicItemStepKey;
  vocabNote: string;
  expressionsNote: string;
  quizNote: string;
  quizEmpty: boolean;
  onSelect: (section: TopicItemStepKey) => void;
}

const TABS: {
  key: TopicItemStepKey;
  index: string;
  label: string;
}[] = [
  { key: "context", index: "1", label: "Bối cảnh (Context)" },
  { key: "vocabulary", index: "2", label: "Từ vựng" },
  { key: "expressions", index: "3", label: "Mẫu câu giao tiếp" },
  { key: "quiz", index: "4", label: "Bài tập & Quiz" },
];

function TabIcon({ section, active }: { section: TopicItemStepKey; active: boolean }) {
  const className = cn(
    "size-[18px]",
    !active && "text-tertiary",
  );
  switch (section) {
    case "context":
      return <Drama className={className} aria-hidden="true" />;
    case "vocabulary":
      return <SpellCheck className={className} aria-hidden="true" />;
    case "expressions":
      return <MessagesSquare className={className} aria-hidden="true" />;
    case "quiz":
      return <ListChecks className={className} aria-hidden="true" />;
  }
}

export default function TopicItemSectionTabRail({
  activeSection,
  vocabNote,
  expressionsNote,
  quizNote,
  quizEmpty,
  onSelect,
}: TopicItemSectionTabRailProps) {
  const noteByKey: Record<TopicItemStepKey, string | null> = {
    context: null,
    vocabulary: vocabNote,
    expressions: expressionsNote,
    quiz: quizNote,
  };

  return (
    <div
      role="tablist"
      aria-label="Các mục biên soạn của topic item"
      className="scrollbar-hide flex items-center gap-2 overflow-x-auto pb-1"
    >
      {TABS.map((tab) => {
        const active = tab.key === activeSection;
        const note = noteByKey[tab.key];
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(tab.key)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-label-lg whitespace-nowrap shadow-sm transition-all",
              active
                ? "bg-primary font-semibold text-on-primary"
                : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-high",
            )}
          >
            <TabIcon section={tab.key} active={active} />
            <span>
              {tab.index}. {tab.label}
            </span>
            {active ? (
              <span
                className="ml-1 size-2 rounded-full bg-secondary-fixed"
                aria-hidden="true"
              />
            ) : (
              note && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-label-sm",
                    tab.key === "quiz" && quizEmpty
                      ? "bg-error-container text-on-error-container"
                      : "bg-surface-container text-on-surface-variant",
                  )}
                >
                  {note}
                </span>
              )
            )}
          </button>
        );
      })}
    </div>
  );
}
