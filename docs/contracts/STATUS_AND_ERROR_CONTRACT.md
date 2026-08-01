# Workflow Status and Error Contract

- Status: DRAFT_CONTRACT
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P2
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Workflow, TaskRun and error semantics
- Supersedes: Legacy status and error contracts
- Implementation Status: NOT_STARTED

Project stage, resource/run status와 capability를 분리한다. 사용자 gate와 AI 실행 capability는 별도이며 backtracking과 upstream 변경에 따른 downstream `STALE`을 지원한다. TaskRun은 업무 요청과 현재 최종 상태를, TaskAttempt는 개별 실행·retry·timeout·오류·응답을 소유한다. Spring이 모든 상태와 capability의 source of truth다.

계약은 payload 초과, gate/policy 차단, execution failure와 AI result validation failure를 서로 다른 오류로 표현한다. 법령 일부 출처 실패는 무조건 transport error로 바꾸지 않고 adopted legal result의 degraded source 상태로 표현할 수 있다. `EXPERT_REVIEW_REQUIRED`는 Legal business result이며 error code가 아니다. 내부 provider body와 민감정보는 public 오류에 포함하지 않는다.

## Independent status dimensions

- Project status와 Workflow Stage는 [Domain Overview](../domain/DOMAIN_OVERVIEW.md)의 값을 사용한다.
- Capability는 enum stage의 동의어가 아니라 owner, policy, current exact references, lifecycle, user gate와 stale validity를 평가한 결과다.
- TaskRun/TaskAttempt가 execution lifecycle을 가진다. Domain Run은 그 상태를 projection하고 adopted business result와 validity를 소유한다. immutable Version/Decision은 content lifecycle과 current/stale validity를 분리한다.
- `STALE`은 terminal failure나 deletion이 아니며 history/provenance를 유지한 채 current capability 근거에서 제외된 상태다.
- TaskAttempt response receipt, schema validation, domain adoption과 TaskRun final state를 각각 구분한다.

Canonical 값은 다음과 같고 같은 문자열이 보여도 각 차원의 enum/field는 공유하지 않는다.

| Dimension | Values |
|---|---|
| Project lifecycle | `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED` |
| Workflow Stage | `IDEA_INTAKE`, `LEGAL_REVIEW`, `CONCEPT_BUILDING`, `CONCEPT_ANALYSIS`, `CONCEPT_SELECTION`, `VALIDATION`, `MARKETING`, `FINAL_REPORT` |
| Validity | `CURRENT`, `STALE` |
| TaskRun | `QUEUED`, `READY`, `RUNNING`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `TIMED_OUT` |
| TaskAttempt | `CREATED`, `CLAIMED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `TIMED_OUT`, `CANCELLED` |
| TaskResult validation | `RECEIVED`, `VALIDATED`, `REJECTED`, `ADOPTED` |
| Legal result | `PASS`, `PASS_WITH_CONDITIONS`, `REVISION_REQUIRED`, `PROHIBITED`, `INSUFFICIENT_INFORMATION`, `EXPERT_REVIEW_REQUIRED` |

## Domain Run execution mapping

- TaskRun은 execution lifecycle source of truth다. Domain Run에 독립적으로 전이되는 duplicate execution status를 두지 않는다.
- Domain Run은 exact business input, 1:1 TaskRun binding, adopted TaskResult/business result reference, domain validation, provenance와 validity를 소유한다.
- TaskRun `SUCCEEDED`만으로 Domain Run 성공을 판단하지 않는다. exact binding/input, `ADOPTED` TaskResult와 domain validation 성공이 모두 필요하다.
- TaskRun `FAILED`, `TIMED_OUT`, `CANCELLED`는 각각 Domain Run execution 표시로 projection되지만 `STALE`과는 별개다.
- upstream 변경은 성공한 run도 `STALE`로 만들 수 있다. 실행 성공 history는 보존한다.
- late, duplicate 또는 stale lease result는 기존 adopted result를 덮어쓰지 않고 `REJECTED`/non-adopted evidence로 보존할 수 있다.

## Error semantics

HTTP status, error envelope와 endpoint별 적용은 [Public API v2 Contract](PUBLIC_API_V2_CONTRACT.md)에서 고정한다.

| Code | Meaning | Retry direction | User correction | HTTP direction |
|---|---|---|---|---:|
| `VALIDATION_ERROR` | command field/shape/domain validation 실패 | 동일 요청 재시도 불가 | 요청 수정 필요 | 400 |
| `RESOURCE_NOT_FOUND` | resource 없음 또는 cross-owner concealment | 일반적으로 불가 | identifier/접근 context 확인 | 404 |
| `CONFLICT` | 현재 revision/lifecycle과 command 충돌 | 최신 상태 조회 후 가능 | refresh 또는 command 변경 | 409 |
| `STALE_RESOURCE` | command 대상 exact reference가 더 이상 current가 아님 | 동일 reference로 불가 | current reference 선택 또는 명시적 rerun | 409 |
| `CAPABILITY_NOT_AVAILABLE` | 계산된 capability가 false | 조건 충족 후 가능 | missing gate/reference 확인 | 409 |
| `POLICY_BLOCKED` | Service Policy 또는 maintenance가 명령을 차단 | policy 해제 후 가능 | 일반적으로 입력 수정 불필요 | 403; 일시 maintenance는 503 방향 |
| `UPSTREAM_NOT_READY` | 필수 current upstream/result가 준비되지 않음 | upstream 완료 후 가능 | 선행 단계 완료 | 409 |
| `LEGAL_GATE_BLOCKED` | current legal result가 concept generation을 허용하지 않음 | 같은 input 자동 retry 불가 | Idea correction, 정보 보강 또는 전문가 검토 | 409 |
| `TASK_ALREADY_RUNNING` | 같은 subject/input의 conflicting active TaskRun 존재 | 기존 task 종료 후 가능 | 새 중복 command 불필요 | 409 |
| `IDEMPOTENCY_CONFLICT` | 같은 key가 다른 canonical input과 결합됨 | 동일 key/다른 input 재시도 불가 | 새 key 또는 원래 input 사용 | 409 |
| `PAYLOAD_TOO_LARGE` | bounded inline/chunk 계약 상한 초과 | 같은 payload로 불가 | 축소 또는 허용 chunk contract 사용 | 413 |
| `TASK_TIMEOUT` | TaskRun/Attempt가 timeout terminal 상태 | retry policy/capability에 따라 가능 | 보통 입력 수정 불필요 | 504 |
| `AI_SERVICE_UNAVAILABLE` | AI Server 또는 required AI dependency 사용 불가 | backoff 후 가능 | 보통 입력 수정 불필요 | 503 |
| `AI_RESULT_INVALID` | 응답 수신은 됐지만 schema/domain validation 또는 adoption 불가 | 정책에 따라 새 Attempt 가능 | 입력 보강이 필요할 수 있음 | 502 |

Error code는 한 envelope에서 하나의 primary code로 사용하고 세부 field/gate/task 원인은 structured detail로 분리한다. Provider 이름, raw response/body, credential, stack trace, 내부 object key와 개인정보는 노출하지 않는다. 모든 오류는 request correlation identifier 방향을 지원하고, task가 이미 생성된 뒤 발생한 오류는 권한 확인 후 TaskRun identifier를 노출할 수 있다. TaskAttempt/provider identifier는 public 기본 응답에 노출하지 않는다.

## Gate-specific semantics

- Legal gate는 exact current IdeaVersion의 adopted `PASS` 또는 `PASS_WITH_CONDITIONS`만 concept generation을 허용한다. 나머지 legal result는 `LEGAL_GATE_BLOCKED`다.
- Shortlist/Selection은 USER decision이다. AI rank/recommendation 부재나 존재가 자동 결정으로 전환되지 않는다.
- Detailed command의 ConceptVersion이 current ShortlistDecision에 없으면 `CAPABILITY_NOT_AVAILABLE` 또는 stale exact reference이면 `STALE_RESOURCE`다.
- Persona, Marketing, Report는 exact current non-stale upstream을 요구한다. 단순히 Project Stage가 앞서 있다는 이유로 허용하지 않는다.
- 동일 subject/input active TaskRun 충돌은 `TASK_ALREADY_RUNNING`; idempotency key/input 불일치는 `IDEMPOTENCY_CONFLICT`로 구분한다.

상세 JSON error envelope, field error shape, command/query별 error subset과 response example은 [Public API v2 Contract](PUBLIC_API_V2_CONTRACT.md)를 따른다. 이 문서는 `docs/api/openapi.yaml`을 변경하거나 현재 구현 계약으로 선언하지 않는다.
