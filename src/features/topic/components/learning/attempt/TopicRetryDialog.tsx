import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";

export function TopicRetryDialog({ open, replacing = false, cancel, confirm }: { open: boolean; replacing?: boolean; cancel: () => void; confirm: () => void }) {
  return <Dialog open={open} onOpenChange={value => { if (!value) cancel(); }}><DialogContent>
    <DialogHeader><DialogTitle>{replacing ? "Thay thế lượt làm lại đang dở?" : "Bắt đầu làm lại?"}</DialogTitle><DialogDescription>{replacing ? "Lượt làm lại đang dở sẽ dừng để bắt đầu lượt mới. " : "Lượt làm lại bắt đầu từ Bối cảnh. "}Kết quả hiện tại được giữ tới khi từng bài hoàn thành lượt mới; kết quả mới sẽ thay thế kể cả khi thấp hơn.</DialogDescription></DialogHeader>
    <DialogFooter><Button type="button" variant="outline" className="min-h-12" onClick={cancel}>Huỷ</Button><Button type="button" className="min-h-12" onClick={confirm}>{replacing ? "Thay thế và bắt đầu lại" : "Bắt đầu làm lại"}</Button></DialogFooter>
  </DialogContent></Dialog>;
}
