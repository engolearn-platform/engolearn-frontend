import ManagementLayout from "@/core/layouts/ManagementLayout";
import { Button } from "@/core/components/shadcn/button";
import { useAuth } from "@shared/hooks";

export default function SubscriptionManagementLayout() {
  const auth = useAuth();
  if (auth.isLoading) return <main className="p-5" role="status">Đang xác định tài khoản…</main>;
  if (auth.error || !auth.user || auth.user.role !== "ADMIN") return <main className="space-y-4 p-5"><h1 className="text-headline-lg font-bold">{auth.error ? "Chưa thể xác định tài khoản" : "Cần quyền quản trị viên"}</h1><p role="alert">{auth.error ? "Vui lòng kiểm tra lại phiên đăng nhập." : "Chỉ ADMIN được truy cập quản lý gói học và hạn mức."}</p><Button onClick={auth.refetch}>Kiểm tra lại đăng nhập</Button></main>;
  return <ManagementLayout key={`${auth.identityGeneration}:${auth.user.id}`} title="Gói học & hạn mức" brand="Quản trị đăng ký" userName={auth.user.email} userRole={auth.user.role} />;
}
