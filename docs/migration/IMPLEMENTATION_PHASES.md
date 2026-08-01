# Implementation Phases

- Status: TARGET_CANONICAL
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P1
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: P0 through P11 delivery guardrails
- Supersedes: Legacy phase readiness and changelog documents
- Implementation Status: PARTIAL

| Phase | Purpose | Prerequisites | Allowed changes | Forbidden changes | Deliverables | Required tests/evidence | Completion condition | Carryover | Next entry condition |
|---|---|---|---|---|---|---|---|---|---|
| P0 | code-based baseline audit | repository access | read-only inspection | file/code/schema change | inventory/classification/risk | branch/HEAD/status/reference searches | audit reported with clean tree | audit document initially absent | P1 decisions available |
| P1 | canonical documentation reset | P0 findings | docs deletion/addition, design move | product code, migration, CI, OpenAPI | canonical doc sets | links, metadata, diff, machine inputs | canonical structure committed | governance/detail correction | P1.1 complete |
| P1.1 | governance and hardening | P1 commit 1549a8e | docs except design/OpenAPI | code, migration, CI, OpenAPI, legacy restore | governance/operations/detail | links/metadata/tables/diff/no-code | user reviews clean diff | none intended | P2 unblocked |
| P2 | domain and contract definition | P1.1 COMPLETE | contract decisions/docs/fixtures | production feature implementation | implementation-ready contracts | consistency/drift review | due decisions resolved | implementation choices | P3 ready |
| P3 | Stable Platform/TaskRun | P2 COMPLETE | tests, /api/v2 base, TaskRun, boundary | P4+ product slices | platform migration/code/contracts | Stable Core/Flyway/AI/FastAPI | forbidden connections and state ownership verified | performance tuning | P4 ready |
| P4 | Idea/Normalization/Legal | P3, OD-001/002/009 | Idea/Legal slices | Concept+ ahead | API/domain/UI/AI/provenance | owner/file/legal/error/E2E | correction loop/sources verified | optional formats | P5 inputs ready |
| P5 | Concept/Quick | P4, Concept contract | concept/version/quick | detailed/selection ahead | candidate/quick slices | provenance/AI/owner/frontend | shortlist inputs verified | scoring refinement | P6 ready |
| P6 | Shortlist/Detailed/Selection | P5, OD-004 | analysis/selection | Persona+ ahead | analysis/selection slices | contracts/user-vs-AI/stale | selected version verified | optional depth | P7 ready |
| P7 | Persona Cards | P6, OD-005 | PersonaStudy/Card | interviews/discussion | card slice | provenance/owner/card | cards reviewed/version-linked | extra axes | P8 ready |
| P8 | Independent Interviews | P7 | interview TaskRuns | discussion/market prediction | interview slices | isolation/retry/stale/owner/E2E | failures isolated | templates | P9 ready |
| P9 | Marketing/Comparison | P8, binary decision | asset/version/comparison | actual-user A/B/probability | workspace slices | Storage/AI binary/claim/UI | relative comparison verified | formats | P10 ready |
| P10 | Persisted Report | P9, OD-006 | snapshot/version/view/export | runtime-only substitute | report slices | version/provenance/storage/export/E2E | current/previous/export verified | extra exports | P11 ready |
| P11 | Admin/Landing/removal/release | P10, replacement tests | Target ops/content/removal | V1–V26 edit/compat remnants | drop migration/release evidence | full suite/E2E/CI/security | legacy removed and remote gates evidenced | post-release tuning | release |

각 Phase는 다음 기능을 미리 구현하지 않는다. carryover는 [Phase Status](../governance/PHASE_STATUS.md)에 기록한다.
