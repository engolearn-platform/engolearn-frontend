import type { CompanionConversation, CompanionQuotaItem } from "../types/companion.types";

interface QuotaSummaryProps {
  quota: CompanionQuotaItem | null;
  isLoading?: boolean;
  conversation?: CompanionConversation | null;
}

function formatWindow(value: string | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function QuotaSummary({ quota, isLoading = false, conversation }: QuotaSummaryProps) {
  const resetAt = formatWindow(quota?.windowEndsAt);
  const hasValidQuota = quota !== null
    && Number.isFinite(quota.limit)
    && Number.isFinite(quota.remaining)
    && quota.limit >= 0
    && quota.remaining >= 0
    && quota.remaining <= quota.limit
    && resetAt !== "";
  const remainingPercentage = hasValidQuota && quota
    ? quota.limit === 0
      ? 0
      : quota.remaining > 0
        ? Math.min(100, Math.ceil((quota.remaining / quota.limit) * 100))
        : 0
    : null;
  const usedPercentage = remainingPercentage === null ? null : 100 - remainingPercentage;
  const hasCapacity = conversation !== null && conversation !== undefined
    && Number.isFinite(conversation.messageCount)
    && Number.isFinite(conversation.maxMessages)
    && conversation.maxMessages > 0;
  const isNearCapacity = hasCapacity && conversation.messageCount >= conversation.warningThreshold;

  return (
    <section className="companion-quota" aria-label="Hạn mức sử dụng">
      {isLoading ? <p className="companion-muted" role="status">Đang cập nhật hạn mức…</p> : null}
      {hasValidQuota && quota && remainingPercentage !== null && usedPercentage !== null ? (
        <>
          <div className="companion-quota-heading">
            <span>Hạn mức AI Companion</span>
            <span>{remainingPercentage}% còn lại</span>
          </div>
          <div
            className="companion-progress-track"
            role="progressbar"
            aria-label="Phần hạn mức còn lại"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={remainingPercentage}
          >
            <span className="companion-progress-value" style={{ width: `${usedPercentage}%` }} />
          </div>
          <p className="companion-quota-footnote">
            Đặt lại vào {resetAt}
          </p>
        </>
      ) : !isLoading ? <p className="companion-muted">Hạn mức hiện chưa khả dụng.</p> : null}

      {hasCapacity && conversation ? (
        <div className="companion-capacity">
          <div className="companion-quota-heading">
            <span>Lượt nhắn trong cuộc trò chuyện</span>
            <span>{conversation.messageCount} / {conversation.maxMessages}</span>
          </div>
          {isNearCapacity ? <p className="companion-capacity-warning">Cuộc trò chuyện này sắp đạt giới hạn.</p> : null}
        </div>
      ) : null}
    </section>
  );
}
