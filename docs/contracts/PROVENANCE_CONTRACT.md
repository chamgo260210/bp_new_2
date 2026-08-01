# Provenance Contract Direction

- Status: DRAFT_CONTRACT
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P2
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Source, AI result and user decision traceability
- Supersedes: Legacy snapshot and hash contracts
- Implementation Status: NOT_STARTED

IdeaSource, 외부 법령 근거, Concept/분석/Persona/Marketing 실행, AI 권고, 사용자 선택과 FinalReportVersion의 연결을 추적해야 한다. versioned 결과는 생성 당시 input snapshot/hash와 TaskRun/TaskAttempt를 식별할 수 있어야 한다. AI 제안, 사용자 결정, 외부 출처 사실과 가정을 서로 다른 provenance category로 구분한다.

Quick와 Detailed는 shared core input provenance를 참조하되 각 analysis-specific 입력·결과를 구분한다. 법률 provenance는 조회 시각, 법령 식별자, 조문과 source channel을 보존하고 한쪽 출처 실패 시 degraded 상태와 누락 출처를 표시한다. 상세 식별자, hash, citation, retention과 재현성 수준은 P2.2에서 결정한다. provenance는 audit와 다르지만 correlation할 수 있어야 한다.
