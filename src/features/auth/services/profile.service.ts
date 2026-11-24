import { httpService } from "@shared/services";

export interface UserProfile {
  displayName: string | null;
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
}

function profile(payload: unknown): UserProfile {
  if (!payload || typeof payload !== "object" || !("data" in payload)) throw new Error("Dữ liệu hồ sơ không hợp lệ.");
  const data = (payload as { data: unknown }).data;
  if (!data || typeof data !== "object") throw new Error("Dữ liệu hồ sơ không hợp lệ.");
  const value = data as Partial<UserProfile>;
  if ((value.displayName !== null && (typeof value.displayName !== "string" || !value.displayName.trim())) ||
      !["A1", "A2", "B1", "B2", "C1", "C2"].includes(value.cefrLevel ?? "")) {
    throw new Error("Dữ liệu hồ sơ không hợp lệ.");
  }
  return value as UserProfile;
}

export const profileService = {
  async me(signal: AbortSignal): Promise<UserProfile> {
    return profile(await httpService.get<unknown>("/api/v1/profile/me", { signal }));
  },
  async updateDisplayName(displayName: string | null): Promise<UserProfile> {
    return profile(await httpService.patch<unknown>("/api/v1/profile/me", { displayName }));
  },
};
