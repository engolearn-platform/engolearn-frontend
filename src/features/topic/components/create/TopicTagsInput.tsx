import { useState } from "react";
import { X } from "lucide-react";

interface TopicTagsInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}

export default function TopicTagsInput({ tags, onAdd, onRemove }: TopicTagsInputProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    onAdd(value);
    setValue("");
  };

  return (
    <div className="flex flex-col gap-2.5 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-label-lg font-semibold text-on-surface">
          Thẻ từ khóa tìm kiếm (Tags)
        </span>
        <span className="text-label-sm text-on-surface-variant">Nhấn Enter để thêm thẻ mới</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-surface-container-low p-3 transition-all focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary">
        {tags.map((tag) => (
          <span
            key={tag}
            className="group inline-flex items-center gap-1.5 rounded-full bg-surface-container-highest px-3 py-1.5 text-label-sm font-medium text-on-surface"
          >
            #{tag}
            <button
              type="button"
              onClick={() => onRemove(tag)}
              aria-label={`Xóa thẻ ${tag}`}
              className="flex items-center transition-colors hover:text-error"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="+ Thêm từ khóa..."
          aria-label="Thêm từ khóa mới"
          className="min-w-[140px] flex-1 border-none bg-transparent px-2 py-1 text-body-md text-on-surface outline-none placeholder:text-on-surface-variant"
        />
      </div>
    </div>
  );
}
