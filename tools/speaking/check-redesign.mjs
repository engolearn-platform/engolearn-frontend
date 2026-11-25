import { createServer } from "vite";
import { WebSocketServer } from "ws";
import { execFileSync, spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";

const output = resolve(process.env.SPEAKING_EVIDENCE_DIR ?? "../screen-shot/speaking-v2");
const mode = process.argv[2] ?? "after";
const chromePath = process.env.SPEAKING_CHROME_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const appPort = Number(process.env.SPEAKING_EVIDENCE_PORT ?? 3013);
const sessionPath = "/speaking/sessions/";
const topicId = "cafe";
let longTurnCount = 14;
const longTurn = i => ({
  ...baseTurn, turnId: "turn-" + i, sequence: i + 1, transcript: `For order ${i + 1}, I'd like a cup of tea, please.`,
});
const intro = {
  reply: "Good morning! What can I get for you today?",
  hint: { exampleEn: "Could I have a cup of tea, please?", explanationVi: "Dùng “Could I have…” để gọi đồ uống một cách lịch sự." },
  audioStatus: "AUDIO_READY", audioAvailable: true,
};
const baseTurn = {
  turnId: "8e079cc2-c83d-4bdc-96eb-a9d053e15416", clientTurnId: "request-1", sequence: 1, status: "COMPLETED",
  transcript: "I would like a tea with two sugar.", reply: "Of course! Would you like anything to eat with that?",
  hint: { exampleEn: "A slice of cake would be great.", explanationVi: "Bạn có thể gọi thêm món ăn hoặc nói rằng bạn chỉ muốn đồ uống." },
  correction: { type: "GRAMMAR", original: "two sugar", suggested: "two spoonfuls of sugar", explanationVi: "Dùng đơn vị đếm với danh từ không đếm được “sugar”." },
  learnerAudioAvailable: true, assistantAudioAvailable: true, audioStatus: "AUDIO_READY",
  replyDeliveredAt: "2026-11-24T12:00:30Z", speechDurationMs: 5100, reason: null,
};
const turnsFor = id => id === "opening" ? [] : id === "long" ? Array.from({ length: longTurnCount }, (_, i) => longTurn(i)) : [baseTurn];

// A local PCM clip keeps the production Audio API in the loop.
const sampleRate = 8000;
const wav = Buffer.alloc(44 + sampleRate * 2);
wav.write("RIFF");
wav.writeUInt32LE(wav.length - 8, 4);
wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(wav.length - 44, 40);

function session(id) {
  const status = ["ready", "partial", "unavailable", "pending"].includes(id) ? "ENDED" : "ACTIVE";
  const turns = turnsFor(id);
  return {
    sessionId: id, scope: { type: "TOPIC", topicId, topicItemId: null },
    context: { title: "Ordering at a Café", topicTitle: "Ordering at a Café", topicItemTitle: null, level: "A2",
      description: "You are ordering a drink at a neighborhood café.", learnerRole: "Customer", aiRole: "Barista" },
    status, assessmentStatus: status === "ACTIVE" ? "PENDING" : id.toUpperCase(), controllerEpoch: 1,
    wsPath: "/fixture-speaking/socket", endReason: null, createdAt: "2026-11-24T12:00:00Z",
    startedAt: "2026-11-24T12:00:00Z", endedAt: status === "ENDED" ? "2026-11-24T12:01:00Z" : null,
    opening: intro, finalizedTurnCount: turns.length, committedTurnCount: turns.length, speechDurationMs: turns.length * 5100,
    limits: { maxTurns: 30, maxSessionMs: 1200000, maxTurnAudioMs: 120000 }, activeTurn: null,
  };
}

function assessment(id) {
  const criterion = (score, maxScore, status = "ASSESSED", reason = null) =>
    ({ score, maxScore, status, reason, sampleCount: 1, wordCount: 12, speechDurationMs: 5100, accuracy: null, range: null, examples: [] });
  const pending = session(id).assessmentStatus === "PENDING";
  const unavailable = id === "unavailable";
  const partial = id === "partial";
  const provider = (maxScore) => criterion(null, maxScore, "UNAVAILABLE", "LANGUAGE_PROVIDER_UNAVAILABLE");
  return {
    sessionId: id, status: session(id).assessmentStatus, finalizedAt: pending ? null : "2026-11-24T12:01:00Z",
    criteria: {
      pronunciation: pending ? criterion(null, 100, null) : unavailable ? provider(100) : criterion(91.71428571428571, 100),
      fluency: pending ? criterion(null, 100, null) : partial || unavailable ? criterion(null, 100, "INSUFFICIENT_DATA", "INSUFFICIENT_AUDIO_EVIDENCE") : criterion(86, 100),
      grammar: pending ? criterion(null, 5, null) : partial || unavailable ? provider(5) : criterion(4.2, 5),
      vocabulary: pending ? criterion(null, 5, null) : unavailable ? provider(5) : criterion(4, 5),
    },
    feedback: {
      strengthsVi: id === "ready" ? ["Bạn gọi món rõ ràng và lịch sự."] : [],
      improvementsVi: id === "ready" ? ["Chú ý dùng đơn vị đếm khi nói về đường."] : [],
      recommendationsVi: id === "ready" ? ["Luyện gọi đồ uống và bánh trong cùng một câu."] : [],
      wordsToPractice: partial || id === "ready" ? [{ word: "spoonfuls", accuracyScore: 62, errorType: "Mispronunciation" }] : [],
    },
  };
}

const profile = await mkdtemp(join(tmpdir(), "speaking-ui-"));
const requests = [];
const ws = new WebSocketServer({ noServer: true });
const sockets = new Map();
const server = await createServer({
  server: { host: "127.0.0.1", port: appPort, strictPort: true, hmr: false },
  plugins: [{
    name: "speaking-ui-fixtures",
    enforce: "pre",
    load(id) {
      const view = id.replaceAll("\\", "/").match(/\/src\/features\/speaking\/views\/(Speaking(?:Session|Result)View\.tsx)$/)?.[1];
      if (mode === "before" && view) {
        const revision = process.env.SPEAKING_BASELINE_REVISION ?? "HEAD";
        return execFileSync("git", ["show", `${revision}:src/features/speaking/views/${view}`], { encoding: "utf8" });
      }
    },
    configureServer(vite) {
      vite.middlewares.use((req, res, next) => {
        const path = new URL(req.url, "http://localhost").pathname;
        if (path === "/fixture-silence.wav") {
          res.setHeader("Content-Type", "audio/wav");
          res.end(wav);
          return;
        }
        if (!path.startsWith("/api/")) return next();
        requests.push(`${req.method} ${path}`);
        const respond = (data) => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ data, timestamp: "2026-11-24T12:00:00Z" }));
        };
        if (path === "/api/v1/auth/me") return respond({ id: "fixture-user", email: "learner@example.test", role: "USER" });
        if (path === "/api/v1/profile/me") return respond({ displayName: "Learner" });
        if (path === "/api/v1/topic-learning/viewer") return respond({
          kind: "LEARNER", learnerId: "fixture-user", displayName: "Learner", cefrLevel: "A2",
        });
        if (path === "/api/v1/speaking/availability") return respond({ available: true, reason: null, activeSession: null });
        if (path === "/api/v1/speaking/sessions" && req.method === "POST") return respond(session("opening"));
        const match = path.match(/^\/api\/v1\/speaking\/sessions\/([^/]+)(\/.*)?$/);
        if (match) {
          const [, id, operation] = match;
          if (!operation) return respond(session(id));
          if (operation === "/turns") return respond({ items: turnsFor(id), page: 0, size: 100, hasNext: false });
          if (operation === "/assessment") return respond(assessment(id));
          if (operation === "/socket-ticket") return respond({ ticket: id, expiresInSeconds: 30 });
          if (operation.includes("/audio")) return respond({ url: "/fixture-silence.wav", expiresInSeconds: 30 });
        }
        res.statusCode = 404;
        respond(null);
      });
      vite.httpServer.on("upgrade", (req, socket, head) => {
        const url = new URL(req.url, "http://localhost");
        if (url.pathname !== "/fixture-speaking/socket") return;
        const id = url.searchParams.get("ticket");
        ws.handleUpgrade(req, socket, head, client => {
          requests.push(`WS ${id}`);
          sockets.set(id, client);
          client.on("message", (raw, binary) => {
            if (binary) return;
            const { type, requestId, payload } = JSON.parse(raw);
            const turnId = "7e079cc2-c83d-4bdc-96eb-a9d053e15416";
            const send = (eventType, eventPayload) => client.send(JSON.stringify({
              type: eventType, payload: eventPayload, requestId, turnId, sessionId: id, sequence: 2,
            }));
            if (type === "START_TURN") send("TURN_ACCEPTED", { clientTurnId: payload.clientTurnId });
            if (type === "END_TURN") send("TURN_PROCESSING", {});
            if (type === "CANCEL_TURN") send("TURN_SKIPPED", { code: "TURN_CANCELLED" });
          });
        });
      });
    },
  }],
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(action, message) {
  for (let i = 0; i < 80; i++) {
    const value = await action();
    if (value) return value;
    await sleep(150);
  }
  throw new Error(message);
}

let chrome;
let client;
try {
  await mkdir(output, { recursive: true });
  await server.listen();
  chrome = spawn(chromePath, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
    "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--disable-background-networking", "about:blank",
  ], { windowsHide: true, stdio: "ignore" });
  const port = await until(async () => (await readFile(join(profile, "DevToolsActivePort"), "utf8").catch(() => "")).split("\n")[0], "Chrome did not launch");
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  client = new WebSocket(tabs.find(tab => tab.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { client.onopen = resolve; client.onerror = reject; });
  const pending = new Map();
  let index = 0;
  client.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(message.error.message));
    else waiter.resolve(message.result);
  };
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++index;
    pending.set(id, { resolve, reject });
    client.send(JSON.stringify({ method, params, id }));
  });
  await cdp("Page.enable");
  const evaluate = async expression => {
    const response = await cdp("Runtime.evaluate", { expression, returnByValue: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description ?? expression);
    return response.result.value;
  };
  async function waitForText(text) {
    try {
      await until(() => evaluate(`document.body?.innerText.includes(${JSON.stringify(text)})`), `Missing: ${text}`);
    } catch (error) {
      console.error(await evaluate("document.body?.innerText.slice(0, 700)"));
      console.error(requests.slice(-10));
      throw error;
    }
  }
  const open = async (id, result = false, width = 1440, height = 1000) => {
    await cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
    const url = `http://127.0.0.1:${appPort}${sessionPath}${id}${result ? "/result" : ""}`;
    await cdp("Page.navigate", { url });
    await until(() => evaluate(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete'`), "Route failed to load");
    await waitForText("Ordering at a Café");
    await waitForText(intro.reply);
    if (!result) await waitForText("Đã kết nối");
    await sleep(250);
    await checkOverflow(width);
  };
  const checkOverflow = async width => {
    const overflow = await evaluate("Math.max(document.documentElement.scrollWidth, document.querySelector('main')?.scrollWidth ?? 0) - innerWidth");
    assert.ok(overflow <= 0, `Horizontal overflow at ${width}px: ${overflow}px`);
    const timelineOverflow = await evaluate(`Math.max(0, ...[...document.querySelectorAll('[aria-label="Hội thoại"] div')]
      .filter(element => getComputedStyle(element).overflowY === "auto")
      .map(element => element.scrollWidth - element.clientWidth))`);
    assert.ok(timelineOverflow <= 0, `Timeline overflow at ${width}px: ${timelineOverflow}px`);
  };
  const capture = async name => {
    const { data } = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(join(output, `${name}.png`), Buffer.from(data, "base64"));
    console.log(`Saved ${name}.png`);
  };
  const click = async (selector, text) => {
    const success = await evaluate(`(() => {
      const element = [...document.querySelectorAll(${JSON.stringify(selector)})].find(el => el.textContent.includes(${JSON.stringify(text)}));
      if (!element || element.disabled) return false;
      element.click(); return true;
    })()`);
    assert.ok(success, `Missing or disabled ${selector}: ${text}`);
  };
  const expandWithKeyboard = async text => {
    const focused = await evaluate(`(() => {
      const summary = [...document.querySelectorAll('summary')].find(el => el.textContent.includes(${JSON.stringify(text)}));
      summary?.focus();
      return !!summary && document.activeElement === summary;
    })()`);
    assert.ok(focused, `Disclosure is not keyboard-focusable: ${text}`);
    const key = { key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 };
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", text: "\r", unmodifiedText: "\r", ...key });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", ...key });
    assert.ok(await evaluate("document.activeElement.parentElement.open"), `Enter did not expand: ${text}`);
  };
  const scrollableTimeline = "[aria-label='Hội thoại']";
  const timelineMetrics = () => evaluate(`(() => {
    const region = document.querySelector(${JSON.stringify(scrollableTimeline)});
    const scroller = [region, ...(region?.querySelectorAll('div') ?? [])].find(el =>
      el && getComputedStyle(el).overflowY === 'auto' && el.scrollHeight > el.clientHeight);
    if (!scroller) return null;
    return { top: scroller.scrollTop, remaining: scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight };
  })()`);
  if (mode === "before") {
    await open("exchange");
    await capture("before-workspace");
    await open("partial", true);
    await capture("before-assessment");
  } else {
    await open("opening");
    await capture("01-workspace-opening");
    await open("exchange");
    await capture("02-workspace-exchange");
    await expandWithKeyboard("Gợi ý trả lời");
    await expandWithKeyboard("Gợi ý sửa câu");
    await waitForText(baseTurn.correction.explanationVi);
    await capture("03-workspace-details");
    await click("button", "Nhấn để nói");
    await until(() => evaluate("[...document.querySelectorAll('button')].some(b => b.textContent.includes('Dừng và gửi'))"), "Recording did not start");
    await click("button", "Kết thúc phiên");
    await waitForText("Bạn đang ghi âm");
    assert.ok(await evaluate("document.querySelector('[role=dialog]')?.contains(document.activeElement)"), "End confirmation did not receive keyboard focus");
    await click("[role=dialog] button", "Tiếp tục nói");
    await click("button", "Dừng và gửi");
    await sleep(350);
    await capture("04-workspace-processing");
    const socketCount = requests.filter(value => value.startsWith("WS ")).length;
    await open("ready", true);
    await waitForText("91,7");
    assert.equal(await evaluate("document.querySelectorAll('main').length"), 1, "Result has more than one main landmark");
    assert.equal(await evaluate("document.querySelectorAll('[role=progressbar],progress').length"), 4);
    await capture("05-assessment-ready");
    await open("partial", true);
    await waitForText("Chưa đủ dữ liệu");
    await capture("06-assessment-partial");
    await open("unavailable", true);
    await waitForText("Chưa thể đánh giá");
    assert.equal(await evaluate("document.querySelectorAll('[role=progressbar],progress').length"), 0);
    await capture("07-assessment-unavailable");
    await open("ready", true);
    await evaluate("document.querySelector('main').scrollTo(0, document.querySelector('main').scrollHeight)");
    await sleep(200);
    await capture("08-saved-conversation");
    assert.equal(requests.filter(value => value.startsWith("WS ")).length, socketCount, "Saved result opened a WebSocket");
    assert.equal(requests.filter(value => value === "POST /api/v1/speaking/sessions").length, 0, "Opening a result created a session");
    await open("exchange", false, 390, 844);
    await capture("09-mobile-workspace");
    await open("ready", true, 390, 844);
    await capture("10-mobile-assessment");
    for (const width of [768, 1280]) {
      await open("exchange", false, width, 900);
      await capture(`workspace-${width}`);
      await open("partial", true, width, 900);
      await capture(`assessment-${width}`);
    }
    await open("pending", true);
    await waitForText("Đang đánh giá");
    await open("exchange");
    sockets.get("exchange").close();
    await waitForText("Đang nối lại");
    assert.ok(await evaluate("document.querySelector('button[data-speaking-control]')?.disabled"), "Recording stayed enabled during reconnect");
    await waitForText("Đã kết nối");
    await open("long");
    await capture("workspace-long");
    assert.ok((await timelineMetrics())?.remaining < 130, "Long conversation must open at the latest turn");
    await evaluate(`[...document.querySelectorAll(${JSON.stringify(`${scrollableTimeline}, ${scrollableTimeline} div`)})]
      .find(el => getComputedStyle(el).overflowY === 'auto' && el.scrollHeight > el.clientHeight).scrollTo(0, 0)`);
    await sleep(200);
    longTurnCount++;
    await until(() => evaluate(`document.body.innerText.includes(${JSON.stringify(longTurn(longTurnCount - 1).transcript)})`), "The appended turn did not load");
    assert.ok((await timelineMetrics())?.top < 50, "An appended turn moved the reader away from older messages");
    await click("button", "mới nhất");
    assert.ok((await timelineMetrics())?.remaining < 130, "Jump action did not reach the latest turn");
    await open("ready", true);
    await click("button,a", "Luyện tập lại");
    await until(() => evaluate("location.pathname === '/topics/cafe/speaking'"), "Practice again did not return to the scoped Speaking entry");
    await waitForText("Bắt đầu luyện nói");
    await click("button", "Bắt đầu luyện nói");
    await until(() => evaluate("location.pathname === '/speaking/sessions/opening'"), "The entry did not open the new session");
    assert.equal(requests.filter(value => value === "POST /api/v1/speaking/sessions").length, 1);
    await open("ready", true);
    await click("a,button", "Quay lại chủ đề");
    await until(() => evaluate("location.pathname === '/topics/cafe/speaking'"), "Back did not navigate to the originating topic scope");
  }
  console.log(`Browser checks completed (${mode}).`);
} finally {
  client?.close();
  chrome?.kill();
  for (const connection of ws.clients) connection.terminate();
  ws.close();
  server.httpServer?.closeAllConnections();
  await server.close();
  await rm(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 250 }).catch(() => {});
}
