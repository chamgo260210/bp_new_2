# Frontend Test Debt Baseline

- Recorded: 2026-07-31
- Owner: frontend maintainers
- Removal deadline: 2026-09-30
- Machine-readable allowlist: `frontEnd/test-debt-baseline.json`
- Verified baseline: 265 total, 225 passing, 40 explicitly allowed failures

## Classification

| Test file | Failures | Category | Common cause | Minimal repair | Production change |
|---|---:|---|---|---|---|
| `src/test/App.test.jsx` | 11 | Provider wrapper | `ServicePolicyProvider` missing from `renderApp` | Add an enabled service-policy fixture to the shared render helper | No |
| `src/features/auth/AuthPages.test.jsx` | 14 | Provider wrapper | 10 tests lack `AuthTransitionProvider`; 4 reach code requiring `ServicePolicyProvider` | Wrap `renderAuthPage` with the same provider order as `AppProviders` | No |
| `src/features/feasibility/FeasibilityPage.test.jsx` | 3 | Provider wrapper | `ServicePolicyProvider` missing from `renderPage` | Add a local enabled policy fixture | No |
| `src/features/projects/ProjectPages.test.jsx` | 6 | Provider wrapper | `ServicePolicyProvider` missing from `renderProject` | Add a local enabled policy fixture | No |
| `src/features/structured-plan/StructuredPlanCompletion.test.jsx` | 4 | Provider wrapper | `ServicePolicyProvider` missing from `Harness` | Wrap the test harness with an enabled policy fixture | No |
| `src/features/personas/hooks/usePersonas.test.jsx` | 2 | Provider wrapper | `usePersonas` now consumes service policy but `renderHook` has no wrapper | Supply a hook wrapper or mock the service-policy hook | No |

No remaining failure is classified as fixture mutation, timer/async, API mock,
environment dependence, obsolete test, or demonstrated production defect. The
earlier fixture mutation and timer race were fixed before this baseline was recorded.

## CI policy

CI runs the entire suite through `npm run test:baseline`. The verifier compares
the exact pair of test file and full test name against the allowlist.

- Any new or renamed failure fails CI.
- If an allowed failure starts passing, CI fails until that entry is removed.
- Entries may be removed but may not be added without an explicit review and
  corresponding update to this document.
- The baseline expires on 2026-09-30 and fails closed after that date.
- Raw `npm run test:run` remains available and continues to report the 40 failures.
- The CI job is not marked `continue-on-error`.

The recommended follow-up is a small test-only PR that repairs the six render
helpers, removes each recovered entry, and reaches a zero-failure baseline.
