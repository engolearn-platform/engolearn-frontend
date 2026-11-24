import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";

test("real signed-in ADMIN can enter Placement as an inherited learner", {
  skip: !process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD, timeout: 120_000,
}, async () => {
  const base = process.env.PLACEMENT_FE_URL || "http://localhost:3000";
  const dom = new JSDOM("<!doctype html><body><main></main></body>", { url: base + "/placement" });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const nativeFetch = globalThis.fetch;
  const cookies = new Map();
  let currentAttemptStatus;
  globalThis.fetch = async (url, options = {}) => {
    const headers = new Headers(options.headers);
    headers.set("Cookie", [...cookies].map(([key, value]) => `${key}=${value}`).join("; "));
    const response = await nativeFetch(new URL(url, base), { ...options, headers });
    if (new URL(url, base).pathname === "/api/v1/placement/attempts/current") currentAttemptStatus = response.status;
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";", 1)[0];
      const index = pair.indexOf("=");
      cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
    return response;
  };
  let vite;
  let root;
  try {
    const login = await fetch(base + "/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: process.env.TEST_ADMIN_EMAIL, password: process.env.TEST_ADMIN_PASSWORD }) });
    assert.equal(login.status, 200);
    assert.equal((await login.json()).data.role, "ADMIN");
    const routerModule = "/tests/placement-roles-router.mjs";
    vite = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true }, appType: "custom", plugins: [{ name: "placement-roles-router", resolveId: id => id === routerModule ? id : undefined, load: id => id === routerModule ? 'export { createMemoryRouter, RouterProvider } from "react-router";' : undefined }] });
    const [{ AuthProvider }, { default: Start }, { createMemoryRouter, RouterProvider }] = await Promise.all([
      vite.ssrLoadModule("/src/shared/hooks/useAuth.tsx"),
      vite.ssrLoadModule("/src/features/placement/views/learning/PlacementStartView.tsx"),
      vite.ssrLoadModule(routerModule),
    ]);
    root = createRoot(document.querySelector("main"));
    const router = createMemoryRouter([{ path: "/placement", element: h(AuthProvider, null, h(Start)) }], { initialEntries: ["/placement"] });
    await act(async () => { root.render(h(RouterProvider, { router })); });
    const end = Date.now() + 30_000;
    const settled = () => /Chỉ tài khoản User|Bắt đầu bài kiểm tra|Bạn có bài kiểm tra chưa hoàn thành|Bạn đã hoàn thành bài kiểm tra/.test(document.body.textContent);
    while (!settled()) {
      assert.ok(Date.now() < end, "timed out waiting for real Placement state");
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 25)); });
    }
    assert.equal(currentAttemptStatus, 200, "learner state must come from the actual backend current-attempt API");
    assert.ok(!document.body.textContent.includes("Chỉ tài khoản User"), "ADMIN inherits USER and must not see the exclusive-role refusal");
    assert.ok([...document.querySelectorAll("button,a")].some(el => /Bắt đầu bài kiểm tra|Tiếp tục bài làm|Xem kết quả/.test(el.textContent)), "a real learner action must be available");
  } finally {
    if (root) await act(async () => root.unmount());
    await vite?.close();
    globalThis.fetch = nativeFetch;
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});
