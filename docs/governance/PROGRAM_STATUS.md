# Re-foundation Program Status

- Status: TARGET_CANONICAL
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P1.1
- Introduced In Commit: 80ce95bbf53bcc5faeae894abc37c8a4cac02222
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
| P1.1 documentation commit | 80ce95bbf53bcc5faeae894abc37c8a4cac02222 |
| Current phase | Phase 1.1 Closure / Merge |
| Next phase | P2 — Domain and Contract Definition |
| Governance phases completed | P0, P1 complete; P1.1 complete with PR/merge carryover |
| Implementation phases completed | 0 |
| Vertical slices completed | 0 |
| New product implementation | 0% |
| Primary blocker | P1.1 PR Remote CI 성공과 main merge 전 P2 시작 금지 |

## Stable Core

Auth, JWT/refresh, admin authorization, Project CRUD와 owner scope, cross-owner 404, Spring JPA/Flyway, Spring Object Storage, 공통 오류, audit를 유지한다.

## Target Workflow

Idea Intake → Idea Normalization → Korean Legal Review → Concept Builder → Quick Assessment → Shortlist → Detailed Analysis → Concept Selection → Three-Layer Persona Cards → Independent Persona Interviews → Marketing Workspace → Persona-Based Marketing A/B Comparison → Persisted Final Report.

## Roadmap

P2는 domain/contract, P3는 Stable Platform/TaskRun, P4~P10은 workflow vertical slices다. P11은 Admin과 Landing 전환, P12는 legacy 제거와 database cutover, P13은 통합 품질·수동 검증·release hardening을 담당한다.

## Recent decisions

- Spring이 RDB와 Object Storage를 전담한다.
- AI Server의 RDB, Storage, presigned URL, 업무 산출물 로컬 저장을 금지한다.
- AnalysisJob 확장 대신 신규 TaskRun 계열을 도입한다.
- Persona Card와 Independent Interview를 P7/P8로 분리한다.
- Admin/Landing, legacy cutover, integrated release를 P11/P12/P13으로 분리한다.

## Recent verification

Commit 1549a8e와 80ce95b 비교에서 54개 파일이 README/docs 범위로 확인됐고 backend, frontEnd, ai, scripts, .github, OpenAPI, Flyway, design reference 변경은 없었다. 연결된 Remote CI run 증거는 아직 없다. 상세는 [Verification Evidence](VERIFICATION_EVIDENCE.md)를 따른다.
