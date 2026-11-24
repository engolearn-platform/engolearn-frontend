import { useAuth } from "@shared/hooks";
import ManagementLayout from "@/core/layouts/ManagementLayout";

export default function PlacementManagementLayout() {
  const { user } = useAuth();
  return <ManagementLayout title="Placement Test" userName={user?.email} userRole="Quản trị viên" />;
}
