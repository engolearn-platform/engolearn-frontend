import { Button } from "@/core/components/shadcn/button";
import ManagementLayout from "@/core/layouts/ManagementLayout";
import { ROUTES } from "@shared/constants";
import { useAuth } from "@shared/hooks";
import { Link, Navigate, useLocation } from "react-router";

export default function GrammarAdminGuard() {
  const { user, isLoading, error, refetch } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return <main className="mx-auto max-w-lg p-6" role="status">Đang kiểm tra phiên đăng nhập…</main>;
  }
  if (error) {
    return <main className="mx-auto max-w-lg space-y-4 p-6">
      <p role="alert">Không thể xác minh phiên đăng nhập.</p>
      <Button variant="outline" onClick={refetch}>Thử lại</Button>
    </main>;
  }
  if (!user) return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  if (user.role !== "CONTENT_MANAGER" && user.role !== "ADMIN") {
    return <main className="mx-auto max-w-lg space-y-4 p-6">
      <h1 className="text-headline-sm font-semibold">Bạn không có quyền quản lý ngữ pháp</h1>
      <Button variant="outline" asChild><Link to={ROUTES.HOME}>Về trang chủ</Link></Button>
    </main>;
  }
  return <ManagementLayout
    title="Quản lý Ngữ pháp"
    userName={user.email}
    userRole={user.role === "ADMIN" ? "Quản trị viên" : "Quản lý nội dung"}
  />;
}
