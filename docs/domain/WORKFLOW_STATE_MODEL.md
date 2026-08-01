# Workflow and Task Logical Model

- Status: DRAFT_CONTRACT
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P2
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Project stage/capability and TaskRun/Attempt/Result/Artifact schema
- Supersedes: Legacy ProjectStage, completion gates and AnalysisJob model
- Implementation Status: NOT_STARTED

## State and capability model

Project status는 `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`다. Workflow stage는 `IDEA_INTAKE`, `LEGAL_REVIEW`, `CONCEPT_BUILDING`, `CONCEPT_ANALYSIS`, `CONCEPT_SELECTION`, `VALIDATION`, `MARKETING`, `FINAL_REPORT`다.

Stage는 현재 사용자 여정의 표시값이다. 실제 명령 가능 여부는 별도 Capability로 평가하며 최소한 다음 입력을 사용한다.

- Project status와 owner scope
- required exact current version/reference 존재 여부
- resource/run lifecycle과 `CURRENT`/`STALE` validity
- 사용자 shortlist/selection/confirmation gate
- TaskRun 충돌·진행 상태와 Service Policy

Backtracking은 허용한다. Stage를 뒤로 이동하거나 상류 version을 바꿔도 downstream record를 삭제하지 않고 stale matrix에 따라 `STALE`로 만든다. AI Server 응답은 Project stage, capability, current pointer 또는 user decision을 직접 변경하지 않는다.

## TaskRun

TaskRun은 Project 소유의 범용 업무 요청 aggregate다.

| Concern | Logical contract |
|---|---|
| Identifier/owner | TaskRun identifier; 정확히 한 Project와 owner scope |
| Subject | task type, subject type과 exact subject identifier; subject는 같은 Project 소속 |
| Input | immutable input snapshot/hash, contract version, idempotency key, correlation 방향 |
| State ownership | 업무 요청과 현재 최종 상태, final adopted TaskResult reference를 Spring이 소유 |
| Retry policy | 생성 당시 retry eligibility, attempt limit/backoff/timeout policy snapshot 방향 |
| Mutability | state/current attempt/final result/lifecycle metadata mutable; subject/input은 immutable |
| Lifecycle | `QUEUED`, `READY`, `RUNNING`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `TIMED_OUT` |
| Time | 생성, 최초 시작, terminal, 마지막 갱신 시각 |
| Concurrency | 필수; claim/result adoption/retry race와 lost update 방지 |
| Provenance | initiating actor/system, subject exact ref, input hash와 adopted result |
| Delete | 업무/domain/report provenance가 참조하면 보존; archive/retention 방향 |
| Uniqueness | TaskRun identifier; idempotency key는 정의된 Project/task/subject scope에서 중복 업무 요청 방지 |

TaskRun state가 `SUCCEEDED`가 되려면 채택 가능한 validated TaskResult가 있어야 한다. late result가 이미 terminal인 TaskRun을 자동 재개하거나 사용자 결정을 교체하지 않는다.

## TaskAttempt

| Concern | Logical contract |
|---|---|
| Identifier/owner | TaskAttempt identifier; TaskRun composition과 Project scope 상속 |
| Cardinality | TaskRun `1:N`; attempt number는 TaskRun 안에서 유일·단조 증가 |
| Claim/lease | worker/claim identity, lease 획득·expiry, heartbeat/renewal 방향 |
| Execution | request/response contract version, provider-neutral execution metadata, started/finished time |
| Failure | timeout, normalized error category/code, retryable direction; secret/raw provider body 제외 |
| Mutability | claim과 lifecycle은 terminal 전 mutable; terminal 후 append-only evidence |
| Lifecycle | `CREATED`, `CLAIMED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `TIMED_OUT`, `CANCELLED` |
| Concurrency | 필수; 유효 lease owner만 transition/adoption 후보 생성 가능 |
| Provenance | exact TaskRun/input hash, executor identity와 contract version |
| Delete | TaskRun retention을 따름 |

외부 AI/MCP/API 호출 동안 Spring DB transaction을 유지하지 않는다. claim/lease 또는 동등한 control로 실행 권한을 확보하고 transaction 밖에서 호출한 뒤, 짧은 transaction에서 lease, attempt state, input hash와 idempotency를 재검증해 결과를 기록한다. polling과 event wake 모두 이 logical contract를 사용할 수 있으며 outbox 선택은 P3 구현 결정이다.

## TaskResult

| Concern | Logical contract |
|---|---|
| Identifier/owner | TaskResult identifier; TaskRun composition, exact TaskAttempt reference |
| Cardinality | TaskAttempt `1:0..N` Result; duplicate/late response evidence 보존. adopted result는 Attempt당 최대 하나이고 TaskRun final adopted result도 최대 하나 |
| Semantics | provider-neutral result body direction, schema/contract version, provenance, warning/error evidence |
| Validation | `RECEIVED`, `VALIDATED`, `REJECTED`, `ADOPTED`; domain adoption과 transport receipt 구분 |
| Mutability | received payload/provenance immutable; validation/adoption state만 controlled transition |
| Time | 수신, 검증, 채택/거절 시각 |
| Concurrency | validation/adoption에 필수; TaskRun terminal/current result와 원자적으로 검증 |
| Provenance | exact Attempt, input snapshot/hash와 external source/model-neutral metadata |
| Delete | adopted/non-adopted 모두 retry/ambiguity evidence retention 방향 |
| Uniqueness | result identifier; 동일 response identity 중복 채택 금지 |

검증 실패 또는 stale lease의 결과는 domain result로 채택하지 않지만 non-adopted evidence로 보존할 수 있다. 지연 response는 current Attempt/TaskRun 상태와 exact contract를 다시 확인하며 이미 채택된 결과를 덮어쓰지 않는다.

## TaskArtifact

| Concern | Logical contract |
|---|---|
| Identifier/owner | TaskArtifact identifier; TaskResult composition/reference와 Project scope |
| Cardinality | TaskResult `1:N` artifact |
| Storage ownership | Spring-owned StoredFile/Object Storage metadata reference만 허용 |
| Semantics | artifact role/type, content metadata/checksum/size, producing result reference 방향 |
| Mutability | bytes immutable; metadata/lifecycle mutable |
| Lifecycle | `PENDING`, `AVAILABLE`, `QUARANTINED`, `DELETED` |
| Time/concurrency | 생성·검증·삭제 시각; lifecycle transition에 optimistic concurrency |
| Provenance | exact TaskResult, Spring validation과 generator identity |
| Delete | RDB reference/retention 확인 후 Spring만 수행 |
| Uniqueness | artifact identifier와 Storage object identity 중복 방지 방향 |

AI Server의 RDB/Object Storage reference, object key, presigned URL 또는 local artifact path는 TaskArtifact 계약에 포함하지 않는다. 초기 AI binary transport는 지원하지 않는다. Spring이 생성한 Final Report PDF 같은 artifact는 TaskArtifact 또는 report export reference와 연결할 수 있다.

## Stale and adoption rules

- TaskRun input subject/version이 stale이면 새 Attempt를 claim할 capability가 없다.
- 실행 중 upstream이 변경되면 response를 수신해도 domain result로 자동 채택하지 않고 stale/non-adopted evidence로 남긴다.
- retry 성공은 이전 user Decision/Selection을 암묵적으로 교체하지 않는다.
- TaskRun/Attempt/Result 상태와 domain Run lifecycle의 mapping은 P2.3 status/error/API contract에서 명시하며 같은 이름을 무조건 동일 enum으로 공유하지 않는다.
