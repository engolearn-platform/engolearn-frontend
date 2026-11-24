import { ManagementPageHeader } from "@shared/components/management";

interface TopicManagementPageHeaderProps {
  onExport?: () => void;
  onCreate?: () => void;
}

export default function TopicManagementPageHeader({ onExport, onCreate }: TopicManagementPageHeaderProps) {
  return (
    <ManagementPageHeader
      title="Quản lý chủ đề"
      badge="Studio Narrative"
      description="Quản lý toàn bộ chủ đề và nội dung học tập theo tình huống giao tiếp thực tế của EngoLearn."
      exportLabel="Xuất dữ liệu"
      onExport={onExport}
      createLabel="Tạo topic mới"
      onCreate={onCreate}
    />
  );
}
