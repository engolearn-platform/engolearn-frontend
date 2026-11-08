# Guest navbar implementation plan

> Execute inline using superpowers:executing-plans. User approved shared home navbar for all Guest-facing Placement pages, including post-submit and auth, on local branches only.

**Goal:** One public navbar across home, resource previews, Placement Guest and login/register.
**Architecture:** Promote the existing PublicNavigation unchanged visually into shared components; keep a compatibility export at its old path. Promote public URL constants to shared with the existing landing alias. Placement public/result Guest fallback and auth form use the common navbar; authenticated Placement and attempt timer stay unchanged.
**Tech Stack:** Existing React/Router/TypeScript/Tailwind.
**Spec:** User instructions in chat; this is a small extension of the approved reuse plan. Reuse is selected over duplicating styles because future changes must remain synchronized.

## Constraints and decisions

- No push, no main changes, no BE or database migration.
- Preserve saved answers, submit/claim logic, authenticated shells and attempt timer.
- Auth navbar login action preserves an existing return-to when navigating between login/register.
- PublicNavigation uses location keys to close mobile panels on navigation. All rendered skip links have a main-content target.
- Shared component must not import from another feature; keep old landing import compatible.

## Steps

- [x] Confirm current navbar mismatch and baseline state.
- [x] Move navigation/public paths to shared; wire Guest Placement and auth; update feature docs.
- [x] Run build/lint and existing return-to checks. Browser: start, submit gate, login/register and mobile menu against real BE; preserve attempt header.
- [x] Review diff, commit locally, bring verified code to D: on a new local branch; no push.

## Verification record

Build pass; lint exit0 with 0 errors/72 existing warnings; auth-return4/4 pass. Read-only independent review: no important findings. Browser verified Guest entry and submitted navbar, register -> navbar login -> register -> successful registration -> original attempt result, authenticated result shell unchanged. At mobile width390, menu/disclosure open, preview navigation closes menu; no horizontal overflow (clientWidth=scrollWidth375). Viewport reset afterward. Attempt source/header untouched; this run reused a submitted Guest attempt rather than creating a new attempt.

Local test side effects: logged out the browser's existing account to inspect Guest UI; created navbar-check-1794142021154@example.test; claimed the existing browser Guest attempt7ec2e9b9-8363-4315-9879-e263120cd797 into that test account. Answers and score were not changed. Logged out the test account afterward. No seed import/replacement, BE source or YAML changes. Mongo/BE were restarted with read-only seed preflight. No new implementation-mirroring tests for this reversible UI reuse; actual UI and existing auth checks are the evidence.

Evidence outside Git: workspace C navbar-build.log, navbar-lint-final.log, navbar-preflight.log, navbar-submitted-proof.png. No push commands used; main refs were not modified.

Final local checkout: fix/placement-guest-navbar at D:/TrenLop/WWWJava/Nhom/EngoLearnApp/engolearn-frontend, implementation eba9e72. Browser rechecked actual3000/placement: shared navbar visible. FE main85043ea and origin/main59078cc unchanged; origin/merge remainsbf5a13d. BE HEAD49a3c08 unchanged, only pre-existing application.yaml unstaged.
