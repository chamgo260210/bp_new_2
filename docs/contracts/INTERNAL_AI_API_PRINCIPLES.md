# Internal AI API Principles

- Status: DRAFT_CONTRACT
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P2
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Spring to AI Server task communication
- Supersedes: Legacy direct-provider and presigned artifact contracts
- Implementation Status: NOT_STARTED

Spring은 TaskRun/TaskAttempt identity, task type/version, idempotency key, input snapshot/hash, 제한과 correlation을 bounded inline JSON으로 전달한다. FILE bytes가 아니라 Spring이 검증·추출한 text를 전달하며, 큰 text는 순서와 무결성을 검증할 수 있는 bounded chunk 배열로 구성한다. AI Server는 실행 결과, provenance, 경고와 정규화된 오류를 반환하고 Spring이 검증·저장한 뒤 TaskRun 최종 상태를 확정한다.

Payload가 계약 상한을 넘고 허용된 chunk contract로 표현할 수 없으면 `PAYLOAD_TOO_LARGE`를 반환한다. Storage URL/credential, presigned URL, 임시 공유 Storage, RDB identity 조회, provider 비밀값 역전달은 금지한다. streaming/binary protocol은 후속 확장이며 이 결정이 AI Server의 Storage 접근을 허용하지 않는다.

외부 AI 호출 동안 Spring DB transaction을 유지하지 않는다. TaskAttempt claim/lease 또는 동등한 동시성 제어와 idempotent result adoption을 사용하며 계약은 polling과 event wake에 중립적이다. provider/model/SDK/library 고유 type은 P2 계약에 포함하지 않는다.

법률 작업에서 AI Server는 법제처 API의 공식 근거 확인과 법령 MCP의 탐색을 조정하고 source channel, 조회 시각, 법령 식별자, 조문, degraded 경고와 전문가 검토 필요 방향을 반환한다. 법령 secret은 Spring payload로 전달하지 않는다.
