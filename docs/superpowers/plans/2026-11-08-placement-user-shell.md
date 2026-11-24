# Placement User shared shell

User approved fixing sidebar consistency on the current local branch, without new branches or pushing.

## Design and plan

- Cause: PlacementUserLayout duplicates the group shell using PlacementUserSidebar/TopBar, so new group menus and responsive behavior drift.
- Reuse core LearningLayout for authenticated Placement entry/result/review. Key it by identityGeneration to preserve the original account-switch reset boundary.
- Add a distinct Kiểm tra đầu vào link to the shared practice section using PUBLIC_PATHS.PLACEMENT and /placement/* active matching. Do not repurpose the disabled periodic-assessment entry.
- Keep Guest public navbar, auth/claim logic and standalone attempt timer/layout unchanged. No BE source or seed changes.
- Update docs first, build/lint, existing auth return-to checks, browser real login/result/review, shared topics navigation, compact sidebar and mobile drawer.
- Work on fix/placement-guest-navbar in the D: checkout; no branch creation, fetch, merge or push.

## Verification

Build pass (17.56s). Lint exit0, 0 errors/72 existing warnings. Auth return-to4/4 pass. Browser real current authenticated session: Placement entry uses shared sidebar/topbar, compact/expanded toggle works, topics submenu -> catalog -> Placement works, mobile390 drawer displays shared menus and no page horizontal overflow (390/390). Original compact preference and viewport restored. Entry/result/review share the same adapter by route/source inspection; owned result/review were not re-tested end-to-end in this run to avoid changing the user session or creating/claiming attempts. No logout, new account or attempt writes in this run. Old sidebar/topbar files stay unused for compatibility; no broad deletion/refactor.

Evidence outside repo: sidebar-build.log, sidebar-lint.log, placement-shared-sidebar.png in the C: workspace. No branch creation or push. FE shared layout change only; BE and its pre-existing application.yaml remain untouched.

Authenticated USER claim-gate states also use PlacementUserLayout / LearningLayout, including active-attempt conflict and loading/error messages. Guest keeps PublicNavigation; other authenticated roles retain the existing public header. Claim service/redirect behavior is unchanged.

Final checks after User claim-shell wiring: build pass4.74s; lint0 errors/72 warnings; auth-return4/4 pass. Result/review/claim wiring reviewed by source; no owned-attempt E2E or real attempt writes in this run.
