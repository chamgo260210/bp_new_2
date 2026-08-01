# Product Scope

- Status: TARGET_CANONICAL
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P1
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Target product boundaries and phase allocation
- Supersedes: Legacy feature inventory and product requirement documents
- Implementation Status: NOT_STARTED

## Project definition

Project는 IdeaSource 수집부터 FinalReportVersion까지 하나의 검증 계보를 소유하는 owner-scoped workspace다. 문서나 analysis job 하나가 Project를 대표하지 않는다. Project 안의 versioned 결과는 upstream version과 사용자 결정을 추적한다.

## In scope

- TEXT, FILE, QUESTION_RESPONSE 방향의 IdeaSource와 IdeaVersion
- Idea Normalization과 사용자 검토
- 한국 법령 MCP·법제처 API 기반 LegalReviewRun
- 복수 concept 생성/version, Quick Assessment, shortlist
- 시장·BM·기술운영·재무 Detailed Analysis
- AI 권고와 분리된 ConceptSelection
- Three-Layer Persona Card와 독립 Persona Interview
- Marketing asset 생성·편집·version과 Persona 기반 상대 A/B 비교
- persisted FinalReportVersion의 current/previous view와 export
- Stable Core auth/owner/audit/data/storage
- Target Admin과 범용 Service Policy

## Out of scope

- 완성 사업계획서 또는 고정 12개 section 필수화
- 기존 legacy data 보존·변환
- Persona 토론 또는 panel consensus
- 시장반응 예측, 구매확률, 실제 전환율 주장
- 실제 사용자 traffic을 사용하는 A/B experiment
- 법률 자문 또는 법적 결론 보장
- Phase 1.1의 상세 field, DB table/column, JSON/API schema, prompt, model/library, 세부 UI 확정

## Phase allocation

| Phase | Scope |
|---|---|
| P2 | domain, state, provenance, public/internal contract |
| P3 | Stable Core regression, /api/v2, TaskRun foundation |
| P4 | Idea/Normalization/Korean Legal |
| P5 | Concept Builder/Quick Assessment |
| P6 | Shortlist/Detailed Analysis/Selection |
| P7–P8 | Persona cards/independent interviews |
| P9 | Marketing Workspace/comparison |
| P10 | persisted Final Report |
| P11 | Admin과 Landing content 전환 |
| P12 | legacy 제거와 database cutover |
| P13 | 통합 품질, 수동 테스트, release hardening |

초기 FILE 형식과 export 형식 등은 [Open Decisions](OPEN_DECISIONS.md)에 남긴다.
