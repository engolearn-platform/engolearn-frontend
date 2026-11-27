import { ManagementPageHeader } from "@shared/components/management";

export default function PassageManagementPageHeader({ onCreate }: { onCreate: () => void }) {
  return <ManagementPageHeader title="Quản lý kho passages" badge="Studio Narrative"
    description="Quản lý các bài đọc và bài nghe dùng để xây dựng lộ trình học tập."
    createLabel="Tạo passage mới" onCreate={onCreate} showExport={false} />;
}
