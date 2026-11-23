# Placement / Grammar: team authorization integration — 23/11/2026

Origin dev merged locally into existing `fix/placement-guest-navbar`; no new feature branch, no push to main/dev. Backend source and detailed runtime/data handoff: `engolearn-backend/docs/technical/placement-grammar-dev-integration.md`.

Grammar routes keep team LearningLayout/ManagementLayout, using `ProtectedRoute` from auth/contract for USER learner and CONTENT_MANAGER management boundaries. ADMIN inherits both. GrammarManagementGuard now composes only the management shell; GrammarLearnerGuard retains identity reset. PlacementManagementGuard uses the same auth contract, requiring ADMIN. Guest Placement routes remain public with result ownership enforced by BE.

Listening question form now has ADMIN-only WAV upload via `HasRole` from auth/contract. Multipart upload is feature-owned; it uses real cookie auth and shared refresh before one retry. Catalog options are loaded from BE, not invented sample files. BE persists mediaId and sends playback URLs. Public audio policy preserves Guest playback; no Cloudinary credentials reach FE.

PlacementAudioPlayer uses actual audio events; missing files no longer trigger simulated timer playback. It shows an explicit error instead. Existing question selection, answers, transcript hiding, team sidebar/navbar and Grammar pedagogy stay unchanged.

Run `npm run dev` from the actual frontend directory and use the BE dev profile on 8080. Prod needs an HTTPS frontend/API deployment for secure cookies; do not weaken cookie security just to serve prod over local HTTP. See auth role-authorization.md for shared guard semantics and backend runtime-configuration.md for profile requirements.

Validation result is recorded in the BE handoff after final build/lint/auth and real dev/prod flow checks. Shared simulated Auth tests supplement actual integration; they do not establish BE/media readiness by themselves.

## Final evidence and upload state contract

PlacementQuestionFields.onChange accepts React Dispatch<SetStateAction<ManagementQuestionDraft>>. Every field update uses the current draft; delayed audio completion cannot restore an old transcript/prompt/options snapshot. Review finding reproduced before the fix and checked again after it.

`tests/placement-upload.integration.test.mjs` uses the actual running FE proxy, BE and existing WAV; no fake HTTP response. To run: supply TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD and PLACEMENT_REAL_AUDIO_FILE as private process environment, optionally PLACEMENT_FE_URL/TEST_PLACEMENT_QUESTION_ID, then `node --test tests/placement-upload.integration.test.mjs`. Missing prerequisites are explicitly skipped; the recorded run supplied all inputs and executed 1/1 with zero skips. Do not commit filled credentials. The test edits only local React draft state and reuses an existing audio asset; it never saves question edits.

Final FE Auth:21/21, build pass, lint0errors/72existingwarnings. Actual module flows:dev59 checks through proxy + prod60HTTPS API checks pass; production frontend hosting is not deployed by this task. Browser verified shared Admin navigation and real Cloudinary playback. Backend full verify still has failures outside Placement/Grammar; see owning BE handoff for exact counts and test names.

## Structure standardization — 23/11/2026

Grammar stays inside the existing feature. FE components/views use `learning/` and `management/`; hooks/services/types remain feature-owned. Management route exports are `GrammarManagementRoutes`; browser URLs and API URLs retain `/admin/grammar` and `/api/v1/grammar/admin/topics`. Reusable content types live in `types/grammar-content.types.ts`.

BE web records are individual files in `grammar/dto/request` and `grammar/dto/response`, with Request/Response suffixes. Management content requests and responses are mapped explicitly in GrammarAdminMapper. The consolidated GrammarAdminDtos/GrammarLearnerRequests/GrammarLearnerResponses classes were removed; the seed validator imports the replacement records. JSON fields, validation, roles and business rules are preserved. No persistence model, collection, ID, seed content or learner progress is migrated by this change.

Chi tiết thay đổi cấu trúc và kết quả kiểm chứng: [báo cáo chuẩn hóa](05-structure-standardization.md).
