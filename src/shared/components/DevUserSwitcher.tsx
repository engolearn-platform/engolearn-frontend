import type * as React from "react";
import { useCallback } from "react";
import { useAuth } from "@shared/hooks/useAuth";

const DEV_USERS: { key: string; label: string; role: string }[] = [
  { key: "guest", label: "Guest (chưa đăng nhập)", role: "—" },
  { key: "dev-user", label: "Người dùng (USER)", role: "USER" },
  { key: "dev-cm", label: "Content Manager (CONTENT_MANAGER)", role: "CONTENT_MANAGER" },
  { key: "dev-admin", label: "Admin (ADMIN)", role: "ADMIN" },
];

/**
 * Dev-only user switcher. Renders only when `import.meta.env.DEV`.
 * Lists the three backend fixture users; changing selection persists to
 * localStorage and triggers `AuthProvider` to re-fetch `/auth/me`.
 */
export function DevUserSwitcher() {
  const { devUserKey, setDevUserKey, user } = useAuth();

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setDevUserKey(event.target.value);
    },
    [setDevUserKey],
  );

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed top-4 right-100 z-50 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
        <span>Dev user:</span>
        {user ? (
          <span className="font-medium text-on-surface">{user.role}</span>
        ) : (
          <span className="font-medium text-on-surface-variant">(anonymous)</span>
        )}
      </div>
      <select
        value={devUserKey ?? "dev-user"}
        onChange={handleChange}
        className="text-xs bg-surface border border-outline-variant rounded px-2 py-1 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {DEV_USERS.map((u) => (
          <option key={u.key} value={u.key}>
            {u.label}
          </option>
        ))}
      </select>
    </div>
  );
}
