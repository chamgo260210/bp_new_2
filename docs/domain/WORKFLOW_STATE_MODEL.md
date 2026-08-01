# Workflow State Model Direction

- Status: DRAFT_CONTRACT
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P1
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Project workflow state and TaskRun interaction
- Supersedes: Legacy ProjectStage and completion gates
- Implementation Status: NOT_STARTED

Project Workflow 상태는 업무 진행을 표현하고 TaskRun 상태와 구분한다. 상태 source of truth는 Spring이며 AI Server 응답 자체가 Project 상태를 변경하지 않는다. 사용자 선택 gate는 자동 완료와 구별한다.

Phase 2에서 상태명, 전이, 실패·취소·재실행, 병렬 실행과 접근 조건을 결정한다.
