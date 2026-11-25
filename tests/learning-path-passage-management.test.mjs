import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { createServer } from "vite";

const path = "/admin/learning-paths/passages";
const endpoint = "/api/management/learning-paths/passages";
let vite;
let dom;
let modules;
const previousGlobals = new Map();

before(async () => {
  dom = new JSDOM("<!doctype html><body></body>", { url: "http://localhost:3000/", pretendToBeVisual: true });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  for (const key of ["HTMLElement", "HTMLInputElement", "Node", "NodeFilter", "CustomEvent", "Event", "MutationObserver", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"]) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value: dom.window[key], writable: true, configurable: true });
  }
  const routerId = "/tests/passage-test-router.mjs";
  vite = await createServer({
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true }, appType: "custom",
    plugins: [{ name: "passage-test-router", resolveId: id => id === routerId ? id : undefined,
      load: id => id === routerId ? 'export { createMemoryRouter, RouterProvider, Outlet, matchRoutes } from "react-router";' : undefined }],
  });
  const [router, auth, routes, service, http, guest, table] = await Promise.all([
    vite.ssrLoadModule(routerId), vite.ssrLoadModule("/src/shared/hooks/useAuth.tsx"),
    vite.ssrLoadModule("/src/features/learning-path/routes.ts"),
    vite.ssrLoadModule("/src/features/learning-path/services/passage-management.service.ts"),
    vite.ssrLoadModule("/src/shared/services/http.service.ts"),
    vite.ssrLoadModule("/src/features/auth/components/GuestOnlyGuard.tsx"),
    vite.ssrLoadModule("/src/features/learning-path/components/management/passages/PassageManagementTable.tsx"),
  ]);
  modules = { ...router, ...auth, ...routes, ...service, ...http, GuestOnlyGuard: guest.default, PassageManagementTable: table.default };
});

after(async () => {
  await vite?.close(); dom?.window.close();
  delete globalThis.window; delete globalThis.document; delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  for (const [key, descriptor] of previousGlobals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
});

test("Passage client sends server filters and revision, and preserves multipart across session refresh", async t => {
  const calls = [];
  let uploadAttempts = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const target = new URL(url);
    calls.push({ target, options });
    if (target.pathname.endsWith("/refresh")) return new Response(null, { status: 204 });
    if (options.body instanceof FormData && uploadAttempts++ === 0) return Response.json({ detail: "Expired" }, { status: 401 });
    return Response.json({ data: { items: [] } });
  });
  const client = modules.passageManagementService;
  await client.list({ keyword: "  bus & train  ", skill: "LISTENING", level: "C2", status: "DRAFT", page: 2, size: 20 });
  assert.equal(calls[0].target.pathname, endpoint);
  assert.deepEqual(Object.fromEntries(calls[0].target.searchParams), {
    page: "2", size: "20", keyword: "bus & train", skill: "LISTENING", level: "C2", status: "DRAFT",
  });
  const audio = new File(["audio bytes"], "lesson.wav", { type: "audio/wav" });
  await client.update("id /?#", { title: "New title", skill: "LISTENING", level: "C2", transcript: "Listen", revision: 7 }, audio);
  const uploads = calls.filter(call => call.options.method === "PATCH");
  assert.equal(uploads.length, 2);
  for (const { target, options } of uploads) {
    assert.equal(target.pathname, `${endpoint}/id%20%2F%3F%23`);
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.headers.has("Content-Type"), false);
    const json = options.body.get("passage");
    assert.equal(json.type, "application/json");
    assert.equal(JSON.parse(await json.text()).revision, 7);
    assert.equal(options.body.get("audio").name, "lesson.wav");
  }
  await client.delete("id /?#", 7);
  assert.equal(calls.at(-1).target.searchParams.get("revision"), "7");
  assert.equal(calls.at(-1).options.method, "DELETE");
  await client.list({ keyword: " ", skill: "ALL", level: "ALL", status: "ALL", page: 0, size: 10 });
  assert.deepEqual(Object.fromEntries(calls.at(-1).target.searchParams), { page: "0", size: "10" });
});

test("Passage errors retain conflict code and JSON requests remain JSON", async t => {
  let options;
  t.mock.method(globalThis, "fetch", async (_url, request) => {
    options = request;
    return Response.json({ detail: "Referenced by questions", code: "PASSAGE_DELETE_CONFLICT" }, { status: 409 });
  });
  await assert.rejects(modules.passageManagementService.delete("draft", 3), error => error.status === 409 && error.code === "PASSAGE_DELETE_CONFLICT");
  await assert.rejects(modules.httpService.post("/api/example", { value: 1 }));
  assert.equal(options.headers.get("Content-Type"), "application/json");
  assert.equal(options.body, '{"value":1}');
});

test("Readiness client encodes the passage ID, uses GET/cookies/no-store and forwards cancellation", async t => {
  const controller = new AbortController();
  let called;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    called = { url: new URL(url), options };
    return Response.json({ data: { passageId: "id /?#", revision: 3, blockers: [] } });
  });
  const result = await modules.passageManagementService.readiness("id /?#", controller.signal);
  assert.equal(called.url.pathname, `${endpoint}/id%20%2F%3F%23/readiness`);
  assert.equal(called.options.method, "GET");
  assert.equal(called.options.credentials, "same-origin");
  assert.equal(called.options.cache, "no-store");
  assert.equal(called.options.signal, controller.signal);
  assert.equal(called.options.body, undefined);
  assert.equal(result.revision, 3);
});

async function mount(t, role, { items = [], onRequest } = {}) {
  let release;
  let fail = false;
  let auth;
  const pending = new Promise(resolve => { release = resolve; });
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const target = new URL(url);
    requests.push(target.pathname);
    const handled = onRequest?.(target, options);
    if (handled !== undefined) return handled;
    if (target.pathname.endsWith("/me")) {
      await pending;
      if (fail) return Response.json({ detail: "Unavailable" }, { status: 503 });
      return role ? Response.json({ data: { id: "manager", email: "manager@example.test", role } }) : Response.json({}, { status: 401 });
    }
    if (target.pathname.endsWith("/refresh")) return Response.json({}, { status: 401 });
    if (target.pathname.endsWith("/login")) return Response.json({ data: { id: "manager", email: "manager@example.test", role } });
    if (target.pathname.endsWith("/logout")) return new Response(null, { status: 204 });
    if (target.pathname === endpoint && options.method === "GET") return Response.json({ data: {
      items, page: 0, size: 20, totalElements: items.length, totalPages: items.length ? 1 : 0,
      counters: { total: items.length, draft: items.length, active: 0, retired: 0 },
    } });
    throw new Error(`Unexpected request: ${target.pathname}`);
  });
  function Shell() { auth = modules.useAuth(); return h(modules.Outlet); }
  const router = modules.createMemoryRouter([{
    Component: Shell, children: [...modules.LearningPathManagementRoutes,
      { Component: modules.GuestOnlyGuard, children: [{ path: "/login", element: h("div", null, "Login") }] }],
  }], { initialEntries: [`${path}?tab=drafts#list`] });
  const container = document.createElement("div"); document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(h(modules.AuthProvider, null, h(modules.RouterProvider, { router }))));
  t.after(async () => { await act(async () => root.unmount()); container.remove(); router.dispose(); });
  return { container, router, requests,
    settle: async (error = false) => { fail = error; await act(async () => { release(); }); },
    retry: async () => { fail = false; await act(async () => container.querySelector("button").click()); },
    demote: async () => { role = "USER"; await act(async () => auth.refetch()); },
    logout: async () => { role = null; await act(async () => auth.logout()); },
    login: async nextRole => { role = nextRole; await act(async () => auth.login({ email: "manager@example.test", password: "test-only" })); },
  };
}

test("Passage direct URL withholds data during pending/error and retries", async t => {
  const app = await mount(t, "CONTENT_MANAGER");
  assert.match(app.container.textContent, /Checking your session/);
  assert.equal(app.requests.includes(endpoint), false);
  await app.settle(true);
  assert.match(app.container.textContent, /Unable to check/);
  assert.equal(app.requests.includes(endpoint), false);
  await app.retry();
  assert.match(app.container.textContent, /Quản lý kho passages/);
});

test("Passage guest redirects with local return-to; learner is denied before fetching", async t => {
  for (const role of [null, "USER"]) await t.test(String(role), async child => {
    const app = await mount(child, role); await app.settle();
    assert.equal(app.requests.includes(endpoint), false);
    if (role) { assert.match(app.container.textContent, /403/); assert.equal(app.router.state.location.pathname, path); }
    else {
      assert.equal(app.router.state.location.pathname, "/login");
      assert.equal(app.router.state.location.state.from.pathname, path);
      assert.equal(app.router.state.location.state.from.search, "?tab=drafts");
      assert.equal(app.router.state.location.state.from.hash, "#list");
    }
  });
});

test("Passage allows CONTENT_MANAGER and inherited ADMIN; demotion/logout removes management content", async t => {
  for (const role of ["CONTENT_MANAGER", "ADMIN"]) await t.test(role, async child => {
    const app = await mount(child, role); await app.settle();
    assert.ok(app.requests.includes(endpoint));
    assert.match(app.container.textContent, /Chưa có passage nào/);
    assert.equal(app.container.querySelector('input[type="search"]')?.maxLength, 200);
    if (role === "ADMIN") {
      await app.demote(); assert.match(app.container.textContent, /403/);
    } else {
      await app.logout(); assert.equal(app.router.state.location.pathname, "/login");
    }
    assert.doesNotMatch(app.container.textContent, /Quản lý kho passages/);
  });
});

test("Signing in from Passage returns to its original URL, query and fragment", async t => {
  for (const role of ["CONTENT_MANAGER", "ADMIN"]) await t.test(role, async child => {
    const app = await mount(child, null); await app.settle();
    assert.equal(app.router.state.location.pathname, "/login");
    await app.login(role);
    const location = app.router.state.location;
    assert.equal(location.pathname + location.search + location.hash, `${path}?tab=drafts#list`);
    assert.match(app.container.textContent, /Quản lý kho passages/);
  });
});

test("Passage table has seven columns with question counts and permits editing/deletion only for drafts", async t => {
  const container = document.createElement("div"); document.body.append(container);
  const root = createRoot(container);
  t.after(async () => { await act(async () => root.unmount()); container.remove(); });
  const selected = [];
  await act(async () => root.render(h(modules.PassageManagementTable, {
    items: ["DRAFT", "ACTIVE", "RETIRED"].map((status, index) => ({
      passageId: status, title: `Passage ${status}`, skill: "READING", level: "C2", status,
      revision: 2, updatedAt: "2026-11-25T11:40:00Z",
      referencingQuestionCount: [3, 0, 1234][index],
    })),
    onView: item => selected.push(item.passageId), onEdit: () => {}, onDelete: () => {}, onCheck: item => selected.push(`check:${item.passageId}`),
  })));
  assert.equal(container.querySelectorAll("th").length, 7);
  assert.equal(container.querySelectorAll("th")[3].textContent, "Số câu hỏi");
  assert.deepEqual([...container.querySelectorAll("tbody tr td:nth-child(4)")].map(cell => cell.textContent.trim()), ["3 câu hỏi", "0 câu hỏi", "1.234 câu hỏi"]);
  assert.doesNotMatch(container.querySelector("thead").textContent, /Audio/);
  const checkButtons = container.querySelectorAll('button[aria-label^="Kiểm tra "]');
  assert.equal(checkButtons.length, 1);
  const publish = [...container.querySelectorAll("button")].find(button => button.textContent === "Xuất bản");
  assert.equal(publish.disabled, true);
  await act(async () => checkButtons[0].click());
  assert.deepEqual(selected, ["check:DRAFT"]);
  selected.length = 0;
  const trigger = container.querySelector('button[aria-label="Thao tác với Passage DRAFT"]');
  await act(async () => trigger.click());
  assert.equal(trigger.getAttribute("aria-expanded"), "true");
  let actions = [...document.querySelectorAll(".fixed button")];
  assert.deepEqual(actions.map(button => button.textContent), ["Xem chi tiết", "Sửa", "Xóa"]);
  await act(async () => actions[0].click());
  assert.deepEqual(selected, ["DRAFT"]);
  for (const status of ["ACTIVE", "RETIRED"]) {
    await act(async () => container.querySelector(`button[aria-label="Thao tác với Passage ${status}"]`).click());
    actions = [...document.querySelectorAll(".fixed button")];
    assert.deepEqual(actions.map(button => button.textContent), ["Xem chi tiết"]);
    await act(async () => actions[0].click());
  }
});

const draft = { passageId: "draft-1", title: "Library hours", skill: "READING", level: "B1", status: "DRAFT", revision: 2, referencingQuestionCount: 1, updatedAt: "2026-11-25T11:40:00Z" };
const readinessResult = {
  passageId: draft.passageId, revision: 3, status: "DRAFT", structurallyValid: false,
  referencingQuestionCount: 1, incompatibleQuestionCount: 0,
  blockers: [{ code: "READING_TEXT_REQUIRED", field: "text", message: "Nội dung bài đọc còn thiếu." }],
  warnings: [{ code: "REVIEW_WARNING", field: "text", message: "Cần kiểm tra cách diễn đạt." }],
  requiredReviewChecks: ["LEVEL_APPROPRIATE", "CONTENT_SUPPORTS_INTENDED_QUESTIONS"],
};

const findButton = (root, label) => [...root.querySelectorAll("button")].find(button => button.textContent === label);

test("Checking a list row shows loading, blockers/warnings/manual review and refetches without publishing", async t => {
  let complete;
  const pending = new Promise(resolve => { complete = resolve; });
  let count = 0;
  const methods = [];
  const app = await mount(t, "CONTENT_MANAGER", { items: [draft], onRequest: (url, options) => {
    methods.push(options.method);
    if (url.pathname.endsWith("/readiness")) {
      count++;
      if (count === 1) return pending;
      return Promise.resolve(Response.json({ data: { ...readinessResult, revision: 4, structurallyValid: true, blockers: [], warnings: [] } }));
    }
  } });
  await app.settle();
  await act(async () => app.container.querySelector('button[aria-label="Kiểm tra Library hours"]').click());
  let dialog = document.querySelector('[role="dialog"]');
  assert.match(dialog.textContent, /Đang kiểm tra dữ liệu đã lưu/);
  assert.doesNotMatch(dialog.textContent, /Đạt kiểm tra tự động/);
  await act(async () => complete(Response.json({ data: readinessResult })));
  assert.match(dialog.textContent, /Nội dung bài đọc còn thiếu/);
  assert.match(dialog.textContent, /Cần kiểm tra cách diễn đạt/);
  assert.match(dialog.textContent, /Passage đã thay đổi so với danh sách/);
  assert.match(dialog.textContent, /Nội dung phù hợp trình độ/);
  assert.equal(dialog.querySelectorAll('input[type="checkbox"]').length, 0);
  await act(async () => findButton(dialog, "Kiểm tra lại").click());
  dialog = document.querySelector('[role="dialog"]');
  assert.equal(count, 2);
  assert.match(dialog.textContent, /Đạt kiểm tra tự động/);
  assert.doesNotMatch(dialog.textContent, /Nội dung bài đọc còn thiếu/);
  assert.match(dialog.textContent, /chưa thay thế việc duyệt chuyên môn/);
  assert.ok(methods.every(method => method === "GET"));
  await act(async () => findButton(dialog, "Đóng").click());
  assert.equal(document.querySelector('[role="dialog"]'), null);
});

test("Readiness failure can retry; non-DRAFT result cannot open editing", async t => {
  let count = 0;
  const app = await mount(t, "ADMIN", { items: [draft], onRequest: url => {
    if (url.pathname.endsWith("/readiness")) return Promise.resolve(++count === 1
      ? Response.json({ detail: "Storage unavailable" }, { status: 503 })
      : Response.json({ data: { ...readinessResult, status: "ACTIVE" } }));
  } });
  await app.settle();
  await act(async () => app.container.querySelector('button[aria-label="Kiểm tra Library hours"]').click());
  let dialog = document.querySelector('[role="dialog"]');
  assert.match(dialog.textContent, /dịch vụ tạm thời không khả dụng/);
  assert.equal(findButton(dialog, "Mở chỉnh sửa"), undefined);
  await act(async () => findButton(dialog, "Thử lại").click());
  dialog = document.querySelector('[role="dialog"]');
  assert.equal(count, 2);
  assert.equal(findButton(dialog, "Mở chỉnh sửa"), undefined);
  await act(async () => findButton(dialog, "Đóng").click());
});

test("Closing readiness aborts its pending request and prevents a late result from appearing", async t => {
  let signal;
  let complete;
  const pending = new Promise(resolve => { complete = resolve; });
  const app = await mount(t, "CONTENT_MANAGER", { items: [draft], onRequest: (url, options) => {
    if (url.pathname.endsWith("/readiness")) { signal = options.signal; return pending; }
  } });
  await app.settle();
  await act(async () => app.container.querySelector('button[aria-label="Kiểm tra Library hours"]').click());
  await act(async () => findButton(document.querySelector('[role="dialog"]'), "Đóng").click());
  assert.equal(signal.aborted, true);
  await act(async () => complete(Response.json({ data: readinessResult })));
  assert.equal(document.querySelector('[role="dialog"]'), null);
});
