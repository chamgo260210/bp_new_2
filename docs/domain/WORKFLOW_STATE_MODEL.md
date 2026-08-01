# Workflow State Model Direction

- Status: DRAFT_CONTRACT
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P2
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Project workflow state and TaskRun interaction
- Supersedes: Legacy ProjectStage and completion gates
- Implementation Status: NOT_STARTED

Project Workflow는 state + capability model을 사용한다. 기본 여정은 순차적이지만 Project stage, resource/run status, 사용자 선택·확정 gate와 AI 실행 capability를 분리한다. backtracking을 허용하고 upstream 변경 시 관련 downstream을 삭제하지 않고 `STALE`로 표시한다. 상태와 capability source of truth는 Spring이며 AI Server 응답 자체가 Project 상태나 사용자 결정을 변경하지 않는다.

TaskRun은 업무 요청과 현재 최종 상태를, TaskAttempt는 개별 실행·retry·timeout·오류·응답을 소유한다. P2.2에서 상태명, capability, 전이, stale propagation, 실패·취소·재실행, 병렬 실행과 cardinality를 결정한다.
