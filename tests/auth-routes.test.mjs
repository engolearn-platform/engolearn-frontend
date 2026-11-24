import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";

const directUrl = "/restricted/lesson?mode=edit#draft";
let dom;
let vite;
let components;

before(async () => {
  dom = new JSDOM("<!doctype html><body></body>", { url: "https://engolearn.test/" });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  // Resolve the test router and guard hooks through the same Vite module graph.
  const routerModule = "/tests/auth-test-router.mjs";
  vite = await createServer({
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true },
    appType: "custom",
    plugins: [{
      name: "auth-test-router",
      resolveId: id => id === routerModule ? id : undefined,
      load: id => id === routerModule
        ? 'export { createMemoryRouter, matchRoutes, Outlet, RouterProvider } from "react-router";'
        : undefined,
    }],
  });
  const [router, contract, auth, legacy, guest] = await Promise.all([
    vite.ssrLoadModule(routerModule),
    vite.ssrLoadModule("/src/features/auth/contract/index.ts"),
    vite.ssrLoadModule("/src/shared/hooks/useAuth.tsx"),
    vite.ssrLoadModule("/src/features/auth/components/AuthGuard.tsx"),
    vite.ssrLoadModule("/src/features/auth/components/GuestOnlyGuard.tsx"),
  ]);
  components = { ...router, ...contract, ...auth, AuthGuard: legacy.default, GuestOnlyGuard: guest.default };
});

after(async () => {
  await vite?.close();
  dom?.window.close();
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

const identity = role => Response.json({ data: { id: "account-1", email: "learner@example.test", role } });
const expired = () => Response.json({ detail: "Authentication is required" }, { status: 401 });

async function mount(t, {
  role = null, loginRole = "USER", required = ["CONTENT_MANAGER"], initial = directUrl, legacy = false,
} = {}) {
  const { AuthProvider, useAuth, ProtectedRoute, HasRole, AuthGuard, GuestOnlyGuard,
    createMemoryRouter, Outlet, RouterProvider } = components;
  let accountRole = role;
  let accessExpired = false;
  let resolveSession;
  let failBootstrap = false;
  const requests = [];

  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(options.credentials, "same-origin");
    const path = new URL(url).pathname;
    requests.push(path);
    switch (path) {
      case "/api/v1/auth/me":
        if (resolveSession) await resolveSession.promise;
        if (failBootstrap) return Response.json({ detail: "Unavailable" }, { status: 503 });
        return accountRole && !accessExpired ? identity(accountRole) : expired();
      case "/api/v1/auth/refresh":
        if (!accountRole) return expired();
        accessExpired = false;
        return new Response(null, { status: 204 });
      case "/api/v1/auth/login":
        accountRole = loginRole;
        return identity(accountRole);
      case "/api/v1/auth/logout":
        accountRole = null;
        return new Response(null, { status: 204 });
      default:
        throw new Error(`Unexpected API request ${path}`);
    }
  });

  let auth;
  function Shell() {
    auth = useAuth();
    return h(Outlet);
  }
  const roleContent = () => h("section", null,
    h(HasRole, { allowedRoles: ["CONTENT_MANAGER"], fallback: h("span", null, "Read-only") },
      h("button", null, "Edit lesson")),
    h(HasRole, { allowedRoles: ["ADMIN"] }, h("button", null, "Admin settings")),
  );
  const router = createMemoryRouter([{
    Component: Shell,
    children: [
      { path: "/", element: h("h1", null, "Home") },
      { path: "/admin/topics", element: h("h1", null, "Manage Topics") },
      { path: "/optional", element: roleContent() },
      {
        element: legacy ? h(AuthGuard) : h(ProtectedRoute, required === null ? {} : { allowedRoles: required }),
        children: [{ path: "/restricted/lesson", element: h("h1", null, "Restricted lesson") }],
      },
      {
        Component: GuestOnlyGuard,
        children: [{ path: "/login", element: h("h1", null, "Sign in") }],
      },
    ],
  }], { initialEntries: [initial] });
  const container = document.body.appendChild(document.createElement("div"));
  const root = createRoot(container);
  t.after(async () => {
    await act(async () => root.unmount());
    router.dispose();
    container.remove();
  });

  resolveSession = Promise.withResolvers();
  await act(async () => root.render(h(AuthProvider, null, h(RouterProvider, { router }))));
  return {
    container, router, requests,
    settle: ({ error = false, expired = false } = {}) => act(async () => {
      failBootstrap = error;
      accessExpired = expired;
      resolveSession.resolve();
      resolveSession = undefined;
    }),
    retryWithRole: role => act(async () => {
      failBootstrap = false;
      accountRole = role;
      container.querySelector("button").click();
    }),
    refreshAs: role => act(async () => {
      accountRole = role;
      accessExpired = true;
      auth.refetch();
    }),
    login: () => act(async () => auth.login({ email: "learner@example.test", password: "test-password" })),
    logout: () => act(async () => auth.logout()),
  };
}

test("direct protected URL waits for bootstrap, then retries a session error", async t => {
  const app = await mount(t, { role: "ADMIN" });
  assert.ok(app.container.querySelector('[role="status"]'));
  assert.doesNotMatch(app.container.textContent, /Restricted lesson/);
  assert.equal(app.router.state.location.pathname, "/restricted/lesson");
  await app.settle({ error: true });
  assert.match(app.container.textContent, /Try again/);
  assert.doesNotMatch(app.container.textContent, /Restricted lesson/);
  await app.retryWithRole("ADMIN");
  assert.match(app.container.textContent, /Restricted lesson/);
});

test("learner login returns to the nested route with its query and fragment", async t => {
  const app = await mount(t, { required: null });
  await app.settle();
  assert.equal(app.router.state.location.pathname, "/login");
  assert.equal(app.router.state.historyAction, "REPLACE");
  assert.match(app.container.textContent, /Sign in/);
  await app.login();
  const { pathname, search, hash } = app.router.state.location;
  assert.equal(pathname + search + hash, directUrl);
  assert.match(app.container.textContent, /Restricted lesson/);
});

test("ADMIN and CONTENT_MANAGER sign in to Topic management", async t => {
  for (const role of ["ADMIN", "CONTENT_MANAGER"]) {
    await t.test(role, async child => {
      const app = await mount(child, { initial: "/login", loginRole: role });
      await app.settle();
      assert.match(app.container.textContent, /Sign in/);
      await app.login();
      assert.equal(app.router.state.location.pathname, "/admin/topics");
      assert.match(app.container.textContent, /Manage Topics/);
    });
  }
});

test("management login selects management over a learner return-to", async t => {
  const app = await mount(t, { loginRole: "CONTENT_MANAGER" });
  await app.settle();
  await app.login();
  assert.equal(app.router.state.location.pathname, "/admin/topics");
});

test("management login retains a safe Topic management return-to", async t => {
  const initial = { pathname: "/login", state: { from: { pathname: "/admin/topics", search: "?tab=drafts" } } };
  const app = await mount(t, { initial, loginRole: "ADMIN" });
  await app.settle();
  await app.login();
  assert.equal(app.router.state.location.pathname + app.router.state.location.search, "/admin/topics?tab=drafts");
});

test("content manager login does not land in the separate subscription workspace", async t => {
  const initial = { pathname: "/login", state: { from: { pathname: "/admin/subscription/plans" } } };
  const app = await mount(t, { initial, loginRole: "CONTENT_MANAGER" });
  await app.settle();
  await app.login();
  assert.equal(app.router.state.location.pathname, "/admin/topics");
});

test("the management landing URL mounts the existing ManagementLayout in the app router", async () => {
  const [{ appRoutes }, { default: ManagementLayout }] = await Promise.all([
    vite.ssrLoadModule("/src/router.tsx"),
    vite.ssrLoadModule("/src/core/layouts/ManagementLayout.tsx"),
  ]);
  const matches = components.matchRoutes(appRoutes, "/admin/topics");
  assert.ok(matches?.some(({ route }) => route.Component === ManagementLayout));
});

test("an insufficient role shows a 403 with local navigation", async t => {
  const insufficient = await mount(t, { role: "USER" });
  await insufficient.settle();
  assert.match(insufficient.container.textContent, /403/);
  assert.equal(insufficient.container.querySelector("a")?.getAttribute("href"), "/");
  assert.doesNotMatch(insufficient.container.textContent, /Restricted lesson/);
  assert.equal(insufficient.router.state.location.pathname, "/restricted/lesson");
});

test("empty required roles deny even an administrator", async t => {
  const app = await mount(t, { role: "ADMIN", required: [] });
  await app.settle();
  assert.match(app.container.textContent, /403/);
  assert.doesNotMatch(app.container.textContent, /Restricted lesson/);
});

test("omitting roles and the legacy AuthGuard both allow an authenticated USER", async t => {
  for (const legacy of [false, true]) {
    await t.test(legacy ? "legacy guard" : "protected route without roles", async child => {
      const app = await mount(child, { role: "USER", legacy, required: null });
      await app.settle();
      assert.match(app.container.textContent, /Restricted lesson/);
    });
  }
});

test("session refresh reapplies the role policy and logout clears route access", async t => {
  const app = await mount(t, { role: "CONTENT_MANAGER" });
  await app.settle({ expired: true });
  assert.deepEqual(app.requests, ["/api/v1/auth/me", "/api/v1/auth/refresh", "/api/v1/auth/me"]);
  assert.match(app.container.textContent, /Restricted lesson/);
  await app.refreshAs("USER");
  assert.match(app.container.textContent, /403/);
  await app.logout();
  assert.equal(app.router.state.location.pathname, "/login");
});

test("HasRole withholds protected content during bootstrap and session errors", async t => {
  const app = await mount(t, { initial: "/optional", role: "ADMIN" });
  assert.match(app.container.textContent, /Read-only/);
  assert.doesNotMatch(app.container.textContent, /Edit lesson|Admin settings/);
  await app.settle({ error: true });
  assert.match(app.container.textContent, /Read-only/);
  assert.doesNotMatch(app.container.textContent, /Edit lesson|Admin settings/);
});

test("HasRole grants inherited access, falls back after demotion, and leaves guests on the same URL", async t => {
  const app = await mount(t, { initial: "/optional", role: "ADMIN" });
  await app.settle();
  assert.match(app.container.textContent, /Edit lessonAdmin settings/);
  assert.doesNotMatch(app.container.textContent, /Read-only/);
  await app.refreshAs("USER");
  assert.match(app.container.textContent, /Read-only/);
  assert.doesNotMatch(app.container.textContent, /Edit lesson|Admin settings/);
  await app.logout();
  assert.match(app.container.textContent, /Read-only/);
  assert.equal(app.router.state.location.pathname, "/optional");
});

test("GuestOnlyGuard redirects signed-in users away from login", async t => {
  const app = await mount(t, { initial: "/login", role: "USER" });
  await app.settle();
  assert.equal(app.router.state.location.pathname, "/");
  assert.match(app.container.textContent, /Home/);
});

test("GuestOnlyGuard rejects an external return-to destination", async t => {
  const initial = { pathname: "/login", state: { from: { pathname: "//external.test/" } } };
  const app = await mount(t, { initial, role: "USER" });
  await app.settle();
  assert.equal(app.router.state.location.pathname, "/");
});
