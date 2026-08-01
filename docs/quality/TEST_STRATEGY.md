# Test Strategy

- Status: TARGET_CANONICAL
- Last Reviewed Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Scope: Regression, vertical slice and contract test strategy
- Supersedes: Legacy testing and coverage documents
- Implementation Status: NOT_STARTED

테스트는 Stable Core Regression과 신규 Workflow vertical slice로 분리한다. legacy 테스트는 기능 삭제와 함께 제거하되 stable-core 또는 신규 대체 테스트가 먼저 존재해야 한다.

신규 slice는 domain unit, Spring API/owner scope, persistence/migration, Spring↔AI contract, frontend state/UI와 필요 시 E2E를 함께 제공한다. mock 결과를 provider 품질 검증으로 간주하지 않는다.
