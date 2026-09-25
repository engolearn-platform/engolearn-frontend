import { Camera, Image as ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";

interface TopicCoverCardProps {
  coverName: string;
  coverMeta: string;
  onChangeClick?: () => void;
  onRemoveClick?: () => void;
}

export default function TopicCoverCard({
  coverName,
  coverMeta,
  onChangeClick,
  onRemoveClick,
}: TopicCoverCardProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-label-lg font-semibold text-on-surface">
          Ảnh bìa chủ đề (Topic Cover Art)
        </span>
        <span className="text-label-sm text-on-surface-variant">
          Tỉ lệ 16:9 • PNG, JPG hoặc WebP (Tối đa 2MB)
        </span>
      </div>

      <div className="grid grid-cols-1 items-center gap-6 rounded-xl bg-surface-container-low p-4 md:grid-cols-12">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-container md:col-span-6">
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <ImageIcon className="size-10 text-outline-variant" aria-hidden="true" />
            <span className="text-label-sm text-on-surface-variant">
              Ảnh bìa minh họa 16:9 (placeholder local)
            </span>
          </div>
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-inverse-surface/70 px-2.5 py-1 text-label-sm text-white">
              1200 x 675 px (Đã tối ưu)
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4 md:col-span-6">
          <div className="flex flex-col">
            <span className="text-label-lg font-semibold text-on-surface">{coverName}</span>
            <span className="mt-0.5 text-label-sm text-on-surface-variant">{coverMeta}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={onChangeClick}
              className="rounded-xl bg-primary text-on-primary shadow-xs hover:bg-primary-container"
            >
              <Camera className="size-[18px]" aria-hidden="true" />
              Thay đổi ảnh
            </Button>
            <Button
              type="button"
              onClick={onRemoveClick}
              className="rounded-xl bg-surface-container text-on-surface hover:bg-error-container hover:text-on-error-container"
            >
              <Trash2 className="size-[18px]" aria-hidden="true" />
              Xóa
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
