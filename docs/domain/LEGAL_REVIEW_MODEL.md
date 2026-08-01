# Legal Review Model Direction

- Status: DRAFT_CONTRACT
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P2
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Korean legal review run boundary
- Supersedes: Legacy StructuredPlan-based legal review
- Implementation Status: NOT_STARTED

LegalReviewRun은 특정 IdeaVersion에 대한 실행과 결과 provenance를 표현한다. AI Server의 coordinated source adapter가 법령 MCP와 법제처 API를 조정한다. 법제처 API는 원문·법령 식별자·현재성 확인의 authoritative source이고 MCP는 검색·탐색·연관 법령 발견에 사용한다. 한쪽 실패 시 성공한 출처와 누락된 출처를 구분한 degraded result를 허용한다.

결과는 출처, 조회 시각, 법령 식별자, 조문, source channel을 포함하는 방향이며 법률 자문이나 법적 결론으로 표현하지 않는다. 불확실성이나 고위험 사항은 `EXPERT_REVIEW_REQUIRED`를 지원한다. P2.2에서 검토 항목, 인용 구조, degraded 상태, 재실행과 사용자 확인의 상세 field를 결정한다. 상류는 IdeaVersion과 TaskRun이며 하류는 Concept Builder의 제약·주의 정보다.
