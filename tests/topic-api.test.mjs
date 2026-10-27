import assert from "node:assert/strict";
import test from "node:test";
import { checkContract, renderTypes } from "../scripts/generate-topic-api-types.mjs";
import { readFile } from "node:fs/promises";
import { createTopicApi } from "../src/features/topic/services/topic-api.service.ts";
import { createTopicApiClient, TopicApiError } from "../src/features/topic/services/topic-api-client.ts";

const spec = await checkContract();
const success = data => Response.json({ data, timestamp: "2026-10-27T10:00:00Z" });
const schema = name => spec.components.schemas[name];

function example(value) {
  if (value.$ref) return example(schema(value.$ref.split("/").at(-1)));
  if (value.anyOf) return value.anyOf.some(child => child.type === "null") ? null : example(value.anyOf[0]);
  if (value.oneOf) return example(value.oneOf[0]);
  if ("const" in value) return value.const;
  if (value.enum) return value.enum[0];
  if (value.type === "object") return Object.fromEntries(Object.entries(value.properties).map(([key, child]) => [key, example(child)]));
  if (value.type === "array") return Array.from({ length: value.minItems ?? 0 }, () => example(value.items));
  if (value.type === "integer") return value.minimum ?? 0;
  if (value.type === "boolean") return false;
  if (value.type === "null") return null;
  return value.format === "date-time" ? "2026-10-27T10:00:00Z" : "resource-1";
}

function validate(value, definition) {
  if (definition.$ref) return validate(value, schema(definition.$ref.split("/").at(-1)));
  if (definition.anyOf || definition.oneOf) {
    assert.ok((definition.anyOf ?? definition.oneOf).some(child => {
      try { validate(value, child); return true; } catch { return false; }
    }), "Value must match a union member");
    return;
  }
  if ("const" in definition) assert.equal(value, definition.const);
  if (definition.enum) assert.ok(definition.enum.includes(value));
  if (definition.type === "null") return assert.equal(value, null);
  if (definition.type === "object") {
    assert.ok(value && typeof value === "object" && !Array.isArray(value));
    for (const key of definition.required ?? []) assert.ok(Object.hasOwn(value, key), "Missing " + key);
    if (definition.additionalProperties === false) for (const key of Object.keys(value)) assert.ok(Object.hasOwn(definition.properties, key), "Unexpected " + key);
    for (const [key, child] of Object.entries(definition.properties)) if (Object.hasOwn(value, key)) validate(value[key], child);
  } else if (definition.type === "array") {
    assert.ok(Array.isArray(value));
    if (definition.minItems !== undefined) assert.ok(value.length >= definition.minItems);
    if (definition.maxItems !== undefined) assert.ok(value.length <= definition.maxItems);
    value.forEach(child => validate(child, definition.items));
  } else {
    assert.equal(typeof value, definition.type === "integer" ? "number" : definition.type);
    if (definition.type === "integer") assert.ok(Number.isInteger(value));
    if (definition.minimum !== undefined) assert.ok(value >= definition.minimum);
    if (definition.maximum !== undefined) assert.ok(value <= definition.maximum);
  }
}

test("generated wire types match the source contract", async () => {
  const generated = await readFile(new URL("../src/features/topic/types/topic-api.types.ts", import.meta.url), "utf8");
  assert.equal(generated.replace(/\r\n/g, "\n"), renderTypes(spec));
});

test("all client operations agree with contract routes, bodies and idempotency", async t => {
  const mutation = { idempotencyKey: "selection-001" };
  const calls = {
    getViewer: api => api.getViewer(),
    browseTopics: api => api.browseTopics(),
    getMyTopics: api => api.getMyTopics(),
    getTopicDetail: api => api.getTopicDetail("topic-1"),
    getTopicProgress: api => api.getTopicProgress("topic-1"),
    startAttempt: api => api.startAttempt("item-1", { mode: "LEARN", retrySessionId: null, replaceRetrySessionId: null }, mutation),
    getAttempt: api => api.getAttempt("attempt-1"),
    recordAttemptAccess: api => api.recordAttemptAccess("attempt-1", mutation),
    getAttemptContent: api => api.getAttemptContent("attempt-1"),
    advanceContent: api => api.advanceContent("attempt-1", { revision: 0, stage: "CONTEXT", itemIndex: 0 }, mutation),
    getCurrentQuiz: api => api.getCurrentQuiz("attempt-1"),
    answerQuiz: api => api.answerQuiz("attempt-1", "quiz-1", { revision: 2, optionId: "option-1" }, mutation),
    getItemResult: api => api.getItemResult("attempt-1"),
    getItemReview: api => api.getItemReview("attempt-1"),
    getTopicResult: api => api.getTopicResult("topic-1"),
    startTopicRetry: api => api.startTopicRetry("topic-1", { replaceRetrySessionId: null }, mutation),
    getRetrySession: api => api.getRetrySession("session-1"),
  };
  assert.equal(Object.values(spec.paths).flatMap(Object.values).length, Object.keys(calls).length);
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      await t.test(operation.operationId, async () => {
        let count = 0;
        const envelope = operation.responses["200"].content["application/json"].schema;
        const payload = example(envelope);
        const api = createTopicApi({ fetchImpl: async (input, init) => {
          count++;
          const pathname = new URL(input, "http://localhost").pathname.slice("/api/v1".length);
          const pattern = new RegExp("^" + path.replace(/\{\w+\}/g, "[^/]+") + "$");
          assert.match(pathname, pattern);
          assert.equal(init.method, method.toUpperCase());
          assert.equal(init.credentials, "same-origin");
          assert.equal(init.headers.has("Authorization"), false);
          if (method === "post") {
            assert.equal(init.headers.get("Idempotency-Key"), mutation.idempotencyKey);
            if (operation.requestBody) validate(JSON.parse(init.body), operation.requestBody.content["application/json"].schema);
            else assert.equal(init.body, undefined);
          } else assert.equal(init.body, undefined);
          return Response.json(payload);
        } });
        const result = await calls[operation.operationId](api);
        assert.deepEqual(result, payload.data);
        assert.equal(count, 1);
      });
    }
  }
});

test("query encoding preserves Vietnamese search, filters and opaque cursors", async () => {
  const api = createTopicApi({ baseUrl: "http://localhost:8080/api/v1/", fetchImpl: async input => {
    const url = new URL(input);
    assert.equal(url.pathname, "/api/v1/topics");
    assert.equal(url.searchParams.get("keyword"), "Ăn & uống?");
    assert.equal(url.searchParams.get("level"), "C2");
    assert.equal(url.searchParams.get("cursor"), "a+/b==");
    assert.equal(url.searchParams.get("limit"), "12");
    return success(example(schema("TopicPageDto")));
  } });
  await api.browseTopics({ keyword: "Ăn & uống?", level: "C2", cursor: "a+/b==", limit: 12 });
});

test("IDs remain one encoded path segment", async () => {
  let path;
  const api = createTopicApi({ fetchImpl: async input => { path = input; return success({}); } });
  await api.getAttempt("part/with?reserved#value");
  assert.equal(path, "/api/v1/topic-attempts/part%2Fwith%3Freserved%23value");
  assert.throws(() => api.getAttempt(".."), TypeError);
  assert.throws(() => api.getAttempt(" "), TypeError);
});

test("guest and every CEFR viewer can be tested without impersonation headers", async () => {
  const viewers = [
    { kind: "GUEST", learnerId: null, displayName: null, cefrLevel: null },
    ...schema("CefrLevelDto").enum.map(level => ({ kind: "LEARNER", learnerId: "fixture-" + level, displayName: level, cefrLevel: level })),
  ];
  for (const viewer of viewers) {
    validate(viewer, schema("ViewerDto"));
    const api = createTopicApi({ fetchImpl: async (input, init) => {
      assert.equal(input, "/api/v1/topic-learning/viewer");
      assert.equal(init.headers.has("X-User-Id"), false);
      assert.equal(init.headers.has("Authorization"), false);
      return success(viewer);
    } });
    assert.deepEqual(await api.getViewer(), viewer);
  }
});

test("ProblemDetail keeps stable code/status; legacy problems get HTTP fallback", async () => {
  for (const status of [400, 401, 404, 409, 422, 503]) {
    const api = createTopicApi({ fetchImpl: async () => Response.json({ type: "about:blank", title: "Error", status, detail: "Reason", code: "STATE_CHANGED" }, { status }) });
    await assert.rejects(api.getAttempt("a"), error => error instanceof TopicApiError && error.status === status && error.code === "STATE_CHANGED" && error.detail === "Reason");
  }
  const legacy = createTopicApi({ fetchImpl: async () => Response.json({ detail: "Old contract" }, { status: 422 }) });
  await assert.rejects(legacy.getViewer(), error => error.code === "HTTP_422");
});

test("malformed success never becomes mock data, guest, or empty list", async () => {
  for (const payload of [{}, { data: null, timestamp: "now" }, { data: {} }, { data: [], timestamp: "now" }, { data: "oops", timestamp: "now" }]) {
    const api = createTopicApi({ fetchImpl: async () => Response.json(payload) });
    await assert.rejects(api.getViewer(), error => error.code === "INVALID_RESPONSE");
  }
  const html = createTopicApi({ fetchImpl: async () => new Response("<html>proxy error</html>") });
  await assert.rejects(html.getViewer(), error => error.code === "INVALID_RESPONSE");
});

test("non-JSON errors produce a safe fallback", async () => {
  const api = createTopicApi({ fetchImpl: async () => new Response("<script>upstream</script>", { status: 503 }) });
  await assert.rejects(api.getViewer(), error => error.status === 503 && error.code === "HTTP_503" && !error.message.includes("<script>"));
});

test("AbortSignal cancellation passes through without becoming NETWORK_ERROR", async () => {
  const controller = new AbortController();
  const api = createTopicApi({ fetchImpl: async (_input, init) => {
    assert.equal(init.signal, controller.signal);
    return new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true }));
  } });
  const request = api.getViewer(controller.signal);
  controller.abort();
  await assert.rejects(request, error => error.name === "AbortError" && !(error instanceof TopicApiError));
});

test("transport does not automatically retry an uncertain mutation", async () => {
  const keys = [];
  const api = createTopicApi({ fetchImpl: async (_input, init) => {
    keys.push(init.headers.get("Idempotency-Key"));
    throw new TypeError("connection lost");
  } });
  const body = { revision: 1, optionId: "option-1" };
  const mutation = { idempotencyKey: "same-action" };
  await assert.rejects(api.answerQuiz("a", "q", body, mutation), error => error.code === "NETWORK_ERROR");
  assert.deepEqual(keys, ["same-action"]);
  await assert.rejects(api.answerQuiz("a", "q", body, mutation), error => error.code === "NETWORK_ERROR");
  assert.deepEqual(keys, ["same-action", "same-action"]);
});

test("missing mutation identity fails before any network call", async () => {
  let calls = 0;
  const client = createTopicApiClient({ fetchImpl: async () => { calls++; return success({}); } });
  for (const key of [undefined, "", " ", "a\r\nb", "x".repeat(129)]) {
    await assert.rejects(client.request("POST", "/test", { idempotencyKey: key, body: {} }), TypeError);
  }
  assert.equal(calls, 0);
});

test("base URL rejects malformed query/fragment/protocol-relative configuration", () => {
  for (const baseUrl of ["", "//other.test/api", "/api?token=secret", "/api#x", "relative"]) {
    assert.throws(() => createTopicApiClient({ baseUrl }), TypeError);
  }
});

test("a correct-answer mutation carries only optionId and revision", async () => {
  const api = createTopicApi({ fetchImpl: async (_input, init) => {
    const body = JSON.parse(init.body);
    assert.deepEqual(Object.keys(body).sort(), ["optionId", "revision"]);
    return success(example(schema("QuizAnswerDto")));
  } });
  await api.answerQuiz("a", "q", { revision: 4, optionId: "option-2" }, { idempotencyKey: "answer-4" });
});


test("an already-aborted request never reaches fetch", async () => {
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  const api = createTopicApi({ fetchImpl: async () => { calls++; return success({}); } });
  await assert.rejects(api.getViewer(controller.signal), error => error.name === "AbortError");
  assert.equal(calls, 0);
});

test("cancellation while decoding does not return a stale successful payload", async () => {
  const controller = new AbortController();
  const api = createTopicApi({ fetchImpl: async () => ({
    ok: true,
    status: 200,
    json: async () => {
      controller.abort();
      return { data: example(schema("ViewerDto")), timestamp: "2026-10-27T10:00:00Z" };
    },
  }) });
  await assert.rejects(api.getViewer(controller.signal), error => error.name === "AbortError");
});


test("documented success examples satisfy their declared response schemas", () => {
  let examplesChecked = 0;
  for (const methods of Object.values(spec.paths)) {
    for (const operation of Object.values(methods)) {
      const content = operation.responses["200"].content["application/json"];
      for (const entry of Object.values(content.examples ?? {})) {
        validate(entry.value, content.schema);
        examplesChecked++;
      }
    }
  }
  assert.ok(examplesChecked >= 7);
});
