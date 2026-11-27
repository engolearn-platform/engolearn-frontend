import { useCallback, useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { useAuth, useFetch } from "@shared/hooks";
import { draftService } from "@features/assessment/services/draft.service";
import type { AssessmentDraft, ManagedAssessmentPaper } from "@features/assessment/types/draft";
import DraftEditor from "@features/assessment/components/DraftEditor";
import { DraftImport } from "@features/assessment/components/DraftImport";
import { MicroSkillAdmin } from "@features/assessment/components/MicroSkillAdmin";
import { AssessmentSoundCheckAdmin } from "@features/assessment/components/AssessmentSoundCheckAdmin";
import { DraftText } from "@features/assessment/components/DraftFields";

export default function DraftManagementView() {
  const { user } = useAuth();
  const [page,setPage] = useState(0);
  const list = useFetch(useCallback((signal: AbortSignal) => draftService.list(page,signal),[page]));
  const [paperPage, setPaperPage] = useState(0);
  const papers = useFetch(useCallback((signal: AbortSignal) => draftService.papers(paperPage, signal), [paperPage]));
  const [editor,setEditor] = useState<AssessmentDraft | null>(null);
  const [series,setSeries] = useState("");
  const [name,setName] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  async function open(code: string, create = false) {
    setBusy(true); setError("");
    try { setEditor(create ? await draftService.create(code,name) : await draftService.open(code)); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  async function archive(paper: ManagedAssessmentPaper) {
    if (!window.confirm("Ngừng cấp bộ đề này cho lượt mới? Lượt cũ vẫn xem lại được.")) return;
    setBusy(true); setError("");
    try { await draftService.archive(paper); papers.refetch(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  return <section className="mx-auto w-full max-w-4xl space-y-5 p-5">
    {editor ? <DraftEditor key={editor.series} initial={editor} close={() => {setEditor(null); list.refetch(); papers.refetch();}}/> :
      <><h1 className="text-2xl font-bold">Đề đánh giá định kỳ</h1>
        <DraftImport onCreated={setEditor} />
        <AssessmentSoundCheckAdmin />
        {user?.role === "ADMIN" && <MicroSkillAdmin />}
        <form className="space-y-3 rounded-2xl border p-5" onSubmit={e => {e.preventDefault(); void open(series.trim(),true);}}>
          <h2 className="text-xl font-semibold">Tạo bản nháp</h2>
          <p className="text-sm">Nhập mã đề đã có để soạn phiên bản kế tiếp từ nội dung gần nhất.</p>
          <DraftText label="Mã bộ đề" value={series} onChange={setSeries} max={80}/>
          <DraftText label="Tên bộ đề" value={name} onChange={setName} max={180}/>
          <Button disabled={busy || !series.trim()}>Tạo nháp</Button></form>
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <h2 className="text-xl font-semibold">Bản nháp đang soạn</h2>
        {list.loading ? <p role="status">Đang tải…</p> : list.error ?
          <div role="alert">{list.error.message} <Button variant="outline" onClick={list.refetch}>Thử lại</Button></div> :
          <ul className="divide-y">{list.data?.length ? list.data.map(row => <li key={row.series} className="flex items-center justify-between gap-3 py-3">
            <div><strong>{row.name || row.series}</strong><p className="text-sm">{row.series} · v{row.version}</p></div>
            <Button variant="outline" disabled={busy} onClick={() => void open(row.series)}>Mở nháp</Button></li>) :
            <li className="py-3">Trang này chưa có bản nháp.</li>}</ul>}
        <div className="flex items-center gap-3"><Button variant="outline" disabled={busy || page === 0}
          onClick={() => setPage(page-1)}>Trang trước</Button><span>Trang {page+1}</span>
          <Button variant="outline" disabled={busy || list.loading || list.data?.length !== 25}
          onClick={() => setPage(page+1)}>Trang sau</Button></div>
        <h2 className="text-xl font-semibold">Phiên bản đã xuất bản</h2>
        {papers.loading ? <p role="status">Đang tải phiên bản…</p> : papers.error
          ? <div role="alert">{papers.error.message} <Button variant="outline" onClick={papers.refetch}>Thử lại</Button></div>
          : <ul className="divide-y">{papers.data?.length ? papers.data.map(paper => <li key={paper.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div><strong>{paper.name || paper.series}</strong>
                <p className="text-sm">{paper.series} · v{paper.version} · {paper.published ? "Đang dùng" : "Đã ngừng dùng"}</p>
              </div>
              {paper.published && <Button variant="outline" disabled={busy}
                onClick={() => void archive(paper)}>Ngừng sử dụng</Button>}
            </li>) : <li className="py-3">Trang này chưa có phiên bản.</li>}</ul>}
        <div className="flex items-center gap-3">
          <Button variant="outline" disabled={paperPage === 0 || papers.loading} onClick={() => setPaperPage(paperPage - 1)}>Trang trước</Button>
          <span>Trang {paperPage + 1}</span>
          <Button variant="outline" disabled={papers.loading || papers.data?.length !== 25}
            onClick={() => setPaperPage(paperPage + 1)}>Trang sau</Button>
        </div>
      </>}
  </section>;
}
