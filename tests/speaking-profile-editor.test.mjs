import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";

let dom; let vite; let routerModule; let editor; let AuthProvider;
const wait = (ms = 20) => new Promise(resolve => setTimeout(resolve, ms));
async function waitFor(check, message) {
  const deadline = Date.now() + 1500;
  while (Date.now() < deadline) { if (check()) return; await wait(10); }
  assert.fail(typeof message === "function" ? message() : message);
}
function profileState(topicId) {
  return { revision: 0, draft: null, published: null, contentVersion: "content-v1", initialProfile: {
    enabled: false, level: "A2", description: `Source ${topicId}`, aiRole: "", learnerRole: "", suggestedTopics: [], selectedResourceIds: [], fallbackReply: "", fallbackHint: null,
  }, scopeTitle: `Topic ${topicId}`, parentTitle: null, publishedProfileVersion: null, draftMatchesPublished: false,
  resourceGroups: [], publishViolations: [], publishedViolations: [], resources: [] };
}

before(async () => {
  dom = new JSDOM("<!doctype html><body></body>", { url: "https://engolearn.test/" });
  globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const routerId = "/tests/speaking-profile-editor-router.mjs";
  vite = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true }, appType: "custom", plugins: [{
    name: "speaking-profile-editor-router", resolveId: id => id === routerId ? id : undefined,
    load: id => id === routerId ? 'export { createMemoryRouter, RouterProvider } from "react-router";' : undefined,
  }] });
  [routerModule, editor, AuthProvider] = await Promise.all([
    vite.ssrLoadModule(routerId),
    vite.ssrLoadModule("/src/features/topic/views/management/TopicSpeakingProfileView.tsx"),
    vite.ssrLoadModule("/src/shared/hooks/useAuth.tsx"),
  ]);
});
after(async () => {
  await vite?.close(); dom?.window.close();
  delete globalThis.window; delete globalThis.document; delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

test("profile editor ignores a late GET response after scope changes", async t => {
  let releaseFirstGet; const firstGet = new Promise(resolve => { releaseFirstGet = resolve; }); const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const request = new URL(url); const path = request.pathname; calls.push({ path, method: options.method });
    if (path.endsWith("/auth/me")) return Response.json({ data: { id: "admin-1", email: "admin@example.test", role: "ADMIN" } });
    if (path.includes("/speaking-profile") && options.method === "GET") {
      if (path.includes("/topics/topic-a/")) return firstGet;
      if (path.includes("/topics/topic-b/")) return Response.json({ data: profileState("topic-b") });
    }
    throw new Error(`Unexpected request ${options.method} ${path}`);
  });
  const { createMemoryRouter, RouterProvider } = routerModule;
  const appRouter = createMemoryRouter([{ path: "/admin/topics/:topicId/speaking-profile", Component: editor.default }], { initialEntries: ["/admin/topics/topic-a/speaking-profile"] });
  const container = document.body.appendChild(document.createElement("div")); const root = createRoot(container);
  t.after(async () => { await act(async () => root.unmount()); appRouter.dispose(); container.remove(); });
  await act(async () => { root.render(h(AuthProvider.AuthProvider, null, h(RouterProvider, { router: appRouter }))); });
  await waitFor(() => calls.some(call => call.path.includes("topic-a") && call.method === "GET"), () => `first scope GET was not issued: ${JSON.stringify(calls)}; ${container.textContent}`);
  await act(async () => { await appRouter.navigate("/admin/topics/topic-b/speaking-profile"); });
  await waitFor(() => container.textContent.includes("Topic topic-b"), "second scope did not load");
  assert.ok([...container.querySelectorAll("input")].some(input => input.value === "Source topic-b"));
  releaseFirstGet(Response.json({ data: profileState("topic-a") }));
  await act(async () => { await wait(50); });
  assert.match(container.textContent, /Topic topic-b/);
  assert.ok([...container.querySelectorAll("input")].some(input => input.value === "Source topic-b"));
  assert.doesNotMatch(container.textContent, /Source topic-a/);
});

test("failed draft save preserves dirty fields and keeps publication blocked", async t => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const request = new URL(url); const path = request.pathname; calls.push({ path, method: options.method, body: options.body });
    if (path.endsWith("/auth/me")) return Response.json({ data: { id: "admin-1", email: "admin@example.test", role: "ADMIN" } });
    if (path.endsWith("/speaking-profile") && options.method === "GET") return Response.json({ data: profileState("save-case") });
    if (path.endsWith("/speaking-profile") && options.method === "PUT") return Response.json({
      code: "PROFILE_DRAFT_REJECTED", detail: "Draft could not be saved", violations: [{ path: "profile.description", code: "INVALID_DESCRIPTION", message: "Description is invalid." }],
    }, { status: 422 });
    if (path.endsWith("/publish")) return Response.json({ data: profileState("save-case") });
    throw new Error(`Unexpected request ${options.method} ${path}`);
  });
  const { createMemoryRouter, RouterProvider } = routerModule;
  const appRouter = createMemoryRouter([{ path: "/admin/topics/:topicId/speaking-profile", Component: editor.default }], { initialEntries: ["/admin/topics/save-case/speaking-profile"] });
  const container = document.body.appendChild(document.createElement("div")); const root = createRoot(container);
  t.after(async () => { await act(async () => root.unmount()); appRouter.dispose(); container.remove(); });
  await act(async () => { root.render(h(AuthProvider.AuthProvider, null, h(RouterProvider, { router: appRouter }))); });
  await waitFor(() => [...container.querySelectorAll("input")].some(input => input.value === "Source save-case"), () => `profile editor did not load: ${JSON.stringify(calls)}; ${container.textContent}`);
  const description = [...container.querySelectorAll("input")].find(input => input.value === "Source save-case");
  assert.ok(description, "initialized source value is editable field data");
  await act(async () => { const propsKey = Object.keys(description).find(key => key.startsWith("__reactProps$")); assert.ok(propsKey, "React input props are mounted"); description[propsKey].onChange({ target: { value: "Edited but not saved" } }); });
  assert.equal(description.value, "Edited but not saved");
  const saveButton = [...container.querySelectorAll("button")].find(button => button.textContent.includes("Lưu bản nháp"));
  assert.ok(saveButton);
  await act(async () => { saveButton.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, button: 0, cancelable: true })); });
  await waitFor(() => container.textContent.includes("Draft could not be saved"), () => `save rejection was not shown: ${container.textContent}`);
  assert.equal(description.value, "Edited but not saved", "rejected save leaves the dirty form intact");
  assert.match(container.textContent, /Mô tả tình huống: Description is invalid\./);
  const publishButton = [...container.querySelectorAll("button")].find(button => button.textContent.includes("Phát hành Speaking"));
  assert.ok(publishButton?.disabled, "dirty or unsaved draft cannot be published");
  assert.equal(calls.filter(call => call.method === "PUT").length, 1);
  assert.equal(calls.filter(call => call.path.endsWith("/publish")).length, 0);
});
