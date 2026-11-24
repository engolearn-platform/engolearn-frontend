import { httpService } from "@shared/services";
import type { ApiEnvelope } from "@features/subscription/types/subscription.types";
import type {
  ProductCatalog,
  ProductDetail,
  ProductPreview,
  ProductService,
  ProductSummary,
  ProductVersionDetail,
} from "@features/subscription/types/subscriptionProduct.types";
import type { ConfigurationContent } from "@features/subscription/types/subscriptionManagement.types";

function invalid(): never { throw new Error("Dữ liệu phản hồi sản phẩm không hợp lệ. Vui lòng tải lại."); }
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid();
  return value as Record<string, unknown>;
}
function text(value: unknown, max = 2000): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}
function nullableText(value: unknown, max = 2000): value is string | null {
  return value === null || typeof value === "string" && value.length <= max;
}
function integer(value: unknown, max = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= max;
}
function envelope<T>(value: unknown, parse: (data: Record<string, unknown>) => T): ApiEnvelope<T> {
  const result = object(value);
  if (typeof result.timestamp !== "string" || !Number.isFinite(Date.parse(result.timestamp))) invalid();
  return { timestamp: result.timestamp, data: parse(object(result.data)) };
}
function configurationContent(value: unknown, allowEmpty = false): ConfigurationContent {
  const content = object(value);
  if (!(allowEmpty ? typeof content.displayName === "string" && content.displayName.length <= 200 : text(content.displayName, 200)) ||
    !nullableText(content.description) || !integer(content.displayOrder, 10000)) invalid();
  if (!Array.isArray(content.benefits) || !Array.isArray(content.billingOptions) || !Array.isArray(content.quotaRules)) invalid();
  const seenBenefits = new Set<string>();
  for (const value of content.benefits) {
    const benefit = object(value);
    if (!text(benefit.code, 128) || seenBenefits.has(benefit.code) || !text(benefit.title, 200) || !text(benefit.description) ||
      !integer(benefit.sortOrder, 10000) || !(benefit.displayValue === null || benefit.displayValue === undefined || typeof benefit.displayValue === "string" && benefit.displayValue.length <= 200)) invalid();
    seenBenefits.add(benefit.code);
  }
  const seenBilling = new Set<string>();
  for (const value of content.billingOptions) {
    const billing = object(value);
    if (!["MONTHLY", "ANNUAL"].includes(String(billing.billingPeriod)) || seenBilling.has(String(billing.billingPeriod)) || !integer(billing.amount) ||
      typeof billing.currency !== "string" || !/^[A-Z]{3}$/.test(billing.currency)) invalid();
    try { new Intl.NumberFormat("vi-VN", { style: "currency", currency: billing.currency }); } catch { invalid(); }
    seenBilling.add(String(billing.billingPeriod));
  }
  const seenQuotaTypes = new Set<string>();
  for (const value of content.quotaRules) {
    const quota = object(value);
    if (!text(quota.quotaType, 128) || seenQuotaTypes.has(quota.quotaType) || !text(quota.displayName, 200) || !text(quota.unit, 128) ||
      !["DAILY", "WEEKLY", "MONTHLY"].includes(String(quota.period)) || !integer(quota.limit) || !integer(quota.displayOrder, 10000)) invalid();
    seenQuotaTypes.add(quota.quotaType);
  }
  return content as unknown as ConfigurationContent;
}
function summary(value: unknown): ProductSummary {
  const product = object(value);
  if (!text(product.planCode, 64) || !["VISIBLE", "HIDDEN"].includes(String(product.visibility)) ||
    !["ON_SALE", "STOPPED"].includes(String(product.saleStatus)) || typeof product.archived !== "boolean" ||
    product.hasDraft !== undefined && typeof product.hasDraft !== "boolean" ||
    !(product.currentVersion === null || integer(product.currentVersion) && product.currentVersion > 0) ||
    !(product.draftRevision === null || integer(product.draftRevision)) || !nullableText(product.displayName, 200)) invalid();
  return product as unknown as ProductSummary;
}
function service(value: unknown): ProductService {
  const item = object(value);
  if (!text(item.code, 128) || !text(item.title, 200) || !text(item.description) ||
    !(item.quotaType === null || text(item.quotaType, 128)) || !(item.unit === null || text(item.unit, 128)) ||
    !(item.period === null || ["DAILY", "WEEKLY", "MONTHLY"].includes(String(item.period)))) invalid();
  if ((item.quotaType === null) !== (item.unit === null) || (item.quotaType === null) !== (item.period === null)) invalid();
  return item as unknown as ProductService;
}
function detail(value: unknown): ProductDetail {
  const product = object(value);
  const base = summary(product);
  const current = product.current === null ? null : object(product.current);
  const draft = product.draft === null ? null : object(product.draft);
  if (current && (!integer(current.version) || current.version === 0 || current.version !== base.currentVersion)) invalid();
  if (draft && (!integer(draft.revision) || draft.revision !== base.draftRevision)) invalid();
  if (current) configurationContent(current.content);
  if (draft && draft.content !== null) configurationContent(draft.content, true);
  if (!Array.isArray(product.history)) invalid();
  let publishedVersion: ProductDetail["publishedVersion"];
  if (product.publishedVersion !== undefined) {
    if (product.publishedVersion === null) publishedVersion = null;
    else {
      const accepted = object(product.publishedVersion);
      if (!integer(accepted.version) || accepted.version === 0 || typeof accepted.effectiveAt !== "string" || !Number.isFinite(Date.parse(accepted.effectiveAt))) invalid();
      publishedVersion = { version: accepted.version, effectiveAt: accepted.effectiveAt, content: configurationContent(accepted.content) };
    }
  }
  for (const version of product.history) {
    const entry = object(version);
    if (!integer(entry.version) || entry.version === 0 || typeof entry.effectiveAt !== "string" || !Number.isFinite(Date.parse(entry.effectiveAt))) invalid();
  }
  return {
    ...base,
    current: current ? { version: current.version as number, content: configurationContent(current.content) } : null,
    draft: draft ? { revision: draft.revision as number, content: draft.content === null ? null : configurationContent(draft.content, true) } : null,
    history: product.history as ProductDetail["history"],
    ...(product.publishedVersion !== undefined ? { publishedVersion } : {}),
  };
}
function preview(value: unknown): ProductPreview {
  const data = object(value);
  if (typeof data.effectiveAt !== "string" || !Number.isFinite(Date.parse(data.effectiveAt)) ||
    data.changedQuotaTypes !== undefined && (!Array.isArray(data.changedQuotaTypes) || !data.changedQuotaTypes.every(v => text(v, 128)))) invalid();
  return {
    content: configurationContent(data.content),
    effectiveAt: data.effectiveAt,
    ...(data.changedQuotaTypes ? { changedQuotaTypes: data.changedQuotaTypes as string[] } : {}),
  };
}
const prefix = "/api/v1/subscription/admin/products";
const segment = (planCode: string) => encodeURIComponent(planCode);

export const subscriptionProductService = {
  async catalog(signal: AbortSignal) {
    return envelope<ProductCatalog>(await httpService.get<unknown>(prefix, { signal }), data => {
      if (!Array.isArray(data.items) || !Array.isArray(data.services)) invalid();
      const items = data.items.map(summary);
      const services = data.services.map(service);
      if (new Set(items.map(item => item.planCode)).size !== items.length || new Set(services.map(item => item.code)).size !== services.length) invalid();
      return { items, services };
    });
  },
  async detail(planCode: string, signal: AbortSignal) {
    return envelope<ProductDetail>(await httpService.get<unknown>(`${prefix}/${segment(planCode)}`, { signal }), data => detail(data));
  },
  async version(planCode: string, number: number, signal: AbortSignal) {
    return envelope<ProductVersionDetail>(await httpService.get<unknown>(`${prefix}/${segment(planCode)}/versions/${number}`, { signal }), data => {
      if (!integer(data.version) || data.version !== number || typeof data.effectiveAt !== "string" || !Number.isFinite(Date.parse(data.effectiveAt))) invalid();
      return { version: data.version, effectiveAt: data.effectiveAt, content: configurationContent(data.content) };
    });
  },
  async create(planCode: string, signal: AbortSignal) {
    return envelope<ProductDetail>(await httpService.post<unknown>(prefix, { planCode }, { signal }), data => detail(data));
  },
  async updateDraft(planCode: string, expectedDraftRevision: number, content: ConfigurationContent, signal: AbortSignal) {
    return envelope<ProductDetail>(await httpService.put<unknown>(`${prefix}/${segment(planCode)}/draft`, { expectedDraftRevision, content }, { signal }), data => detail(data));
  },
  async preview(planCode: string, expectedDraftRevision: number, signal: AbortSignal) {
    return envelope<ProductPreview>(await httpService.post<unknown>(`${prefix}/${segment(planCode)}/preview`, { expectedDraftRevision }, { signal }), data => preview(data));
  },
  async publish(planCode: string, expectedDraftRevision: number, key: string, signal: AbortSignal) {
    return envelope<ProductDetail>(await httpService.post<unknown>(`${prefix}/${segment(planCode)}/publish`, { expectedDraftRevision }, { signal, headers: { "Idempotency-Key": key } }), data => detail(data));
  },
  async setVisibility(planCode: string, visibility: ProductSummary["visibility"], signal: AbortSignal) {
    return envelope<ProductDetail>(await httpService.patch<unknown>(`${prefix}/${segment(planCode)}/visibility`, { visibility }, { signal }), data => detail(data));
  },
  async setSaleStatus(planCode: string, saleStatus: ProductSummary["saleStatus"], signal: AbortSignal) {
    return envelope<ProductDetail>(await httpService.patch<unknown>(`${prefix}/${segment(planCode)}/sale`, { saleStatus }, { signal }), data => detail(data));
  },
  async archive(planCode: string, signal: AbortSignal) {
    return envelope<ProductDetail>(await httpService.post<unknown>(`${prefix}/${segment(planCode)}/archive`, {}, { signal }), data => detail(data));
  },
  async deleteDraft(planCode: string, signal: AbortSignal) {
    await httpService.delete<unknown>(`${prefix}/${segment(planCode)}/draft`, { signal });
  },
};
