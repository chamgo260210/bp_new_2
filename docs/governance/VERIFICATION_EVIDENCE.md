# Verification Evidence

- Status: CURRENT_BASELINE
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P2
- Introduced In Commit: 80ce95bbf53bcc5faeae894abc37c8a4cac02222
- Scope: Commands actually executed and evidence limitations
- Supersedes: None
- Implementation Status: PARTIAL

| Phase | Branch | Commit | Date | Command | Result | Evidence | Not Executed | Remote CI Status |
|---|---|---|---|---|---|---|---|---|
| P0 | main | e16bd316ac881f4c5fab076e65c14657f6a8c7d4 | 2026-08-01 | git branch/rev-parse/status; repository inventory and dependency searches | 완료, 파일 변경 없음 | [Phase 0 repository audit](PHASE0_REPOSITORY_AUDIT.md) | 제품 테스트, Remote CI 조회 | NOT_EXECUTED |
| P1 | refoundation/phase1-canonical-docs | 1549a8efa0aeb2ca400f4795c1c44b34868e4722 | 2026-08-01 | git diff --check; Markdown link/metadata; design blob; machine input; protected-path diff | 로컬 문서 검사 성공 | Commit 1549a8e tree와 Phase 1 보고 | Java/JS/Python 제품 테스트, push 검증 | NOT_EXECUTED |
| P1.1 | refoundation/phase1-canonical-docs | 80ce95bbf53bcc5faeae894abc37c8a4cac02222 | 2026-08-01 | git diff --check; Markdown link/metadata/governance columns; git diff 1549a8e..80ce95b | 문서 hardening commit 확인 | 1549a8e → 80ce95b compare: 54 files, README/docs only; backend/frontEnd/ai/scripts/.github/OpenAPI/Flyway/design 변경 없음 | Java/JavaScript/Python 제품 테스트, migration test, E2E, manual test | NO_ASSOCIATED_RUN |
| P1.1 initial CI | refoundation/phase1-canonical-docs | 41fd90e9fbbe63751ca42025551f11d17375d864 | 2026-08-01 | PR #14 Remote CI PostgreSQL migration tests | 실패, remediation 필요 | `PostgreSqlMigrationTests.v26EnforcesParserArtifactMetadataConstraints`와 `upgradesLegacyLocalDocumentFromV25ToV26WithoutDataLoss`가 V25/V26 `users.username` NOT NULL fixture 불일치로 실패 | 성공하지 않은 PostgreSQL check를 성공으로 간주하지 않음 | FAILED |
| P1.1 CI remediation | fix/postgres-v26-test-fixture | c7baa9b4b466c9872dd66dc51526099e1a820412; merge 19687dc0ae385d87c2369abd074eaf5cb32ffb89 | 2026-08-01 | PR #15 backend, PostgreSQL, frontend, Docker E2E, contract-and-security, dependency-review | 6 checks 성공, main merge | PostgreSQL schema-version fixture 분리 fix가 PR #15로 main에 포함됨 | 제품 수동 테스트 | SUCCESS (6/6) |
| P1.1 final CI | refoundation/phase1-canonical-docs | merge 6c43f97c884127257a5a733025475d60fd81ca21 | 2026-08-01 | PR #14 최종 Remote CI 및 merge 확인 | 최종 CI 성공, main merge | PR #15 remediation을 포함한 main 위에 canonical docs PR #14 병합; merge parent에 19687dc0ae385d87c2369abd074eaf5cb32ffb89 포함 | 제품 수동 테스트 | SUCCESS |
| P2 kickoff | refoundation/phase2-domain-contracts | 6c43f97c884127257a5a733025475d60fd81ca21 | 2026-08-01 | git branch --show-current; git rev-parse HEAD/main; git status --porcelain=v1; git merge-base --is-ancestor main HEAD; git diff --check; Markdown relative link; P0–P13/status/identifier/protected-path checks | branch/HEAD 일치, main ancestor, 시작 worktree clean, 문서 검증 성공 | main과 동일한 merge commit에서 P2 문서 전용 branch 시작; kickoff 변경은 governance/migration/product 문서 5개로 제한; protected path 변경 0 | production test, migration test, frontend test, AI test | NOT_EXECUTED |

Local evidence는 해당 commit 범위의 증거이며 Remote CI 성공을 대체하지 않는다. 실행하지 않은 검사는 통과로 기록하지 않는다.
