# Public API Principles

- Status: DRAFT_CONTRACT
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P1
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Public API versioning and ownership rules
- Supersedes: Legacy workflow API contract
- Implementation Status: NOT_STARTED

Stable core는 기존 /api/v1을 유지할 수 있다. 신규 Project Workflow는 /api/v2를 사용한다. legacy Workflow에 compatibility redirect나 endpoint를 추가하지 않고 전환 완료 후 삭제한다.

모든 Project resource는 owner scope, 일관된 오류와 request correlation을 적용한다. resource path와 request/response schema는 구현 전 계약 Phase에서 결정한다.
