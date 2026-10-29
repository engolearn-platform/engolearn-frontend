import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";

export function TopicRetryDialog({ open, reset = false, cancel, confirm }: { open: boolean; reset?: boolean; cancel: () => void; confirm: () => void }) {
  return <Dialog open={open} onOpenChange={value => { if (!value) cancel(); }}><DialogContent>
    <DialogHeader><DialogTitle>{reset ? "Làm lại chủ đề từ đầu?" : "Bắt đầu làm lại bài học?"}</DialogTitle><DialogDescription>{reset ? "Toàn bộ tiến độ, kết quả và lượt làm lại đang dở của chủ đề này sẽ bị xoá. Bạn sẽ bắt đầu học từ đầu. Thao tác này không thể hoàn tác." : "Lượt làm lại bắt đầu từ Bối cảnh. Bạn cần hoàn thành bài này trước khi làm lại bài khác trong chủ đề. Kết quả hiện tại được giữ tới khi hoàn thành; kết quả mới sẽ thay thế kể cả khi thấp hơn."}</DialogDescription></DialogHeader>
    <DialogFooter><Button type="button" variant="outline" className="min-h-12" onClick={cancel}>Huỷ</Button><Button type="button" variant={reset ? "destructive" : "default"} className="min-h-12" onClick={confirm}>{reset ? "Làm lại chủ đề" : "Bắt đầu làm lại"}</Button></DialogFooter>
  </DialogContent></Dialog>;
}
