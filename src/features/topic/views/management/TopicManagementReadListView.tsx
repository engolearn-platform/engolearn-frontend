import TopicManagementListView from "./TopicManagementListView";
import { HasRole } from "@features/auth/components/HasRole";
import { ForbiddenView } from "@features/auth/components/ForbiddenView";

export default function TopicManagementReadListView() {
  return <HasRole allowedRoles={["CONTENT_MANAGER", "ADMIN"]} fallback={<ForbiddenView />}><TopicManagementListView readOnly /></HasRole>;
}
