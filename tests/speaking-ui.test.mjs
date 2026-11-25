import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";

let dom; let vite; let router; let hookModule; let resultView; let speakingEntry; let historyView; let AuthProvider;
const session = {
  sessionId: "42f14305-3cae-4523-8b68-59a48e728be1", scope: { type: "TOPIC_ITEM", topicId: "t", topicItemId: "i" },
  context: { title: "Ordering a drink", topicTitle: "At a cafe", topicItemTitle: "Ordering a drink", level: "A2", description: "Order a drink.", aiRole: "Barista", learnerRole: "Customer" },
  status: "ACTIVE", endReason: null, controllerEpoch: 1, wsPath: "/ws/speaking/session", limits: { maxTurns: 30, maxSessionMs: 1200000, maxTurnAudioMs: 120000 },
  createdAt: "2026-11-24T12:00:00Z", startedAt: "2026-11-24T12:00:00Z", endedAt: null, opening: null,
  finalizedTurnCount: 0, committedTurnCount: 0, speechDurationMs: 0, assessmentStatus: "PENDING", activeTurn: null,
};
const historyFixture = JSON.parse(await readFile(new URL("../../docs/system-design/speaking-access-history.fixture.json", import.meta.url), "utf8"));
const wait = (ms = 20) => new Promise(resolve => setTimeout(resolve, ms));

before(async () => {
  dom = new JSDOM("<!doctype html><body></body>", { url: "https://engolearn.test/" });
  globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const routerId = "/tests/speaking-test-router.mjs";
  vite = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true }, appType: "custom", plugins: [{
    name: "speaking-test-router", resolveId: id => id === routerId ? id : undefined,
    load: id => id === routerId ? 'export { createMemoryRouter, RouterProvider } from "react-router";' : undefined,
  }] });
  [router, hookModule, resultView, speakingEntry, historyView, AuthProvider] = await Promise.all([
    vite.ssrLoadModule(routerId),
    vite.ssrLoadModule("/src/features/speaking/hooks/useSpeakingV2Stream.ts"),
    vite.ssrLoadModule("/src/features/speaking/views/SpeakingResultView.tsx"),
    vite.ssrLoadModule("/src/features/speaking/views/SpeakingEntry.tsx"),
    vite.ssrLoadModule("/src/features/speaking/views/SpeakingHistoryView.tsx"),
    vite.ssrLoadModule("/src/shared/hooks/useAuth.tsx"),
  ]);
});
after(async () => {
  await vite?.close(); dom?.window.close();
  delete globalThis.window; delete globalThis.document; delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

test("history keeps account tabs in the URL, shows sections in order, and completed loads only completed Topics", async t => {
  const groupCalls = []; const sessionItem = { ...session, status: "ENDED", assessmentStatus: "PARTIAL", committedTurnCount: 2, speechDurationMs: 18000 };
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const request = new URL(url); const path = request.pathname;
    if (path.endsWith("/auth/me")) return Response.json({ data: { id: "learner-1", email: "learner@example.test", role: "USER" } });
    if (path.endsWith("/history/topics")) {
      const group = request.searchParams.get("group"); groupCalls.push(group);
      const data = { ...historyFixture.groups.response.data, totals: { ...historyFixture.groups.response.data.totals, other: group === "OTHER" ? 0 : historyFixture.groups.response.data.totals.other }, items: group === "OTHER" ? [] : historyFixture.groups.response.data.items };
      return Response.json({ data });
    }
    if (path.endsWith("/sessions")) return Response.json({ data: { items: [sessionItem], page: 0, size: 6, hasNext: false } });
    throw new Error(`Unexpected request ${path} ${options.method}`);
  });
  const { createMemoryRouter, RouterProvider } = router;
  const appRouter = createMemoryRouter([{ path: "/speaking/history", Component: historyView.default }], { initialEntries: ["/speaking/history"] });
  const container = document.body.appendChild(document.createElement("div")); const root = createRoot(container);
  t.after(async () => { await act(async () => root.unmount()); appRouter.dispose(); container.remove(); });
  await act(async () => { root.render(h(AuthProvider.AuthProvider, null, h(RouterProvider, { router: appRouter }))); await wait(80); });
  assert.match(container.textContent, /Phiên luyện nói gần đây/);
  assert.ok(container.textContent.indexOf("Phiên luyện nói gần đây") < container.textContent.indexOf("Chủ đề đang học"));
  assert.match(container.textContent, /Luyện theo mục học/);
  assert.match(container.textContent, /18 giây nói/);
  assert.doesNotMatch(container.textContent, /Lịch sử khác/);
  const resultLink = [...container.querySelectorAll("a")].find(link => link.textContent.includes("Xem phiên"));
  assert.ok(resultLink?.getAttribute("href")?.includes("from=%2Fspeaking%2Fhistory"), "result route survives as a URL-backed history intent");
  assert.deepEqual(groupCalls.slice(-2), ["IN_PROGRESS", "OTHER"]);

  groupCalls.length = 0;
  const completedTab = [...container.querySelectorAll("a")].find(link => link.textContent.includes("Hoàn thành"));
  assert.ok(completedTab);
  await act(async () => { completedTab.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, button: 0, cancelable: true })); await wait(80); });
  assert.match(appRouter.state.location.search, /tab=COMPLETED/);
  assert.doesNotMatch(container.textContent, /Phiên luyện nói gần đây/);
  assert.deepEqual(groupCalls, ["COMPLETED"]);
});

test("parent history with zero sessions uses a neutral header when title metadata is absent", async t => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async url => {
    const path = new URL(url).pathname; calls.push(path);
    if (path.endsWith("/auth/me")) return Response.json({ data: { id: "learner-1", email: "learner@example.test", role: "USER" } });
    if (path.endsWith("/history/topics/topic-5/sessions")) return Response.json({ data: {
      items: [], page: 0, size: 20, hasNext: false, topicId: "topic-5", title: null, sessionCount: 0,
    } });
    throw new Error(`Unexpected request ${path}`);
  });
  const { createMemoryRouter, RouterProvider } = router;
  const appRouter = createMemoryRouter([{ path: "/speaking/history", Component: historyView.default }], {
    initialEntries: ["/speaking/history?parentTopicId=topic-5"],
  });
  const container = document.body.appendChild(document.createElement("div")); const root = createRoot(container);
  t.after(async () => { await act(async () => root.unmount()); appRouter.dispose(); container.remove(); });
  await act(async () => { root.render(h(AuthProvider.AuthProvider, null, h(RouterProvider, { router: appRouter }))); await wait(80); });
  assert.match(container.textContent, /Lịch sử chủ đề/);
  assert.match(container.textContent, /0 phiên thuộc chủ đề này/);
  assert.match(container.textContent, /Chưa có phiên Speaking trong chủ đề này/);
  assert.doesNotMatch(container.textContent, /Chủ đề không còn hiển thị/);
  assert.ok(calls.includes("/api/v1/speaking/history/topics/topic-5/sessions"));
  assert.equal(calls.filter(path => path.includes("/api/v1/topics/")).length, 0, "no Topic metadata request is needed to render the empty parent history");
});

test("denied new admission keeps resume and links exact history back to the same Topic Item workspace", async t => {
  const calls = [];
  const availability = { scope: session.scope, available: false, reason: "LEVEL_TOO_HIGH", activeSession: {
    sessionId: session.sessionId, scope: session.scope, status: "ACTIVE", controllerEpoch: 1,
  } };
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const parsed = new URL(url); calls.push({ path: parsed.pathname, method: options.method });
    if (parsed.pathname.endsWith("/availability")) return Response.json({ data: availability });
    if (parsed.pathname.endsWith(`/sessions/${session.sessionId}/resume`)) return Response.json({ data: session });
    if (parsed.pathname.endsWith(`/sessions/${session.sessionId}`)) return Response.json({ data: session });
    throw new Error(`Unexpected request ${parsed.pathname}`);
  });
  const { createMemoryRouter, RouterProvider } = router;
  function Entry() { return h(speakingEntry.SpeakingEntry, { scope: session.scope }); }
  function Workspace() { return h("p", null, "Workspace opened"); }
  const appRouter = createMemoryRouter([
    { path: "/topics/:topicId/items/:itemId/speaking", Component: Entry },
    { path: "/speaking/sessions/:sessionId", Component: Workspace },
  ], { initialEntries: ["/topics/t/items/i/speaking"] });
  const container = document.body.appendChild(document.createElement("div")); const root = createRoot(container);
  t.after(async () => { await act(async () => root.unmount()); appRouter.dispose(); container.remove(); });
  await act(async () => { root.render(h(RouterProvider, { router: appRouter })); await wait(60); });
  assert.match(container.textContent, /trình độ cao hơn/i);
  assert.doesNotMatch(container.textContent, /LEVEL_TOO_HIGH/);
  assert.match(container.textContent, /Bạn có một phiên đang mở/);
  assert.ok([...container.querySelectorAll("button")].some(button => button.textContent.includes("Tiếp tục luyện")));
  assert.ok(![...container.querySelectorAll("button")].some(button => button.textContent.includes("Thay bằng phiên mới")));
  const exactHistory = [...container.querySelectorAll("a")].find(link => link.textContent === "Lịch sử phiên của mục học này");
  assert.equal(exactHistory?.getAttribute("href"), "/speaking/history?scopeType=TOPIC_ITEM&topicId=t&topicItemId=i&from=%2Ftopics%2Ft%2Fitems%2Fi%2Fspeaking");
  const resume = [...container.querySelectorAll("button")].find(button => button.textContent.includes("Tiếp tục luyện"));
  await act(async () => { resume.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); await wait(40); });
  assert.ok(calls.some(call => call.path.endsWith("/resume") && call.method === "POST"));
  assert.match(container.textContent, /Workspace opened/);
});

test("a create-time access denial is localized when availability changed after its read", async t => {
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
  Object.defineProperty(dom.window.navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) } });
  t.after(() => { if (previousNavigator) Object.defineProperty(globalThis, "navigator", previousNavigator); else delete globalThis.navigator; });
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const path = new URL(url).pathname;
    if (path.endsWith("/availability")) return Response.json({ data: { scope: session.scope, available: true, reason: null, activeSession: null } });
    if (path.endsWith("/sessions") && options.method === "POST") return Response.json({ code: "LEVEL_TOO_HIGH", detail: "Learner level is below the Topic level" }, { status: 403 });
    throw new Error(`Unexpected request ${path}`);
  });
  const { createMemoryRouter, RouterProvider } = router;
  function Entry() { return h(speakingEntry.SpeakingEntry, { scope: session.scope }); }
  const appRouter = createMemoryRouter([{ path: "/entry", Component: Entry }], { initialEntries: ["/entry"] });
  const container = document.body.appendChild(document.createElement("div")); const root = createRoot(container);
  t.after(async () => { await act(async () => root.unmount()); appRouter.dispose(); container.remove(); });
  await act(async () => { root.render(h(RouterProvider, { router: appRouter })); await wait(50); });
  const start = [...container.querySelectorAll("button")].find(button => button.textContent.includes("Bắt đầu luyện nói"));
  assert.ok(start);
  await act(async () => { start.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); await wait(35); });
  assert.match(container.textContent, /Chủ đề này yêu cầu trình độ cao hơn cấp độ hiện tại/i);
  assert.doesNotMatch(container.textContent, /LEVEL_TOO_HIGH|Learner level/);
});

test("mounted V2 hook waits for admission, caps PCM and releases the microphone", async t => {
  const limitedSession = { ...session, limits: { ...session.limits, maxTurnAudioMs: 150 } };
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const path = new URL(url).pathname; requests.push(path);
    if (path.endsWith("/socket-ticket")) return Response.json({ data: { ticket: "one-time", expiresInSeconds: 30 } });
    if (path.endsWith(`/sessions/${session.sessionId}/turns`)) return Response.json({ data: { items: [], page: 0, size: 100, hasNext: false } });
    if (path.endsWith(`/sessions/${session.sessionId}`)) return Response.json({ data: limitedSession });
    throw new Error(`Unexpected request ${path}`);
  });
  const tracks = []; const streams = [];
  const media = { getUserMedia: async () => {
    const track = { onended: null, stopped: false, stop() { this.stopped = true; } }; tracks.push(track);
    const stream = { getTracks: () => [track] }; streams.push(stream); return stream;
  } };
  Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
  Object.defineProperty(dom.window.navigator, "mediaDevices", { value: media, configurable: true });
  class FakeAudioContext {
    state = "running"; audioWorklet = { addModule: async () => {} };
    createMediaStreamSource() { return { connect: target => target, disconnect() {} }; }
    createGain() { return { gain: { value: 1 }, connect: target => target }; }
    async close() { this.state = "closed"; }
  }
  class FakeAudioWorkletNode {
    static last;
    constructor() { FakeAudioWorkletNode.last = this; }
    port = { onmessage: null }; connect(target) { return target; } disconnect() {}
  }
  class FakeWebSocket {
    static OPEN = 1; static last;
    readyState = 0; sent = []; onopen = null; onclose = null; onmessage = null; onerror = null;
    constructor() { FakeWebSocket.last = this; }
    open() { this.readyState = FakeWebSocket.OPEN; this.onopen?.(); }
    send(value) { this.sent.push(value); }
    receive(value) { this.onmessage?.({ data: JSON.stringify(value) }); }
    close() { this.readyState = 3; this.onclose?.(); }
  }
  globalThis.AudioContext = FakeAudioContext; globalThis.AudioWorkletNode = FakeAudioWorkletNode; globalThis.WebSocket = FakeWebSocket; dom.window.WebSocket = FakeWebSocket;
  let state; const errors = [];
  const commands = () => FakeWebSocket.last.sent.filter(value => typeof value === "string").map(value => JSON.parse(value));
  function Probe() { state = hookModule.useSpeakingV2Stream(limitedSession, () => {}, message => errors.push(message)); return h("p", null, state.connection); }
  const container = document.body.appendChild(document.createElement("div")); const root = createRoot(container);
  t.after(async () => { await act(async () => root.unmount()); container.remove(); });
  await act(async () => { root.render(h(Probe)); await wait(50); });
  assert.ok(FakeWebSocket.last, `fake socket constructor was not used; WebSocket=${globalThis.WebSocket?.name}`);
  await act(async () => { FakeWebSocket.last.open(); await wait(50); });
  assert.equal(state.connection, "connected", `${errors.join(" | ")} requests=${requests.join(",")} socketState=${FakeWebSocket.last.readyState} hasOpen=${typeof FakeWebSocket.last.onopen}`);

  await act(async () => state.startTurn());
  assert.equal(tracks.length, 0, "microphone must remain closed before server admission");
  const startCommand = commands().find(message => message.type === "START_TURN");
  assert.ok(startCommand?.payload.clientTurnId);
  await act(async () => FakeWebSocket.last.receive({ type: "ERROR", sessionId: session.sessionId, requestId: "unrelated-request", payload: { code: "TURN_IN_PROGRESS", retryable: true } }));
  assert.equal(state.recording, "requesting", "an unrelated admission error must not unlock the pending start");
  assert.equal(tracks.length, 0, "an unrelated admission error must not open capture");
  await act(async () => FakeWebSocket.last.receive({ type: "ERROR", sessionId: session.sessionId, requestId: startCommand.requestId, payload: { code: "TURN_IN_PROGRESS", retryable: true } }));
  assert.equal(state.recording, "idle", "a matching admission error must restore the start control");
  assert.match(errors.at(-1), /lượt nói trước vẫn đang xử lý/i);

  await act(async () => state.startTurn());
  const retryStart = commands().filter(message => message.type === "START_TURN").at(-1);
  await act(async () => {
    FakeWebSocket.last.receive({ type: "ERROR", sessionId: session.sessionId, requestId: startCommand.requestId, payload: { code: "TURN_IN_PROGRESS", retryable: true } });
    FakeWebSocket.last.receive({ type: "TURN_ACCEPTED", sessionId: session.sessionId, requestId: startCommand.requestId, turnId: "stale-turn", sequence: 1, payload: { clientTurnId: startCommand.payload.clientTurnId } });
  });
  assert.equal(state.recording, "requesting", "a stale failure or acceptance must not alter the newer request");
  assert.equal(tracks.length, 0, "a stale acceptance must not open capture");
  await act(async () => { FakeWebSocket.last.receive({ type: "TURN_ACCEPTED", sessionId: session.sessionId, requestId: retryStart.requestId, turnId: "dff51e78-0b05-48c6-9ad8-a7fe456c2998", sequence: 1, payload: { clientTurnId: retryStart.payload.clientTurnId } }); await wait(); });
  assert.equal(tracks.length, 1, "microphone opens only after acceptance");
  assert.equal(state.recording, "recording");
  await act(async () => state.cancelTurn());
  assert.equal(tracks[0].stopped, true);
  assert.ok(commands().some(message => message.type === "CANCEL_TURN"));

  await act(async () => { FakeWebSocket.last.receive({ type: "TURN_SKIPPED", sessionId: session.sessionId, turnId: "dff51e78-0b05-48c6-9ad8-a7fe456c2998", payload: { code: "TURN_CANCELLED" } }); await wait(); });
  await act(async () => state.startTurn());
  const secondStart = commands().filter(message => message.type === "START_TURN").at(-1);
  await act(async () => { FakeWebSocket.last.receive({ type: "TURN_ACCEPTED", sessionId: session.sessionId, requestId: secondStart.requestId, turnId: "dff51e78-0b05-48c6-9ad8-a7fe456c2999", sequence: 2, payload: { clientTurnId: secondStart.payload.clientTurnId } }); await wait(); });
  const emitPcm = () => FakeAudioWorkletNode.last.port.onmessage({ data: { pcm: new ArrayBuffer(3200), rms: 0.1 } });
  await act(async () => { emitPcm(); emitPcm(); emitPcm(); });
  const audioFrames = FakeWebSocket.last.sent.filter(value => typeof value !== "string");
  assert.deepEqual(audioFrames.map(frame => frame.byteLength - 28), [3200, 1600]);
  assert.deepEqual(audioFrames.map(frame => new DataView(frame).getUint32(24)), [0, 1]);
  assert.equal(commands().filter(message => message.type === "END_TURN").length, 1);
  assert.equal(JSON.parse(FakeWebSocket.last.sent.at(-1)).type, "END_TURN");
  assert.equal(state.recording, "sealing");
  assert.equal(tracks[1].stopped, true, "reaching the PCM cap must release the microphone");

  await act(async () => { FakeWebSocket.last.receive({ type: "TURN_FAILED", sessionId: session.sessionId, turnId: "dff51e78-0b05-48c6-9ad8-a7fe456c2999", payload: { code: "STT_UNAVAILABLE", retryable: false } }); await wait(30); });
  assert.match(errors.at(-1), /nhận diện lời nói|bản chép lời/i, "STT failure should explain how to recover without showing a raw code");
  await act(async () => state.startTurn());
  const thirdStart = commands().filter(message => message.type === "START_TURN").at(-1);
  await act(async () => { FakeWebSocket.last.receive({ type: "TURN_ACCEPTED", sessionId: session.sessionId, requestId: thirdStart.requestId, turnId: "dff51e78-0b05-48c6-9ad8-a7fe456c3000", sequence: 3, payload: { clientTurnId: thirdStart.payload.clientTurnId } }); await wait(); });
  assert.equal(tracks[2].stopped, false);
  await act(async () => { FakeWebSocket.last.close(); await wait(); });
  await act(async () => { await wait(); });
  assert.equal(tracks[2].stopped, true, "socket disconnect must release capture tracks");
  assert.ok(requests.some(path => path.endsWith("/socket-ticket")));
});

test("mounted result distinguishes a missing score from numeric zero", async t => {
  const value = { ...session, status: "ENDED", assessmentStatus: "PARTIAL", endedAt: "2026-11-24T12:01:00Z" };
  const criterion = (score, maxScore) => ({ status: score === null ? "INSUFFICIENT_DATA" : "ASSESSED", score, maxScore, reason: null,
    sampleCount: 1, wordCount: null, speechDurationMs: 1000, accuracy: null, range: null, examples: [] });
  const assessment = { sessionId: value.sessionId, status: "PARTIAL", criteria: {
    pronunciation: criterion(null, 100), fluency: criterion(0, 100), grammar: criterion(null, 5), vocabulary: criterion(null, 5),
  }, feedback: { strengthsVi: [], improvementsVi: [], recommendationsVi: [], wordsToPractice: [{ word: "theory", accuracyScore: 0.4, errorType: "Mispronunciation" }] }, finalizedAt: value.endedAt };
  t.mock.method(globalThis, "fetch", async url => {
    const path = new URL(url).pathname;
    if (path.endsWith(`/sessions/${value.sessionId}/turns`)) return Response.json({ data: { items: [], page: 0, size: 100, hasNext: false } });
    if (path.endsWith(`/sessions/${value.sessionId}/assessment`)) return Response.json({ data: assessment });
    if (path.endsWith(`/sessions/${value.sessionId}`)) return Response.json({ data: value });
    throw new Error(`Unexpected request ${path}`);
  });
  const { createMemoryRouter, RouterProvider } = router;
  const historyOrigin = "/speaking/history?tab=COMPLETED&page=2";
  const appRouter = createMemoryRouter([{ path: "/speaking/sessions/:sessionId/result", Component: resultView.default }], { initialEntries: [`/speaking/sessions/${value.sessionId}/result?from=${encodeURIComponent(historyOrigin)}`] });
  const container = document.body.appendChild(document.createElement("div")); const root = createRoot(container);
  t.after(async () => { await act(async () => root.unmount()); appRouter.dispose(); container.remove(); });
  await act(async () => { root.render(h(RouterProvider, { router: appRouter })); await wait(50); });
  assert.match(container.textContent, /Chưa có điểm/);
  assert.match(container.textContent, /Chưa đủ dữ liệu/);
  assert.match(container.textContent, /0 \/ 100/);
  assert.match(container.textContent, /theory/);
  assert.match(container.textContent, /Cần luyện phát âm/);
  assert.equal([...container.querySelectorAll("a")].find(link => link.textContent === "Quay lại lịch sử")?.getAttribute("href"), historyOrigin);
  assert.doesNotMatch(container.textContent, /Mispronunciation/);
  assert.equal(container.querySelectorAll('[role="progressbar"]').length, 1, "only the assessed zero score has a progress indicator");
});

test("mounted result refreshes the terminal session and loads turns beyond the first page", async t => {
  let sessionReads = 0; let assessmentReads = 0; let failedTerminalPage = false;
  const closing = { ...session, status: "CLOSING", committedTurnCount: 29, finalizedTurnCount: 29, assessmentStatus: "PENDING" };
  const ended = { ...closing, status: "ENDED", committedTurnCount: 30, finalizedTurnCount: 30, assessmentStatus: "PARTIAL", endedAt: "2026-11-24T12:02:00Z" };
  const criterion = (score, maxScore) => ({ status: score === null ? "INSUFFICIENT_DATA" : "ASSESSED", score, maxScore, reason: null,
    sampleCount: 1, wordCount: null, speechDurationMs: 1000, accuracy: null, range: null, examples: [] });
  const assessment = { sessionId: session.sessionId, status: "PARTIAL", criteria: {
    pronunciation: criterion(null, 100), fluency: criterion(0, 100), grammar: criterion(null, 5), vocabulary: criterion(null, 5),
  }, feedback: { strengthsVi: [], improvementsVi: [], recommendationsVi: [], wordsToPractice: [] }, finalizedAt: ended.endedAt };
  const turn = sequence => ({ turnId: `turn-${sequence}`, clientTurnId: `client-${sequence}`, sequence, status: "COMPLETED",
    transcript: sequence === 30 ? "The final committed turn." : `Turn ${sequence}`, reply: null, hint: null, correction: null,
    learnerAudioAvailable: false, assistantAudioAvailable: false, audioStatus: null, replyDeliveredAt: null, speechDurationMs: 1000, reason: null });
  const pages = page => page === 0 ? Array.from({ length: 20 }, (_, index) => turn(index + 1)) : Array.from({ length: 10 }, (_, index) => turn(index + 21));
  t.mock.method(globalThis, "fetch", async url => {
    const request = new URL(url); const path = request.pathname;
    if (path.endsWith(`/sessions/${session.sessionId}/turns`)) {
      const page = Number(request.searchParams.get("page"));
      if (sessionReads > 1 && !failedTerminalPage) { failedTerminalPage = true; throw new Error("History temporarily unavailable"); }
      return Response.json({ data: { items: pages(page), page, size: 20, hasNext: page === 0 } });
    }
    if (path.endsWith(`/sessions/${session.sessionId}/assessment`)) {
      assessmentReads++;
      return Response.json({ data: assessmentReads === 1 ? { ...assessment, status: "PENDING" } : assessment });
    }
    if (path.endsWith(`/sessions/${session.sessionId}`)) {
      sessionReads++; return Response.json({ data: sessionReads === 1 ? closing : ended });
    }
    throw new Error(`Unexpected request ${path}`);
  });
  const { createMemoryRouter, RouterProvider } = router;
  const appRouter = createMemoryRouter([{ path: "/speaking/sessions/:sessionId/result", Component: resultView.default }], { initialEntries: [`/speaking/sessions/${session.sessionId}/result`] });
  const container = document.body.appendChild(document.createElement("div")); const root = createRoot(container);
  t.after(async () => { await act(async () => root.unmount()); appRouter.dispose(); container.remove(); });
  await act(async () => { root.render(h(RouterProvider, { router: appRouter })); await wait(100); });
  assert.match(container.textContent, /29 lượt hội thoại/);
  assert.match(container.textContent, /Turn 21/);
  await act(async () => { await wait(2700); });
  assert.match(container.textContent, /Kết quả một phần/, "final assessment remains visible when history refresh fails");
  assert.doesNotMatch(container.textContent, /PARTIAL/, "assessment enums are translated for learners");
  assert.match(container.textContent, /30 lượt hội thoại/, "the final session counters refresh even if turn history is temporarily unavailable");
  assert.match(container.textContent, /History temporarily unavailable/);
  const retry = [...container.querySelectorAll("button")].find(button => button.textContent.includes("Tải lại hội thoại"));
  assert.ok(retry, "failed history refresh exposes a retry action");
  await act(async () => { retry.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); await wait(50); });
  assert.match(container.textContent, /30 lượt hội thoại/, "terminal assessment refreshes the final session counters");
  assert.match(container.textContent, /The final committed turn\./, "all pages include the last committed turn");
});

test("mounted result stops its current audio before replay and when leaving the route", async t => {
  const value = { ...session, status: "ENDED", assessmentStatus: "UNAVAILABLE", endedAt: "2026-11-24T12:01:00Z",
    opening: { reply: "Welcome", hint: null, audioStatus: "AUDIO_READY", audioAvailable: true } };
  const turn = { turnId: "turn-audio", clientTurnId: "client-audio", sequence: 1, status: "COMPLETED", transcript: "Hello", reply: "Hi there", hint: null,
    correction: null, learnerAudioAvailable: true, assistantAudioAvailable: true, audioStatus: "AUDIO_READY", replyDeliveredAt: null, speechDurationMs: 1000, reason: null };
  const criterion = { status: "UNAVAILABLE", score: null, maxScore: 100, reason: null, sampleCount: 0, wordCount: null, speechDurationMs: null, accuracy: null, range: null, examples: [] };
  const assessment = { sessionId: value.sessionId, status: "UNAVAILABLE", criteria: { pronunciation: criterion, fluency: { ...criterion, maxScore: 100 }, grammar: { ...criterion, maxScore: 5 }, vocabulary: { ...criterion, maxScore: 5 } },
    feedback: { strengthsVi: [], improvementsVi: [], recommendationsVi: [], wordsToPractice: [] }, finalizedAt: value.endedAt };
  t.mock.method(globalThis, "fetch", async url => {
    const path = new URL(url).pathname;
    if (path.endsWith(`/sessions/${value.sessionId}/turns`)) return Response.json({ data: { items: [turn], page: 0, size: 100, hasNext: false } });
    if (path.endsWith(`/sessions/${value.sessionId}/assessment`)) return Response.json({ data: assessment });
    if (path.endsWith(`/sessions/${value.sessionId}/turns/${turn.turnId}/audio/AI_REPLY`)) return Response.json({ data: { url: "https://audio.test/reply", expiresInSeconds: 60 } });
    if (path.endsWith(`/sessions/${value.sessionId}/opening/audio`)) return Response.json({ data: { url: "https://audio.test/opening", expiresInSeconds: 60 } });
    if (path.endsWith(`/sessions/${value.sessionId}`)) return Response.json({ data: value });
    throw new Error(`Unexpected request ${path}`);
  });
  const previousAudio = globalThis.Audio; const audios = [];
  globalThis.Audio = class FakeAudio {
    constructor(url) { this.url = url; this.paused = false; this.onended = null; this.onerror = null; audios.push(this); }
    play() { return Promise.resolve(); }
    pause() { this.paused = true; }
  };
  t.after(() => { globalThis.Audio = previousAudio; });
  const { createMemoryRouter, RouterProvider } = router;
  const appRouter = createMemoryRouter([{ path: "/speaking/sessions/:sessionId/result", Component: resultView.default }, { path: "/other", Component: () => h("p", null, "Other route") }],
    { initialEntries: [`/speaking/sessions/${value.sessionId}/result`] });
  const container = document.body.appendChild(document.createElement("div")); const root = createRoot(container);
  t.after(async () => { await act(async () => root.unmount()); appRouter.dispose(); container.remove(); });
  await act(async () => { root.render(h(RouterProvider, { router: appRouter })); await wait(80); });
  const replyButtons = [...container.querySelectorAll('[aria-label="Nghe phản hồi AI"]')];
  const playOpening = replyButtons[0];
  const playReply = replyButtons[1];
  await act(async () => { playOpening.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); await wait(10); });
  assert.equal(audios.length, 1);
  await act(async () => { playReply.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); await wait(10); });
  assert.equal(audios.length, 2);
  assert.equal(audios[0].paused, true, "starting another clip stops the active one");
  await act(async () => { await appRouter.navigate("/other"); await wait(10); });
  assert.equal(audios[1].paused, true, "leaving the result route stops its owned audio");
});

test("mounted hook reconciles sealed and receiving turns and retries the same failed turn once", async t => {
  let restSession = session;
  const openingSession = { ...session, status: "INITIALIZING" };
  const persistedTurn = { turnId: "dff51e78-0b05-48c6-9ad8-a7fe456c2998", clientTurnId: "client", sequence: 28, status: "FAILED",
    transcript: "Could I have a tea?", reply: null, hint: null, correction: null, learnerAudioAvailable: true, assistantAudioAvailable: false,
    audioStatus: null, replyDeliveredAt: null, speechDurationMs: 1300, reason: "CONVERSATION_UNAVAILABLE" };
  t.mock.method(globalThis, "fetch", async url => {
    const path = new URL(url).pathname;
    if (path.endsWith("/socket-ticket")) return Response.json({ data: { ticket: "one-time", expiresInSeconds: 30 } });
    if (path.endsWith(`/sessions/${session.sessionId}/turns`)) {
      const page = Number(new URL(url).searchParams.get("page"));
      const firstPage = Array.from({ length: 20 }, (_, index) => ({ ...persistedTurn, turnId: `turn-${index + 1}`, sequence: index + 1, status: "COMPLETED" }));
      return Response.json({ data: { items: page === 0 ? firstPage : [persistedTurn], page, size: 20, hasNext: page === 0 } });
    }
    if (path.endsWith(`/sessions/${session.sessionId}`)) return Response.json({ data: restSession });
    throw new Error(`Unexpected request ${path}`);
  });
  class FakeWebSocket {
    static OPEN = 1; static instances = [];
    readyState = 0; sent = []; onopen = null; onclose = null; onmessage = null; onerror = null;
    constructor() { FakeWebSocket.instances.push(this); }
    open() { this.readyState = FakeWebSocket.OPEN; this.onopen?.(); }
    send(value) { this.sent.push(value); }
    receive(value) { this.onmessage?.({ data: JSON.stringify(value) }); }
    close() { this.readyState = 3; this.onclose?.(); }
  }
  globalThis.WebSocket = FakeWebSocket; dom.window.WebSocket = FakeWebSocket;
  let currentSession = openingSession; let state;
  function Probe() { state = hookModule.useSpeakingV2Stream(currentSession, value => { currentSession = value; }, () => {}); return h("p", null, state.connection); }
  const container = document.body.appendChild(document.createElement("div")); const root = createRoot(container);
  t.after(async () => { await act(async () => root.unmount()); container.remove(); });
  await act(async () => { root.render(h(Probe)); await wait(30); });
  assert.equal(FakeWebSocket.instances.length, 1, "connect while the session is INITIALIZING");
  const socket = FakeWebSocket.instances[0];
  await act(async () => { socket.open(); await wait(20); currentSession = session; root.render(h(Probe)); await wait(20); });
  assert.equal(FakeWebSocket.instances.length, 1, "keep the same socket when the session becomes ACTIVE");
  await act(async () => socket.receive({ type: "OPENING_RESULT", sessionId: session.sessionId, payload: {
    reply: "Welcome. What would you like to drink?", hint: null, audioStatus: "AUDIO_READY", audioAvailable: true,
  } }));
  assert.equal(currentSession.opening.reply, "Welcome. What would you like to drink?");
  const played = [];
  class FakeAudio { constructor(url) { this.url = url; this.onended = null; this.onerror = null; } play() { played.push(this.url); return Promise.resolve(); } pause() {} }
  globalThis.Audio = FakeAudio;
  t.mock.method(URL, "createObjectURL", () => "blob:opening-audio");
  t.mock.method(URL, "revokeObjectURL", () => {});
  const audioFrame = new Uint8Array(30); audioFrame.set([0x53, 0x50, 0x4b, 0x32], 0); audioFrame[4] = 2; audioFrame[29] = 0x01;
  await act(async () => {
    socket.receive({ type: "TTS_STARTED", sessionId: session.sessionId, payload: { mimeType: "audio/wav" } });
    socket.onmessage({ data: audioFrame.buffer });
    socket.receive({ type: "TTS_COMPLETED", sessionId: session.sessionId, payload: { byteLength: 2 } });
    await wait(20);
  });
  assert.equal(played.at(-1), "blob:opening-audio", "opening speech uses streamed playback");
  assert.equal(state.playing, true);

  await act(async () => socket.receive({ type: "SESSION_STATE", sessionId: session.sessionId, payload: { ...session,
    activeTurn: { turnId: persistedTurn.turnId, sequence: persistedTurn.sequence, clientTurnId: "client", status: "RECEIVING" } } }));
  assert.equal(state.recoverableTurn?.turnId, persistedTurn.turnId);
  await act(async () => socket.receive({ type: "SESSION_STATE", sessionId: session.sessionId, payload: { ...session, finalizedTurnCount: 1,
    activeTurn: null } }));
  assert.equal(state.recoverableTurn, null, "a finalized skipped/failed attempt clears when finalizedTurnCount advances");

  const receivingTurn = { turnId: "dff51e78-0b05-48c6-9ad8-a7fe456c2997", sequence: 5, clientTurnId: "client-2", status: "RECEIVING" };
  await act(async () => socket.receive({ type: "SESSION_STATE", sessionId: session.sessionId, payload: { ...session, finalizedTurnCount: 1, activeTurn: receivingTurn } }));
  assert.equal(state.recoverableTurn?.turnId, receivingTurn.turnId);
  await act(async () => socket.receive({ type: "SESSION_STATE", sessionId: session.sessionId, payload: { ...session, finalizedTurnCount: 1, activeTurn: null } }));
  assert.equal(state.recoverableTurn, null, "ordered current-socket state can confirm cancellation without counter changes");

  await act(async () => socket.receive({ type: "SESSION_STATE", sessionId: session.sessionId, payload: { ...session, finalizedTurnCount: 1, committedTurnCount: 1, activeTurn: null } }));
  restSession = { ...session, finalizedTurnCount: 1, committedTurnCount: 0, activeTurn: { ...receivingTurn } };
  await act(async () => { await state.sync(); await wait(10); });
  assert.equal(currentSession.finalizedTurnCount, 1);
  assert.equal(currentSession.committedTurnCount, 1, "stale REST snapshots cannot regress committed counters or resurrect old active turns");
  restSession = { ...session, finalizedTurnCount: 0, committedTurnCount: 1, activeTurn: { ...receivingTurn } };
  await act(async () => { await state.sync(); await wait(10); });
  assert.equal(currentSession.finalizedTurnCount, 1, "stale REST snapshots cannot regress finalized counters either");

  await act(async () => socket.receive({ type: "SESSION_STATE", sessionId: session.sessionId, payload: { ...session, finalizedTurnCount: 1,
    committedTurnCount: 1, activeTurn: receivingTurn } }));
  await act(async () => state.discardRecoveredTurn());
  assert.ok(socket.sent.map(value => JSON.parse(value)).some(message => message.type === "CANCEL_TURN" && message.turnId === receivingTurn.turnId));
  await act(async () => socket.receive({ type: "TURN_SKIPPED", sessionId: session.sessionId, turnId: receivingTurn.turnId, payload: { code: "TURN_CANCELLED" } }));

  await act(async () => socket.receive({ type: "SESSION_STATE", sessionId: session.sessionId, payload: { ...session, finalizedTurnCount: 1, committedTurnCount: 1,
    activeTurn: { turnId: persistedTurn.turnId, sequence: persistedTurn.sequence, clientTurnId: "client", status: "GENERATING" } } }));
  assert.equal(state.recording, "processing", "sealed server work stays pending until a terminal event");
  await act(async () => socket.receive({ type: "TURN_FAILED", sessionId: session.sessionId, turnId: persistedTurn.turnId,
    payload: { code: "CONVERSATION_UNAVAILABLE", retryable: true, message: "Provider temporarily unavailable" } }));
  await act(async () => { await wait(50); });
  assert.equal(state.retryableTurnId, persistedTurn.turnId);
  await act(async () => { state.retryFailedTurn(persistedTurn.turnId); state.retryFailedTurn(persistedTurn.turnId); });
  const retries = socket.sent.map(value => JSON.parse(value)).filter(message => message.type === "RETRY_TURN");
  assert.equal(retries.length, 1);
  assert.equal(retries[0].turnId, persistedTurn.turnId);
  assert.ok(retries[0].requestId, "retry command carries a correlation ID");
  await act(async () => socket.receive({ type: "TURN_PROCESSING", sessionId: session.sessionId, turnId: persistedTurn.turnId, requestId: retries[0].requestId, payload: { status: "GENERATING" } }));
  assert.equal(state.retryableTurnId, null);

  await act(async () => socket.receive({ type: "SESSION_STATE", sessionId: session.sessionId, payload: { ...session, finalizedTurnCount: 1, committedTurnCount: 1, status: "CLOSING" } }));
  currentSession = { ...session, finalizedTurnCount: 1, committedTurnCount: 1, status: "CLOSING" };
  await act(async () => { root.render(h(Probe)); await wait(10); });
  assert.equal(socket.readyState, FakeWebSocket.OPEN, "retain socket across ACTIVE to CLOSING");
  await act(async () => socket.receive({ type: "SESSION_ENDED", sessionId: session.sessionId, payload: { ...session, finalizedTurnCount: 1, committedTurnCount: 1, status: "ENDED", endedAt: "2026-11-24T12:02:00Z" } }));
  assert.equal(currentSession.status, "ENDED", "terminal state is delivered over the retained socket");
});

test("mounted hook reconnects without reopening sealed audio or applying stale socket events", async t => {
  let durableSession = session;
  const requests = [];
  t.mock.method(globalThis, "fetch", async url => {
    const path = new URL(url).pathname; requests.push(path);
    if (path.endsWith("/socket-ticket")) return Response.json({ data: { ticket: `ticket-${requests.filter(item => item.endsWith("/socket-ticket")).length}`, expiresInSeconds: 30 } });
    if (path.endsWith(`/sessions/${session.sessionId}/turns`)) return Response.json({ data: { items: [], page: 0, size: 100, hasNext: false } });
    if (path.endsWith(`/sessions/${session.sessionId}`)) return Response.json({ data: durableSession });
    throw new Error(`Unexpected request ${path}`);
  });
  class FakeWebSocket {
    static OPEN = 1; static instances = [];
    readyState = 0; sent = []; onopen = null; onclose = null; onmessage = null; onerror = null;
    constructor() { FakeWebSocket.instances.push(this); }
    open() { this.readyState = FakeWebSocket.OPEN; this.onopen?.(); }
    send(value) { this.sent.push(value); }
    receive(value) { this.onmessage?.({ data: JSON.stringify(value) }); }
    close() { this.readyState = 3; this.onclose?.(); }
  }
  globalThis.WebSocket = FakeWebSocket; dom.window.WebSocket = FakeWebSocket;
  let currentSession = session; let state;
  function Probe() { state = hookModule.useSpeakingV2Stream(currentSession, value => { currentSession = value; }, () => {}); return h("p", null, state.connection); }
  const container = document.body.appendChild(document.createElement("div")); const root = createRoot(container);
  t.after(async () => { await act(async () => root.unmount()); container.remove(); });
  await act(async () => { root.render(h(Probe)); await wait(30); });
  const first = FakeWebSocket.instances[0]; assert.ok(first);
  await act(async () => { first.open(); await wait(30); });
  durableSession = { ...session, activeTurn: { turnId: "dff51e78-0b05-48c6-9ad8-a7fe456c2998", sequence: 7, clientTurnId: "client", status: "GENERATING" } };
  await act(async () => { first.close(); await wait(20); });
  await act(async () => { await wait(2150); });
  assert.equal(FakeWebSocket.instances.length, 2, "a fresh ticket creates a replacement socket");
  const second = FakeWebSocket.instances[1];
  await act(async () => { second.open(); await wait(50); });
  assert.equal(state.recording, "processing", "durable sealed work is reconciled without starting a new recording");
  const previousSession = currentSession;
  await act(async () => first.receive({ type: "SESSION_ENDED", sessionId: session.sessionId, payload: { ...session, status: "ENDED" } }));
  assert.equal(currentSession, previousSession, "a stale socket cannot overwrite the current session");
  assert.equal(requests.filter(path => path.endsWith("/socket-ticket")).length, 2);
  assert.equal(requests.some(path => path.endsWith("/end")), false, "disconnect does not end the session");
});
