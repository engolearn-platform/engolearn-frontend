export const vietnamTime = (value: string) => new Intl.DateTimeFormat("vi-VN", {dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh"}).format(new Date(value));
export const statusLabel: Record<string, string> = {ACTIVE: "Đang làm", READY: "Hoàn thành", NO_RESULT: "Không có đáp án", ABANDONED: "Bỏ dở"};
