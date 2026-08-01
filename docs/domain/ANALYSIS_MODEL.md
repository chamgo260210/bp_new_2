# Analysis Model Direction

- Status: DRAFT_CONTRACT
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P2
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Quick and detailed concept assessment boundaries
- Supersedes: Legacy feasibility and financial analysis models
- Implementation Status: NOT_STARTED

ConceptAssessmentRun은 모든 Concept 후보에 적용하는 저비용 Quick Assessment를, DetailedAnalysisRun은 shortlist 후보에만 적용하는 시장·BM·기술운영·재무 분석을 표현한다. 두 run은 shared core provenance와 input snapshot을 재사용하되 analysis-specific input/output contract를 가진다. Quick 결과는 Detailed 사실로 자동 승격되지 않으며 각 결과는 해당 ConceptVersion과 provenance를 고정한다.

P2.2에서 shared core와 분석별 추가 입력·결과, scoring, 근거, 재실행 field를 결정한다. ConceptSelection은 AI 권고와 사용자 선택을 분리한다. model/provider/library 고유 타입은 계약에 포함하지 않는다.
