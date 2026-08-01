# Concept Model Direction

- Status: DRAFT_CONTRACT
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P1
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Concept generation, candidate and version boundaries
- Supersedes: Fixed 12-section plan model
- Implementation Status: NOT_STARTED

ConceptGenerationRun은 IdeaVersion과 법률 검토 맥락에서 복수 ConceptCandidate를 만든다. 후보는 ConceptVersion 계보를 가지며 고정 항목을 요구하지 않는다.

Phase 2에서 concept field, 후보 수 정책, version 생성과 provenance를 결정한다. 상류는 IdeaVersion/LegalReviewRun, 하류는 assessment, shortlist, selection이다.
