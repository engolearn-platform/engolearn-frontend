import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { JSDOM } from "jsdom";
import { createServer } from "vite";

let vite;
let dom;
let dashboardService;

before(async () => {
  dom = new JSDOM("<!doctype html><body></body>", { url: "https://engolearn.test/" });
  globalThis.window = dom.window;
  vite = await createServer({
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true },
    appType: "custom",
  });
  ({ dashboardService } = await vite.ssrLoadModule(
    "/src/features/management-dashboard/services/dashboard.service.ts",
  ));
});

after(async () => {
  await vite?.close();
  dom?.window.close();
  delete globalThis.window;
});

function validSummary() {
  return {
    content: {
      topics: { total: 0, published: 0, draft: 0, unpublished: 0 },
      grammar: { total: 0, published: 0, draft: 0, inProgress: 0, archived: 0 },
      passages: { total: 0, active: 0, draft: 0, retired: 0 },
      learningPathQuestions: { total: 0 },
    },
    administration: {
      users: { total: 0 },
      subscription: { activePremium: 0 },
      placement: { testSets: 0, questions: 0 },
    },
  };
}

function mockEnvelope(t, payload) {
  t.mock.method(globalThis, "fetch", async () => Response.json({ data: payload }));
}

test("accepts zero counts and preserves the admin payload for ADMIN", async t => {
  const summary = validSummary();
  mockEnvelope(t, summary);

  const result = await dashboardService.getSummary(new AbortController().signal, true);

  assert.deepEqual(result, summary);
});

test("rejects negative and fractional summary counts", async t => {
  const negative = validSummary();
  negative.content.topics.draft = -1;
  mockEnvelope(t, negative);
  await assert.rejects(
    dashboardService.getSummary(new AbortController().signal, false),
    /content\.topics\.draft/,
  );

  const fractional = validSummary();
  fractional.content.grammar.total = 1.5;
  t.mock.reset();
  mockEnvelope(t, fractional);
  await assert.rejects(
    dashboardService.getSummary(new AbortController().signal, false),
    /content\.grammar\.total/,
  );
});

test("rejects missing required counts and missing ADMIN data", async t => {
  const missingContentCount = validSummary();
  delete missingContentCount.content.passages.retired;
  mockEnvelope(t, missingContentCount);
  await assert.rejects(
    dashboardService.getSummary(new AbortController().signal, false),
    /content\.passages\.retired/,
  );

  const missingAdmin = validSummary();
  delete missingAdmin.administration;
  t.mock.reset();
  mockEnvelope(t, missingAdmin);
  await assert.rejects(
    dashboardService.getSummary(new AbortController().signal, true),
    /missing administration/,
  );
});

test("strips an unexpected administration payload from CONTENT_MANAGER state", async t => {
  const payload = validSummary();
  mockEnvelope(t, payload);

  const result = await dashboardService.getSummary(new AbortController().signal, false);

  assert.deepEqual(result, { content: payload.content });
  assert.equal("administration" in result, false);
});

test("passes cancellation to transport and propagates abort and HTTP errors", async t => {
  const controller = new AbortController();
  let seenSignal;
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    seenSignal = options.signal;
    controller.abort();
    throw new DOMException("Aborted", "AbortError");
  });

  await assert.rejects(
    dashboardService.getSummary(controller.signal, false),
    error => error.name === "AbortError",
  );
  assert.equal(seenSignal, controller.signal);

  t.mock.reset();
  t.mock.method(globalThis, "fetch", async () => Response.json(
    { detail: "Dashboard unavailable" },
    { status: 503 },
  ));
  await assert.rejects(
    dashboardService.getSummary(new AbortController().signal, false),
    /Dashboard unavailable/,
  );
});
