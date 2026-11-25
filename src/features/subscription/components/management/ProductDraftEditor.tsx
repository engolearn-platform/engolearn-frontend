import { useEffect, useMemo, useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { Card } from "@shared/components/Card";
import { Field, TextField, fieldClass } from "@features/subscription/components/management/ConfigurationFields";
import type { ProductService } from "@features/subscription/types/subscriptionProduct.types";
import type { ConfigurationBilling, ConfigurationContent, ConfigurationQuota } from "@features/subscription/types/subscriptionManagement.types";

type BillingPeriod = ConfigurationBilling["billingPeriod"];

export default function ProductDraftEditor({ initial, revision, sourceVersion, services, pending, onSave, onPreview }: {
  initial: ConfigurationContent;
  revision: number;
  sourceVersion: number | null;
  services: ProductService[];
  pending: boolean;
  onSave: (content: ConfigurationContent) => void;
  onPreview: (revision: number) => void;
}) {
  const [content, setContent] = useState(() => structuredClone(initial));
  useEffect(() => { setContent(structuredClone(initial)); }, [initial, revision]);
  const initialJson = useMemo(() => JSON.stringify(initial), [initial]);
  const dirty = JSON.stringify(content) !== initialJson;
  const invalidNumber = content.billingOptions.some(item => !Number.isSafeInteger(item.amount) || item.amount < 0) ||
    content.quotaRules.some(item => !Number.isSafeInteger(item.limit) || item.limit < 0) || !Number.isSafeInteger(content.displayOrder) || content.displayOrder < 0;
  const selectedCodes = new Set(content.benefits.map(benefit => benefit.code));

  function update(patch: Partial<ConfigurationContent>) {
    setContent(value => ({ ...value, ...patch }));
  }
  function updateBilling(period: BillingPeriod, field: "amount" | "currency", value: string) {
    const option = content.billingOptions.find(item => item.billingPeriod === period);
    if (!option) return;
    const billingOptions = content.billingOptions.map(item => item.billingPeriod !== period ? item : {
      ...item,
      [field]: field === "amount" ? (value === "" ? Number.NaN : Number(value)) : value.toUpperCase(),
    });
    update({ billingOptions });
  }
  function toggleBilling(period: BillingPeriod, enabled: boolean) {
    const billingOptions = enabled
      ? [...content.billingOptions, { billingPeriod: period, amount: 0, currency: "VND" as const }].sort((a, b) => a.billingPeriod.localeCompare(b.billingPeriod))
      : content.billingOptions.filter(item => item.billingPeriod !== period);
    update({ billingOptions });
  }
  function toggleService(service: ProductService, enabled: boolean) {
    const selectedServices = services.filter(item => item.code !== service.code ? selectedCodes.has(item.code) : enabled);
    const benefits = enabled
      ? [...content.benefits.filter(item => item.code !== service.code), { code: service.code, title: service.title, description: service.description, displayValue: null, sortOrder: content.benefits.length }]
      : content.benefits.filter(item => item.code !== service.code);
    const selectedQuotaTypes = new Map<string, ProductService>();
    selectedServices.forEach(item => { if (item.quotaType) selectedQuotaTypes.set(item.quotaType, item); });
    const quotaRules: ConfigurationQuota[] = [...selectedQuotaTypes].map(([quotaType, source], index) => {
      const existing = content.quotaRules.find(item => item.quotaType === quotaType);
      return existing
        ? { ...existing, displayName: source.title, unit: source.unit!, period: source.period! }
        : { quotaType, displayName: source.title, unit: source.unit!, period: source.period!, limit: 0, displayOrder: index };
    });
    update({ benefits, quotaRules });
  }
  function updateQuota(quotaType: string, limit: string) {
    update({ quotaRules: content.quotaRules.map(item => item.quotaType === quotaType ? { ...item, limit: limit === "" ? Number.NaN : Number(limit) } : item) });
  }

  return <Card className="space-y-6 rounded-2xl border-border bg-card p-5 shadow-none md:p-6">
    <header className="space-y-2"><h2 className="text-headline-md font-semibold">{sourceVersion ? `Bản nháp mới từ phiên bản v${sourceVersion}` : `Bản nháp r${revision}`}</h2><p className="leading-6 text-muted-foreground">Chọn dịch vụ từ danh mục hiện hành. Tên, đơn vị và chu kỳ hạn mức lấy từ máy chủ.</p></header>
    <div className="grid gap-4 md:grid-cols-2">
      <TextField id="productDisplayName" label="Tên hiển thị" maxLength={200} value={content.displayName} disabled={pending} onChange={event => update({ displayName: event.target.value })} />
      <TextField id="productDisplayOrder" label="Thứ tự hiển thị" type="number" min={0} step={1} value={Number.isFinite(content.displayOrder) ? content.displayOrder : ""} disabled={pending} onChange={event => update({ displayOrder: event.target.value === "" ? Number.NaN : Number(event.target.value) })} />
      <Field id="productDescription" label="Mô tả">
        <textarea id="productDescription" name="productDescription" maxLength={2000} rows={3} value={content.description ?? ""} disabled={pending} onChange={event => update({ description: event.target.value || null })} className={fieldClass} />
      </Field>
    </div>

    <section className="space-y-3" aria-labelledby="product-prices-heading">
      <div><h3 id="product-prices-heading" className="font-semibold">Giá theo kỳ</h3><p className="text-sm leading-6 text-muted-foreground">Bật các kỳ được cung cấp cho gói này.</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        {(["MONTHLY", "ANNUAL"] as const).map(period => {
          const option = content.billingOptions.find(item => item.billingPeriod === period);
          const id = `billing-${period.toLowerCase()}`;
          return <div key={period} className="space-y-3 rounded-2xl border border-border p-4">
            <label htmlFor={`${id}-enabled`} className="flex min-h-12 items-center gap-3 font-semibold"><input id={`${id}-enabled`} type="checkbox" checked={!!option} disabled={pending} onChange={event => toggleBilling(period, event.target.checked)} className="size-5 accent-primary" />{period === "MONTHLY" ? "Theo tháng" : "Theo năm"}</label>
            {option && <div className="grid gap-3 sm:grid-cols-2"><TextField id={`${id}-amount`} label="Giá" type="number" min={0} step={1} value={Number.isFinite(option.amount) ? option.amount : ""} disabled={pending} onChange={event => updateBilling(period, "amount", event.target.value)} /><TextField id={`${id}-currency`} label="Mã tiền tệ" maxLength={3} value={option.currency} disabled={pending} onChange={event => updateBilling(period, "currency", event.target.value)} /></div>}
          </div>;
        })}
      </div>
    </section>

    <section className="space-y-3" aria-labelledby="product-services-heading">
      <div><h3 id="product-services-heading" className="font-semibold">Dịch vụ và quyền lợi</h3><p className="text-sm leading-6 text-muted-foreground">Dịch vụ được chọn sẽ được cấp cho người học trong gói này.</p></div>
      {services.length === 0 ? <p className="rounded-xl bg-muted p-4 leading-6 text-muted-foreground">Danh mục dịch vụ hiện chưa có mục nào.</p> : <div className="grid gap-3 md:grid-cols-2">
        {services.map(service => <label key={service.code} htmlFor={`service-${service.code}`} className="flex min-h-16 cursor-pointer items-start gap-3 rounded-2xl border border-border p-4">
          <input id={`service-${service.code}`} type="checkbox" checked={selectedCodes.has(service.code)} disabled={pending} onChange={event => toggleService(service, event.target.checked)} className="mt-1 size-5 accent-primary" />
          <span className="min-w-0"><span className="block font-semibold">{service.title}</span><span className="mt-1 block text-sm leading-6 text-muted-foreground">{service.description}</span><span className="mt-1 block break-all text-xs text-muted-foreground">{service.code}{service.quotaType ? ` · ${service.unit} / ${service.period}` : " · Không giới hạn theo lượt"}</span></span>
        </label>)}
      </div>}
    </section>

    <section className="space-y-3" aria-labelledby="product-quotas-heading">
      <div><h3 id="product-quotas-heading" className="font-semibold">Hạn mức cho dịch vụ được chọn</h3><p className="text-sm leading-6 text-muted-foreground">Chu kỳ và đơn vị do danh mục dịch vụ quyết định.</p></div>
      {content.quotaRules.length === 0 ? <p className="rounded-xl bg-muted p-4 leading-6 text-muted-foreground">Các dịch vụ đã chọn không có hạn mức theo chu kỳ.</p> : <div className="grid gap-4 md:grid-cols-2">{content.quotaRules.map(rule => <TextField key={rule.quotaType} id={`quota-${rule.quotaType}`} label={`${rule.displayName} (${rule.unit} / ${rule.period})`} type="number" min={0} step={1} value={Number.isFinite(rule.limit) ? rule.limit : ""} disabled={pending} onChange={event => updateQuota(rule.quotaType, event.target.value)} />)}</div>}
    </section>

    {invalidNumber && <p role="alert" className="leading-6 text-destructive">Nhập số nguyên không âm cho giá, thứ tự và hạn mức.</p>}
    <div className="flex flex-wrap gap-3 border-t border-border pt-5">
      <Button className="min-h-12 rounded-xl" disabled={pending || invalidNumber || !dirty} onClick={() => onSave(content)}>{pending ? "Đang lưu…" : "Lưu bản nháp"}</Button>
      <Button variant="outline" className="min-h-12 rounded-xl" disabled={pending || dirty} onClick={() => onPreview(revision)}>{pending ? "Đang xem trước…" : "Xem trước bản nháp"}</Button>
      {dirty && <p className="self-center text-sm leading-6 text-muted-foreground">Lưu thay đổi trước khi tạo bản xem trước.</p>}
    </div>
  </Card>;
}
