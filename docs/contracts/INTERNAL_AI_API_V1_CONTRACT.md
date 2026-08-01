# Internal Spring–AI API v1 Contract

- Status: DRAFT_CONTRACT
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P2
- Introduced In Commit: P2.5 commit pending
- Scope: Provider-neutral synchronous TaskAttempt execution contract between Spring WAS and AI Server
- Supersedes: Legacy direct-provider, artifact-service and presigned transfer contracts
- Implementation Status: NOT_STARTED

이 문서는 구현 전 Target 계약이다. 실제 Spring client, FastAPI route, DTO/Pydantic model, OpenAPI 또는 provider 선택을 의미하지 않는다.

## 1. Boundary and execution model

- Base path는 `/internal/v1/ai`이고 유일한 실행 endpoint는 `POST /internal/v1/ai/executions`다.
- 하나의 HTTP request는 Spring Worker가 claim한 하나의 `TaskAttempt` 실행이다. AI Server는 동기적으로 처리해 success 또는 error JSON을 반환한다.
- AI Server는 stateless execution service다. 내부 업무 queue, 업무 RDB, callback, webhook, durable idempotency store를 요구하지 않는다.
- Spring은 외부 호출 동안 DB transaction을 유지하지 않는다. 연결 단절이나 응답 유실 때문에 실제 실행은 at-least-once일 수 있지만, 검증된 결과의 채택은 Spring이 정확히 한 번 수행한다.
- retry는 같은 TaskRun에 새 TaskAttempt와 새 execution identifier를 만든다. 사용자 rerun은 새 Domain Run과 새 TaskRun을 만든다.
- TaskRun/TaskAttempt, retry, timeout, idempotency, 최종 상태는 Spring이 source of truth다. HTTP 200만으로 TaskRun 성공이 되지 않는다.

## 2. Authentication and headers

| Header | Requirement | Rule |
|---|---|---|
| `Authorization` | required | `Bearer <internal-service-token>`; 사용자 JWT가 아닌 service credential |
| `Content-Type` | required | `application/json` |
| `X-Correlation-Id` | required | body `correlationId`와 같아야 하는 bounded opaque value |

Service token은 환경변수 또는 deployment Secret으로만 공급하며 body, application log, error 또는 fixture에 기록하지 않는다. TLS가 적용된 내부 network에서만 호출한다. 향후 mTLS 추가는 JSON body를 바꾸지 않는다. v1에는 별도 version header를 정의하지 않으며 body `contractVersion`이 유일한 version discriminator다. 사용자 JWT, refresh token, session ID, 사용자 credential은 전달하지 않는다.

## 3. Common execution request

```json
{
  "contractVersion": "1.0",
  "taskType": "IDEA_INTERPRETATION",
  "taskSchemaVersion": "1.0",
  "taskRunId": "opaque-execution-reference",
  "taskAttemptId": "opaque-attempt-reference",
  "correlationId": "opaque-correlation-id",
  "deadlineAt": "2026-08-02T00:30:00Z",
  "canonicalInputHash": "sha256:hex-digest",
  "locale": "ko-KR",
  "input": {}
}
```

모든 field는 required/non-null이다. Unknown top-level field는 `INVALID_REQUEST`다. `taskRunId`와 `taskAttemptId`는 echo/correlation용 opaque reference이며 AI Server가 Spring RDB를 조회하는 key가 아니다. owner/user/Project DB identifier를 lookup 목적으로 전달하지 않는다. 업무 관계는 request-local key로 표현한다. `deadlineAt`은 RFC 3339 UTC이며 만료된 요청은 실행하지 않는다. v1 locale은 `ko-KR`이고 다른 값은 해당 task schema가 명시적으로 확장하기 전까지 거부한다. `input`은 `taskType` discriminator와 `taskSchemaVersion`에 맞는 schema여야 한다.

### Canonical input hash

- 알고리즘은 SHA-256, encoding은 UTF-8 canonical JSON이다.
- hash 대상은 `contractVersion`, `taskType`, `taskSchemaVersion`, `locale`, `input`이다.
- 실행마다 변하는 `taskRunId`, `taskAttemptId`, `correlationId`, `deadlineAt`은 제외한다.
- Object key나 credential을 hash input에 넣지 않는다.
- Spring이 계산하고 AI Server가 검증·echo한다. 정확한 canonicalization fixture는 P2.6에서 고정한다.

## 4. ContractLimitProfile V1 and text chunks

| Limit | V1 value |
|---|---:|
| Request JSON hard maximum | 2 MiB |
| Response JSON hard maximum | 2 MiB |
| Text chunks per `TextContent` | 64 |
| Text per chunk | 16,384 characters |
| Total extracted text per execution | 500,000 characters |

Provider effective limit가 더 작으면 Spring Service Policy가 command 수락 전에 capability 또는 payload를 차단한다. Contract 상한을 넘으면 `PAYLOAD_TOO_LARGE`다.

`TextContent` required fields는 `contentKey`, `contentType`=`TEXT`, `language`, `totalCharacters`, `contentHash`, `chunks`다. `TextChunk` required fields는 `index`, `text`, `characterCount`, `chunkHash`다. Index는 0부터 연속이어야 하고 누락·중복·순서 변경을 허용하지 않는다. 선언 count, 실제 character count, chunk SHA-256, 순서대로 결합한 전체 content SHA-256을 모두 검증한다. HTML, binary, base64 FILE payload, FILE bytes는 허용하지 않는다.

## 5. Common success response

```json
{
  "contractVersion": "1.0",
  "taskType": "IDEA_INTERPRETATION",
  "taskSchemaVersion": "1.0",
  "taskRunId": "opaque-execution-reference",
  "taskAttemptId": "opaque-attempt-reference",
  "correlationId": "opaque-correlation-id",
  "canonicalInputHash": "sha256:hex-digest",
  "resultSchemaVersion": "1.0",
  "result": {},
  "warnings": [],
  "provenance": [],
  "usage": null
}
```

정상 구조화 결과는 HTTP 200이다. Request의 version/type/execution/correlation/hash를 정확히 echo한다. `warnings`와 `provenance`는 required arrays이며 `usage`는 required nullable provider-neutral summary다. AI Server가 output schema를 검증한 후 반환하고 Spring이 size, echo identity/hash, schema, provenance와 domain invariant를 독립적으로 다시 검증한다. Spring이 TaskResult를 `ADOPTED`한 뒤에만 업무 성공이다. Provider/model/SDK 이름, prompt, chain-of-thought, raw provider response는 결과에 포함하지 않는다.

## 6. Internal error envelope and public mapping

```json
{
  "error": {
    "code": "DEPENDENCY_UNAVAILABLE",
    "message": "A required dependency is temporarily unavailable.",
    "correlationId": "opaque-correlation-id",
    "taskRunId": "opaque-execution-reference",
    "taskAttemptId": "opaque-attempt-reference",
    "retryable": true,
    "details": []
  }
}
```

Error는 안전한 요약만 제공한다. Raw dependency/provider body, secret, prompt, stack trace 또는 storage identity는 금지한다.

| Internal code | HTTP | Retryable | TaskAttempt direction | Public Task error | Safe detail direction |
|---|---:|---|---|---|---|
| `INVALID_REQUEST` | 400 | no | FAILED | `AI_RESULT_INVALID` | invalid field/reason; raw value 제외 |
| `UNAUTHORIZED_INTERNAL_CALL` | 401/403 | no | FAILED | `AI_SERVICE_UNAVAILABLE` | authentication/authorization category only |
| `UNSUPPORTED_CONTRACT_VERSION` | 422 | no | FAILED | `AI_RESULT_INVALID` | supported major versions |
| `UNSUPPORTED_TASK_TYPE` | 422 | no | FAILED | `AI_RESULT_INVALID` | rejected discriminator |
| `UNSUPPORTED_TASK_SCHEMA_VERSION` | 422 | no | FAILED | `AI_RESULT_INVALID` | task type와 supported versions |
| `PAYLOAD_TOO_LARGE` | 413 | no | FAILED | `PAYLOAD_TOO_LARGE` | violated limit name |
| `DEADLINE_EXCEEDED` | 504 | policy-dependent | TIMED_OUT | `TASK_TIMEOUT` | deadline category, no provider detail |
| `DEPENDENCY_UNAVAILABLE` | 503 | yes | FAILED | `AI_SERVICE_UNAVAILABLE` | dependency class only |
| `RATE_LIMITED` | 429 | yes | FAILED | `AI_SERVICE_UNAVAILABLE` | safe retry-after direction |
| `EXECUTION_FAILED` | 500 | indicated by response | FAILED | `AI_SERVICE_UNAVAILABLE` | normalized execution category |
| `RESULT_SCHEMA_INVALID` | 502 | policy-dependent | FAILED | `AI_RESULT_INVALID` | schema/reason identifier |
| `INTERNAL_ERROR` | 500 | policy-dependent | FAILED | `AI_SERVICE_UNAVAILABLE` | generic internal category |

Internal request bug의 raw detail은 public에 숨긴다. 이미 public command가 202로 TaskRun을 만든 뒤 발생한 오류는 TaskRun의 terminal state/errorSummary에 기록되고, TaskRun GET은 200이다. Spring이 TaskRun을 만들기 전에 dependency unavailable로 command를 수락할 수 없는 경우에만 public 503이며 `taskRunId`는 null이다.

## 7. Task registry

모든 task/result schema version은 v1에서 `1.0`이다.

| Task type | Public command / Domain Run | Input schema | Result schema | Local keys | Bounds | External dependency / degraded | Forbidden output | Spring adoption rule |
|---|---|---|---|---|---|---|---|---|
| `IDEA_INTERPRETATION` | interpretation command / IdeaInterpretationRun | `IdeaInterpretationInputV1` | `IdeaInterpretationResultV1` | source, statement | text limits; options allowlist | model / no | auto IdeaVersion or user decision | facts/assumptions separation and adopted exact input |
| `LEGAL_REVIEW` | legal command / LegalReviewRun | `LegalReviewInputV1` | `LegalReviewResultV1` | idea item | findings/sources bounded | MOLEG_API, LEGAL_MCP / yes | legal advice claim | source identity/currentness and legal enum valid |
| `CONCEPT_GENERATION` | generation command / ConceptGenerationRun | `ConceptGenerationInputV1` | `ConceptGenerationResultV1` | idea item, concept | candidateCount 1–10 | model / no | user selection | requested bounds and passing legal input |
| `QUICK_ASSESSMENT` | quick command / QuickAssessmentRun | `QuickAssessmentInputV1` | `QuickAssessmentResultV1` | concept, evidence | one concept; dimensions bounded | model / no | shortlist decision | exact concept and proposal disclosure |
| `DETAILED_ANALYSIS` | detailed command / DetailedAnalysisRun | `DetailedAnalysisInputV1` | `DetailedAnalysisResultV1` | concept, evidence | one type; arrays bounded | model; task-specific sources / optional warnings | deterministic overwrite | shortlist/type/schema and calculation boundary |
| `PERSONA_CARD_GENERATION` | persona card command / PersonaCardGenerationRun | `PersonaCardGenerationInputV1` | `PersonaCardGenerationResultV1` | concept, persona | personaCount 1–10 | model / no | real-customer/statistical claims | three layers and synthetic disclosure |
| `PERSONA_INTERVIEW` | interview command / PersonaInterview | `PersonaInterviewInputV1` | `PersonaInterviewResultV1` | persona, question | exactly one card; bounded questions | model / no | other persona context | isolation and synthetic disclosure |
| `INTERVIEW_SYNTHESIS` | synthesis command / InterviewSynthesis | `InterviewSynthesisInputV1` | `InterviewSynthesisResultV1` | interview | at least 2 adopted interviews | model / no | source interview mutation | included/excluded set and source preservation |
| `MARKETING_GENERATION` | generation command / MarketingGenerationRun | `MarketingGenerationInputV1` | `MarketingGenerationResultV1` | asset, persona | text/structured result only | model / no | binary, probability | exact workspace/evidence and safe type |
| `MARKETING_COMPARISON` | comparison command / MarketingComparisonRun | `MarketingComparisonInputV1` | `MarketingComparisonResultV1` | asset, persona | at least 2 asset versions | model / no | statistical A/B/probability | relative dimensions and caveats |
| `FINAL_REPORT_GENERATION` | report command / FinalReportGenerationRun | `FinalReportGenerationInputV1` | `FinalReportGenerationResultV1` | upstream statement | bounded immutable snapshots | model / no | decision change, PDF/binary | exact references and user decision preserved |

`PDF_EXPORT`는 AI task가 아니다. Spring이 생성·검증·저장한다.

### Task-specific collection limits

아래는 v1 hard maximum이며 Public command가 더 작은 상한을 정하면 더 작은 값이 적용된다. Nested text는 공통 2 MiB response limit도 만족해야 한다.

| Task | Collection maximums |
|---|---|
| `IDEA_INTERPRETATION` | TextContent 64, statement items per category 200, warnings/evidence needs 100 |
| `LEGAL_REVIEW` | findings 100, source references 200, conditions/warnings/expert reasons 100 |
| `CONCEPT_GENERATION` | concepts 10, list fields per concept 50 |
| `QUICK_ASSESSMENT` | dimensions 20, evidence/assumptions/uncertainties/warnings 100 each |
| `DETAILED_ANALYSIS` | findings 200, evidence/assumptions/uncertainties/warnings 200 each |
| `PERSONA_CARD_GENERATION` | cards 10, items per three-layer section 50 |
| `PERSONA_INTERVIEW` | questions 50, answers/interpretations/evidence needs/warnings 100 each |
| `INTERVIEW_SYNTHESIS` | input interviews 100, each result collection 200 |
| `MARKETING_GENERATION` | target personas 10, proposal sections/warnings 100 |
| `MARKETING_COMPARISON` | asset versions 20, personas 10, dimensions 30, assessment items 200 |
| `FINAL_REPORT_GENERATION` | upstream references 500, report sections 50, items per section 200 |

## 8. Task-specific contracts

### IDEA_INTERPRETATION

`IdeaInterpretationInputV1`은 하나 이상의 verified `TextContent`, source-safe label, source statement keys, readiness/normalization options, locale와 limit profile을 가진다. `IdeaInterpretationResultV1`은 `originalSourceSummary`, `normalizedDescription`, structured `facts`, `assumptions`, `constraints`, `openQuestions`, `readiness`, `warnings`, `evidenceNeeds`, `provenance`를 가진다. Statement item은 stable local key, text, provenance category, source keys, confidence/uncertainty, verificationNeeded를 구분한다. 불확실성을 fact로 승격하거나 사용자 constraint를 삭제하거나 IdeaVersion/User Decision을 자동 생성하지 않는다.

### LEGAL_REVIEW

`LegalReviewInputV1`은 exact confirmed IdeaVersion snapshot, normalized description, facts/assumptions/constraints, `jurisdiction=KR`, bounded options와 idea item keys를 가진다. AI Server는 `MOLEG_API`를 법령 identifier·원문·조문·현재성의 authoritative source로, `LEGAL_MCP`를 검색·탐색·연관 법령 발견에 사용한다. Secret은 AI Server 환경변수/deployment Secret이며 Spring payload에 없다.

`LegalReviewResultV1`은 legalResult, findings, sourceReferences, sourceCoverage, conditions, warnings, expertReviewReasons, provenance를 가진다. Legal result는 `PASS`, `PASS_WITH_CONDITIONS`, `REVISION_REQUIRED`, `PROHIBITED`, `INSUFFICIENT_INFORMATION`, `EXPERT_REVIEW_REQUIRED` 중 하나다. Source reference는 sourceChannel, lawIdentifier, lawName, article, observedAt, currentness, authoritative, degraded와 optional officialSourceUrl을 가진다. 한 source 실패는 missing channel/degraded를 명시한 success가 될 수 있다. 법률 자문이나 확정적 전문가 판단으로 표현하지 않는다.

### CONCEPT_GENERATION and QUICK_ASSESSMENT

`ConceptGenerationInputV1`은 exact IdeaVersion, passing LegalReview result/conditions, candidateCount 1–10과 bounded options다. Result proposal은 local concept key, title, targetProblem, targetUserContext, valueProposition, solutionOutline, differentiators, constraints, assumptions, evidenceNeeds, provenance를 가진다. 사용자 Selection을 생성하지 않는다.

`QuickAssessmentInputV1`은 exact ConceptVersion 하나, shared core snapshot과 quick options다. Result는 dimension assessments, evidence, assumptions, uncertainties, warnings, evidenceNeeds, provenance를 구분한다. Shortlist나 사용자 Decision을 생성하지 않는다.

### DETAILED_ANALYSIS

`analysisType`은 `MARKET`, `BUSINESS_MODEL`, `TECHNICAL_OPERATION`, `FINANCIAL`이다. 각 type은 별도 discriminated input/result section을 가진다. 공통 input은 exact shortlisted ConceptVersion과 shared snapshot이며 공통 result는 findings, assumptions, uncertainties, warnings, evidenceNeeds, provenance다.

FINANCIAL input의 `deterministicInputs`, `calculationRuleVersion`, `deterministicResults`, assumptions, evidenceNeeds는 Spring이 제공한다. AI Server는 `aiExplanation`, drivers, risks, caveats만 생성하며 결정론적 section을 수정하거나 source of truth로 덮어쓰지 않는다. Result에서도 deterministic section과 AI explanation을 분리한다.

### PERSONA_CARD_GENERATION, PERSONA_INTERVIEW, INTERVIEW_SYNTHESIS

Card generation input은 exact PersonaStudy, ConceptSelection, selected ConceptVersion, personaCount 1–10, bounded options다. Result는 하나 이상의 local persona key와 initial version의 roleAndContext, problemAndNeeds, behaviorAndDecision, mandatory syntheticDisclosure, provenance를 가진다. Demographic-only persona, 실제 고객 조사 claim, 구매확률, 시장점유율, 대표 모집단 통계는 금지한다.

Interview input은 PersonaCardVersion 정확히 하나, question set, selected concept context, bounded options만 가진다. 다른 Persona card/interview/answer/hidden context를 포함하지 않는다. Result는 questions, synthetic answers, interpretations, evidenceNeeds, warnings, syntheticDisclosure, provenance를 가진다. 실제 고객·전문가 인터뷰라고 표현하지 않는다.

Synthesis input은 같은 PersonaStudy의 adopted Interview result 둘 이상, exact included/excluded keys, options다. Result는 commonResponses, conflictingResponses, unresolvedQuestions, researchRecommendations, caveats, provenance를 가진다. 개별 Interview 원본을 수정하거나 덮어쓰지 않는다.

### MARKETING_GENERATION and MARKETING_COMPARISON

Generation input은 exact MarketingWorkspaceVersion, selected ConceptVersion, Persona/Interview/Synthesis evidence, assetType, generationInput이다. Result는 text 또는 structured asset proposal, target Persona keys, message rationale, warnings, provenance다. Binary image/audio/video, base64 artifact, AI local path/Storage reference, conversion probability는 금지한다.

Comparison input은 exact MarketingAssetVersion 둘 이상, Persona evidence, comparison dimensions다. Result는 dimension별 relative assessment, Persona별 strengths/risks, caveats, evidenceNeeds, provenance다. 통계적 A/B experiment claim, winner probability, conversion/market-share prediction을 생성하지 않는다.

### FINAL_REPORT_GENERATION

Input은 exact immutable upstream snapshots, facts, legalSources, AI proposals, assumptions, researchNeeds, user decisions, reportDecision, userRationale다. `reportDecision`은 `GO`, `CONDITIONAL_GO`, `REWORK`, `HOLD`, `STOP` 중 사용자가 제공한 값이다. Result는 structured sections, executiveSummary, supportingFindings, risks, unresolvedResearch, caveats, provenance다. AI는 user decision을 바꾸지 않는다. 결과는 FinalReportVersion proposal이며 Spring이 검증·snapshot 저장한다. PDF는 Spring 책임이고 Markdown/binary output은 없다.

## 9. Request-local references

`source-1`, `fact-1`, `concept-1`, `persona-1`, `interview-1`, `asset-1` 같은 key를 사용한다. Key는 request 안에서 유일한 의미 없는 bounded string이다. AI Server는 request에 존재하는 key만 result에서 참조하며 unknown key를 생성·echo하지 않는다. Spring이 결과 key를 실제 Domain reference로 매핑한다. 이 계약은 DB table/entity identifier 형식을 정의하지 않는다. 외부 법령 identifier는 authoritative external identifier이므로 local key와 별도다.

## 10. Internal provenance

각 provenance item은 `category`, `statementKey`, `sourceKeys`, `externalSourceReferences`, `generatedAt`, optional `confidence`, optional `uncertainty`, `verificationNeeded`, optional `caveat`를 가진다. Category는 `USER_INPUT`, `EXTERNAL_SOURCE_FACT`, `ASSUMPTION`, `AI_PROPOSAL`, `USER_DECISION`이다. AI Server는 `USER_DECISION`을 새로 생성하지 않고 request에 이미 존재하는 결정을 echo/reference할 수만 있다. Unknown local key와 source가 없는 external fact는 Spring adoption validation에서 거부한다.

## 11. Timeout, cancellation, retry and adoption

- `deadlineAt` 이후 새 provider/MCP call을 시작하지 않고 `DEADLINE_EXCEEDED`를 반환한다.
- Spring 연결 취소는 best-effort cancel 신호이며 AI-side persistent job이나 callback을 만들지 않는다.
- 같은 TaskAttempt response는 한 번만 채택한다. Late, duplicate, stale-lease response는 adopted result를 덮어쓰지 않고 Spring이 non-adopted evidence로 처리할 수 있다.
- Retry는 새 TaskAttempt이고 Domain rerun은 새 Domain Run/TaskRun이다.
- AI Server retry 권고는 참고 정보이며 Spring retry policy가 최종 결정한다.

## 12. Logging, security and privacy

기본 log 허용값은 correlationId, taskType, taskSchemaVersion, duration, HTTP/status, canonical input hash prefix, safe error code다. 사용자 전체 text, prompt, raw model response, JWT, service token, credential, legal API secret, FILE content, 개인정보, Storage identifier는 기록하지 않는다. Debug content logging은 기본 비활성화다. AI Server는 RDB/Object Storage를 조회하지 않고 FILE bytes, Storage URL/key, presigned URL, local path, base64/binary를 받거나 반환하지 않는다.

## 13. P2.6 fixture case manifest

P2.6은 fixture 파일과 자동 consistency check를 만든다. 최소 case는 다음과 같다.

- common execution request success와 common internal error
- chunk order/hash success, chunk gap failure, canonical input hash fixture
- 11개 task 각각의 minimum valid request와 valid result
- legal degraded source result
- financial deterministic/result와 AI explanation boundary
- persona isolation과 synthetic disclosure
- marketing prohibited probability/statistical claim rejection
- final report user decision preservation
- unsupported contract/task schema version, deadline exceeded, result schema invalid
- unknown request-local reference rejection

Fixture는 이 문서의 schema/version/limit/error registry를 재사용하고 public P2.4 contract와 enum·provenance·error mapping drift를 검사한다.
