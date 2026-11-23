import ManagementLayout from "@/core/layouts/ManagementLayout";
import { useAuth } from "@shared/hooks";

export default function GrammarAdminGuard() {
  const { user } = useAuth();
  return <ManagementLayout title="Quản lý Ngữ pháp" userName={user?.email}
    userRole={user?.role === "ADMIN" ? "Quản trị viên" : "Quản lý nội dung"} />;
}
