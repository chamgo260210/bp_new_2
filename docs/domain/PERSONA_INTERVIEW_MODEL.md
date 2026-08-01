# Persona and Interview Model Direction

- Status: DRAFT_CONTRACT
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P2
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: PersonaStudy, PersonaCard and independent interviews
- Supersedes: Fixed cluster persona and panel interview models
- Implementation Status: NOT_STARTED

PersonaStudy는 선택된 ConceptVersion을 기준으로 `Role and Context`, `Problem and Needs`, `Behavior and Decision`의 Three-Layer Persona Card와 독립 PersonaInterview를 관리한다. demographic label만으로 Persona를 구성하지 않고 구매확률·시장점유율·실제 고객 통계로 표현하지 않는다. Persona는 서로 토론하지 않으며 각 인터뷰는 독립 TaskRun으로 추적한다.

P2.2에서 각 layer의 상세 field, 질문·응답과 실행 정책을 결정한다. Persona Card와 Interview는 AI가 생성한 합성 관점이며 실제 소비자 조사나 전문가 판단이 아니다. 결과는 MarketingWorkspace와 FinalReport의 근거가 된다.
