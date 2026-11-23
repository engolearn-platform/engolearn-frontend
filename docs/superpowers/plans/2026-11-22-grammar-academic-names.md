# Grammar academic names implementation plan

> Execute sequentially with superpowers:executing-plans. User authorizes existing D checkouts; no new branch/worktree/commit/push.

**Goal:** Apply reviewed content and conventional bilingual names to canonical data and local Grammar.
**Architecture:** Separate title_en/title_vi remain the source. Render English (Vietnamese) only in Grammar. Use versioned Admin API for live edits.
**Tech Stack:** Existing React/TS/Vite, Spring Boot, MongoDB replica set; no new dependencies.
**Spec:** ../../features/grammar/03-academic-names.md

## Constraints and review focus
Preserve 32/65, IDs/codes/levels/order, progress, pinned sessions/revisions. Preserve 31 DRAFT topics. Existing A1 publication only. Detect live source drift before editing. Back up private snapshots outside repo. No duplicate curricula or main changes.

## Tasks
- [x] Read live data and canonical source; save backup and verify before-values.
- [x] Prepare conventional names and apply reviewed 5 content changes to shared canonical seed; validate production DTO/checklist.
- [x] Add GrammarName to existing GrammarLearningUi, use in 4 learner views, update feature docs; build/lint.
- [x] Update live data through existing Admin API; apply revision for 3 previously published lessons; keep remaining topics draft.
- [x] Read real FE proxy/BE/DB to check names, counts and existing progress/sessions/revisions. Review desktop/mobile UI. Write final result into existing BE docs and data README.

Verification 23/11/2026: real Admin API/DB 32/65, 3 new revisions; old progress/session/revisions preserved; ordering fence +31 expected. Build passes; lint 0 errors/72 existing warnings. Browser roadmap/topic/theory inspected at current viewport; dedicated phone-size coverage not run. See BE docs/technical/grammar-academic-names-result.md.
