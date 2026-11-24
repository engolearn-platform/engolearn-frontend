import { Image as ImageIcon } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { playableManagementMediaUrl } from "@features/topic/utils/management-media";
import TopicMediaUpload from "@features/topic/components/management/upsert/TopicMediaUpload";

interface TopicCoverCardProps {
  coverName: string;
  onChange: (value: string) => void;
  error?: string;
  topicId?: string;
}

export default function TopicCoverCard({
  coverName,
  onChange,
  error,
  topicId,
}: TopicCoverCardProps) {
  const preview = playableManagementMediaUrl(coverName);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-label-lg font-semibold text-on-surface">
          Ảnh bìa chủ đề (Topic Cover Art)
        </span>
      </div>

      <div className="grid grid-cols-1 items-center gap-6 rounded-xl bg-surface-container-low p-4 md:grid-cols-12">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-container md:col-span-6">
          {preview ? <img src={preview} alt="Ảnh bìa chủ đề" className="size-full object-contain" /> : <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <ImageIcon className="size-10 text-outline-variant" aria-hidden="true" />
            <span className="text-label-sm text-on-surface-variant">
              Chưa có ảnh bìa
            </span>
          </div>}
        </div>

        <div className="flex flex-col justify-center gap-4 md:col-span-6">
          <label htmlFor="topic-cover-url" className="text-label-lg font-semibold">Đường dẫn ảnh bìa</label>
          <input id="topic-cover-url" className="w-full rounded-lg bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface" value={coverName} onChange={(event) => onChange(event.target.value)} aria-invalid={!!error} />
          {error && <p className="text-label-sm text-error">{error}</p>}
          {topicId ? <TopicMediaUpload topicId={topicId} kind="image" onUploaded={onChange} />
            : <p className="text-label-sm text-on-surface-variant">Lưu nháp chủ đề trước khi tải ảnh lên.</p>}
          {coverName && <Button type="button" variant="outline" className="self-start" onClick={() => onChange("")}>Bỏ ảnh bìa</Button>}
        </div>
      </div>
    </div>
  );
}
