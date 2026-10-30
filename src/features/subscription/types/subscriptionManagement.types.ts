export type ConfigurationScope = "FREE" | "TRIAL" | "PREMIUM";
export type QuotaPeriod = "DAILY" | "WEEKLY" | "MONTHLY";
export interface ConfigurationBenefit { code: string; title: string; description: string; displayValue: string | null; sortOrder: number }
export interface ConfigurationBilling { billingPeriod: "MONTHLY" | "ANNUAL"; amount: number; currency: string }
export interface ConfigurationQuota { quotaType: string; displayName: string; unit: string; period: QuotaPeriod; limit: number; displayOrder: number }
export interface ConfigurationContent { displayName: string; description: string | null; displayOrder: number; benefits: ConfigurationBenefit[]; billingOptions: ConfigurationBilling[]; quotaRules: ConfigurationQuota[] }
export interface ConfigurationVersion { scope: ConfigurationScope; version: number; effectiveAt: string; status: "CURRENT" | "SCHEDULED" | "HISTORICAL"; content: ConfigurationContent }
export interface ConfigurationCatalog { revision: number; serverTime: string; timeZone: "Asia/Ho_Chi_Minh"; quotaTypes: { quotaType: string; unit: string; period: QuotaPeriod }[]; scopes: ConfigurationScope[] }
export interface Configuration { revision: number; serverTime: string; scope: ConfigurationScope; current: ConfigurationVersion | null; pending: ConfigurationVersion | null; activationPending: boolean }
export interface ConfigurationHistory { items: ConfigurationVersion[]; nextBeforeVersion: number | null }
export interface PublicationInput { expectedRevision: number; effect: { mode: "NEXT_LOCAL_MIDNIGHT" | "NOW" | "AT"; at: string | null }; content: ConfigurationContent }
export interface PublicationPreview { revision: number; scope: ConfigurationScope; effectiveAt: string; changedQuotaTypes: string[]; impact: "FREE_CHANGED_TYPES_AT_EFFECTIVE_TIME" | "NEW_PERIODS_ONLY"; content: ConfigurationContent }
export interface PublicationResult { publicationId: string; scope: ConfigurationScope; version: number; effectiveAt: string; acceptedAt: string; revision: number }
export interface PublicationFailure { message: string; status?: number; code?: string; fieldErrors?: { field: string; message: string }[] }
