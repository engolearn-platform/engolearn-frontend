import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";

export function TopicRetryDialog({ open, cancel, confirm }: { open: boolean; cancel: () => void; confirm: () => void }) {
  return <Dialog open={open} onOpenChange={value => { if (!value) cancel(); }}><DialogContent>
    <DialogHeader><DialogTitle>Thay thế lượt làm lại đang dở?</DialogTitle><DialogDescription>Lượt làm lại đang dở sẽ dừng để bắt đầu lượt mới. Các kết quả đã hoàn thành vẫn được giữ.</DialogDescription></DialogHeader>
    <DialogFooter><Button type="button" variant="outline" className="min-h-12" onClick={cancel}>Giữ lượt hiện tại</Button><Button type="button" className="min-h-12" onClick={confirm}>Thay thế và bắt đầu lại</Button></DialogFooter>
  </DialogContent></Dialog>;
}
