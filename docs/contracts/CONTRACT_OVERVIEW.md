# Contract Overview

- Status: DRAFT_CONTRACT
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P1
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Contract layers and Phase 2 boundaries
- Supersedes: Legacy API and AI contracts
- Implementation Status: NOT_STARTED

계약은 public /api/v2, Spring↔AI internal API, 상태·오류, provenance로 분리한다. 상세 JSON, field, DB schema와 endpoint는 Phase 2 이후 정의한다.

불변조건은 Frontend→Spring, AI Server→Spring-only, Spring data/storage ownership, owner scope, TaskRun source of truth, version/provenance 보존이다.
