# Status and Error Contract Direction

- Status: DRAFT_CONTRACT
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P2
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Workflow, TaskRun and error semantics
- Supersedes: Legacy status and error contracts
- Implementation Status: NOT_STARTED

Project stage, resource/run status와 capability를 분리한다. 사용자 gate와 AI 실행 capability는 별도이며 backtracking과 upstream 변경에 따른 downstream `STALE`을 지원한다. TaskRun은 업무 요청과 현재 최종 상태를, TaskAttempt는 개별 실행·retry·timeout·오류·응답을 소유한다. Spring이 모든 상태와 capability의 source of truth다.

계약은 최소한 payload 초과를 다른 오류와 구분하는 `PAYLOAD_TOO_LARGE`, 법령 일부 출처 실패의 degraded result, `EXPERT_REVIEW_REQUIRED` 방향을 지원한다. 내부 provider body와 민감정보는 public 오류에 포함하지 않는다.

## Logical status dimensions

- Project status와 Workflow Stage는 [Domain Overview](../domain/DOMAIN_OVERVIEW.md)의 값을 사용한다.
- Capability는 enum stage의 동의어가 아니라 owner, policy, current exact references, lifecycle, user gate와 stale validity를 평가한 결과다.
- mutable Run/Task는 execution lifecycle을 가진다. immutable Version/Decision은 content lifecycle과 current/stale validity를 분리한다.
- `STALE`은 terminal failure나 deletion이 아니며 history/provenance를 유지한 채 current capability 근거에서 제외된 상태다.
- TaskAttempt response receipt, schema validation, domain adoption과 TaskRun final state를 각각 구분한다.

상세 capability name, domain별 status mapping, HTTP error mapping, cancellation, timeout, lease/retry와 stale response body는 P2.3에서 결정한다.
