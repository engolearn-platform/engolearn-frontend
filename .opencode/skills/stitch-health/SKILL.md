---
name: stitch-health
description: >
  Use when a Stitch MCP call fails with a connection/auth error
  (401, Incompatible auth server, dynamic client registration,
  needs authentication, MCP connect/debug failure).
  Diagnoses Stitch MCP connection step by step.
  Do NOT run for every Stitch task — only on connection errors.
---

# Stitch MCP Health Check

Run this **only when a Stitch MCP call fails** with a connection/auth
error. Stop real work and fix connection first.

## Step 1 — Server registered

```powershell
opencode mcp list
```

Pass: `✓ stitch connected` with `https://stitch.googleapis.com/mcp`.

Fail: check `.opencode/opencode.json` has:

```json
"stitch": {
  "type": "remote",
  "url": "https://stitch.googleapis.com/mcp",
  "enabled": true,
  "oauth": false,
  "headers": { "X-Goog-Api-Key": "{env:STITCH_API_KEY}" }
}
```

`"oauth": false` is required — without it a `401` triggers
OAuth Dynamic Client Registration, and Stitch does not support DCR
(`Incompatible auth server` error).

## Step 2 — Handshake

```powershell
opencode mcp debug stitch --log-level DEBUG
```

Pass: `HTTP response: 200 OK` + `Server info: {"name":"StatelessServer"...}`.

Note: `Auth status: ✗ not authenticated` here is normal.
`initialize` / `tools/list` do not check the API key, so this step
alone does NOT prove the key works.

## Step 3 — Real key check (mandatory)

```powershell
npx -y @_davideast/stitch-mcp doctor --verbose
```

Pass both:

- `API Key Detected` (sees `STITCH_API_KEY` from `.env`)
- `API Key Connection` (real call to `stitch.googleapis.com` succeeds)

Fail: check `.env` has `STITCH_API_KEY=<key>` (never commit `.env`),
restart `opencode` to reload env, or create a new key at
`stitch.withgoogle.com/settings` if expired.

Background: `tools/call list_projects` without a valid key returns
`401` + `WWW-Authenticate: Bearer resource_metadata="https://stitch.googleapis.com/.well-known/oauth-protected-resource/..."`.
The MCP client then attempts OAuth DCR and fails. A valid key returns
`200` with the project list (e.g. `EngoLearn English Learning App`).

## Rule

Only run these 3 steps when `stitch_list_projects`,
`stitch_list_screens`, `stitch_get_screen`, or `/stitch-screen` Phase 0
fails with a connection/auth error. Normal Stitch tasks skip this skill.
