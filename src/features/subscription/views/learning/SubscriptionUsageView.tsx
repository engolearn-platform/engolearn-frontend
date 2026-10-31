import { Link } from "react-router";
import { ArrowRight, Clock3 } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { DateTime, LoadingState, PrivateAccount, SubscriptionPage, Surface, Unavailable } from "@features/subscription/components/SubscriptionUi";
import { useQuotaUsage } from "@features/subscription/hooks/useSubscription";
import type { QuotaUsageItem } from "@features/subscription/types/subscription.types";

const periodLabels = { DAILY: "Mỗi ngày", WEEKLY: "Mỗi tuần", MONTHLY: "Mỗi tháng" };
const statusLabels = { AVAILABLE: "Còn hạn mức", EXHAUSTED: "Đã hết hạn mức", OVER_LIMIT: "Đã vượt hạn mức" };
function amount(value: number, unit: string) {
  return `${new Intl.NumberFormat("vi-VN").format(value)} ${unit === "SECOND" ? "giây" : unit === "ATTEMPT" ? "lượt" : unit}`;
}
function QuotaCard({ quota: q }: { quota: QuotaUsageItem }) {
  const percentage = q.limit === 0 ? 0 : Math.min(100, q.used / q.limit * 100);
  return <Surface className="space-y-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-sm font-semibold text-primary">{periodLabels[q.period]}</p><h2 className="mt-2 text-[22px] font-semibold leading-7">{q.displayName}</h2></div><span className={`h-fit rounded-full px-3 py-2 text-sm font-semibold ${q.status === "AVAILABLE" ? "bg-muted text-primary" : "bg-muted text-foreground"}`}>{statusLabels[q.status]}</span></div><div><p className="text-[28px] font-bold leading-9">{amount(q.used, q.unit)}</p><p className="mt-1 text-muted-foreground">đã sử dụng / {amount(q.limit, q.unit)}</p></div><div role="progressbar" aria-label={q.displayName} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} aria-valuetext={`Đã sử dụng ${amount(q.used, q.unit)}, hạn mức ${amount(q.limit, q.unit)}, còn ${amount(q.remaining, q.unit)}. ${statusLabels[q.status]}.`} className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} /></div><p className="font-semibold text-primary">Còn lại {amount(q.remaining, q.unit)}</p>{q.status === "OVER_LIMIT" && <p className="leading-6 text-muted-foreground">Đã vượt {amount(q.overLimitAmount!, q.unit)}. Số đã sử dụng được giữ nguyên; không còn hạn mức cho tiêu thụ mới.</p>}<div className="space-y-2 border-t border-border pt-4 text-sm leading-6 text-muted-foreground"><p className="flex items-start gap-2"><Clock3 className="mt-1 size-4 shrink-0" aria-hidden="true" /><span>Kỳ tiếp theo bắt đầu: <DateTime value={q.windowEndsAt} /> (giờ Việt Nam)</span></p><p>Kỳ lịch: <DateTime value={q.windowStartAt} /> — <DateTime value={q.windowEndsAt} /></p>{q.allowanceStartAt !== q.windowStartAt && <p>Hạn mức được tính từ <DateTime value={q.allowanceStartAt} /> trong kỳ này.</p>}</div></Surface>;
}
function UsageContent() {
  const state = useQuotaUsage();
  if (state.loading) return <LoadingState label="Đang tải hạn mức cá nhân…" />;
  if (state.error) return <Unavailable error={state.error} retry={state.refetch} />;
  if (!state.data) return null;
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm leading-6 text-muted-foreground">Dữ liệu tại <DateTime value={state.data.timestamp} /> (giờ Việt Nam)</p><Button variant="outline" className="min-h-12 rounded-xl" onClick={state.refetch}>Tải lại hạn mức</Button></div>{state.data.data.items.length === 0 ? <Surface><h2 className="text-lg font-semibold">Chưa có hạn mức áp dụng</h2><p className="mt-2 text-muted-foreground">Máy chủ đã xác nhận danh sách hạn mức hiện tại trống.</p></Surface> : <div className="grid gap-4 xl:grid-cols-2">{state.data.data.items.map(q => <QuotaCard key={q.quotaType} quota={q} />)}</div>}</div>;
}
export default function SubscriptionUsageView() {
  return <SubscriptionPage usage><PrivateAccount>{() => <UsageContent />}</PrivateAccount><Surface><h2 className="text-[22px] font-semibold leading-7">Hiểu hạn mức của bạn</h2><div className="mt-4 space-y-3 leading-6 text-muted-foreground"><p>Mỗi hạn mức có kỳ và thời điểm kết thúc riêng theo giờ Việt Nam (Asia/Ho_Chi_Minh). Thời điểm kết thúc kỳ là thời điểm bắt đầu kỳ tiếp theo.</p><p>Đổi gói hoặc bắt đầu kỳ đăng ký mới giữ lại lượng đã sử dụng trong cùng kỳ lịch. Thay đổi chính sách Free có thể bắt đầu một hạn mức mới bên trong kỳ lịch.</p><p>Trang này chỉ hiển thị mức sử dụng. Điều kiện bắt đầu bài đánh giá, thời gian chờ và quyền hoàn thành bài đang làm do tính năng học tương ứng quyết định.</p></div><Button asChild variant="outline" className="mt-5 min-h-12 rounded-xl"><Link to="/subscription">Xem gói học & quyền lợi<ArrowRight aria-hidden="true" /></Link></Button></Surface></SubscriptionPage>;
}
