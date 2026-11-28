import { httpService } from "@shared/services/http.service";
import type { ApiEnvelope, CreateManagedUser, EditManagedUser, ManagedUser, UserListQuery, UserManagementPage, ManagedStatus, AssignableRole } from "@features/user-management/types/user-management.types";

const endpoint = "/api/v1/admin/users";
const itemUrl = (id: string) => `${endpoint}/${encodeURIComponent(id)}`;
const writeOptions = { skipAuthRefresh: true } as const;

export const userManagementService = {
  async list(query: UserListQuery, signal?: AbortSignal): Promise<UserManagementPage> {
    const params: Record<string, string> = {
      page: String(query.page), size: String(query.size), sort: query.sort,
    };
    if (query.search.trim()) params.search = query.search.trim();
    if (query.role !== "ALL") params.role = query.role;
    if (query.status !== "ALL") params.status = query.status;
    return (await httpService.get<ApiEnvelope<UserManagementPage>>(endpoint, { params, signal })).data;
  },
  async detail(id: string, signal?: AbortSignal): Promise<ManagedUser> {
    return (await httpService.get<ApiEnvelope<ManagedUser>>(itemUrl(id), { signal })).data;
  },
  async create(input: CreateManagedUser): Promise<ManagedUser> {
    return (await httpService.post<ApiEnvelope<ManagedUser>>(endpoint, input, writeOptions)).data;
  },
  async update(id: string, input: EditManagedUser): Promise<ManagedUser> {
    return (await httpService.patch<ApiEnvelope<ManagedUser>>(itemUrl(id), input, writeOptions)).data;
  },
  async setStatus(id: string, status: ManagedStatus, expectedRevision: number): Promise<ManagedUser> {
    return (await httpService.patch<ApiEnvelope<ManagedUser>>(`${itemUrl(id)}/status`, { status, expectedRevision }, writeOptions)).data;
  },
  async setRole(id: string, role: AssignableRole, expectedRevision: number): Promise<ManagedUser> {
    return (await httpService.patch<ApiEnvelope<ManagedUser>>(`${itemUrl(id)}/role`, { role, expectedRevision }, writeOptions)).data;
  },
  async delete(id: string, expectedRevision: number): Promise<void> {
    await httpService.delete(`${itemUrl(id)}?expectedRevision=${expectedRevision}`, writeOptions);
  },
};
