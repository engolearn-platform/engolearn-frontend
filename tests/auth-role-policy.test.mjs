import assert from "node:assert/strict";
import test from "node:test";
import { hasRequiredRole } from "../src/features/auth/utils/role-policy.ts";

const roles = ["USER", "CONTENT_MANAGER", "ADMIN"];

test("role authorization follows the backend authority matrix", () => {
  const expectations = {
    USER: [true, false, false],
    CONTENT_MANAGER: [true, true, false],
    ADMIN: [true, true, true],
  };

  for (const [role, expected] of Object.entries(expectations)) {
    assert.deepEqual(roles.map(required => hasRequiredRole(role, [required])), expected, role);
  }
});

test("either required role grants access, while missing or empty roles deny", () => {
  assert.equal(hasRequiredRole("CONTENT_MANAGER", ["ADMIN", "CONTENT_MANAGER"]), true);
  assert.equal(hasRequiredRole("USER", ["ADMIN", "CONTENT_MANAGER"]), false);
  assert.equal(hasRequiredRole("ADMIN", []), false);
  assert.equal(hasRequiredRole(null, roles), false);
});
