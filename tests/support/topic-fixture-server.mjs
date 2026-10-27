import http from "node:http";
import { readFile } from "node:fs/promises";
const spec = JSON.parse(await readFile(new URL("../../docs/handout/topic-learning/api.openapi.yaml", import.meta.url), "utf8"));
function sample(s) {
  if (s.$ref) return sample(spec.components.schemas[s.$ref.split("/").at(-1)]);
  if (s.anyOf) return null;
  if (s.oneOf) return sample(s.oneOf[0]);
  if ("const" in s) return s.const;
  if (s.enum) return s.enum[0];
  if (s.type === "object") return Object.fromEntries(Object.entries(s.properties).map(([k, v]) => [k, sample(v)]));
  if (s.type === "array") return [];
  if (s.type === "integer") return s.minimum ?? 0;
  if (s.type === "boolean") return false;
  return s.format === "date-time" ? new Date().toISOString() : "fixture";
}
const make = name => sample(spec.components.schemas[name]);
const clock = () => new Date().toISOString();
const levels = ["A1", "A1", "A1", "A1", "A1", "A2", "B1", "A1", "A2", "B1", "B2", "A1", "C1", "C2", "A1", "A2", "B1"];
const titles = ["Thói quen hằng ngày", "Ẩm thực & Gọi món", "Gia đình & Bạn bè", "Mua sắm & Giá cả", "Du lịch & Sân bay", "Giao tiếp Công sở & Email", "Môi trường & Cuộc sống", "Khách sạn & Đặt phòng", "Sức khỏe & Thể thao", "Học tập & Công việc", "Âm nhạc & Giải trí", "Phương tiện & Đi lại", "Công nghệ hằng ngày", "Lễ hội & Văn hóa", "Ở quán cà phê", "Cuối tuần của bạn", "Hẹn gặp bạn bè"];
const ids = titles.map((_, i) => (i + 1).toString(16).padStart(24, "0"));
const itemId = (id, n) => (1000 + ids.indexOf(id) * 10 + n).toString(16).padStart(24, "0");
const scenario = { kind: "LEARNER", level: "A1", fail: "", mineEmpty: false };
let records, attempts;
const calls = [];
const allow = (allowed, reason = null) => ({ allowed, reason: allowed ? null : reason });
function reset() {
  records = new Map([[ids[0], { completed: 2, index: 2, attemptId: "attempt-daily", accessed: clock() }], [ids[1], { completed: 5, index: null, attemptId: null, accessed: clock() }]]);
  attempts = new Map();
  if (scenario.mineEmpty) records.clear();
}
reset();
function eligible(id) { return scenario.kind === "LEARNER" && ["A1", "A2", "B1", "B2", "C1", "C2"].indexOf(levels[ids.indexOf(id)]) <= ["A1", "A2", "B1", "B2", "C1", "C2"].indexOf(scenario.level); }
function summary(id) {
  const state = records.get(id), count = state?.completed ?? 0;
  return { status: count === 5 ? "COMPLETED" : state ? "IN_PROGRESS" : "NOT_STARTED", completedItemCount: count, totalItemCount: 5, percent: count * 20 };
}
function card(id) {
  const i = ids.indexOf(id);
  return { ...make("TopicCardDto"), topicId: id, titleVi: titles[i], titleEn: "Topic " + (i + 1), cefrLevel: levels[i], coverUrl: "http://127.0.0.1:4317/__fixture-image/" + i, vocabularyCount: 15, quizCount: 30, durationMinutes: 45 + i, totalItemCount: 5, progress: scenario.kind === "GUEST" ? null : summary(id), hasNewContent: id === ids[1], startAvailability: allow(eligible(id), scenario.kind === "GUEST" ? "SIGN_IN_REQUIRED" : "LEVEL_TOO_LOW"), lastAccessedAt: records.get(id)?.accessed ?? null };
}
function attempt(id, topic = ids[0], index = 2, mode = "LEARN") {
  if (attempts.has(id)) return attempts.get(id);
  const complete = id.startsWith("completed-");
  const value = { ...make("AttemptDto"), attemptId: id, topicId: topic, topicItemId: itemId(topic, index), topicItemVersionId: "version-1", version: 1, mode, status: complete ? "COMPLETED" : "IN_PROGRESS", revision: 1, position: complete ? null : { stage: id === "attempt-daily" ? "VOCAB" : "CONTEXT", itemIndex: id === "attempt-daily" ? 1 : 0 }, progress: { completedStepCount: complete ? 11 : id === "attempt-daily" ? 2 : 0, totalStepCount: 11, percent: complete ? 100 : id === "attempt-daily" ? 18 : 0, learnedVocabularyCount: 0, learnedExpressionCount: 0, completedQuizCount: complete ? 6 : 0, totalQuizCount: 6 }, retrySessionId: null, startedAt: clock(), lastAccessedAt: clock(), completedAt: complete ? clock() : null };
  return value;
}
function detail(id) {
  const state = records.get(id), guest = scenario.kind === "GUEST";
  const value = { ...make("TopicDetailDto"), topicId: id, titleVi: card(id).titleVi, titleEn: card(id).titleEn, cefrLevel: card(id).cefrLevel, description: "Luyện giao tiếp qua các tình huống thực tế. Học từ vựng và mẫu câu để tự tin sử dụng tiếng Anh mỗi ngày.", durationMinutes: 50, vocabularyCount: 15, expressionCount: 15, quizCount: 30, progress: guest ? null : summary(id), hasNewContent: id === ids[1], retryAvailability: allow(!guest && eligible(id) && summary(id).status === "COMPLETED", guest ? "SIGN_IN_REQUIRED" : "NOT_COMPLETED") };
  value.items = Array.from({ length: 5 }, (_, n) => {
    const complete = (state?.completed ?? 0) > n, running = !!state && state.index === n;
    const canStart = !guest && !complete && !running && n === (state?.completed ?? 0) && eligible(id);
    const reason = guest ? "SIGN_IN_REQUIRED" : !eligible(id) ? "LEVEL_TOO_LOW" : complete ? "ALREADY_COMPLETED" : "PREDECESSOR_INCOMPLETE";
    return { ...make("TopicItemSummaryDto"), topicItemId: itemId(id, n), title: ["Giới thiệu bản thân & Thói quen cơ bản", "Buổi sáng năng động", "Lịch trình làm việc & Đi lại", "Thời gian dành cho gia đình", "Thư giãn & Chuẩn bị nghỉ ngơi"][n], description: "Thực hành những câu giao tiếp quen thuộc trong một tình huống cụ thể.", durationMinutes: 10, vocabularyCount: 3, expressionCount: 3, quizCount: 6, learningStatus: guest ? null : complete ? "COMPLETED" : running ? "IN_PROGRESS" : "NOT_STARTED", hasNewContent: !guest && complete && id === ids[1] && n === 0, actions: { start: allow(canStart, reason), continue: allow(!guest && running, "NO_RUNNING_ATTEMPT"), review: allow(!guest && complete, "NOT_COMPLETED"), retry: allow(!guest && complete && eligible(id), !eligible(id) ? "LEVEL_TOO_LOW" : "NOT_COMPLETED"), resumeRetry: allow(false, "NO_RUNNING_ATTEMPT"), restartRetry: allow(false, "NO_RUNNING_ATTEMPT") }, learningAttempt: !guest && running ? { attemptId: state.attemptId, position: attempt(state.attemptId, id, n).position } : null, completedAttemptId: !guest && complete ? "completed-" + id + "-" + n : null };
  });
  return value;
}
export async function startTopicFixtureServer(port = 4317) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1:" + port);
    const send = (data, status = 200) => { res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify(status < 400 ? { data, timestamp: clock() } : data)); };
    const error = (status, code) => send({ type: "about:blank", title: "Fixture error", status, detail: "Test fixture failure", code }, status);
    let body = ""; for await (const chunk of req) { body += chunk; if (body.length > 65536) return error(400, "INVALID_REQUEST"); }
    if (url.pathname === "/__scenario" && req.method === "POST") { Object.assign(scenario, JSON.parse(body || "{}")); reset(); calls.length = 0; return send(scenario); }
    if (url.pathname === "/__requests") return send(calls);
    if (url.pathname.startsWith("/__fixture-image/")) {
      const i = Number(url.pathname.split("/").at(-1));
      res.writeHead(200, { "Content-Type": "image/svg+xml" });
      return res.end('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><rect width="800" height="450" fill="' + ["#c5dcd5", "#e2d3bc", "#d5e0e9", "#e3d7ca"][i % 4] + '"/><circle cx="620" cy="90" r="180" fill="#fff" opacity=".2"/><path d="M200 300v-150q85-35 170 0 85-35 170 0v150q-85-35-170 0-85-35-170 0Z" fill="#fff" opacity=".7"/><path d="M370 150v150m-120-100h65m-65 35h65m110-35h65m-65 35h65" stroke="#006565" stroke-width="6" opacity=".5"/></svg>');
    }
    calls.push({ method: req.method, path: url.pathname, search: url.search });
    const path = url.pathname.replace(/^\/api\/v1/, "");
    if (scenario.fail === "viewer" && path === "/topic-learning/viewer") return error(503, "SERVICE_UNAVAILABLE");
    if (path === "/topic-learning/viewer") return send(scenario.kind === "GUEST" ? { kind: "GUEST", learnerId: null, displayName: null, cefrLevel: null } : { kind: "LEARNER", learnerId: "fixture-" + scenario.level, displayName: "Học viên", cefrLevel: scenario.level });
    if (path === "/topics" || path === "/topics/mine") {
      const mine = path.endsWith("/mine");
      if (mine && scenario.kind === "GUEST") return error(401, "SIGN_IN_REQUIRED");
      if (scenario.fail === "topics" || scenario.fail === "more" && url.searchParams.has("cursor")) return error(503, "SERVICE_UNAVAILABLE");
      let rows = ids.filter(id => mine ? records.has(id) && summary(id).status === (url.searchParams.get("status") ?? "IN_PROGRESS") : scenario.kind === "GUEST" || !records.has(id));
      if (!mine && url.searchParams.get("level")) rows = rows.filter(id => levels[ids.indexOf(id)] === url.searchParams.get("level"));
      if (!mine && url.searchParams.get("keyword")) rows = rows.filter(id => titles[ids.indexOf(id)].toLocaleLowerCase("vi").includes(url.searchParams.get("keyword").toLocaleLowerCase("vi")));
      if (!mine) rows.sort((a, b) => url.searchParams.get("sort") === "duration" ? ids.indexOf(a) - ids.indexOf(b) : levels[ids.indexOf(a)].localeCompare(levels[ids.indexOf(b)]) || ids.indexOf(a) - ids.indexOf(b));
      else rows.sort((a, b) => (records.get(b).accessed ?? "").localeCompare(records.get(a).accessed ?? ""));
      const start = Number(url.searchParams.get("cursor") ?? "0"), limit = Number(url.searchParams.get("limit") ?? "12");
      return send({ items: rows.slice(start, start + limit).map(card), total: rows.length, nextCursor: start + limit < rows.length ? String(start + limit) : null, hasMore: start + limit < rows.length, ...(mine ? { counts: { inProgress: [...records.keys()].filter(id => summary(id).status === "IN_PROGRESS").length, completed: [...records.keys()].filter(id => summary(id).status === "COMPLETED").length } } : {}) });
    }
    const topic = path.match(/^\/topics\/([^/]+)(\/progress|\/retry-sessions)?$/);
    if (topic) {
      const id = topic[1]; if (!ids.includes(id)) return error(404, "CONTENT_UNAVAILABLE");
      if (topic[2] === "/progress") {
        if (scenario.kind === "GUEST") return error(401, "SIGN_IN_REQUIRED");
        if (scenario.fail === "progress") return error(503, "SERVICE_UNAVAILABLE");
        const p = summary(id);
        return send({ ...make("TopicProgressDto"), topicId: id, ...p, lastAccessedAt: records.get(id)?.accessed ?? null, metrics: { learnedVocabularyCount: p.completedItemCount * 3, totalVocabularyCount: 15, learnedExpressionCount: p.completedItemCount * 3, totalExpressionCount: 15, completedQuizCount: p.completedItemCount * 6, totalQuizCount: 30 }, hasNewContent: id === ids[1] });
      }
      if (!topic[2]) return send(detail(id));
      const data = { ...make("RetrySessionDto"), retrySessionId: "retry-" + id, topicId: id, scope: "TOPIC", status: "IN_PROGRESS", itemIds: Array.from({ length: 5 }, (_, n) => itemId(id, n)), completedItemIds: [], currentAttemptId: "attempt-retry-" + id, startedAt: clock() };
      attempts.set(data.currentAttemptId, { ...attempt(data.currentAttemptId, id, 0, "RETRY"), retrySessionId: data.retrySessionId }); return send(data);
    }
    const start = path.match(/^\/topic-items\/([^/]+)\/attempts$/);
    if (start) {
      if (scenario.kind === "GUEST") return error(401, "SIGN_IN_REQUIRED");
      let found; for (const topicId of ids) for (let n = 0; n < 5; n++) if (itemId(topicId, n) === start[1]) found = { topicId, n };
      if (!found) return error(404, "CONTENT_UNAVAILABLE");
      if (!eligible(found.topicId)) return error(422, "LEVEL_TOO_LOW");
      const payload = JSON.parse(body), id = "attempt-" + found.topicId + "-" + payload.mode;
      const data = attempt(id, found.topicId, found.n, payload.mode); attempts.set(id, data);
      if (payload.mode === "LEARN") records.set(found.topicId, { completed: 0, index: found.n, attemptId: id, accessed: clock() });
      return send(data);
    }
    const entry = path.match(/^\/topic-attempts\/([^/]+)(\/review|\/access)?$/);
    if (entry) {
      if (scenario.kind === "GUEST") return error(401, "SIGN_IN_REQUIRED");
      const id = entry[1], match = id.match(/^completed-(\w+)-(\d+)$/);
      const data = attempt(id, match?.[1] ?? ids[0], Number(match?.[2] ?? "2"));
      if (entry[2] === "/access") return send({ lastAccessedAt: clock() });
      return send(entry[2] === "/review" ? { attempt: data, content: make("LessonContentDto"), quizzes: [] } : data);
    }
    return error(404, "CONTENT_UNAVAILABLE");
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(port, "127.0.0.1", resolve); });
  return server;
}
