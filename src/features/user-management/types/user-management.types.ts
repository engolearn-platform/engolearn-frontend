export type ManagedRole = "USER" | "CONTENT_MANAGER" | "ADMIN";
export type ManagedStatus = "ACTIVE" | "DISABLED";
export type AssignableRole = Exclude<ManagedRole, "ADMIN">;
export type UserSort = "createdAt,desc" | "createdAt,asc" | "name,asc" | "name,desc";

export interface ManagedUserSummary {
  id: string;
  name: string | null;
  email: string;
  role: ManagedRole;
  status: ManagedStatus;
  createdAt: string | null;
}

export interface ManagedUser extends ManagedUserSummary { revision: number }
export interface UserManagementPage { items: ManagedUserSummary[]; page: number; size: number; totalElements: number; totalPages: number }
export interface UserListQuery { search: string; role: string; status: string; sort: UserSort; page: number; size: number }
export interface CreateManagedUser { name: string; email: string; initialPassword: string; role?: AssignableRole }
export interface EditManagedUser { name: string; expectedName: string | null; expectedRevision: number }
export interface ApiEnvelope<T> { data: T }
