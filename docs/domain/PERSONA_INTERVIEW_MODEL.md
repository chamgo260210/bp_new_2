# Persona and Interview Model Direction

- Status: DRAFT_CONTRACT
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P1
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: PersonaStudy, PersonaCard and independent interviews
- Supersedes: Fixed cluster persona and panel interview models
- Implementation Status: NOT_STARTED

PersonaStudy는 선택된 ConceptVersion을 기준으로 Three-Layer Persona Card와 독립 PersonaInterview를 관리한다. Persona는 서로 토론하지 않으며 각 인터뷰는 독립 TaskRun으로 추적한다.

Phase 2에서 세 layer, 특성, 질문·응답과 실행 정책을 결정한다. 결과는 MarketingWorkspace와 FinalReport의 근거가 된다.
