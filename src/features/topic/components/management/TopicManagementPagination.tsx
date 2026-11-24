import { ListPagination } from "@shared/components/management";

interface TopicManagementPaginationProps {
  total: number;
}

export default function TopicManagementPagination({ total }: TopicManagementPaginationProps) {
  return <ListPagination total={total} from={1} to={6} itemNoun="chủ đề" pageSize={6} />;
}
