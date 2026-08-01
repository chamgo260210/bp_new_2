# Target Project Workflow

- Status: TARGET_CANONICAL
- Last Reviewed Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Scope: Ordered Project workflow and gates
- Supersedes: StructuredPlan-centered workflow documents
- Implementation Status: NOT_STARTED

## Canonical order

`Idea Intake → Idea Normalization → Korean Legal Review → Concept Builder → Quick Assessment → Shortlist → Detailed Analysis → Concept Selection → Three-Layer Persona Cards → Independent Persona Interviews → Marketing Workspace → Persona-Based Marketing A/B Comparison → Persisted Final Report`

## Workflow rules

- 문서는 여러 IdeaSource 중 하나이며 중심 aggregate가 아니다.
- 단계 결과는 이후 단계 입력으로 사용될 때 provenance를 유지한다.
- AI 권고는 사용자 결정을 대신하지 않는다. Concept Selection은 명시적 사용자 선택이다.
- Persona 인터뷰는 Persona별 독립 실행이다.
- Marketing A/B는 시안 간 상대 비교이며 실제 사용자 실험이나 전환율이 아니다.
- Final Report는 일회성 browser view가 아니라 저장 가능한 versioned snapshot이다.
- 상세 상태명, 재실행 규칙, gate 조건은 Phase 2의 Workflow State 계약에서 확정한다.
