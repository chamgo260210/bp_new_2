# Current route map

- Status: Current
- Verified HEAD: pending final commit
- Verified Date: 2026-07-30 working tree

| Route | Guard/layout | Page/state | Status |
|---|---|---|---|
| `/` | Public | Home | Active |
| `/auth/login`, `/auth/signup` | Public-only | auth API | Active |
| `/auth/password-reset` | Public-only | placeholder | Deferred |
| `/dashboard` | Protected/AppShell | project summary | Active |
| `/projects`, `/projects/new` | Protected/AppShell | project list/create | Active |
| `/projects/:projectId/overview` | Protected/Project | integrated dashboard | Active |
| `.../documents` | Protected/Project | document/upload/job | Active |
| `.../structure` | Protected/Project | structured plan | Active |
| `.../legal-review` | Protected/Project | legal result | Active |
| `.../feasibility` | Protected/Project | feasibility | Active |
| `/app/projects/:projectId/review/financial` | Protected/Project | financial list | Active |
| `/app/projects/:projectId/review/financial/new` | Protected/Project | financial draft creation | Active |
| `/app/projects/:projectId/review/financial/:analysisId` | Protected/Project | assumptions, scenarios, result | Active |
| `.../personas` | Protected/Project | persona/validation plan | Active |
| `/app/projects/:projectId/validate/interview` | Protected/Project | persona-based expected interview | Active MVP |
| `/app/projects/:projectId/validate/market-response` | Protected/Project | validation-data-based expected response | Active MVP |
| `/app/projects/:projectId/validate/marketing` | Protected/Project | marketing content workspace | Active MVP |
| `.../report` | Protected/Project | runtime integrated report | Active canonical |
| `.../reports`, `.../reports/:reportId` | Protected/Project | redirect to `.../report` | Compatibility |
| `/projects/:projectId/financial` | Protected | redirect to `/app/projects/:projectId/review/financial` | Compatibility |
| `*` | any | Not found | Active |

Direct entry, refresh, logout/login return, and cross-owner 404 were verified in Phase 11.
