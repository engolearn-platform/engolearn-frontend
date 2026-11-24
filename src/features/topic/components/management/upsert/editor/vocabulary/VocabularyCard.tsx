import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { playableManagementMediaUrl } from "@features/topic/utils/management-media";
import type { TopicVocabularyResource } from "@features/topic/types/topic-management.types";
import { hasCollocationDetails, partOfSpeechLabel, toVocabularyPresentation, vocabularyCollocationLayout } from "@features/topic/utils/topic-vocabulary-presentation";

function AudioTrack({ label, value }: { label: string; value: string | null }) {
  const [failed, setFailed] = useState(false);
  const source = playableManagementMediaUrl(value);
  useEffect(() => setFailed(false), [source]);
  return <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2">
    <span className="text-label-sm font-medium text-on-surface">{label}</span>
    {source ? failed
      ? <span role="status" className="text-label-sm text-error">Không phát được âm thanh</span>
      : <audio key={source} controls preload="none" src={source} onError={() => setFailed(true)} className="max-w-full" aria-label={`Phát ${label.toLocaleLowerCase("vi-VN")}`} />
      : <span className="text-label-sm text-on-surface-variant">{value ? "Tham chiếu âm thanh không hợp lệ" : "Chưa có âm thanh"}</span>}
  </div>;
}

interface VocabularyCardProps {
  resource: TopicVocabularyResource;
  readOnly?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function VocabularyCard({ resource, readOnly = true, onEdit, onDelete }: VocabularyCardProps) {
  const item = toVocabularyPresentation(resource);
  const quickCheck = item.quickCheck;
  const collocationLayout = vocabularyCollocationLayout(item.collocations);
  return <article className="min-w-0 max-w-full rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm sm:p-6">
    <header className="flex min-w-0 flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-2">
      <h3 className="min-w-0 max-w-full break-words whitespace-pre-wrap text-headline-md font-bold text-on-surface [overflow-wrap:anywhere]">{item.word || "Từ chưa có nội dung"}</h3>
      {item.pos && <span className="max-w-full break-words whitespace-pre-wrap rounded-md bg-learning-note px-2.5 py-1 text-label-sm font-semibold text-learning-note-ink [overflow-wrap:anywhere]">{partOfSpeechLabel(item.pos)}</span>}
      {item.ipa && <span className="max-w-full break-words whitespace-pre-wrap text-body-md text-tertiary [overflow-wrap:anywhere]">{item.ipa}</span>}
      </div>
      {!readOnly && <div className="flex items-center gap-1">
        <button type="button" onClick={onEdit} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"><Pencil className="size-[18px]" aria-hidden="true" />Chỉnh sửa</button>
        <button type="button" onClick={onDelete} aria-label={`Xóa từ ${item.word}`} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-label-sm text-error transition-colors hover:bg-error-container/30"><Trash2 className="size-[18px]" aria-hidden="true" />Xóa</button>
      </div>}
    </header>
    {item.hasUnresolvedReference && <p className="mt-2 min-w-0 max-w-full break-words text-label-sm text-on-surface-variant [overflow-wrap:anywhere]">Từ điển liên kết chưa có nhãn hiển thị.</p>}
    {item.meaningVi && <p className="mt-2 min-w-0 max-w-full break-words whitespace-pre-wrap text-body-md text-on-surface-variant [overflow-wrap:anywhere]">{item.meaningVi}</p>}
    {item.showSense && <p className="mt-2 min-w-0 max-w-full break-words whitespace-pre-wrap text-body-md text-on-surface [overflow-wrap:anywhere]">{item.sense}</p>}

    {item.hasMissingPronunciation
      ? <p role="status" className="mt-3 text-label-sm text-on-surface-variant">Chưa có âm thanh phát âm.</p>
      : <section className="mt-4 min-w-0 max-w-full" aria-label="Phát âm">
      <div className="flex flex-wrap gap-2">{item.pronunciations.map((track) => <AudioTrack key={track.label} label={track.label} value={track.url} />)}</div>
    </section>}

    {item.examples.length > 0 && <section className="mt-5 space-y-3">
      <h4 className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">Ví dụ trong ngữ cảnh</h4>
      <ol className="min-w-0 max-w-full space-y-3">{item.examples.map((example, index) => <li key={`${index}-${example.en}`} className="min-w-0 max-w-full rounded-xl border border-learning-outline p-3">
        {example.en && <p className="min-w-0 max-w-full break-words whitespace-pre-wrap text-body-md font-medium text-on-surface [overflow-wrap:anywhere]">{example.en}</p>}
        {example.vi && <p className="mt-1 min-w-0 max-w-full break-words whitespace-pre-wrap text-body-md text-on-surface-variant [overflow-wrap:anywhere]">{example.vi}</p>}
        <div className="mt-2"><AudioTrack label={`Âm thanh ví dụ ${index + 1}`} value={example.audioUrl} /></div>
      </li>)}</ol>
    </section>}

    {collocationLayout !== "none" && <section className="mt-5 space-y-2">
      <h4 className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">Cụm từ kết hợp</h4>
      {collocationLayout === "chips"
        ? <div className="flex min-w-0 max-w-full flex-wrap gap-2">{item.collocations.map((entry, index) => <span key={`${index}-${entry.text}`} className="inline-flex max-w-full break-words whitespace-pre-wrap rounded-md bg-surface-container px-2.5 py-1 text-label-sm font-medium text-on-surface [overflow-wrap:anywhere]">{entry.text}</span>)}</div>
        : <ul className="min-w-0 max-w-full space-y-2">{item.collocations.map((entry, index) => <li key={`${index}-${entry.text}`} className="min-w-0 max-w-full rounded-xl border border-outline-variant/60 px-3 py-2">
          {hasCollocationDetails(entry)
            ? <details>
              <summary className="min-w-0 max-w-full cursor-pointer break-words whitespace-pre-wrap font-medium text-on-surface [overflow-wrap:anywhere]">{entry.text || "Chi tiết cụm từ"}</summary>
              <div className="mt-2 min-w-0 max-w-full space-y-1 text-body-md">
                {entry.descriptionVi && <p className="min-w-0 max-w-full break-words whitespace-pre-wrap text-on-surface-variant [overflow-wrap:anywhere]">{entry.descriptionVi}</p>}
                {entry.exampleEn && <p className="min-w-0 max-w-full break-words whitespace-pre-wrap font-medium text-on-surface [overflow-wrap:anywhere]">{entry.exampleEn}</p>}
                {entry.exampleVi && <p className="min-w-0 max-w-full break-words whitespace-pre-wrap text-on-surface-variant [overflow-wrap:anywhere]">{entry.exampleVi}</p>}
              </div>
            </details>
            : <span className="inline-flex max-w-full break-words whitespace-pre-wrap rounded-md bg-surface-container px-2.5 py-1 text-label-sm font-medium text-on-surface [overflow-wrap:anywhere]">{entry.text}</span>}
        </li>)}</ul>}
    </section>}

    {quickCheck && <section className="mt-5 rounded-xl bg-surface-container-low p-4">
      <details>
        <summary className="cursor-pointer font-semibold text-on-surface">Kiểm tra nhanh</summary>
        <div className="mt-3 space-y-2">
          <p className="min-w-0 max-w-full break-words whitespace-pre-wrap font-medium text-on-surface [overflow-wrap:anywhere]">{quickCheck.question}</p>
          {quickCheck.sentence && <p className="min-w-0 max-w-full break-words whitespace-pre-wrap text-body-md text-on-surface [overflow-wrap:anywhere]">{quickCheck.sentence}</p>}
          {quickCheck.meaningVi && <p className="min-w-0 max-w-full break-words whitespace-pre-wrap text-body-md text-on-surface-variant [overflow-wrap:anywhere]">{quickCheck.meaningVi}</p>}
          {quickCheck.audioUrl && <AudioTrack label="Âm thanh câu hỏi" value={quickCheck.audioUrl} />}
          {quickCheck.audioUrlSlow && <AudioTrack label="Âm thanh chậm" value={quickCheck.audioUrlSlow} />}
          <ul className="min-w-0 max-w-full space-y-1">{quickCheck.options.map((option, index) => <li key={`${index}-${option}`} className="flex min-w-0 max-w-full items-start gap-2 text-body-md text-on-surface">
            <span aria-hidden="true" className="shrink-0 font-semibold">{String.fromCharCode(65 + index)}.</span><span className="min-w-0 flex-1 break-words whitespace-pre-wrap [overflow-wrap:anywhere]">{option}</span>
            {quickCheck.correctAnswer === option && <span className="text-label-sm font-semibold text-primary">Đáp án đúng</span>}
          </li>)}</ul>
          {quickCheck.answerInconsistent
            ? <p role="status" className="min-w-0 max-w-full break-words whitespace-pre-wrap text-label-sm text-on-surface-variant [overflow-wrap:anywhere]">Dữ liệu đáp án chưa thống nhất; chưa đánh dấu lựa chọn đúng.</p>
            : quickCheck.correctAnswer === null && <p role="status" className="text-label-sm text-on-surface-variant">Chưa có đáp án rõ ràng trong dữ liệu.</p>}
          {quickCheck.explanation && <p className="min-w-0 max-w-full break-words whitespace-pre-wrap text-body-md text-on-surface-variant [overflow-wrap:anywhere]">{quickCheck.explanation}</p>}
        </div>
      </details>
    </section>}

    {item.hasUnsupportedQuickCheck && resource.quickCheck && <section className="mt-5 rounded-xl border border-outline-variant/60 p-4">
      <p className="text-body-md text-on-surface-variant">Kiểm tra nhanh có cấu trúc cũ chưa được hỗ trợ trong bản xem trước.</p>
      <details className="mt-2 text-label-sm text-on-surface-variant">
        <summary className="cursor-pointer">Chi tiết kiểm tra nhanh</summary>
        <pre className="mt-2 min-w-0 max-w-full max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-surface-container-low p-3 text-body-sm [overflow-wrap:anywhere]">{JSON.stringify(resource.quickCheck, null, 2)}</pre>
      </details>
    </section>}

    {item.tips && <aside className="mt-5 min-w-0 max-w-full break-words whitespace-pre-wrap rounded-xl bg-learning-note px-4 py-3 text-body-md text-learning-note-ink [overflow-wrap:anywhere]"><span className="font-semibold">Ghi chú: </span>{item.tips}</aside>}

    {(item.references.vocabId || item.references.senseId || item.sampleProvenance.length > 0 || quickCheck?.source || quickCheck?.externalId) && <details className="mt-4 min-w-0 max-w-full border-t border-outline-variant/60 pt-3 text-label-sm text-on-surface-variant">
      <summary className="cursor-pointer">Thông tin tham chiếu</summary>
      <div className="mt-2 space-y-1">
        {item.references.vocabId && <p className="break-words [overflow-wrap:anywhere]">Từ điển liên kết chưa được tải: <code className="break-all">{item.references.vocabId}</code></p>}
        {item.references.senseId && <p className="break-words [overflow-wrap:anywhere]">Nghĩa liên kết chưa được tải: <code className="break-all">{item.references.senseId}</code></p>}
        {quickCheck?.source && <p className="break-words whitespace-pre-wrap [overflow-wrap:anywhere]">Nguồn câu kiểm tra: {quickCheck.source}</p>}
        {quickCheck?.externalId && <p className="break-words [overflow-wrap:anywhere]">ID câu kiểm tra: <code className="break-all">{quickCheck.externalId}</code></p>}
        {item.sampleProvenance.map((provenance) => <p key={provenance.sampleIndex}>Nguồn ví dụ {provenance.sampleIndex}: {provenance.label}</p>)}
      </div>
    </details>}
  </article>;
}
