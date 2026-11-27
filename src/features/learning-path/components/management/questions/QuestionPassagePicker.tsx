import { useCallback, useEffect, useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { Loading } from "@shared/components";
import { useFetch } from "@shared/hooks";
import { passageManagementService } from "@features/learning-path/services/passage-management.service";
import type { PassageLevel, PassageSkill } from "@features/learning-path/types/passage-management.types";
import PassageWorkspaceDialog, { PassagePreview } from "@features/learning-path/components/management/passages/PassageWorkspaceDialog";
import { PassageStatusBadge } from "@features/learning-path/components/management/passages/PassageManagementTable";
import { questionFieldClass } from "./QuestionReviewPanel";

export default function QuestionPassagePicker({ skill, level, value, onChange, onValidityChange, disabled }: {
  skill: PassageSkill; level: PassageLevel; value: string; onChange: (id: string) => void; onValidityChange: (valid: boolean) => void; disabled: boolean;
}) {
  const [keyword, setKeyword] = useState(""); const [query, setQuery] = useState(""); const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false); const [manualId, setManualId] = useState<string>();
  useEffect(() => { const timer = window.setTimeout(() => { setQuery(keyword.trim()); setPage(0); }, 350); return () => window.clearTimeout(timer); }, [keyword]);
  const load = useCallback((signal: AbortSignal) => passageManagementService.list({ keyword: query, skill, level, status: "ALL", page, size: 10 }, signal), [query, skill, level, page]);
  const list = useFetch(load);
  const loadSelected = useCallback((signal: AbortSignal) => passageManagementService.detail(value, signal), [value]);
  const selected = useFetch(loadSelected, !!value);
  const matching = selected.data?.passageId === value && selected.data.skill === skill && selected.data.level === level;
  useEffect(() => { onValidityChange(!value || (!selected.loading && !selected.error && matching)); }, [value, selected.loading, selected.error, matching, onValidityChange]);
  return <section className="space-y-3 rounded-xl border border-outline-variant p-4" aria-label="Chọn passage cho câu hỏi">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Passage {skill === "LISTENING" ? "*" : "(tùy chọn)"}</h3>
      <Button type="button" variant="outline" disabled={disabled} onClick={() => setCreating(true)}>Tạo passage mới</Button></div>
    <p className="text-label-sm text-on-surface-variant">Chọn bài {skill === "READING" ? "đọc" : "nghe"} cùng trình độ {level}. Có thể lưu với passage bản nháp; passage phải đang sử dụng trước khi xuất bản câu hỏi.</p>
    <div className="flex flex-col gap-2 sm:flex-row"><label className="min-w-0 flex-1"><span className="sr-only">Nhập mã passage</span>
      <input className={questionFieldClass} maxLength={100} value={manualId ?? value} placeholder="Nhập mã passage nếu đã biết"
        onChange={event => setManualId(event.target.value)} disabled={disabled} /></label>
      <Button type="button" variant="outline" disabled={disabled || !(manualId ?? value).trim()} onClick={() => { onChange((manualId ?? value).trim()); setManualId(undefined); }}>Chọn mã này</Button>
      {value && <Button type="button" variant="ghost" disabled={disabled} onClick={() => { onChange(""); setManualId(undefined); }}>Bỏ chọn</Button>}
    </div>
    {value && <div className="space-y-2 rounded-xl bg-surface-container-low p-3">
      <p className="break-all text-label-sm">Đang chọn: {value}</p>
      {selected.loading ? <Loading /> : selected.error ? <div><p role="alert" className="text-error">{selected.error.message}</p><Button type="button" variant="outline" onClick={selected.refetch}>Tải lại passage</Button></div>
        : selected.data && matching ? <details><summary className="min-h-12 cursor-pointer py-3 font-semibold">{selected.data.title} · xem trước passage</summary>
          <PassagePreview key={selected.data.audio?.url ?? selected.data.updatedAt} detail={selected.data} onReload={selected.refetch} /></details>
          : <p role="alert" className="text-error">Passage không khớp kỹ năng hoặc trình độ. Hãy chọn lại trước khi lưu.</p>}
    </div>}
    <label className="block"><span className="sr-only">Tìm passage theo tiêu đề hoặc nội dung</span>
      <input className={questionFieldClass} type="search" maxLength={200} value={keyword} disabled={disabled}
        onChange={event => setKeyword(event.target.value)} placeholder="Tìm tiêu đề hoặc nội dung passage..." /></label>
    {list.loading ? <Loading /> : list.error ? <div className="space-y-2"><p role="alert" className="text-error">Không tải được danh sách passage.</p><Button type="button" variant="outline" onClick={list.refetch}>Thử lại</Button></div>
      : list.data && <>
        <div className="max-h-60 space-y-1 overflow-y-auto">
          {list.data.items.filter(item => item.skill === skill && item.level === level).map(item => <label key={item.passageId} className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg p-3 hover:bg-surface-container-low">
            <input type="radio" name="question-passage" className="mt-1 size-5 shrink-0 accent-primary" checked={value === item.passageId} disabled={disabled}
              onChange={() => { onChange(item.passageId); setManualId(undefined); }} />
            <span className="min-w-0 flex-1"><span className="block font-semibold">{item.title}</span><span className="block break-all text-label-sm text-on-surface-variant">{item.passageId}</span></span>
            <PassageStatusBadge status={item.status} />
          </label>)}
          {list.data.items.length === 0 && <p className="p-3 text-on-surface-variant">Chưa tìm thấy passage phù hợp. Bạn có thể tạo passage mới.</p>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-label-sm">
          <span>Trang {page + 1} / {Math.max(1, list.data.totalPages)}</span><div className="flex gap-2">
            <Button type="button" variant="outline" disabled={disabled || page === 0} onClick={() => setPage(value => value - 1)}>Trước</Button>
            <Button type="button" variant="outline" disabled={disabled || page + 1 >= list.data.totalPages} onClick={() => setPage(value => value + 1)}>Sau</Button>
          </div>
        </div>
      </>}
    {creating && <PassageWorkspaceDialog workspace={{ mode: "create", classification: { skill, level } }} onClose={() => setCreating(false)}
      onSaved={receipt => { onChange(receipt.passageId); setManualId(undefined); setCreating(false); setPage(0); list.refetch(); }} />}
  </section>;
}
