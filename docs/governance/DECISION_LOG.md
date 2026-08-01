# Decision Log

- Status: TARGET_CANONICAL
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P1.1
- Introduced In Commit: 80ce95bbf53bcc5faeae894abc37c8a4cac02222
- Scope: Accepted program decisions and downstream impact
- Supersedes: Decisions dispersed across Phase 1 documents
- Implementation Status: PARTIAL

| Decision ID | Title | Status | Introduced Phase | Decided Phase | Decision | Rationale | Alternatives | Affected Documents | Downstream Code Impact | Test Impact | Supersedes | Superseded By |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DEC-001 | Spring data ownership | ACCEPTED | P0 | P1 | Spring이 RDB와 Object Storage를 전담한다. | 인증·owner·transaction·artifact 무결성을 한 경계에서 보장 | AI Server의 DB/Storage 접근 | architecture, contracts, quality | repository/storage access를 Spring에 한정 | owner/storage regression | 혼합 소유 가능성 | — |
| DEC-002 | AI Server storage prohibition | ACCEPTED | P0 | P1 | AI Server의 RDB, Storage, presigned URL, 업무 결과 로컬 저장을 금지한다. | 업무 상태와 데이터 소유권 회귀 방지 | presigned GET/PUT, shared volume | AI boundary, data architecture | 현재 presigned/outputs 경로 제거 | negative boundary/AI contract | P0의 presigned 허용 미결정 | — |
| DEC-003 | Generic TaskRun | ACCEPTED | P0 | P1 | AnalysisJob 확장 대신 TaskRun, TaskAttempt, TaskResult, TaskArtifact 방향을 채택한다. | legacy source FK와 분석 의미 분리 | AnalysisJob 일반화 | architecture, domain, migration | 신규 platform model 필요 | lifecycle/concurrency/contract | AnalysisJob 중심 | — |
| DEC-004 | No legacy data migration | ACCEPTED | P0 | P1 | 기존 데이터는 테스트 데이터이므로 이관하지 않는다. | 보존 요구가 없고 legacy schema 제거 단순화 | transform/archive | migration, quality | 신규 drop migration | fresh/upgrade/validate | legacy migration 검토 | — |
| DEC-005 | Workflow API v2 | ACCEPTED | P1 | P1 | 신규 Workflow public API는 /api/v2를 사용한다. | stable /api/v1과 계약 분리 | /api/v1 확장 | contracts, migration, UI route | 신규 controllers/clients | version/owner/contract | 기존 workflow API | — |
| DEC-006 | Persisted Final Report | ACCEPTED | P0 | P1 | Final Report는 RDB snapshot/version과 Storage export를 가진다. | 재현 가능한 현재·이전 보고서 | runtime-only view | product, domain, architecture | 신규 aggregate/API/export | version/provenance/integrity | runtime report | — |
| DEC-007 | Independent Persona interviews | ACCEPTED | P1 | P1 | Persona는 토론하지 않고 각각 독립 interview를 수행한다. | 실패·근거·관점 독립성 | panel discussion | product, persona domain | 독립 TaskRun orchestration | isolation/retry | fixed panel simulation | — |
| DEC-008 | Marketing Persona A/B | ACCEPTED | P1 | P1 | A/B는 Marketing Workspace의 Persona 기반 시안 상대 비교다. | 실제 사용자 실험·전환율 오인 방지 | market response/purchase probability | product, marketing domain, UX | comparison run/UI 용어 | claim/contract/UI | market response prediction | — |
| DEC-009 | Korean legal sources | ACCEPTED | P1 | P1 | 법률 검토는 한국 법령 MCP와 법제처 API를 사용한다. | 근거 추적 가능한 한국 법률 검토 | 모델 단독 생성, 일반 web | product, legal domain, AI boundary | MCP/API adapter와 provenance | source/error/availability | generic legal review | — |
| DEC-010 | Landing design/content split | ACCEPTED | P0 | P1 | Landing layout/design/common component는 유지하고 copy/workflow/demo/CTA는 교체한다. | 디자인 자산 재사용과 제품 사실 분리 | 전체 유지 또는 전체 교체 | product, UIUX, migration | 후속 frontend content 변경 | UI/content/accessibility | legacy Landing product copy | — |

Status는 ACCEPTED, SUPERSEDED, REJECTED만 사용한다. 상세 implementation 선택은 [Open Decisions](../product/OPEN_DECISIONS.md)에 둔다.
