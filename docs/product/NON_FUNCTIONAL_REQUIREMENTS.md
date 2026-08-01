# Non-Functional Requirements

- Status: TARGET_CANONICAL
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P1
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Identified security, integrity, reliability and operability requirements
- Supersedes: Legacy quality, security and operations documents
- Implementation Status: NOT_STARTED

| ID | Requirement | Verification direction | Planned phase |
|---|---|---|---|
| NFR-001 | Frontend는 Spring WAS만 호출한다. | network/contract inspection | P3+ |
| NFR-002 | Spring은 RDB의 유일한 관리 주체다. | dependency/network test | P3+ |
| NFR-003 | Spring은 Object Storage의 유일한 관리 주체다. | boundary negative test | P3+ |
| NFR-004 | AI Server는 RDB, Storage, presigned URL, 업무 결과 로컬 저장을 사용하지 않는다. | dependency/config/integration inspection | P3 |
| NFR-005 | 모든 Project resource는 owner scope와 cross-owner 404를 보장한다. | API integration test | 모든 slice |
| NFR-006 | JWT/refresh/admin authorization은 re-foundation 중 회귀하지 않는다. | Stable Core regression | P3–P11 |
| NFR-007 | 비밀값·token·민감 provider body를 코드, 문서, public error, audit에 노출하지 않는다. | secret scan/error tests/review | 모든 phase |
| NFR-008 | 입력과 AI 결과는 schema, size, type, provenance 검증 후 저장한다. | validation/contract tests | P3+ |
| NFR-009 | TaskRun 상태와 retry 결정은 Spring이 source of truth다. | lifecycle/concurrency tests | P3 |
| NFR-010 | versioned 결과는 upstream version과 stale 상태를 추적한다. | persistence/API tests | P4–P10 |
| NFR-011 | 파일·export artifact는 checksum, content type, size, owner 검증을 적용한다. | storage integrity tests | P3/P4/P9/P10 |
| NFR-012 | Flyway V1–V26을 수정하지 않고 fresh/upgrade/validate를 통과한다. | PostgreSQL migration gates | schema phase |
| NFR-013 | 외부 AI·법령 장애를 업무 데이터 손상과 다른 실행으로 격리한다. | timeout/retry/failure tests | P3/P4+ |
| NFR-014 | health/readiness는 process, RDB, Storage, AI, 법령 연결 상태를 구분한다. | actuator/admin integration | P3/P11 |
| NFR-015 | local evidence와 remote CI status를 구분하고 미실행 검사를 통과로 기록하지 않는다. | governance review | 모든 phase |
| NFR-016 | current/target contract drift를 자동 또는 반복 가능한 검사로 탐지한다. | link/schema/route/contract gates | P2+ |

정량 SLO, payload 제한, retention, encryption/key management와 deployment topology는 후속 Phase에서 결정한다.
