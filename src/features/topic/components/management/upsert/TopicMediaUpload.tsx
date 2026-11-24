import { useEffect, useId, useRef, useState } from "react";
import { uploadTopicMedia, TopicApiError } from "@features/topic/services/topic-management.service";

const ACCEPT = { image: "image/jpeg,image/png,image/webp", audio: "audio/mpeg,audio/wav,.mp3,.wav" };

export default function TopicMediaUpload({ topicId, kind, onUploaded }: {
  topicId: string;
  kind: "image" | "audio";
  onUploaded: (reference: string) => void;
}) {
  const id = useId();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const currentHandler = useRef<typeof onUploaded | null>(onUploaded);
  useEffect(() => {
    currentHandler.current = onUploaded;
    return () => { currentHandler.current = null; };
  }, [onUploaded]);

  async function upload(file: File) {
    setMessage("");
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Tệp vượt quá 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const reference = await uploadTopicMedia(topicId, kind, file);
      currentHandler.current?.(reference);
      setMessage("Tệp đã tải lên. Bấm lưu để gắn tệp vào bản nháp.");
    } catch (error) {
      setMessage(error instanceof TopicApiError ? error.message : "Không thể tải tệp lên. Bạn vẫn có thể lưu nháp.");
    } finally {
      setUploading(false);
    }
  }

  return <div className="grid min-w-0 gap-1 text-label-sm">
    <label htmlFor={id}>{kind === "image" ? "Tải ảnh JPG, PNG, WebP" : "Tải audio MP3 hoặc WAV"} (tối đa 5 MB)</label>
    <input id={id} type="file" accept={ACCEPT[kind]} disabled={uploading} aria-describedby={message ? `${id}-status` : undefined}
      onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file) void upload(file);
      }} />
    {(uploading || message) && <span id={`${id}-status`} aria-live="polite">{uploading ? "Đang tải tệp…" : message}</span>}
  </div>;
}
