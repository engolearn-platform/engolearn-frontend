import ManagementLayout from "@/core/layouts/ManagementLayout";
import { Button } from "@/core/components/shadcn/button";
import { useAuth } from "@shared/hooks";

export default function AssessmentManagementLayout() {
  const auth = useAuth();
  if (auth.isLoading) return <main className="p-5" role="status">Đang xác định tài khoản…</main>;
  if (auth.error || !auth.user || !["ADMIN", "CONTENT_MANAGER"].includes(auth.user.role))
    return <main className="space-y-3 p-5"><h1 className="text-xl font-bold">Quản lý đề đánh giá</h1>
      <p role="alert">{auth.error ? "Chưa thể xác minh phiên đăng nhập." : "Cần quyền quản trị viên hoặc quản lý nội dung."}</p>
      <Button onClick={auth.refetch}>Kiểm tra lại tài khoản</Button></main>;
  return <ManagementLayout key={auth.identityGeneration + ":" + auth.user.id} title="Đề đánh giá" brand="Quản lý nội dung"
    userName={auth.user.email} userRole={auth.user.role} />;
}
