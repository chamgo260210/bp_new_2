# Status and Error Contract Direction

- Status: DRAFT_CONTRACT
- Last Reviewed Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Scope: Workflow, TaskRun and error semantics
- Supersedes: Legacy status and error contracts
- Implementation Status: NOT_STARTED

Project Workflow 상태와 TaskRun 상태를 분리한다. Spring이 상태 source of truth이며 retryable 여부, 사용자 조치 필요 여부와 안전한 public error를 구분한다.

상세 enum, HTTP mapping, cancellation, timeout과 retry 규칙은 Phase 2에서 결정한다. 내부 provider body와 민감정보는 public 오류에 포함하지 않는다.
