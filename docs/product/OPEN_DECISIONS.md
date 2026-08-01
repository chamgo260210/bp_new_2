# Open Decisions

- Status: TARGET_CANONICAL
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P2
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Governance for P2 due decisions and later implementation-slice decisions
- Supersedes: Open questions dispersed across legacy documents
- Implementation Status: PARTIAL

| Decision ID | Decision owner | Due milestone | Status | Introduced Phase | Decision topic | Options | Required evidence | Affected documents | Downstream implementation Phase | Impact scope |
|---|---|---|---|---|---|---|---|---|---|---|
| OD-001 | Product + Backend/API | P2 completion | OPEN | P1 | 초기 FILE 지원 형식 | DOCX only; common office subset; extensible allowlist | parser 재사용성, upload 보안·크기 제한, UX와 테스트 비용 비교 | [Idea Model](../domain/IDEA_MODEL.md), [Public API Principles](../contracts/PUBLIC_API_PRINCIPLES.md), [Data and Storage](../architecture/DATA_AND_STORAGE_ARCHITECTURE.md) | P4 | parser, upload, UX, tests |
| OD-002 | Architecture + Spring/AI boundary owners | P2 completion | OPEN | P1 | 대용량 Spring–AI 전송 계약 방향 | bounded inline; chunk/stream; Spring-mediated temporary channel | payload 크기·timeout·memory 분석, binary 흐름과 금지 통신 준수 검토 | [Internal AI API Principles](../contracts/INTERNAL_AI_API_PRINCIPLES.md), [Spring WAS Boundary](../architecture/SPRING_WAS_BOUNDARY.md), [AI Server Boundary](../architecture/AI_SERVER_BOUNDARY.md) | P3, P4, P9 | internal API, memory, timeout, binary AI |
| OD-003 | Domain + Product/API/UX | P2 completion | OPEN | P1 | Workflow 상태와 gate | strict sequential; optional gates; state + capability model | 사용자 결정·되돌아가기·stale 시나리오와 상태 전이 검토 | [Workflow State Model](../domain/WORKFLOW_STATE_MODEL.md), [Project Workflow](PROJECT_WORKFLOW.md), [Status and Error Contract](../contracts/STATUS_AND_ERROR_CONTRACT.md) | P3–P10 | domain, API, UI, stale |
| OD-004 | Product + Domain/AI contract owners | P2 completion | OPEN | P1 | Concept Quick/Detailed 분석 입력 | shared core + depth; analysis-specific inputs | 단계 목적·비용·provenance·재실행/stale 비교와 example fixture | [Analysis Model](../domain/ANALYSIS_MODEL.md), [Concept Model](../domain/CONCEPT_MODEL.md), [Provenance Contract](../contracts/PROVENANCE_CONTRACT.md) | P5, P6 | domain, AI contract, provenance |
| OD-005 | Product + Persona/UX domain owners | P2 completion | OPEN | P1 | Persona Three-Layer 상세 축 | needs/context/behavior 계열 후보; 다른 reviewed taxonomy | 축의 중복·설명 가능성·interview 독립성 검토와 representative fixture | [Persona Interview Model](../domain/PERSONA_INTERVIEW_MODEL.md), [Workflow UX](../uiux/WORKFLOW_UX.md) | P7, P8 | domain, UI, interview |
| OD-006 | Product + Report/Storage owners | P2 completion | OPEN | P1 | Final Report 초기 export | PDF; Markdown; HTML; staged subset | 사용자 view/export 요구, renderer 운영비용, Storage 무결성·보안 비교 | [Final Report Model](../domain/FINAL_REPORT_MODEL.md), [Data and Storage](../architecture/DATA_AND_STORAGE_ARCHITECTURE.md), [Product Scope](PRODUCT_SCOPE.md) | P10 | renderer, Storage, UI |
| OD-007 | Platform + Backend transaction owners | P2 completion | OPEN | P1 | TaskRun transaction과 attempt 경계 | single aggregate; separated attempt transaction; outbox/event wake | 동시성·retry·timeout·idempotency·감사 시나리오와 transaction sequence 검토 | [Workflow State Model](../domain/WORKFLOW_STATE_MODEL.md), [Internal AI API Principles](../contracts/INTERNAL_AI_API_PRINCIPLES.md), [System Architecture](../architecture/SYSTEM_ARCHITECTURE.md) | P3 | DB, concurrency, retry |
| OD-008 | AI Platform owner | 각 provider-dependent implementation slice 진입 전 | OPEN | P1 | AI model/provider/library | provider abstraction 후보; model per task | 품질·비용·latency·보안·운영성 benchmark와 fallback 검토 | [Internal AI API Principles](../contracts/INTERNAL_AI_API_PRINCIPLES.md), [Analysis Model](../domain/ANALYSIS_MODEL.md), [Contract Overview](../contracts/CONTRACT_OVERVIEW.md) | P3–P10의 해당 AI slice | AI Server, cost, quality tests |
| OD-009 | Legal integration + Architecture owners | P2 completion | OPEN | P1 | 법령 MCP·법제처 API 연동 방식 | MCP primary/API fallback; API primary/MCP enrichment; coordinated source adapter | 출처·최신성·가용성·오류/수정 loop·법률 UX 검토 | [Legal Review Model](../domain/LEGAL_REVIEW_MODEL.md), [Provenance Contract](../contracts/PROVENANCE_CONTRACT.md), [AI Server Boundary](../architecture/AI_SERVER_BOUNDARY.md) | P4 | provenance, availability, legal UX |

## Governance

OPEN 결정은 due milestone 전에 ACCEPTED, REJECTED 또는 DEFERRED로 갱신하고 [Decision Log](../governance/DECISION_LOG.md)에 채택 결정을 기록한다. 상세 schema를 결론 전에 canonical 사실로 서술하지 않는다. 이전 Phase 결정을 변경하는 경우에는 [Change Impact Ledger](../governance/CHANGE_IMPACT_LEDGER.md)에 새 CHG ID를 기록한다. 단순 상태 전환, PR merge 기록, CI remediation은 제품 결정 변경이 아니므로 ledger 대상이 아니다.

OD-008은 구현 slice 진입 전까지 OPEN으로 유지할 수 있다. 그동안 P2의 public/internal AI, provenance, analysis 계약은 특정 provider·model·SDK·library의 고유 타입이나 동작을 전제로 하지 않는 provider-neutral contract여야 한다.
