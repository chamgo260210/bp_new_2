# Functional Requirements

- Status: TARGET_CANONICAL
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P1
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Identified target capabilities without detailed schemas
- Supersedes: Legacy feature and product requirement documents
- Implementation Status: NOT_STARTED

| ID | Requirement | Planned phase |
|---|---|---|
| FR-001 | 인증 사용자는 owner-scoped Project를 생성·조회·수정·삭제한다. | Stable Core/P3 |
| FR-002 | Project는 여러 IdeaVersion과 IdeaSource provenance를 보유한다. | P4 |
| FR-003 | IdeaSource는 TEXT, FILE, QUESTION_RESPONSE를 지원 가능한 유형으로 둔다. | P2/P4 |
| FR-004 | 사용자 입력 수정은 과거 version을 덮어쓰지 않고 새 IdeaVersion을 만든다. | P4 |
| FR-005 | 시스템은 특정 IdeaVersion을 정규화하고 사용자 확인을 받는다. | P4 |
| FR-006 | 법률 검토는 한국 법령 MCP·법제처 API 근거와 실패 상태를 추적한다. | P4 |
| FR-007 | 법률 실패·수정 후 새 IdeaVersion 또는 LegalReviewRun으로 반복한다. | P4 |
| FR-008 | 복수 ConceptCandidate와 ConceptVersion을 생성·조회한다. | P5 |
| FR-009 | Quick Assessment는 shortlist 결정을 위한 상대 평가를 제공한다. | P5 |
| FR-010 | 사용자는 shortlist를 명시적으로 확정한다. | P5/P6 |
| FR-011 | shortlist 후보에 시장·BM·기술운영·재무 Detailed Analysis를 수행한다. | P6 |
| FR-012 | AI 권고와 별도로 사용자가 ConceptSelection을 기록한다. | P6 |
| FR-013 | 선택 concept에 Three-Layer Persona Card를 생성·검토한다. | P7 |
| FR-014 | 각 PersonaInterview는 다른 Persona와 독립적으로 실행·재시도된다. | P8 |
| FR-015 | MarketingWorkspace는 asset 생성, 편집, version 조회를 지원한다. | P9 |
| FR-016 | MarketingComparisonRun은 Persona 기반 시안 상대 비교를 제공한다. | P9 |
| FR-017 | 비교를 실제 사용자 A/B, 구매확률 또는 전환율로 표현하지 않는다. | P9 |
| FR-018 | FinalReportVersion은 구조화 snapshot과 provenance를 RDB에 저장한다. | P10 |
| FR-019 | 현재·이전 report version을 조회한다. | P10 |
| FR-020 | Spring이 PDF·Markdown·HTML 등 확정된 export artifact를 Storage에 저장한다. | P10 |
| FR-021 | upstream 변경 시 downstream stale 상태를 판정·표시한다. | P2/P4–P10 |
| FR-022 | Admin은 사용자/역할, Project, audit, TaskRun, Storage, AI/법령 연결을 운영한다. | P11 |
| FR-023 | Service Policy는 maintenance, Project 생성, upload, AI, report 생성 제어 방향을 제공한다. | P11 |
| FR-024 | legacy Workflow API/route에 신규 compatibility 경로를 만들지 않고 P12에서 제거한다. | P3–P12 |

상세 field, validation, command/query schema와 UI interaction은 P2 이후 계약에서 결정한다.
