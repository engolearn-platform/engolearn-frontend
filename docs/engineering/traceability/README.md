# Traceability — how engineering artifacts link

> **Purpose:** The link model between business requirements, decisions, feature designs,
> implementation, validation evidence, and deviations — plus when links must be revalidated and the
> no-duplication rule.
> **Scope:** `docs/engineering/` ↔ `src/` ↔ the feature doc packages under `docs/features/`.
> Business requirements themselves live **outside** this repo area and are reached only by link.
> **Owner:** Every author of a change — updating its trace links is part of the change
> (docs-first loop, [../../AGENTS.md](../../../AGENTS.md)).
> **Status:** PROPOSED (model below). Relationship facts it binds are EXISTING docs.
> **Relationships:** [../README.md](../README.md) (precedence) · [../decisions/README.md](../decisions/README.md) ·
> [../feature-design/_template.md](../feature-design/_template.md) · [../code-validation.md](../code-validation.md) ·
> [deviations.md](deviations.md) · [../../AGENTS.md](../../../AGENTS.md) ·
> [../architecture/project-structure.md](../../architecture/project-structure.md) ·
> example living matrix: [../../features/topic/learner/00-mock-api-status.md](../../features/topic/learner/00-mock-api-status.md)

## 1. The chain

```text
[Business requirement / UC]          — OUTSIDE this repo area → status UNKNOWN (never invented)
        │  (linked when a source is supplied; D11 context)
        ▼
[Decision Dn]                        docs/engineering/decisions/README.md (+ dN-slug file when grown)
        │  (a settled decision drives rules & design)
        ▼
[Constraint C-xx]                    docs/engineering/implementation-constraints.md   (optional, if a rule results)
        ▼
[Feature design]                     docs/engineering/feature-design/<…>.md
        │                              or the feature's own doc package:
        │                              docs/features/<domain>/<surface>/NN-<screen>.md  ← living spec for screens
        ▼
[Implementation]                     src/features/<d>/{components,hooks,types,views,services,routes.ts}
        │                              (file + symbol — design docs record these as "Implementation paths")
        ▼
[Validation evidence]                docs/engineering/code-validation.md outcomes (PASS/FAIL/BLOCKED + command output)
        │                              tests/CI → NOT AVAILABLE ([../guides/testing.md](../guides/testing.md))
        ▼
[Deviations]                         docs/engineering/traceability/deviations.md  (DEV-xx, when code knowingly departs)
```

Link directions and ownership:

| From → To | Rule |
|---|---|
| decision → requirements/designs/areas | ADR "Related" field: BR/UC refs stay **UNKNOWN** unless supplied; name design docs + `C-xx` + `DEV-xx` + code paths |
| feature design → impl | "Implementation paths" table must hold real `src/…` paths (fill when code lands) |
| impl → validation | evidence references the change that carried it ([../code-validation.md](../code-validation.md)) |
| impl ↔ deviations | any intentional rule-break has a `DEV-xx` entry; any new `C-xx` rule audits against [deviations.md](deviations.md) |
| screen docs → mock matrix | the learner matrix row is the cross-cutting status index for that package |

## 2. When to update / revalidate

Update the affected links **in the same change** (`C-11`) when you:

1. **Change code** that a design/screen doc describes (prop, route, state, mock↔real) → update that
   doc + any matrix row; if it breaks a `C-xx` rule intentionally → add/adjust a `DEV-xx`.
2. **Settle or supersede a decision** → register status in
   [../decisions/README.md](../decisions/README.md), then update every constraint/guide/deviation
   that referenced the stub.
3. **Add or change a constraint** → re-scan [deviations.md](deviations.md): does an existing DEV now
   conflict? Re-verify (build+lint evidence) rather than assuming.
4. **Flip a mock row** 🟡→✅ → the screen doc, the matrix row, and any feature-design "Data & API"
   pointer move together; the validation step in
   [../code-validation.md](../code-validation.md) records it.
5. **Structure moves** (folders/routes) → [../architecture/project-structure.md](../../architecture/project-structure.md)
   first (it owns structure), then this chain.

Revalidation trigger: any code change touching a linked artifact requires re-reading the linked
upstream doc — links are not "write once"; a stale link is doc rot under AGENTS.md's tie-break rule.

## 3. No-duplication rule

- **Link, don't copy.** Never paste the content of an APPROVED authority (project-structure,
  design-system, business docs) into `docs/engineering/` — reference it with a relative path and
  the section anchor where useful.
- **Derive, don't restate, where possible:** mock status derives from
  [00-mock-api-status.md](../../features/topic/learner/00-mock-api-status.md); token values are
  read from [tokens.yaml](../../design-system/tokens.yaml), never re-typed.
- **Single writer per fact:** requirement text → business docs; structure → project-structure;
  visuals → design-system; screen behavior → feature doc package; decisions → decisions register;
  rule IDs → constraints; departures → deviations; evidence → the change report
  ([../code-validation.md](../code-validation.md)).
- Duplicating a fact anywhere else creates a second writer — forbidden; fix by linking instead.
