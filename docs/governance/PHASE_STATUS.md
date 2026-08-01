# Phase Status Register

- Status: TARGET_CANONICAL
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P1.1
- Introduced In Commit: P1.1 commit pending
- Scope: P0 through P11 status and handoff register
- Supersedes: None
- Implementation Status: PARTIAL

상태 값은 NOT_STARTED, IN_PROGRESS, BLOCKED, CORRECTION_REQUIRED, COMPLETE_WITH_CARRYOVER, COMPLETE만 사용한다.

## P0 — Repository Baseline and Re-foundation Audit

- 상태: COMPLETE_WITH_CARRYOVER
- 시작 branch: main
- 시작 commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- 완료 commit: 없음(읽기 전용 감사)
- 범위: 코드·DB·문서·테스트·CI inventory, Stable Core/legacy 분리
- 산출물: Phase 0 대화 보고, [repository audit](PHASE0_REPOSITORY_AUDIT.md)
- 실행한 검증: branch/HEAD/status, 파일·route·entity·migration·AI/storage/job 참조 검색
- 미해결 항목: 감사 문서 미커밋 상태를 P1.1에서 보완
- 다음 Phase 진입 조건: canonical 제품 결정 확보
- 받은 결정: 없음
- 전달 결정: Stable Core와 legacy dependency map

## P1 — Canonical Product and Architecture Documentation Reset

- 상태: CORRECTION_REQUIRED
- 시작 branch: refoundation/phase1-canonical-docs
- 시작 commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- 완료 commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- 범위: canonical 문서 구조, legacy 문서 제거, 디자인 reference 분리
- 산출물: Product/Domain/Architecture/Contracts/UIUX/Quality/Migration 문서
- 실행한 검증: metadata/link/whitespace/diff/machine input/design blob 검사
- 미해결 항목: governance, phase 이력, 검증 evidence, 문서 상세도 부족
- 다음 Phase 진입 조건: P1.1 COMPLETE
- 받은 결정: P0 Stable Core/legacy 분류
- 전달 결정: Target Workflow, system boundary, TaskRun, /api/v2, persisted report

## P1.1 — Documentation Hardening and Governance

- 상태: IN_PROGRESS
- 시작 branch: refoundation/phase1-canonical-docs
- 시작 commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- 완료 commit: pending
- 범위: governance, decision/change/evidence, canonical 상세 보강, Stable Core 운영 정책
- 산출물: docs/governance, docs/operations와 보강된 canonical 문서
- 실행한 검증: 완료 시 본 문서와 VERIFICATION_EVIDENCE에 기록
- 미해결 항목: 현재 작업 diff 검증과 사용자 검토
- 다음 Phase 진입 조건: P1.1 문서·링크·metadata·영향 ledger 검증 완료
- 받은 결정: P1 Target과 P0 code baseline
- 전달 결정: P2 결정 목록과 phase별 guardrail

## P2 — Domain and Contract Definition

- 상태: BLOCKED
- 시작 branch: 미정
- 시작 commit: 미정
- 완료 commit: 미정
- 범위: domain field 방향, workflow state/gate, provenance, API/AI contract
- 산출물: reviewed DRAFT_CONTRACT와 구현-ready contract
- 실행한 검증: contract consistency와 drift 검사 예정
- 미해결 항목: [Open Decisions](../product/OPEN_DECISIONS.md)
- 다음 Phase 진입 조건: P1.1 COMPLETE 및 P2 decision owner/기한 확정
- 받은 결정: system boundary, /api/v2, TaskRun, no legacy data migration
- 전달 결정: P3 플랫폼 구현 계약

## P3 — Stable Platform Guard and TaskRun Foundation

- 상태: NOT_STARTED
- 시작 branch/commit/완료 commit: 미정
- 범위: Stable Core regression 분리, /api/v2 foundation, TaskRun 기반과 AI/data/storage boundary
- 산출물: migration, platform code, contract tests
- 실행한 검증: Stable Core, Flyway, Spring–AI, FastAPI 예정
- 미해결 항목: P2 상세 contract
- 다음 Phase 진입 조건: P2 COMPLETE
- 받은 결정: P2 contract 예정
- 전달 결정: P4 vertical slice 기반

## P4 — Idea Intake, Normalization and Korean Legal Review

- 상태: NOT_STARTED
- 시작 branch/commit/완료 commit: 미정
- 범위: IdeaSource/IdeaVersion과 한국 법률 검토
- 산출물: vertical slices와 provenance
- 실행한 검증: owner/API/AI/legal-source/E2E 예정
- 미해결 항목: 초기 FILE·법령 연동 결정
- 다음 Phase 진입 조건: P3 COMPLETE
- 받은 결정: P3 TaskRun/API 기반
- 전달 결정: verified idea/legal inputs

## P5 — Concept Builder and Quick Assessment

- 상태: NOT_STARTED
- 시작 branch/commit/완료 commit: 미정
- 범위: concept generation, version, quick assessment
- 산출물: vertical slices와 tests
- 실행한 검증: contract/owner/AI/frontend 예정
- 미해결 항목: Concept schema/quick inputs
- 다음 Phase 진입 조건: P4 COMPLETE
- 받은 결정: Idea/legal provenance
- 전달 결정: shortlist 후보

## P6 — Shortlist, Detailed Analysis and Concept Selection

- 상태: NOT_STARTED
- 시작 branch/commit/완료 commit: 미정
- 범위: shortlist, detailed analysis, user selection
- 산출물: analysis/selection slices
- 실행한 검증: 시장·BM·기술운영·재무 계약/결정 분리 예정
- 미해결 항목: 상세 분석 입력
- 다음 Phase 진입 조건: P5 COMPLETE
- 받은 결정: concept candidates
- 전달 결정: selected ConceptVersion

## P7 — Three-Layer Persona Cards

- 상태: NOT_STARTED
- 시작 branch/commit/완료 commit: 미정
- 범위: PersonaStudy와 Three-Layer Persona Card
- 산출물: Persona card slice
- 실행한 검증: provenance/independence/frontend 예정
- 미해결 항목: Persona 상세 축
- 다음 Phase 진입 조건: P6 COMPLETE
- 받은 결정: selected concept
- 전달 결정: interview-ready cards

## P8 — Independent Persona Interviews

- 상태: NOT_STARTED
- 시작 branch/commit/완료 commit: 미정
- 범위: Persona별 독립 interview
- 산출물: interview TaskRun slices
- 실행한 검증: 독립 실행/실패 격리/재시도 예정
- 미해결 항목: 질문·응답 계약
- 다음 Phase 진입 조건: P7 COMPLETE
- 받은 결정: Persona cards
- 전달 결정: independent interview evidence

## P9 — Marketing Workspace and Persona-Based Comparison

- 상태: NOT_STARTED
- 시작 branch/commit/완료 commit: 미정
- 범위: asset generation/workspace와 상대 A/B 비교
- 산출물: Marketing slices
- 실행한 검증: binary result/storage/comparison claim 예정
- 미해결 항목: asset 형식과 비교 계약
- 다음 Phase 진입 조건: P8 COMPLETE
- 받은 결정: Persona interview evidence
- 전달 결정: report-ready marketing evidence

## P10 — Persisted Final Report

- 상태: NOT_STARTED
- 시작 branch/commit/완료 commit: 미정
- 범위: report snapshot/version/view/export
- 산출물: RDB snapshot, Object Storage export, UI/API
- 실행한 검증: version/provenance/integrity/export 예정
- 미해결 항목: 초기 export 형식
- 다음 Phase 진입 조건: P9 COMPLETE
- 받은 결정: complete workflow evidence
- 전달 결정: persisted report baseline

## P11 — Admin, Landing, Legacy Removal and Release Hardening

- 상태: NOT_STARTED
- 시작 branch/commit/완료 commit: 미정
- 범위: Target Admin/Service Policy, Landing content, legacy code/schema/artifact 제거, release gates
- 산출물: 신규 drop migration, 제거된 legacy flow, 운영·release evidence
- 실행한 검증: full Stable Core/new workflow/E2E/CI/security 예정
- 미해결 항목: 실제 FK/drop 순서와 deployment
- 다음 Phase 진입 조건: P10 COMPLETE 및 대체 test 완비
- 받은 결정: 모든 Target vertical slice
- 전달 결정: release-ready Target system
