# Spring WAS Boundary

- Status: TARGET_CANONICAL
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P1
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Spring responsibilities, flows and TaskRun ownership
- Supersedes: Legacy backend architecture documents
- Implementation Status: NOT_STARTED

## Owned responsibilities

Spring은 auth/JWT/refresh, admin authorization, Project owner scope, public /api/v1 stable core와 /api/v2 workflow, domain transaction, Flyway, Object Storage, audit, Service Policy, TaskRun 계열을 소유한다.

TaskRun은 업무 작업 상태의 source of truth다. TaskAttempt는 개별 실행 시도, TaskResult는 검증된 결과, TaskArtifact는 Spring이 소유한 artifact metadata/lifecycle 방향을 가진다. 상세 schema는 P2/P3에서 확정한다.

## Input and result flow

사용자 파일은 Spring multipart 또는 후속 public upload contract를 통해 들어온다. Spring이 owner, policy, filename, content type, size, checksum을 검증하고 metadata와 bytes를 각각 RDB/Storage에 저장한다.

AI JSON 작업은 Spring이 특정 input version을 snapshot/reference하여 bounded request를 만들고 TaskAttempt identity와 함께 AI Server에 전달한다. 응답은 identity, type/version, size/schema, provenance, domain invariants를 검증한 뒤에만 채택한다.

AI binary 결과도 Storage URL을 AI Server에 제공하지 않는다. 전달 방식은 OD-002에서 결정하며, 어떤 선택이든 Spring이 bytes를 받아 검증하고 Storage에 기록한다.

## Timeout, retry and error

- Spring이 업무 timeout, retry eligibility, attempt 생성과 최종 TaskRun 상태를 결정한다.
- AI Server는 한 attempt 내부 provider timeout/error를 정규화한다.
- network ambiguity가 결과 중복 채택으로 이어지지 않도록 attempt/result identity를 검증한다.
- public error는 내부 provider body와 secret을 숨긴다.
- 사용자 입력 수정이 필요한 실패와 자동 retry 가능한 실패를 구분한다.

## Current gap

현재 AnalysisJob과 provider 직접 adapter는 Target TaskRun/Spring–AI boundary가 아니다. 기존 기반을 compatibility layer로 확장하지 않고 후속 Phase에서 교체한다.
