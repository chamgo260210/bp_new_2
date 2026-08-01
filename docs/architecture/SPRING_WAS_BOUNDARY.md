# Spring WAS Boundary

- Status: TARGET_CANONICAL
- Last Reviewed Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Scope: Spring responsibilities and prohibited delegation
- Supersedes: Legacy backend architecture documents
- Implementation Status: NOT_STARTED

Spring은 인증/JWT/refresh, admin authorization, owner scope, Project Workflow, RDB transaction, Flyway, Object Storage, audit, Service Policy와 public API를 소유한다.

신규 범용 TaskRun, TaskAttempt, TaskResult, TaskArtifact의 상태 source of truth도 Spring이다. Spring은 AI 입력을 구성해 전달하고 응답의 identity, schema, size, provenance와 업무 불변조건을 검증한 뒤 RDB/Object Storage에 저장한다.

Spring 안의 provider 직접 adapter는 Target에서 제거한다. 상세 Task schema와 transaction은 후속 Phase에서 확정한다.
