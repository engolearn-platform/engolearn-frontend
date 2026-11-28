import assert from "node:assert/strict";

const origin = process.env.ENGOLEARN_TEST_ORIGIN || "http://localhost:3000";
const email = process.env.ENGOLEARN_TEST_EMAIL;
const password = process.env.ENGOLEARN_TEST_PASSWORD;
assert(email && password, "Set ENGOLEARN_TEST_EMAIL and ENGOLEARN_TEST_PASSWORD for an existing test account.");
const target = new URL(origin);
assert(["localhost", "127.0.0.1", "[::1]"].includes(target.hostname), "This verification only targets the local frontend proxy.");

const login = await fetch(new URL("/api/v1/auth/login", target), {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }),
});
assert.equal(login.status, 200, "Existing test-account login must succeed.");
const cookie = login.headers.getSetCookie().map(value => value.split(";", 1)[0]).join("; ");
assert(cookie, "Login must establish real auth cookies.");
const reads = [
  ["/api/v1/topics/home-summary", ["AVAILABLE", "NO_CURRENT_LEARNING"]],
  ["/api/v1/grammar/home-summary", ["AVAILABLE", "NOT_STARTED", "NO_CURRENT_LEARNING"]],
  ["/api/learning-paths/home-summary", ["AVAILABLE", "ASSESSMENT_REQUIRED", "PAST_PATHS_ONLY", "RECOMMENDATION_AVAILABLE", "NO_WEAK_SKILLS", "NO_ELIGIBLE_SKILLS"]],
  ["/api/v1/assessment/home-summary", ["AVAILABLE", "NO_COMPLETED_ASSESSMENT"]],
  ["/api/v1/speaking/home-summary", ["AVAILABLE", "NOT_STARTED"]],
  ["/api/v1/profile/me", null],
  ["/api/micro-skills", null],
];

try {
  for (const [path, states] of reads) {
    const response = await fetch(new URL(path, target), { headers: { Cookie: cookie }, cache: "no-store" });
    assert.equal(response.status, 200, `${path} must return a real successful response.`);
    const { data } = await response.json();
    assert(data && typeof data === "object", `${path} must return an ApiResponse payload.`);
    if (states) {
      assert(states.includes(data.state), `${path} returned an unsupported state.`);
      assert(Number.isFinite(Date.parse(data.asOf)), `${path} requires an observation timestamp.`);
      assert.match(response.headers.get("Cache-Control") || "", /no-store/);
      if (data.counts) for (const value of Object.values(data.counts)) assert(Number.isInteger(value) && value >= 0);
      const card = data.currentTopic ?? data.currentPath ?? data.latestResult ?? data.latestSession;
      if (data.state === "AVAILABLE") assert(card, `${path} must supply its available card.`);
      else assert(!card, `${path} must not present an empty state with a populated card.`);
    }
    if (path.endsWith("/profile/me")) assert(["A1", "A2", "B1", "B2", "C1", "C2"].includes(data.cefrLevel));
    if (path === "/api/micro-skills") assert(Array.isArray(data.items));
    console.log(`PASS ${path}${states ? ` (${data.state})` : ""}`);
  }
  for (const [path] of reads.slice(0, 5)) {
    const response = await fetch(new URL(path, target), { cache: "no-store" });
    assert.equal(response.status, 401, `${path} must reject a request without authentication.`);
  }
  console.log("PASS five anonymous summary requests rejected; no learner progress was created or modified.");
} finally {
  const logout = await fetch(new URL("/api/v1/auth/logout", target), { method: "POST", headers: { Cookie: cookie } });
  assert(logout.ok, "Close the test's own authenticated session.");
}
