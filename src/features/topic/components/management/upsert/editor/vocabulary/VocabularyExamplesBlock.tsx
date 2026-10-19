import { Quote } from "lucide-react";
import type { TopicVocabularyExample } from "@features/topic/types/topic-create.types";

interface VocabularyExamplesBlockProps {
  examples: TopicVocabularyExample[];
  highlight: string;
}

function highlightSentence(
  sentence: string,
  highlight: string,
): React.ReactNode {
  const keyword = highlight.trim();
  if (!keyword) return sentence;
  const index = sentence.toLowerCase().indexOf(keyword.toLowerCase());
  if (index < 0) return sentence;
  const before = sentence.slice(0, index);
  const match = sentence.slice(index, index + keyword.length);
  const after = sentence.slice(index + keyword.length);
  return (
    <>
      {before}
      <mark className="rounded bg-secondary-fixed/50 px-1 font-semibold text-on-surface">
        {match}
      </mark>
      {after}
    </>
  );
}

export default function VocabularyExamplesBlock({
  examples,
  highlight,
}: VocabularyExamplesBlockProps) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
        <Quote className="size-4 text-primary" aria-hidden="true" />
        Ví dụ trong ngữ cảnh
      </p>
      <ul className="space-y-1.5">
        {examples.map((example) => (
          <li
            key={example.en}
            className="flex items-start gap-2 text-body-md text-on-surface"
          >
            <span
              className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <span className="font-medium">
                &ldquo;{highlightSentence(example.en, highlight)}&rdquo;
              </span>
              {example.vi.trim().length > 0 && (
                <span className="block font-normal text-on-surface-variant sm:ml-2 sm:inline">
                  ({example.vi})
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
