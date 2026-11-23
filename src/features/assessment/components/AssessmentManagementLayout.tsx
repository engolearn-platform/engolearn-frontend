import ManagementLayout from "@/core/layouts/ManagementLayout";
import { useAuth } from "@shared/hooks";

export default function AssessmentManagementLayout() {
  const { user, identityGeneration } = useAuth();
  if (!user) return null;
  return <ManagementLayout key={identityGeneration + ":" + user.id} title="Đề đánh giá" brand="Quản lý nội dung"
    userName={user.email} userRole={user.role} />;
}
