import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";

registerHooks({ resolve(specifier, context, nextResolve) {
  return nextResolve(specifier === "@shared/constants"
    ? new URL("../src/shared/constants/app.constants.ts", import.meta.url).href : specifier, context);
} });
const { authReturnTo } = await import("../src/features/auth/utils/authReturnTo.ts");

test("login keeps the captured assessment destination, query and fragment", () => {
  assert.equal(authReturnTo({ from: { pathname: "/assessment", search: "?page=2", hash: "#result" } }), "/assessment?page=2#result");
  assert.equal(authReturnTo({ from: { pathname: "/assessment/attempts/existing/review" } }), "/assessment/attempts/existing/review");
});

test("return destination rejects external redirects, control characters and auth loops", () => {
  for (const pathname of ["https://outside.test", "//outside.test", "/\\outside.test", "/\tout", "/login", "/register", "/login/nested", "/x/../login"]) {
    assert.equal(authReturnTo({ from: { pathname } }), "/", pathname);
  }
  assert.equal(authReturnTo(null), "/");
  assert.equal(authReturnTo({ from: { pathname: 7 } }), "/");
});
