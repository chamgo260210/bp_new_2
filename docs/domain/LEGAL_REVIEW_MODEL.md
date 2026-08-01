# Legal Review Model Direction

- Status: DRAFT_CONTRACT
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P1
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Korean legal review run boundary
- Supersedes: Legacy StructuredPlan-based legal review
- Implementation Status: NOT_STARTED

LegalReviewRun은 특정 IdeaVersion에 대한 실행과 결과 provenance를 표현한다. 한국 법령 MCP와 법제처 API 근거를 사용하며 법률 자문으로 오인되지 않게 표현한다.

Phase 2에서 검토 항목, 인용 구조, 상태, 재실행과 사용자 확인 계약을 결정한다. 상류는 IdeaVersion과 TaskRun이며 하류는 Concept Builder의 제약·주의 정보다.
