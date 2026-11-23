# Grammar structure standardization implementation plan

> Execute inline, following the existing branches. No push or merge into main/dev.

**Goal:** Align Grammar with team package and feature conventions without changing behavior.

**Architecture:** FE remains one grammar feature with learning and management surfaces and shared types/hooks/services. BE HTTP records become individual request/response files; persistence models and stored class names remain unchanged.

**Tech Stack:** React/TypeScript, Java 21/Spring Boot/MongoDB.

**Spec:** FE docs/architecture/project-structure.md; BE docs/architecture/package-structure.md and implementation-conventions.md.

## Constraints and review focus
- Preserve all HTTP URLs, JSON component names, validation annotations, authorization, publication and grading rules.
- Do not move persistence models, migrate/reseed data or modify another module's behavior.
- Preserve existing uncommitted runtime incident documentation.
- Check import resolution, mapper direction, seed-validator compilation and stale compiled DTO classes.

## Tasks
1. Move FE components/admin and views/admin to management; learner components/views to learning. Rename role-based guard, service and route symbols to management. Keep content types surface-neutral. Rewrite source/docs references and aliases, retaining all URL strings.
2. Extract GrammarAdminDtos, GrammarLearnerRequests, GrammarLearnerResponses records into dto/request and dto/response. Separate management input/output content values; update mapper, callers, tests and seed validator. Keep each record's fields and annotations intact.
3. Update owning module documentation. Run FE build/lint/auth, BE clean compile and verify with a disposable test database, seed dry-run, and real API read checks. Compare old/new JSON contract components. Review the final diff. Record existing unrelated failures separately.

## Progress
- [x] Read authoritative docs and inspect callers.
- [x] FE structure and references.
- [x] BE records and mapper.
- [x] Verification and review.
