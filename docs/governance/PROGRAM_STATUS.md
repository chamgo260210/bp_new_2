# Re-foundation Program Status

- Status: TARGET_CANONICAL
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P1.1
- Introduced In Commit: P1.1 commit pending
- Scope: Program-level status, next actions and blockers
- Supersedes: None
- Implementation Status: PARTIAL

## Program objective

Project 전체를 하나의 아이디어 검증 과정으로 재정립하고, 입력 일반화부터 한국 법률 검토, concept 생성·평가·선택, 독립 Persona 인터뷰, Marketing 비교, 저장 가능한 Final Report까지의 Target Workflow를 구현한다. 인증·owner scope·Spring의 RDB/Object Storage 소유권을 Stable Core로 보호한다.

## Current status

| Item | Value |
|---|---|
| Branch | refoundation/phase1-canonical-docs |
| Code baseline | e16bd316ac881f4c5fab076e65c14657f6a8c7d4 |
| P1 documentation commit | 1549a8efa0aeb2ca400f4795c1c44b34868e4722 |
| Current phase | P1.1 — Documentation Hardening and Governance |
| Next phase | P2 — Domain and Contract Definition |
| Overall progress | 15% phase-tracking estimate; 신규 제품 기능 구현은 0% |
| Primary blocker | P1.1 완료 전 P2 진입 금지; P2 open decisions와 contract가 미확정 |

## Stable Core

Auth, JWT/refresh, admin authorization, Project CRUD와 owner scope, cross-owner 404, Spring JPA/Flyway, Spring Object Storage, 공통 오류, audit를 유지한다.

## Target Workflow

Idea Intake → Idea Normalization → Korean Legal Review → Concept Builder → Quick Assessment → Shortlist → Detailed Analysis → Concept Selection → Three-Layer Persona Cards → Independent Persona Interviews → Marketing Workspace → Persona-Based Marketing A/B Comparison → Persisted Final Report.

## Recent decisions

- Spring이 RDB와 Object Storage를 전담한다.
- AI Server의 RDB, Storage, presigned URL, 업무 산출물 로컬 저장을 금지한다.
- AnalysisJob 확장 대신 신규 TaskRun 계열을 도입한다.
- 신규 Workflow API는 /api/v2를 사용한다.
- 기존 테스트 데이터는 이관하지 않는다.

## Recent verification

P1에서 45개 Markdown metadata, 상대 링크, root README link, design blob, machine-consumed 파일, 코드·migration 무변경과 git diff check를 로컬 검증했다. 해당 branch push 또는 remote CI 성공 증거는 없다. 상세는 [Verification Evidence](VERIFICATION_EVIDENCE.md)를 따른다.
