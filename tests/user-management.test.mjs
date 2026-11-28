import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement as h } from "react";
import { createServer } from "vite";

const endpoint = "/api/v1/admin/users";
let dom;
let vite;
let modules;
let createRoot;
let previousGlobals = new Map();

before(async () => {
  dom = new JSDOM("<!doctype html><body></body>", { url: "http://localhost:3000/admin/users?search=mei&page=1&size=10&role=USER&status=ACTIVE&sort=name,asc", pretendToBeVisual: true });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  for (const key of ["HTMLElement", "HTMLInputElement", "Node", "NodeFilter", "CustomEvent", "Event", "MutationObserver", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"]) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value: dom.window[key], writable: true, configurable: true });
  }
  ({ createRoot } = await import("react-dom/client"));
  const routerId = "/tests/user-management-test-router.mjs";
  vite = await createServer({
    server: { middlewareMode: true, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true }, appType: "custom",
    plugins: [{ name: "user-management-test-router", resolveId: id => id === routerId ? id : undefined,
      load: id => id === routerId ? 'export { createMemoryRouter, RouterProvider, Outlet, useLocation, useNavigate, useSearchParams } from "react-router";' : undefined }],
  });
  const [router, service, http, view, auth] = await Promise.all([
    vite.ssrLoadModule(routerId), vite.ssrLoadModule("/src/features/user-management/services/user-management.service.ts"),
    vite.ssrLoadModule("/src/shared/services/http.service.ts"), vite.ssrLoadModule("/src/features/user-management/views/UserManagementView.tsx"),
    vite.ssrLoadModule("/src/shared/hooks/useAuth.tsx"),
  ]);
  modules = { ...router, ...service, ...http, UserManagementView: view.default, AuthProvider: auth.AuthProvider };
});

after(async () => {
  await vite?.close(); dom?.window.close();
  delete globalThis.window; delete globalThis.document; delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  for (const [key, descriptor] of previousGlobals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
  }
});

test("user management client maps filters, encodes IDs, and disables auth refresh replay for every write", async t => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ target: new URL(url), options });
    return options.method === "GET"
      ? Response.json({ data: { items: [], page: 0, size: 25, totalElements: 0, totalPages: 0 } })
      : Response.json({ code: "AUTHENTICATION_REQUIRED" }, { status: 401 });
  });
  const client = modules.userManagementService;
  await client.list({ search: " mei ", role: "USER", status: "ACTIVE", sort: "name,asc", page: 1, size: 10 });
  assert.deepEqual(Object.fromEntries(calls[0].target.searchParams), { search: "mei", role: "USER", status: "ACTIVE", sort: "name,asc", page: "1", size: "10" });
  await assert.rejects(client.create({ name: " Mai ", email: "mai@example.test", initialPassword: "secret" }));
  await assert.rejects(client.update("a /?#", { name: "Mai", expectedName: null, expectedRevision: 3 }));
  await assert.rejects(client.setStatus("id", "DISABLED", 3));
  await assert.rejects(client.setRole("id", "CONTENT_MANAGER", 3));
  await assert.rejects(client.delete("id", 3));
  const writes = calls.filter(call => call.options.method !== "GET");
  assert.equal(writes.length, 5);
  assert.ok(writes.every(call => call.options.method === "DELETE" || call.options.body));
  assert.equal(calls.some(call => call.target.pathname.endsWith("/refresh")), false, "an F05 write must not be replayed after refresh");
  assert.equal(calls.find(call => call.options.method === "PATCH").target.pathname, `${endpoint}/a%20%2F%3F%23`);
  assert.equal(calls.at(-1).target.searchParams.get("expectedRevision"), "3");
});

test("user management list renders API records and server paging", async t => {
  const requests = [];
  let accountName = "Mai Nguyen";
  let revision = 2;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const path = new URL(url).pathname;
    requests.push(path);
    if (path === "/api/v1/auth/me") return Response.json({ data: { id: "admin-1", email: "admin@example.test", role: "ADMIN" } });
    if (path === `${endpoint}/u-1` && options.method === "PATCH") {
      accountName = JSON.parse(options.body).name;
      revision += 1;
      return Response.json({ data: { id: "u-1", name: accountName, email: "mai@example.test", role: "USER", status: "ACTIVE", revision, createdAt: "2026-11-01T00:00:00Z" } });
    }
    if (path === `${endpoint}/u-1`) return Response.json({ data: { id: "u-1", name: accountName, email: "mai@example.test", role: "USER", status: "ACTIVE", revision, createdAt: "2026-11-01T00:00:00Z" } });
    if (revision > 2) await new Promise(resolve => setTimeout(resolve, 25));
    return Response.json({ data: {
      items: [{ id: "u-1", name: accountName, email: "mai@example.test", role: "USER", status: "ACTIVE", createdAt: "2026-11-01T00:00:00Z" }],
      page: 1, size: 10, totalElements: 11, totalPages: 2,
    } });
  });
  const router = modules.createMemoryRouter([{ path: "/admin/users", Component: modules.UserManagementView }], { initialEntries: ["/admin/users?search=mei&page=1&size=10&role=USER&status=ACTIVE&sort=name,asc"] });
  const root = createRoot(document.body.appendChild(document.createElement("div")));
  t.after(async () => {
    await act(async () => root.unmount());
    router.dispose();
    root._internalRoot?.containerInfo.remove();
  });
  await act(async () => { root.render(h(modules.AuthProvider, null, h(modules.RouterProvider, { router }))); await new Promise(resolve => setTimeout(resolve, 0)); });
  assert.match(document.body.textContent, /Mai Nguyen/);
  assert.match(document.body.textContent, /mai@example\.test/);
  assert.match(document.body.textContent, /Trang 2/);
  const createTrigger = [...document.querySelectorAll("button")].find(button => button.textContent?.trim() === "Tạo tài khoản");
  assert.ok(createTrigger);
  await act(async () => { createTrigger.focus(); createTrigger.click(); await new Promise(resolve => setTimeout(resolve, 0)); });
  assert.match(document.body.textContent, /Thông tin đăng nhập ban đầu/);
  await act(async () => { [...document.querySelectorAll("button")].find(button => button.textContent?.trim() === "Hủy")?.click(); await new Promise(resolve => setTimeout(resolve, 0)); });
  await new Promise(resolve => setTimeout(resolve, 250));
  assert.equal(document.activeElement, createTrigger, "canceling create restores focus to its opener");

  const detailTrigger = [...document.querySelectorAll("button")].find(button => button.textContent?.trim() === "Chi tiết");
  assert.ok(detailTrigger);
  await act(async () => { detailTrigger.click(); await new Promise(resolve => setTimeout(resolve, 0)); });
  assert.ok(requests.includes(`${endpoint}/u-1`));
  assert.equal(requests.filter(path => path === endpoint).length, 1, `opening detail must not refetch the roster; got ${requests.join(",")}`);
  assert.match(document.body.textContent, /Chi tiết tài khoản/);
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 25)); });
  const nameField = document.getElementById("h-v-t-n");
  assert.ok(nameField);
  await act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(nameField, "   ");
    nameField.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  });
  const saveName = [...document.querySelectorAll("button")].find(button => button.textContent?.trim() === "Lưu tên");
  assert.ok(saveName);
  await act(async () => { saveName.click(); await new Promise(resolve => setTimeout(resolve, 0)); });
  assert.match(document.body.textContent, /Tên phải có từ 1 đến 80 ký tự/);
  assert.equal(saveName.disabled, false, "invalid trimmed names must not leave the editor busy");
  assert.equal(requests.filter(path => path.includes("/api/v1/admin/users/u-1")).length, 1, "invalid names do not send an update");
  await act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(nameField, "Mai Updated");
    nameField.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  });
  const saveUpdatedName = [...document.querySelectorAll("button")].find(button => button.textContent?.trim() === "Lưu tên");
  await act(async () => { saveUpdatedName.click(); await new Promise(resolve => setTimeout(resolve, 0)); });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 25)); });
  const replacementTrigger = [...document.querySelectorAll("[data-user-detail-trigger]")]
    .find(element => element.getAttribute("data-user-detail-trigger") === "u-1");
  assert.ok(replacementTrigger);
  assert.notEqual(replacementTrigger, detailTrigger, "a successful edit replaces the roster row trigger");

  const statusTrigger = [...document.querySelectorAll("button")].find(button => button.textContent?.trim() === "Vô hiệu hóa");
  assert.ok(statusTrigger);
  await act(async () => { statusTrigger.focus(); statusTrigger.click(); await new Promise(resolve => setTimeout(resolve, 0)); });
  assert.match(document.body.textContent, /Xác nhận thay đổi/);
  await act(async () => { [...document.querySelectorAll("button")].find(button => button.textContent?.trim() === "Hủy")?.click(); await new Promise(resolve => setTimeout(resolve, 0)); });
  await new Promise(resolve => setTimeout(resolve, 250));
  assert.equal(document.activeElement, statusTrigger, "canceling a status decision restores focus to its opener");
  await act(async () => { document.querySelector('[aria-label="Đóng chi tiết"]')?.click(); await new Promise(resolve => setTimeout(resolve, 0)); });
  assert.equal(router.state.location.search, "?search=mei&page=1&size=10&role=USER&status=ACTIVE&sort=name%2Casc");
  await new Promise(resolve => setTimeout(resolve, 250));
  assert.equal(document.activeElement, replacementTrigger, "closing after a row reload restores focus by account ID");
});

test("direct detail links return focus to the roster heading when no row opener exists", async t => {
  t.mock.method(globalThis, "fetch", async url => {
    const path = new URL(url).pathname;
    if (path === "/api/v1/auth/me") return Response.json({ data: { id: "admin-1", email: "admin@example.test", role: "ADMIN" } });
    if (path === `${endpoint}/u-1`) return Response.json({ data: { id: "u-1", name: "Mai Nguyen", email: "mai@example.test", role: "USER", status: "ACTIVE", revision: 2 } });
    return Response.json({ data: { items: [], page: 0, size: 25, totalElements: 0, totalPages: 0 } });
  });
  const router = modules.createMemoryRouter(
    [{ path: "/admin/users", Component: modules.UserManagementView }],
    { initialEntries: ["/admin/users?detail=u-1"] },
  );
  const root = createRoot(document.body.appendChild(document.createElement("div")));
  t.after(async () => {
    await act(async () => root.unmount());
    router.dispose();
    root._internalRoot?.containerInfo.remove();
  });
  await act(async () => {
    root.render(h(modules.AuthProvider, null, h(modules.RouterProvider, { router })));
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  assert.match(document.body.textContent, /Chi tiết tài khoản/);
  await act(async () => {
    document.querySelector('[aria-label="Đóng chi tiết"]')?.click();
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  await new Promise(resolve => setTimeout(resolve, 250));
  assert.equal(document.activeElement, document.querySelector("h2"));
});
