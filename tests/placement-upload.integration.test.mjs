import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { JSDOM } from "jsdom";
import { act, createElement as h, useState } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";

const enabled = Boolean(process.env.TEST_ADMIN_EMAIL && process.env.TEST_ADMIN_PASSWORD && process.env.PLACEMENT_REAL_AUDIO_FILE);

test("real audio upload completion preserves edits made while its response is pending", { skip: !enabled, timeout: 120_000 }, async () => {
  const base = process.env.PLACEMENT_FE_URL || "http://localhost:3000";
  const dom = new JSDOM("<!doctype html><body><main></main></body>", { url: base });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const nativeFetch = globalThis.fetch;
  const cookies = new Map();
  let release;
  const pendingResponse = new Promise(resolve => { release = resolve; });
  let uploaded = false;
  globalThis.fetch = async (url, options = {}) => {
    const headers = new Headers(options.headers);
    headers.set("Cookie", [...cookies].map(([k, v]) => `${k}=${v}`).join("; "));
    const response = await nativeFetch(new URL(url, base), { ...options, headers });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";", 1)[0];
      const index = pair.indexOf("=");
      cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
    if (options.method === "POST" && new URL(url, base).pathname === "/api/v1/placement/admin/questions/media") {
      assert.equal(response.status, 200, "real BE must accept the existing WAV through Media");
      uploaded = true;
      await pendingResponse;
    }
    return response;
  };
  let vite;
  let root;
  try {
    const login = await globalThis.fetch(`${base}/api/v1/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: process.env.TEST_ADMIN_EMAIL, password: process.env.TEST_ADMIN_PASSWORD }) });
    assert.equal(login.status, 200);
    assert.equal((await login.json()).data.role, "ADMIN");
    const questionId = process.env.TEST_PLACEMENT_QUESTION_ID || "PLT-Q-A1-L-0001-V3";
    const response = await globalThis.fetch(`${base}/api/v1/placement/admin/questions/${encodeURIComponent(questionId)}`);
    assert.equal(response.status, 200);
    const initial = (await response.json()).data;
    assert.equal(initial.skill, "LISTENING");
    const routerModule = "/tests/placement-test-router.mjs";
    vite = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true }, appType: "custom", plugins: [{name:"placement-test-router",resolveId:id=>id===routerModule?id:undefined,load:id=>id===routerModule?'export { createMemoryRouter, RouterProvider } from "react-router";':undefined}] });
    const [{ AuthProvider }, { default: ManagementProvider }, { PlacementQuestionFields }, { createMemoryRouter, RouterProvider }] = await Promise.all([
      vite.ssrLoadModule("/src/shared/hooks/useAuth.tsx"),
      vite.ssrLoadModule("/src/features/placement/components/management/PlacementManagementProvider.tsx"),
      vite.ssrLoadModule("/src/features/placement/components/management/questions/PlacementQuestionFields.tsx"),
      vite.ssrLoadModule(routerModule),
    ]);
    let editTranscript;
    function Harness() {
      const [draft, setDraft] = useState(initial);
      editTranscript = text => setDraft(previous => ({ ...previous, transcript: text }));
      return h(PlacementQuestionFields, { draft, onChange: setDraft, editing: true });
    }
    async function until(predicate) {
      const end = Date.now() + 30_000;
      while (!predicate()) {
        assert.ok(Date.now() < end, "timed out waiting for real UI/API state");
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 25)); });
      }
    }
    root = createRoot(document.querySelector("main"));
    const router = createMemoryRouter([{ element: h(AuthProvider, null, h(ManagementProvider)), children: [{ path: "/", Component: Harness }] }]);
    await act(async () => { root.render(h(RouterProvider, { router })); });
    await until(() => document.querySelector('input[type="file"]'));
    const input = document.querySelector('input[type="file"]');
    const bytes = await readFile(process.env.PLACEMENT_REAL_AUDIO_FILE);
    const file = new File([bytes], basename(process.env.PLACEMENT_REAL_AUDIO_FILE), { type: "audio/wav" });
    Object.defineProperty(input, "files", { configurable: true, value: [file] });
    await act(async () => { input.dispatchEvent(new dom.window.Event("change", { bubbles: true })); });
    await until(() => uploaded);
    const edited = `${initial.transcript}\nEditorial note entered while the existing audio response is pending.`;
    await act(async () => { editTranscript(edited); });
    assert.ok([...document.querySelectorAll("textarea")].some(field => field.value === edited));
    await act(async () => { release(); });
    await until(() => !document.body.textContent.includes("Đang tải audio…"));
    assert.ok([...document.querySelectorAll("textarea")].some(field => field.value === edited), "upload completion must change only audioUrl; the concurrent transcript edit must survive");
  } finally {
    release();
    if (root) await act(async () => root.unmount());
    await vite?.close();
    globalThis.fetch = nativeFetch;
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});
