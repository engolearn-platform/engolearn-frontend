import type { ConfigurationContent } from "@features/subscription/types/subscriptionManagement.types";

export type ProductVisibility = "VISIBLE" | "HIDDEN";
export type ProductSaleStatus = "ON_SALE" | "STOPPED";

export interface ProductSummary {
  planCode: string;
  visibility: ProductVisibility;
  saleStatus: ProductSaleStatus;
  archived: boolean;
  hasDraft?: boolean;
  currentVersion: number | null;
  draftRevision: number | null;
  displayName: string | null;
}

export interface ProductService {
  code: string;
  title: string;
  description: string;
  quotaType: string | null;
  unit: string | null;
  period: "DAILY" | "WEEKLY" | "MONTHLY" | null;
}

export interface ProductVersion {
  version: number;
  content: ConfigurationContent;
}

export interface ProductVersionDetail extends ProductVersion {
  effectiveAt: string;
}

export interface ProductDraft {
  revision: number;
  content: ConfigurationContent | null;
}

export interface ProductHistorySummary {
  version: number;
  effectiveAt: string;
}

export interface ProductDetail extends ProductSummary {
  current: ProductVersion | null;
  draft: ProductDraft | null;
  history: ProductHistorySummary[];
  /** Immutable version accepted by the last successful or idempotently replayed publish. */
  publishedVersion?: ProductVersionDetail | null;
}

export interface ProductCatalog {
  items: ProductSummary[];
  services: ProductService[];
}

export interface ProductPreview {
  content: ConfigurationContent;
  effectiveAt: string;
  changedQuotaTypes?: string[];
}
