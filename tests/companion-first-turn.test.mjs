import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
let dom, vite, auth, companion;
before(async () => {
  dom = new JSDOM("<!doctype html><body></body>", { url: "https://engolearn.test/" });
  globalThis.window = dom.window; globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vite = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true }, appType: "custom" });
  auth = await vite.ssrLoadModule("/src/shared/hooks/useAuth.tsx");
  companion = await vite.ssrLoadModule("/src/features/companion/state/CompanionProvider.tsx");
});
after(async () => { await vite?.close(); dom?.window.close(); delete globalThis.window; delete globalThis.document; delete globalThis.IS_REACT_ACT_ENVIRONMENT; });
const now = "2026-11-27T00:00:00Z";
const conversation = (id, title, messageCount = 0) => ({ id, title, createdAt: now, updatedAt: now, messageCount, maxMessages: 100, warningThreshold: 80 });
const envelope = data => Response.json({ data });
const problem = (status, code) => Response.json({ code, detail: code }, { status });
const sse = (...events) => new Response(events.map(([event, data]) => "event: "+event+"\ndata: "+JSON.stringify(data)+"\n\n").join(""), { headers: { "Content-Type": "text/event-stream" } });
const statusFor = (req, state = "ACTIVE") => ({
  turnId: req.turnId, state,
  conversation: state === "CANCELLED" ? null : conversation("new-id", req.content.trim().slice(0,65), state === "COMPLETED" ? 2 : 1),
  userMessage: state === "CANCELLED" ? null : { id: "u1", sequence: 1, role: "USER", content: req.content, createdAt: now },
  assistantMessage: state === "COMPLETED" ? { id: "a1", sequence: 2, role: "ASSISTANT", content: "answer", createdAt: now } : null,
  retryEligible: state === "INCOMPLETE"
});
async function mount(t, onFirst, onMessages = () => envelope({ items: [], nextBeforeSequence: null })) {
  const calls = []; let current, currentAuth, first, result, account = true;
  t.mock.method(globalThis, "fetch", async (url, options = {}) => {
    const path = new URL(url, "https://engolearn.test/").pathname;
    const method = options.method || "GET";
    calls.push({ path, method, body: options.body ? JSON.parse(options.body) : null });
    if (path === "/api/v1/auth/me") return account ? envelope({ id: "account-1", email: "test@example.test", role: "USER" }) : problem(401, "UNAUTHORIZED");
    if (path === "/api/v1/auth/logout") { account = false; return new Response(null, { status: 204 }); }
    if (path === "/api/v1/auth/refresh") return problem(401, "UNAUTHORIZED");
    if (path.endsWith("/usage")) return envelope({ items: [] });
    if (path === "/api/v1/companion/conversations") return envelope({ items: result?.conversation ? [result.conversation] : [], nextCursor: null });
    if (path.endsWith("/messages")) return onMessages(path, new URL(url, "https://engolearn.test/"), options);
    if (path === "/api/v1/companion/first-turns") {
      first = JSON.parse(options.body);
      return onFirst(first, options, value => { result = value; });
    }
    if (path === "/api/v1/companion/first-turns/"+first?.turnId+"/cancel") {
      result = statusFor(first, "CANCELLED"); return envelope(result);
    }
    if (path === "/api/v1/companion/first-turns/"+first?.turnId) return result ? envelope(result) : problem(404, "FIRST_TURN_NOT_FOUND");
    if (path.endsWith("/turns")) return problem(429, "QUOTA_EXHAUSTED");
    throw new Error("Unexpected path "+method+" "+path);
  });
  dom.window.confirm = () => true;
  function Probe() { current = companion.useCompanion(); currentAuth = auth.useAuth(); return null; }
  const el = document.createElement("div"); document.body.appendChild(el); const root = createRoot(el);
  await act(async () => { root.render(h(auth.AuthProvider, null, h(companion.CompanionProvider, null, h(Probe)))); });
  t.after(async () => { await act(async () => root.unmount()); el.remove(); });
  return { get c() { return current; }, get auth() { return currentAuth; }, calls, get first() { return first; } };
}
test("lazy New Chat is local; Home send creates independent canonical first turn", async t => {
  const m = await mount(t, (req, opts, set) => {
    const completed = statusFor(req, "COMPLETED"); set(completed);
    return sse(["admitted", statusFor(req)], ["delta", { text: "answer" }], ["completed", { turnId: req.turnId, assistantMessage: completed.assistantMessage, messageCount: 2, maxMessages: 100, warning: false }]);
  });
  await act(async () => { m.c.startNewConversation(); m.c.startNewConversation(); });
  assert.equal(m.c.state.activeConversation, null);
  assert.equal(m.c.state.mode, "conversation");
  assert.equal(m.calls.filter(c => c.method === "POST").length, 0);
  await act(async () => m.c.openConversation(conversation("old-id", "old")));
  await act(async () => { m.c.setMode("home"); m.c.setDraft("  my new title  "); });
  await act(async () => m.c.submitTurn());
  assert.equal(m.c.state.activeConversation.id, "new-id");
  assert.equal(m.c.state.activeConversation.title, "my new title");
  assert.equal(m.c.state.draft, "");
  assert.deepEqual(m.c.state.messages.map(x => x.id), ["u1","a1"]);
  assert.equal(m.calls.filter(c => c.method === "POST").length, 1);
  assert.equal(m.calls.find(c => c.method === "POST").path, "/api/v1/companion/first-turns");
});
test("unknown receipt blocks resend until explicit cancellation", async t => {
  const m = await mount(t, () => problem(503, "SERVER_UNAVAILABLE"));
  await act(async () => { m.c.startNewConversation(); m.c.setDraft("unknown"); });
  await act(async () => m.c.submitTurn());
  assert.equal(m.c.state.firstAdmissionPending, true);
  assert.equal(m.c.state.pendingQuestion.content, "unknown");
  assert.equal(m.c.state.draft, "unknown");
  await act(async () => { m.c.startNewConversation(); await m.c.submitTurn(); });
  assert.equal(m.calls.filter(c => c.method === "POST").length, 1);
  await act(async () => m.c.checkFirstAdmission(true));
  assert.equal(m.c.state.firstAdmissionPending, false);
  assert.equal(m.c.state.pendingQuestion, null);
  assert.equal(m.c.state.activeConversation, null);
  assert.equal(m.c.state.draft, "unknown");
  assert.equal(m.calls.filter(c => c.method === "POST").length, 2);
});
test("executor failure resolves admitted first turn and exposes eligible retry", async t => {
  const m = await mount(t, (req, opts, set) => { set(statusFor(req, "INCOMPLETE")); return problem(503, "STREAM_CAPACITY_EXCEEDED"); });
  await act(async () => { m.c.startNewConversation(); m.c.setDraft("accepted"); });
  await act(async () => m.c.submitTurn());
  assert.equal(m.c.state.firstAdmissionPending, false);
  assert.equal(m.c.state.activeConversation.id, "new-id");
  assert.equal(m.c.state.retryAvailable, true);
  assert.equal(m.c.state.draft, "");
  await act(async () => m.c.retryTurn());
  const retry = m.calls.find(c => c.path.endsWith("/new-id/turns"));
  assert.equal(retry.body.turnId, m.first.turnId);
  assert.equal(retry.body.retry, true);
});
test("explicit discard can be declined without losing draft or context", async t => {
  const m = await mount(t, () => { throw new Error("unexpected first turn"); });
  await act(async () => m.c.openConversation(conversation("old-id","old")));
  await act(async () => { m.c.setDraft("keep"); m.c.registerScreenContext({ label: "Topic", reference: { type: "TOPIC_OVERVIEW", topicId: "topic" } }); });
  await act(async () => m.c.attachAvailableContext());
  dom.window.confirm = () => false;
  await act(async () => m.c.startNewConversation());
  assert.equal(m.c.state.activeConversation.id, "old-id");
  assert.equal(m.c.state.draft, "keep");
  assert.equal(m.c.state.attachedContext.reference.topicId, "topic");
});

test("Stop fences an unobserved first admission and preserves newer draft and attachment", async t => {
  let started;
  const ready = new Promise(resolve => { started = resolve; });
  const m = await mount(t, (req, opts) => { started(); return new Promise((resolve,reject) => opts.signal.addEventListener("abort", () => reject(new DOMException("aborted","AbortError")), {once:true})); });
  await act(async () => { m.c.startNewConversation(); m.c.setDraft("first"); m.c.registerScreenContext({label:"old",reference:{type:"TOPIC_OVERVIEW",topicId:"old"}}); });
  await act(async () => m.c.attachAvailableContext());
  let sending;
  await act(async () => { sending = m.c.submitTurn(); await ready; });
  assert.equal(m.first.screenContext.topicId,"old");
  assert.equal(m.c.state.pendingQuestion.content,"first");
  assert.equal(m.c.state.pendingQuestion.contextLabel,"old");
  assert.equal(m.c.state.messages.length,0);
  await act(async () => { m.c.setDraft("next"); m.c.removeAttachedContext(); m.c.registerScreenContext({label:"new",reference:{type:"TOPIC_OVERVIEW",topicId:"new"}}); });
  await act(async () => m.c.attachAvailableContext());
  await act(async () => { m.c.stopTurn(); await sending; });
  assert.equal(m.c.state.firstAdmissionPending,false);
  assert.equal(m.c.state.pendingQuestion,null);
  assert.equal(m.c.state.activeConversation,null);
  assert.equal(m.c.state.draft,"next");
  assert.equal(m.c.state.attachedContext.reference.topicId,"new");
  assert.equal(m.calls.filter(c => c.method === "POST").length,2);
});
test("known quota rejection preserves draft and creates no local conversation", async t => {
  const m = await mount(t, () => problem(429,"QUOTA_EXHAUSTED"));
  await act(async () => { m.c.startNewConversation(); m.c.setDraft("quota rejected"); });
  await act(async () => m.c.submitTurn());
  assert.equal(m.c.state.activeConversation,null);
  assert.equal(m.c.state.firstAdmissionPending,false);
  assert.equal(m.c.state.pendingQuestion,null);
  assert.equal(m.c.state.draft,"quota rejected");
  assert.equal(m.calls.filter(c => c.method === "POST").length,1);
});

test("identity change fences late first admission without cross-account reconciliation", async t => {
  let start, release;
  const ready = new Promise(resolve => { start = resolve; });
  const m = await mount(t, (req, opts, set) => { start(); return new Promise(resolve => { release = () => { set(statusFor(req,"COMPLETED")); resolve(sse(["admitted",statusFor(req)])); }; }); });
  await act(async () => { m.c.startNewConversation(); m.c.setDraft("private"); });
  let sending;
  await act(async () => { sending = m.c.submitTurn(); await ready; });
  await act(async () => m.auth.logout());
  await act(async () => { release(); await sending; });
  assert.equal(m.c.state.activeConversation,null);
  assert.equal(m.c.state.draft,"");
  assert.equal(m.c.state.firstAdmissionPending,false);
  assert.equal(m.c.state.pendingQuestion,null);
  assert.equal(m.calls.filter(c => c.path.includes("/first-turns/")).length,0);
});
test("failed prepend and late same-conversation page after reopen do not pollute transcript", async t => {
  let attempt=0, release, started;
  const ready = new Promise(resolve => { started=resolve; });
  const row = n => ({id:"m"+n,sequence:n,role:"USER",content:"fixture",createdAt:now});
  const m=await mount(t,()=>{throw Error("unexpected first send");},(path,url) => {
    if(!url.searchParams.has("beforeSequence"))return envelope({items:[row(3),row(4)],nextBeforeSequence:3});
    attempt++;
    if(attempt===1)return problem(503,"UNAVAILABLE");
    if(attempt===2){started();return new Promise(resolve=>{release=()=>resolve(envelope({items:[row(1),row(2)],nextBeforeSequence:null}));});}
    return envelope({items:[row(1),row(2)],nextBeforeSequence:null});
  });
  const chat=conversation("old-id","old",4);
  await act(async()=>m.c.openConversation(chat));
  await act(async()=>m.c.loadOlderMessages());
  assert.deepEqual(m.c.state.messages.map(x=>x.id),["m3","m4"]);
  let old;
  await act(async()=>{old=m.c.loadOlderMessages();await ready;});
  await act(async()=>m.c.openConversation(chat));
  await act(async()=>{release();await old;});
  assert.deepEqual(m.c.state.messages.map(x=>x.id),["m3","m4"]);
  await act(async()=>m.c.loadOlderMessages());
  assert.deepEqual(m.c.state.messages.map(x=>x.id),["m1","m2","m3","m4"]);
});
