import assert from "node:assert/strict";
import test from "node:test";
import { HttpService } from "../src/shared/services/http.service.ts";

test("POST combines JSON, operation headers and same-origin cookies", async () => {
  const calls = [];
  const service = new HttpService("http://localhost", async (url, init) => {
    calls.push({ url, init });
    return Response.json({ data: { ok: true } });
  });
  const result = await service.post("/api/v1/items", { name: "one" }, { headers: { "Idempotency-Key": "key-1" }, params: { page: "2" } });
  assert.deepEqual(result, { data: { ok: true } });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.credentials, "same-origin");
  assert.equal(new URL(calls[0].url).searchParams.get("page"), "2");
  assert.equal(calls[0].init.headers.get("Idempotency-Key"), "key-1");
  assert.equal(calls[0].init.headers.get("Content-Type"), "application/json");
  assert.equal(calls[0].init.headers.get("Accept"), "application/json");
  assert.deepEqual(JSON.parse(calls[0].init.body), { name: "one" });
});

test("401 refresh retries once with the original body and headers", async () => {
  const calls = [];
  const service = new HttpService("http://localhost", async (url, init) => {
    calls.push({ url, init });
    return url.endsWith("/auth/refresh") ? new Response(null, { status: 200 }) :
      calls.length === 1 ? new Response(null, { status: 401 }) : Response.json({ data: 1 });
  });
  const result = await service.post("/api/v1/items", { value: 1 }, { headers: { "Idempotency-Key": "same-key" } });
  assert.deepEqual(result, { data: 1 });
  assert.deepEqual(calls.map(call => new URL(call.url).pathname), ["/api/v1/items", "/api/v1/auth/refresh", "/api/v1/items"]);
  assert.equal(calls[2].init.headers.get("Idempotency-Key"), "same-key");
  assert.equal(calls[2].init.body, calls[0].init.body);
});

test("auth endpoint 401 and forbidden response never trigger refresh", async () => {
  const calls = [];
  const service = new HttpService("http://localhost", async (url) => {
    calls.push(url);
    return new Response(null, { status: url.includes("login") ? 401 : 403 });
  });
  await assert.rejects(service.post("/api/v1/auth/login", {}), error => error.status === 401);
  await assert.rejects(service.get("/api/v1/items"), error => error.status === 403);
  assert.equal(calls.length, 2);
});

test("GET appends params and forwards the abort signal", async () => {
  const controller = new AbortController();
  const service = new HttpService("http://localhost", async (url, init) => {
    assert.equal(new URL(url).searchParams.get("status"), "ACTIVE");
    assert.equal(init.signal, controller.signal);
    return Response.json({ data: [] });
  });
  await service.get("/api/v1/items", { params: { status: "ACTIVE" }, signal: controller.signal });
});
