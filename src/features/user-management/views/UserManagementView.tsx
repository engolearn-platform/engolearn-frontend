import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { RefreshCw, Search, UserRound, X } from "lucide-react";
import { useAuth } from "@shared/hooks";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { ManagementPageHeader } from "@shared/components/management/ManagementPageHeader";
import { userManagementService } from "@features/user-management/services/user-management.service";
import type { AssignableRole, ManagedStatus, ManagedUser, ManagedUserSummary, UserListQuery, UserManagementPage, UserSort } from "@features/user-management/types/user-management.types";

type ApiFailure = Error & { code?: string; status?: number; fieldErrors?: { field: string; message: string }[] };
type Confirmation = { kind: "status"; status: ManagedStatus } | { kind: "role"; role: AssignableRole } | { kind: "delete" };
const queryDefaults: UserListQuery = { search: "", role: "ALL", status: "ALL", sort: "createdAt,desc", page: 0, size: 25 };
const sorts: UserSort[] = ["createdAt,desc", "createdAt,asc", "name,asc", "name,desc"];

function readQuery(params: URLSearchParams): UserListQuery {
  const rawPage = Number(params.get("page"));
  const rawSize = Number(params.get("size"));
  const sort = params.get("sort") as UserSort | null;
  const role = params.get("role") ?? "ALL";
  const status = params.get("status") ?? "ALL";
  return {
    search: (params.get("search") ?? "").slice(0, 100),
    role: ["ALL", "USER", "CONTENT_MANAGER", "ADMIN"].includes(role) ? role : "ALL",
    status: ["ALL", "ACTIVE", "DISABLED"].includes(status) ? status : "ALL",
    sort: sort && sorts.includes(sort) ? sort : queryDefaults.sort,
    page: Number.isInteger(rawPage) && rawPage >= 0 && rawPage <= 100000 ? rawPage : 0,
    size: Number.isInteger(rawSize) && rawSize >= 1 && rawSize <= 100 ? rawSize : queryDefaults.size,
  };
}

function problemMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Đã xảy ra lỗi. Vui lòng thử lại.";
  const code = (error as ApiFailure).code;
  if (code === "USER_STATE_CONFLICT") return "Tài khoản đã thay đổi. Thông tin mới đã được tải; hãy xem lại trước khi quyết định.";
  if (code === "ADMIN_TARGET_READ_ONLY") return "Tài khoản quản trị viên chỉ xem được.";
  if (code === "USER_NOT_FOUND") return "Không tìm thấy tài khoản này. Danh sách đã được làm mới.";
  if (code === "EMAIL_ALREADY_EXISTS") return "Email này đã được sử dụng.";
  if (code === "VALIDATION_ERROR") return "Vui lòng kiểm tra lại thông tin đã nhập.";
  if (code === "AUTHENTICATION_REQUIRED" || code === "ACCESS_DENIED") return "Phiên quản trị không còn quyền truy cập. Vui lòng đăng nhập lại.";
  return "Không thể hoàn thành yêu cầu. Vui lòng thử lại.";
}

function roleLabel(role: string) {
  return role === "CONTENT_MANAGER" ? "Quản lý nội dung" : role === "ADMIN" ? "Quản trị viên" : "Người học";
}

function statusLabel(status: ManagedStatus) { return status === "ACTIVE" ? "Đang hoạt động" : "Đã vô hiệu hóa"; }
function displayName(name: string | null) { return name?.trim() || "Chưa có tên"; }
function isVisibleForFocus(element: HTMLElement) {
  let current: HTMLElement | null = element;
  while (current) {
    const style = window.getComputedStyle(current);
    if (style.display === "none" || style.visibility === "hidden") return false;
    current = current.parentElement;
  }
  return true;
}

function Field({ label, value, onChange, type = "text", required = false, maxLength, error, autoComplete }: {
  label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; maxLength?: number; error?: string; autoComplete?: string;
}) {
  const id = label.toLocaleLowerCase("vi").replace(/[^a-z0-9]+/g, "-");
  return (
    <div className="flex flex-col gap-1.5 text-label-lg font-medium text-on-surface">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        required={required}
        maxLength={maxLength}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="min-h-12 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-body-md font-normal focus-visible:outline-2 focus-visible:outline-primary"
      />
      {error && (
        <span id={`${id}-error`} role="alert" className="text-label-md font-normal text-error">
          {error}
        </span>
      )}
    </div>
  );
}

export default function UserManagementView() {
  const [params, setParams] = useSearchParams();
  const listParamsKey = ["search", "role", "status", "sort", "page", "size"]
    .map(key => `${key}=${encodeURIComponent(params.get(key) ?? "")}`).join("&");
  const query = useMemo(() => readQuery(new URLSearchParams(listParamsKey)), [listParamsKey]);
  const { refetch } = useAuth();
  const [pageData, setPageData] = useState<UserManagementPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [searchDraft, setSearchDraft] = useState(query.search);
  const [detail, setDetail] = useState<ManagedUser | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState<AssignableRole>("USER");
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [editName, setEditName] = useState("");
  const [editNameError, setEditNameError] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");
  const [emailError, setEmailError] = useState("");
  const listController = useRef<AbortController | null>(null);
  const listHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const detailHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const detailOpenerRef = useRef<HTMLElement | null>(null);
  const detailOpenerIdRef = useRef<string | null>(null);
  const createOpenerRef = useRef<HTMLElement | null>(null);
  const confirmationOpenerRef = useRef<HTMLElement | null>(null);

  const restoreFocus = (
    event: Event,
    openerRef: { current: HTMLElement | null },
    fallbackRef: { current: HTMLElement | null } = listHeadingRef,
    accountIdRef?: { current: string | null },
  ) => {
    event.preventDefault();
    const opener = openerRef.current;
    const accountId = accountIdRef?.current;
    openerRef.current = null;
    if (accountIdRef) accountIdRef.current = null;
    requestAnimationFrame(() => {
      const replacement = accountId
        ? [...document.querySelectorAll<HTMLElement>("[data-user-detail-trigger]")]
          .find(element => element.dataset.userDetailTrigger === accountId && isVisibleForFocus(element))
        : null;
      const target = opener?.isConnected && isVisibleForFocus(opener) ? opener : replacement;
      if (target?.isConnected) {
        target.focus();
        if (document.activeElement === target) return;
      }
      fallbackRef.current?.focus();
    });
  };

  const updateQuery = useCallback((changes: Partial<UserListQuery>, extras?: Record<string, string | null>) => {
    setParams(current => {
      const next = new URLSearchParams(current);
      for (const [key, value] of Object.entries(changes)) {
        if (value === "" || value === "ALL" || value === queryDefaults[key as keyof UserListQuery]) next.delete(key);
        else next.set(key, String(value));
      }
      for (const [key, value] of Object.entries(extras ?? {})) {
        if (value === null) next.delete(key);
        else next.set(key, value);
      }
      return next;
    });
  }, [setParams]);
  const updateQueryRef = useRef(updateQuery);
  updateQueryRef.current = updateQuery;

  useEffect(() => { setSearchDraft(query.search); }, [query.search]);
  const loadList = useCallback(async (requestedQuery: UserListQuery = query) => {
    listController.current?.abort();
    const controller = new AbortController();
    listController.current = controller;
    setLoading(true); setListError("");
    try {
      const result = await userManagementService.list(requestedQuery, controller.signal);
      if (controller.signal.aborted) return;
      setPageData(result);
      if (result.totalPages === 0 && requestedQuery.page !== 0) updateQueryRef.current({ page: 0 });
      else if (result.totalPages > 0 && requestedQuery.page >= result.totalPages) updateQueryRef.current({ page: result.totalPages - 1 });
    } catch (error) {
      if (controller.signal.aborted) return;
      if (["AUTHENTICATION_REQUIRED", "ACCESS_DENIED"].includes((error as ApiFailure).code ?? "")) { setPageData(null); void refetch(); }
      setListError(problemMessage(error));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [query, refetch]);

  useEffect(() => {
    void loadList(query);
    return () => listController.current?.abort();
  }, [loadList, query]);

  const detailId = params.get("detail");
  useEffect(() => {
    if (!detailId) { setDetail(null); setDetailError(""); return; }
    const controller = new AbortController();
    setDetailLoading(true); setDetailError("");
    void userManagementService.detail(detailId, controller.signal).then(user => {
      if (controller.signal.aborted) return;
      setDetail(user); setEditName(user.name ?? ""); setEditNameError("");
    }).catch(error => {
      if (controller.signal.aborted) return;
      setDetail(null); setDetailError(problemMessage(error));
      if (["USER_NOT_FOUND", "AUTHENTICATION_REQUIRED", "ACCESS_DENIED"].includes((error as ApiFailure).code ?? "")) {
        detailOpenerRef.current = null;
        detailOpenerIdRef.current = null;
        updateQuery({}, { detail: null });
        if ((error as ApiFailure).code === "USER_NOT_FOUND") void loadList();
        if ((error as ApiFailure).code !== "USER_NOT_FOUND") void refetch();
      }
    }).finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [detailId, loadList, refetch, updateQuery]);

  const isAdminTarget = detail?.role === "ADMIN";
  const closeDetail = () => updateQuery({}, { detail: null });
  const clearForm = () => { setName(""); setEmail(""); setPassword(""); setNewRole("USER"); setFormError(""); setEmailError(""); setNameError(""); setPasswordError(""); };
  const refreshDetail = async (): Promise<boolean> => {
    if (!detailId) return false;
    setDetailLoading(true);
    try {
      const fresh = await userManagementService.detail(detailId);
      setDetail(fresh); setEditName(fresh.name ?? ""); setEditNameError(""); setFormError(""); setDetailError("");
      return true;
    } catch (refreshError) {
      setDetailError(problemMessage(refreshError));
      if ((refreshError as ApiFailure).code === "USER_NOT_FOUND") {
        detailOpenerRef.current = null;
        detailOpenerIdRef.current = null;
        updateQuery({}, { detail: null });
      }
      return false;
    } finally { setDetailLoading(false); }
  };
  const openDetail = (user: ManagedUserSummary, opener: HTMLElement) => {
    detailOpenerRef.current = opener;
    detailOpenerIdRef.current = user.id;
    updateQuery({}, { detail: user.id });
  };
  const openCreate = () => {
    createOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    clearForm();
    setCreateOpen(true);
  };
  const openConfirmation = (next: Confirmation, opener: HTMLElement) => {
    confirmationOpenerRef.current = opener;
    setConfirmation(next);
  };
  const submitCreate = async (event: FormEvent) => {
    event.preventDefault(); setFormError(""); setEmailError(""); setNameError(""); setPasswordError("");
    const normalizedName = name.trim();
    const passwordBytes = new TextEncoder().encode(password).length;
    if (!normalizedName || normalizedName.length > 80) { setNameError("Tên phải có từ 1 đến 80 ký tự."); return; }
    if (password.length < 8 || passwordBytes > 72) { setPasswordError("Mật khẩu cần ít nhất 8 ký tự và tối đa 72 byte UTF-8."); return; }
    setPending(true);
    const secret = password;
    setPassword("");
    try {
      const created = await userManagementService.create({ name: normalizedName, email: email.trim(), initialPassword: secret, ...(newRole !== "USER" ? { role: newRole } : {}) });
      clearForm();
      createOpenerRef.current = null;
      setCreateOpen(false);
      updateQuery({}, { detail: created.id });
    } catch (error) {
      const failure = error as ApiFailure;
      if (failure.code === "EMAIL_ALREADY_EXISTS") setEmailError("Email này đã được sử dụng.");
      else if (failure.fieldErrors) {
        for (const item of failure.fieldErrors) if (item.field.toLowerCase().includes("email")) setEmailError(item.message);
        setFormError(problemMessage(error));
      } else setFormError(problemMessage(error));
      if (["AUTHENTICATION_REQUIRED", "ACCESS_DENIED"].includes(failure.code ?? "")) {
        createOpenerRef.current = null;
        setCreateOpen(false);
        clearForm();
        void refetch();
      }
    } finally { setPending(false); }
  };

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault(); if (!detail || isAdminTarget) return;
    setFormError("");
    setEditNameError("");
    const updatedName = editName.trim();
    if (!updatedName || updatedName.length > 80) {
      setEditNameError("Tên phải có từ 1 đến 80 ký tự.");
      return;
    }
    setPending(true);
    try { setDetail(await userManagementService.update(detail.id, { name: updatedName, expectedName: detail.name, expectedRevision: detail.revision })); await loadList(); }
    catch (error) { await handleMutationError(error); }
    finally { setPending(false); }
  };

  const handleMutationError = async (error: unknown) => {
    const failure = error as ApiFailure;
    setFormError(problemMessage(error));
    if (failure.code === "USER_STATE_CONFLICT" || failure.code === "ADMIN_TARGET_READ_ONLY") {
      setConfirmation(null);
      const reloaded = await refreshDetail();
      if (reloaded) setFormError(problemMessage(error));
    } else if (failure.code === "USER_NOT_FOUND") {
      confirmationOpenerRef.current = null;
      detailOpenerRef.current = null;
      detailOpenerIdRef.current = null;
      setConfirmation(null);
      updateQuery({}, { detail: null });
      await loadList();
    } else if (["AUTHENTICATION_REQUIRED", "ACCESS_DENIED"].includes(failure.code ?? "")) {
      confirmationOpenerRef.current = null;
      detailOpenerRef.current = null;
      detailOpenerIdRef.current = null;
      setConfirmation(null);
      setDetail(null);
      updateQuery({}, { detail: null });
      void refetch();
    }
  };

  const applyConfirmation = async () => {
    if (!detail || !confirmation || isAdminTarget) return;
    setPending(true); setFormError("");
    try {
      if (confirmation.kind === "status") { setDetail(await userManagementService.setStatus(detail.id, confirmation.status, detail.revision)); await loadList(); }
      else if (confirmation.kind === "role") { setDetail(await userManagementService.setRole(detail.id, confirmation.role, detail.revision)); await loadList(); }
      else {
        await userManagementService.delete(detail.id, detail.revision);
        detailOpenerRef.current = null;
        detailOpenerIdRef.current = null;
        setConfirmation(null);
        updateQuery({}, { detail: null });
        await loadList();
        return;
      }
      setConfirmation(null);
    } catch (error) { await handleMutationError(error); }
    finally { setPending(false); }
  };

  const totalPages = Math.max(1, pageData?.totalPages ?? 1);
  const from = pageData && pageData.totalElements ? query.page * query.size + 1 : 0;
  const to = pageData ? Math.min((query.page + 1) * query.size, pageData.totalElements) : 0;
  const confirmationTarget = detail
    ? `${displayName(detail.name)} (${detail.email}), ${roleLabel(detail.role)}, ${statusLabel(detail.status)}`
    : "";
  const confirmationCopy = confirmation?.kind === "delete"
    ? `Xóa mềm tài khoản ${confirmationTarget}? Thao tác này không thể hoàn tác. Tài khoản sẽ không thể đăng nhập; dữ liệu liên kết được giữ và email vẫn bị giữ chỗ, không thể dùng cho tài khoản khác.`
    : confirmation?.kind === "role"
      ? `Đổi vai trò của ${confirmationTarget} thành ${roleLabel(confirmation.role)}? Quyền mới áp dụng ở lần xác thực tiếp theo.`
      : confirmation
        ? `${confirmation.status === "DISABLED" ? "Vô hiệu hóa" : "Kích hoạt lại"} tài khoản ${confirmationTarget}? ${confirmation.status === "DISABLED" ? "Các phiên đăng nhập hiện tại sẽ bị thu hồi." : "Người dùng cần đăng nhập lại."}`
        : "";

  return <div className="mx-auto w-full max-w-7xl px-5 pb-8">
    <ManagementPageHeader
      title="Quản lý người dùng"
      description="Xem và quản lý tài khoản người dùng trong hệ thống."
      showExport={false}
      createLabel="Tạo tài khoản"
      onCreate={openCreate}
    />
    <section aria-label="Bộ lọc tài khoản" className="mb-5 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 sm:p-5">
      <form onSubmit={event => { event.preventDefault(); updateQuery({ search: searchDraft.trim(), page: 0 }); }} className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(14rem,1.5fr)_1fr_1fr_1.2fr_auto]">
        <label className="flex flex-col gap-1 text-label-md font-medium text-on-surface">Tìm theo tên hoặc email
          <span className="relative"><Search aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-on-surface-variant" /><input value={searchDraft} maxLength={100} onChange={event => setSearchDraft(event.target.value)} placeholder="Nhập tên hoặc email" className="min-h-12 w-full rounded-xl border border-outline-variant bg-surface px-10 text-body-md focus-visible:outline-2 focus-visible:outline-primary" /></span>
        </label>
        <label className="flex flex-col gap-1 text-label-md font-medium">Vai trò<select value={query.role} onChange={event => updateQuery({ role: event.target.value, page: 0 })} className="min-h-12 rounded-xl border border-outline-variant bg-surface px-3 text-body-md"><option value="ALL">Tất cả vai trò</option><option value="USER">Người học</option><option value="CONTENT_MANAGER">Quản lý nội dung</option><option value="ADMIN">Quản trị viên</option></select></label>
        <label className="flex flex-col gap-1 text-label-md font-medium">Trạng thái<select value={query.status} onChange={event => updateQuery({ status: event.target.value, page: 0 })} className="min-h-12 rounded-xl border border-outline-variant bg-surface px-3 text-body-md"><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="DISABLED">Đã vô hiệu hóa</option></select></label>
        <label className="flex flex-col gap-1 text-label-md font-medium">Sắp xếp<select value={query.sort} onChange={event => updateQuery({ sort: event.target.value as UserSort, page: 0 })} className="min-h-12 rounded-xl border border-outline-variant bg-surface px-3 text-body-md"><option value="createdAt,desc">Mới tạo trước</option><option value="createdAt,asc">Cũ tạo trước</option><option value="name,asc">Tên A–Z</option><option value="name,desc">Tên Z–A</option></select></label>
        <Button type="submit" className="min-h-12 self-end rounded-xl px-5"><Search aria-hidden="true" className="size-4" />Tìm kiếm</Button>
      </form>
    </section>

    <section aria-label="Danh sách người dùng" className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
        <div>
          <h2 ref={listHeadingRef} tabIndex={-1} className="text-headline-md font-semibold">
            Danh sách tài khoản
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            {pageData?.totalElements ?? 0} tài khoản
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-12 rounded-xl"
          onClick={() => void loadList()}
          aria-label="Tải lại danh sách"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">Tải lại</span>
        </Button>
      </div>
      {loading ? <p role="status" className="p-8 text-center text-body-md text-on-surface-variant">Đang tải danh sách tài khoản…</p>
        : listError ? <div className="flex flex-col items-center gap-3 p-8 text-center"><p role="alert" className="text-body-md text-error">{listError}</p><Button type="button" variant="outline" onClick={() => void loadList()}>Thử lại</Button></div>
        : !pageData?.items.length ? <div className="p-10 text-center"><UserRound className="mx-auto mb-3 size-8 text-on-surface-variant" aria-hidden="true" /><h3 className="text-headline-md font-semibold">{query.search || query.role !== "ALL" || query.status !== "ALL" ? "Không tìm thấy tài khoản phù hợp" : "Chưa có tài khoản nào"}</h3><p className="mt-1 text-body-md text-on-surface-variant">Thử đổi bộ lọc hoặc tạo tài khoản mới.</p></div>
        : <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-label-md text-on-surface-variant">
                <tr>
                  <th scope="col" className="px-5 py-3">Người dùng</th>
                  <th scope="col" className="px-5 py-3">Vai trò</th>
                  <th scope="col" className="px-5 py-3">Trạng thái</th>
                  <th scope="col" className="px-5 py-3">Ngày tạo</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {pageData.items.map(user => (
                  <tr key={user.id} className="hover:bg-learning-nav-active">
                    <td className="px-5 py-4">
                      <span className="block font-semibold text-on-surface">{displayName(user.name)}</span>
                      <span className="text-body-sm text-on-surface-variant">{user.email}</span>
                    </td>
                    <td className="px-5 py-4">{roleLabel(user.role)}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-learning-mint px-3 py-1 text-label-sm text-primary">
                        {statusLabel(user.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-body-sm">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "Không rõ"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11 rounded-lg"
                        data-user-detail-trigger={user.id}
                        onClick={event => openDetail(user, event.currentTarget)}
                      >
                        Chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-outline-variant md:hidden">
            {pageData.items.map(user => (
              <li key={user.id} className="p-4">
                <button
                  type="button"
                  data-user-detail-trigger={user.id}
                  onClick={event => openDetail(user, event.currentTarget)}
                  className="flex min-h-12 w-full items-start justify-between gap-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{displayName(user.name)}</span>
                    <span className="block truncate text-body-sm text-on-surface-variant">{user.email}</span>
                    <span className="mt-1 block text-label-sm">
                      {roleLabel(user.role)} · {statusLabel(user.status)}
                    </span>
                    <span className="mt-1 block text-label-sm text-on-surface-variant">
                      Ngày tạo: {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "Không rõ"}
                    </span>
                  </span>
                  <span className="shrink-0 text-label-md text-primary">Chi tiết</span>
                </button>
              </li>
            ))}
          </ul>
        </>}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-outline-variant bg-surface-container-low/40 p-4 sm:flex-row"><p className="text-body-sm text-on-surface-variant">Hiển thị {from}–{to} trong {pageData?.totalElements ?? 0} tài khoản</p><div className="flex items-center gap-2"><label className="sr-only" htmlFor="user-page-size">Số dòng mỗi trang</label><select id="user-page-size" value={query.size} onChange={event => updateQuery({ size: Number(event.target.value), page: 0 })} className="min-h-11 rounded-lg border border-outline-variant bg-surface px-2 text-body-sm"><option value={10}>10 / trang</option><option value={25}>25 / trang</option><option value={50}>50 / trang</option><option value={100}>100 / trang</option></select><Button type="button" variant="outline" className="min-h-11 rounded-lg" disabled={query.page <= 0} onClick={() => updateQuery({ page: query.page - 1 })}>Trước</Button><span aria-live="polite" className="px-2 text-label-md">Trang {query.page + 1} / {totalPages}</span><Button type="button" variant="outline" className="min-h-11 rounded-lg" disabled={query.page + 1 >= totalPages} onClick={() => updateQuery({ page: query.page + 1 })}>Sau</Button></div></div>
    </section>

    <Dialog
      open={createOpen}
      onOpenChange={open => {
        if (!open && !pending) {
          setCreateOpen(false);
          clearForm();
        }
      }}
    >
      <DialogContent
        className="max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container-lowest sm:max-w-xl"
        onCloseAutoFocus={event => restoreFocus(event, createOpenerRef)}
      >
        <DialogHeader>
          <DialogTitle className="text-headline-md">Tạo tài khoản</DialogTitle>
          <DialogDescription>
            Thông tin đăng nhập ban đầu sẽ không được hiển thị lại sau khi tạo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submitCreate} className="space-y-4">
          <Field
            label="Họ và tên"
            value={name}
            onChange={value => { setName(value); setNameError(""); }}
            required
            maxLength={80}
            autoComplete="name"
            error={nameError}
          />
          <Field
            label="Email"
            value={email}
            onChange={value => { setEmail(value); setEmailError(""); }}
            type="email"
            required
            autoComplete="email"
            error={emailError}
          />
          <Field
            label="Mật khẩu ban đầu"
            value={password}
            onChange={value => { setPassword(value); setPasswordError(""); }}
            type="password"
            required
            autoComplete="new-password"
            error={passwordError}
          />
          <label className="flex flex-col gap-1.5 text-label-lg font-medium">
            Vai trò
            <select
              value={newRole}
              onChange={event => setNewRole(event.target.value as AssignableRole)}
              className="min-h-12 rounded-xl border border-outline-variant bg-surface px-3"
            >
              <option value="USER">Người học</option>
              <option value="CONTENT_MANAGER">Quản lý nội dung</option>
            </select>
          </label>
          {formError && <p role="alert" className="text-body-sm text-error">{formError}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-12 rounded-xl"
              disabled={pending}
              onClick={() => { setCreateOpen(false); clearForm(); }}
            >
              Hủy
            </Button>
            <Button type="submit" className="min-h-12 rounded-xl" disabled={pending}>
              {pending ? "Đang tạo…" : "Tạo tài khoản"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog open={Boolean(detailId)} onOpenChange={open => { if (!open && !pending) closeDetail(); }}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container-lowest sm:max-w-2xl"
        onCloseAutoFocus={event => restoreFocus(event, detailOpenerRef, listHeadingRef, detailOpenerIdRef)}
      >
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle ref={detailHeadingRef} tabIndex={-1} className="text-headline-md">
                Chi tiết tài khoản
              </DialogTitle>
              <DialogDescription>Thông tin và quyền truy cập tài khoản.</DialogDescription>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="-mt-2 min-h-12 min-w-12"
              aria-label="Đóng chi tiết"
              onClick={closeDetail}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        </DialogHeader>
        {detailLoading ? (
          <p role="status" className="py-8 text-center">Đang tải thông tin…</p>
        ) : detailError ? (
          <div className="py-5">
            <p role="alert" className="text-error">{detailError}</p>
            <div className="mt-4 flex gap-2">
              <Button type="button" variant="outline" className="min-h-12" onClick={() => void refreshDetail()}>
                Thử lại
              </Button>
              <Button type="button" variant="outline" className="min-h-12" onClick={closeDetail}>
                Về danh sách
              </Button>
            </div>
          </div>
        ) : detail && (
          <div className="space-y-5">
          <dl className="grid gap-4 rounded-xl bg-surface-container-low p-4 sm:grid-cols-2">
            <div>
              <dt className="text-label-sm text-on-surface-variant">Họ và tên</dt>
              <dd className="font-semibold">{displayName(detail.name)}</dd>
            </div>
            <div>
              <dt className="text-label-sm text-on-surface-variant">Email</dt>
              <dd className="break-all">{detail.email}</dd>
            </div>
            <div>
              <dt className="text-label-sm text-on-surface-variant">Vai trò</dt>
              <dd>{roleLabel(detail.role)}</dd>
            </div>
            <div>
              <dt className="text-label-sm text-on-surface-variant">Trạng thái</dt>
              <dd>{statusLabel(detail.status)}</dd>
            </div>
            <div>
              <dt className="text-label-sm text-on-surface-variant">Ngày tạo</dt>
              <dd>{detail.createdAt ? new Date(detail.createdAt).toLocaleString("vi-VN") : "Không rõ"}</dd>
            </div>
          </dl>
          {isAdminTarget ? (
            <p className="rounded-xl border border-outline-variant p-4 text-body-sm text-on-surface-variant">
              Tài khoản quản trị viên ở chế độ chỉ xem.
            </p>
          ) : <>
            <form onSubmit={submitEdit} className="space-y-3">
              <h3 className="font-semibold">Cập nhật tên</h3>
              <Field
                label="Họ và tên"
                value={editName}
                onChange={value => { setEditName(value); setEditNameError(""); setFormError(""); }}
                required
                maxLength={80}
                error={editNameError || undefined}
              />
              <Button
                type="submit"
                className="min-h-12 rounded-xl"
                disabled={pending || editName.trim() === (detail.name ?? "")}
              >
                {pending ? "Đang lưu…" : "Lưu tên"}
              </Button>
            </form>
            <div className="grid gap-3 border-t border-outline-variant pt-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 font-semibold">Trạng thái</p>
                <p className="mb-3 text-body-sm text-on-surface-variant">{statusLabel(detail.status)}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-12 w-full rounded-xl"
                  disabled={pending}
                  onClick={event => openConfirmation({
                    kind: "status",
                    status: detail.status === "ACTIVE" ? "DISABLED" : "ACTIVE",
                  }, event.currentTarget)}
                >
                  {detail.status === "ACTIVE" ? "Vô hiệu hóa" : "Kích hoạt lại"}
                </Button>
              </div>
              <div>
                <p className="mb-2 font-semibold">Vai trò</p>
                <p className="mb-3 text-body-sm text-on-surface-variant">{roleLabel(detail.role)}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-12 w-full rounded-xl"
                  disabled={pending}
                  onClick={event => openConfirmation({
                    kind: "role",
                    role: detail.role === "USER" ? "CONTENT_MANAGER" : "USER",
                  }, event.currentTarget)}
                >
                  Đổi thành {detail.role === "USER" ? "Quản lý nội dung" : "Người học"}
                </Button>
              </div>
            </div>
            <div className="border-t border-outline-variant pt-4">
              <Button
                type="button"
                variant="destructive"
                className="min-h-12 rounded-xl"
                disabled={pending}
                onClick={event => openConfirmation({ kind: "delete" }, event.currentTarget)}
              >
                Xóa mềm tài khoản
              </Button>
            </div>
          </>}
            {formError && !isAdminTarget && (
              <p role="alert" className="text-body-sm text-error">{formError}</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>

    <Dialog
      open={Boolean(confirmation)}
      onOpenChange={open => {
        if (!open && !pending) setConfirmation(null);
      }}
    >
      <DialogContent
        className="rounded-2xl bg-surface-container-lowest"
        onCloseAutoFocus={event => restoreFocus(event, confirmationOpenerRef, detailHeadingRef)}
      >
        <DialogHeader>
          <DialogTitle className="text-headline-md">Xác nhận thay đổi</DialogTitle>
          <DialogDescription>{confirmationCopy}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-12 rounded-xl"
            disabled={pending}
            onClick={() => setConfirmation(null)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant={confirmation?.kind === "delete" ? "destructive" : "default"}
            className="min-h-12 rounded-xl"
            disabled={pending}
            onClick={() => void applyConfirmation()}
          >
            {pending ? "Đang xử lý…" : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
