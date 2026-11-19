import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@shared/hooks";
import { ROUTES } from "@shared/constants";
import { ManagementButton, ManagementCard } from "./PlacementManagementUi";

export default function PlacementManagementGuard() {
  const { user, isAuthenticated, isLoading, error, refetch } = useAuth();
  const location = useLocation();
  if (isLoading || error) return <main className="mx-auto flex min-h-screen max-w-xl items-center px-5"><ManagementCard><p role="status">{error ? "Không thể xác minh phiên đăng nhập." : "Đang kiểm tra phiên đăng nhập…"}</p>{error && <ManagementButton className="mt-4" onClick={refetch}>Thử lại</ManagementButton>}</ManagementCard></main>;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  if (user?.role !== "ADMIN") return <main className="mx-auto flex min-h-screen max-w-xl items-center px-5"><ManagementCard><h1 className="text-headline-md font-semibold">Bạn không có quyền quản trị Placement</h1><p className="mt-3 text-body-md text-on-surface-variant">Chức năng này chỉ dành cho tài khoản Admin.</p><ManagementButton className="mt-4" asChild><a href="/">Về trang chủ</a></ManagementButton></ManagementCard></main>;
  return <Outlet />;
}
