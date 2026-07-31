# Phase D1 사업계획서 구조화 AI Task Schema

## 1. 계약 식별자와 책임

- 기준 commit: `8283acb5889e800a8fad5f59e354c247c09aac68`
- endpoint: `POST /internal/v1/tasks`
- `task_type`: `DOCUMENT_PARSE`
- `schema_version`: `1.0`
- `prompt_version`: `business-plan-structure-v2`
- `rubric_version`: `business-plan-rubric-v2`
- 실제 의미: Spring이 DOCX에서 만든 typed blocks와 현재 사용자 보완을 12개 canonical section으로 구조화하고 완전성을 검증한다.

Spring은 원본 파일, parser artifact, AnalysisJob, ValidationRun과 최종 결과의 유일한 원장이다. FastAPI는 PostgreSQL을 읽거나 쓰지 않으며 task 입력만 처리한다. FastAPI의 HTTP 성공은 provider 호출 성공을 뜻하고, 업무상 PASS는 응답의 `overall_passed`로 별도 표현한다.

## 2. 현재 공통 AI Task envelope

아래 계약은 현재 source인 `ai/app/models/tasks.py`, `ai/app/api/tasks.py`, `ai/app/api/errors.py`, `ai/app/models/contracts.py`, `backend/src/main/java/com/aivle/backend/integration/ai/task/dto/AiTaskRequest.java`, `AiTaskResponse.java`, `backend/src/main/java/com/aivle/backend/integration/ai/task/AiTaskClient.java`, `backend/src/main/java/com/aivle/backend/integration/ai/AiServerClientSupport.java`를 기준으로 한다. DOCUMENT_PARSE는 이 envelope를 대체하지 않고 `input`과 `result`의 discriminator별 typed payload만 추가한다.

### 2.1 실제 공통 Request

| wire field | 현재 타입/규칙 |
|---|---|
| `request_id` | 1~100자. `X-Request-Id`가 있으면 같은 값이어야 함 |
| `task_id` | 1~100자 |
| `task_type` | 현재 enum: `SYSTEM_SMOKE_TEST`, `SYSTEM_ARTIFACT_SMOKE_TEST`, `MARKETING_BANNER_GENERATION`; D2에서 `DOCUMENT_PARSE`를 additive 추가 |
| `schema_version` | 1~20자, endpoint가 현재 `1.0`만 수용 |
| `input` | JSON object, task별 payload |
| `context` | JSON object |
| `options` | JSON object |
| `artifacts` | 공통 `AiTaskArtifactInput[]`, 기본 빈 배열 |
| `output_targets` | 공통 `AiTaskOutputTarget[]`, 기본 빈 배열 |

공통 input artifact는 `artifact_id`, `role=SOURCE`, `object_key`, `download_url`, `content_type`, `size`, `checksum=sha256:{64 lowercase hex}`다. 공통 output target은 `role=RESULT`, `object_key`, `upload_url`, `content_type`이다.

### 2.2 실제 공통 Response와 error

성공 response는 `request_id`, `task_id`, `task_type`, `status=SUCCEEDED`, `schema_version`, `result`, `warnings[]`, `execution{handler,handler_version}`, nullable `error`, `artifacts[]`다. 현재 공통 success status는 `SUCCEEDED` 하나뿐이며 업무상 completeness는 Document result의 `overall_passed`로 표현한다.

공통 result artifact metadata는 `role=RESULT`, `object_key`, `content_type`, `size`, `checksum`이다. HTTP 비-2xx는 성공 envelope가 아니라 다음 공통 error envelope다.

```json
{
  "request_id": "request-id",
  "error": {
    "code": "INVALID_REQUEST",
    "message": "safe message",
    "retryable": false
  }
}
```

Spring `AiTaskClient`는 request ID를 확정해 header와 body에 넣고 `/internal/v1/tasks`를 호출한 뒤 request/task ID, task type, schema version, `status=SUCCEEDED`, non-null result와 execution을 검증한다. DOCUMENT_PARSE adapter는 이 공통 검증 뒤 `result`를 `DocumentParseTaskResult`로 deserialize하고 12개/evidence/overall 규칙을 추가 검증한다.

기존 smoke와 marketing task는 기존 `input/context/options`, 공통 `SOURCE/RESULT` artifact, result JSON을 그대로 사용한다. DOCUMENT_PARSE semantic role인 `SOURCE_DOCUMENT_BLOCKS`와 `RESULT_DOCUMENT_STRUCTURE` 때문에 공통 role enum이나 기존 handler payload를 바꾸지 않는다.

### 2.3 Spring AiTaskClient mapping

| Spring 값 | 공통 wire | Document 전용 위치 |
|---|---|---|
| HTTP 시도 request ID | `request_id`, `X-Request-Id` | 없음 |
| AnalysisJob ID | `task_id` | 없음 |
| `AiTaskType.DOCUMENT_PARSE` | `task_type` | discriminator |
| task schema version | `schema_version` | result schema 검증 기준 |
| DocumentParseTaskInput DTO | `input` JsonNode | 전체 document input |
| correlation/trace | `context` JsonNode | `context.correlation_id` |
| timeout/provider option | `options` JsonNode | document handler가 허용 목록만 사용 |
| parser StoredFile/presigned GET | `artifacts[0]` | `input.source_artifact.artifact_id`로 결합 |
| result presigned PUT | `output_targets[0]` | semantic role RESULT_DOCUMENT_STRUCTURE |
| DocumentParseTaskResult DTO | response `result` JsonNode | deserialize 후 독립 validation |
| result StoredFile metadata | response `artifacts[0]` | checksum/size 검증 후 DB 연결 |

현재 `AiTaskClient.validate`의 공통 identity/status/result/execution 검증은 유지한다. DOCUMENT_PARSE 전용 adapter 또는 persistence boundary가 그 뒤에 mode, result schema, 단일 supplement reference, evidence, 전체 12개와 result artifact를 검증한다.

현재 `AiServerClientSupport`는 비-2xx 공통 error의 `code`를 보존하지만 body의 `retryable`을 직접 사용하지 않고 HTTP 5xx 여부로 retryability를 계산한다. 연결/읽기 timeout은 `AI_SERVER_TIMEOUT`, success body 계약 불일치는 `AI_SERVER_INVALID_RESPONSE`로 변환한다. D2 DOCUMENT_PARSE mapping은 아래 document error 표의 retryability를 code 기준으로 적용해야 하며, 기존 smoke/marketing의 generic mapping을 소급 변경하지 않는다.

## 3. DOCUMENT_PARSE discriminator와 전송 모드

`task_type=DOCUMENT_PARSE`일 때만:

```text
AiTaskRequest.input  = DocumentParseTaskInput
AiTaskResponse.result = DocumentParseTaskResult
```

JSON wire name은 공통 계약과 같이 `snake_case`다. `Content-Type`은 `application/json; charset=utf-8`이다.

### 3.1 `input_mode`

| mode | 공통 `artifacts` | `input.typed_blocks` | 용도 |
|---|---|---|---|
| `ARTIFACT` | 정확히 1개 `role=SOURCE`; `input.source_artifact.semantic_role=SOURCE_DOCUMENT_BLOCKS`와 동일 artifact ID | 금지 | 운영 기본값 |
| `INLINE` | `SOURCE_DOCUMENT_BLOCKS` artifact 금지, 즉 공통 `artifacts=[]` | 필수 | local unit/contract test 또는 명시적으로 허용된 작은 입력 |

두 입력을 동시에 보내거나 둘 다 없으면 `INVALID_DOCUMENT_BLOCKS`다. 공통 artifact wire role은 계속 `SOURCE`이며 `SOURCE_DOCUMENT_BLOCKS`는 DocumentParseTaskInput 안의 semantic role이다.

ARTIFACT mode:

1. Spring은 StoredFile metadata와 object를 대조해 size/checksum을 검증한다.
2. 공통 artifact의 `size`와 `checksum`은 parser artifact byte 기준이다.
3. FastAPI는 presigned URL로 최대 12 MiB를 내려받아 SHA-256과 content type을 검증한다.
4. canonical JSON을 `DocumentBlock[]`로 materialize한 후 block count/문자 수/sequence를 검증한다.
5. request hash에는 presigned URL과 만료시각을 넣지 않고 artifact semantic role, object key, size, checksum과 나머지 normalized input을 넣는다.

INLINE mode:

1. `typed_blocks`가 비어 있지 않아야 한다.
2. Spring은 RFC 8785 방식의 canonical JSON byte를 만들고 `input.inline_blocks_size`, `input.inline_blocks_checksum`을 기록한다.
3. FastAPI가 동일 canonicalization으로 size/checksum을 재계산하고 불일치하면 거부한다.
4. request hash에는 inline block 원문 자체 대신 canonical checksum/size와 나머지 normalized input을 넣는다.

두 mode 모두 materialization 이후 동일한 DocumentBlock validation과 AI prompt를 사용한다. request body 최대 12 MiB, parser artifact/inline canonical block JSON 최대 10 MiB, block 최대 10,000개, block text 합 최대 2,000,000 Unicode code point다.

### 3.2 전체 Request 예시 — ARTIFACT

```json
{
  "request_id": "018f-request-uuid",
  "task_id": "analysis-job-id",
  "task_type": "DOCUMENT_PARSE",
  "schema_version": "1.0",
  "input": {
    "input_mode": "ARTIFACT",
    "project_id": "project-uuid",
    "document_version_id": "document-version-uuid",
    "structured_plan_id": "structured-plan-uuid",
    "validation_run_id": "validation-run-uuid",
    "parser_version": "spring-docx-blocks-v2",
    "prompt_version": "business-plan-structure-v2",
    "rubric_version": "business-plan-rubric-v2",
    "document": {
      "document_id": "document-uuid",
      "version_number": 3,
      "file_name": "business-plan.docx",
      "content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "size_bytes": 482103,
      "source_checksum_sha256": "64 lowercase hex",
      "parser_artifact_checksum_sha256": "64 lowercase hex",
      "language_hint": "ko"
    },
    "source_artifact": {
      "semantic_role": "SOURCE_DOCUMENT_BLOCKS",
      "artifact_id": "task-artifact-id"
    },
    "typed_blocks": null,
    "inline_blocks_size": null,
    "inline_blocks_checksum": null,
    "current_extracted_sections": [],
    "user_supplements": [],
    "output_requirements": {
      "canonical_section_codes": ["BUSINESS_OVERVIEW", "MARKET_SIZE", "TARGET_CUSTOMER", "COMPETITIVE_ANALYSIS", "PRODUCT_SERVICE", "BUSINESS_MODEL", "COST_PROFITABILITY", "SALES_GOALS_FINANCIAL_PROJECTIONS", "TECHNOLOGY_PRODUCTION", "LEGAL_PERMITS", "SCHEDULE_RISK", "EVIDENCE_LIST"],
      "required_item_count": 12,
      "allowed_statuses": ["PASS", "REJECT"],
      "max_response_bytes": 2097152
    }
  },
  "context": {
    "correlation_id": "trace-or-correlation-id"
  },
  "options": {},
  "artifacts": [{
    "artifact_id": "task-artifact-id",
    "role": "SOURCE",
    "object_key": "projects/.../parser/v2/checksum.json",
    "download_url": "https://object-storage/presigned",
    "content_type": "application/json",
    "size": 284130,
    "checksum": "sha256:64-lowercase-hex"
  }],
  "output_targets": [{
    "role": "RESULT",
    "object_key": "ai-tasks/job-id/RESULT_DOCUMENT_STRUCTURE/result.json",
    "upload_url": "https://object-storage/presigned",
    "content_type": "application/json"
  }]
}
```

`output_targets`는 운영 DOCUMENT_PARSE에서 정확히 1개다. FastAPI는 canonical result JSON을 업로드하고 공통 response `artifacts`에 `role=RESULT` metadata를 반환한다. semantic role은 `RESULT_DOCUMENT_STRUCTURE`이며 `AiTaskResponse.result`와 동일한 document result를 담는다.

### 3.3 필드 소속과 DocumentParseTaskInput 규칙

#### 3.3.1 공통 AiTaskRequest envelope

| 필드 | 필수 | 규칙 |
|---|---:|---|
| `request_id` | Y | 개별 HTTP 시도 식별자, 시도마다 새 값 |
| `task_id` | Y | AnalysisJob 외부 task 식별자, 재시도 동안 동일 |
| `task_type` | Y | 정확히 `DOCUMENT_PARSE`인 discriminator |
| `schema_version` | Y | 정확히 `1.0` |
| `context.correlation_id` | Y | 전 구간 로그 상관키 |
| `artifacts` | 조건부 | ARTIFACT이면 공통 `role=SOURCE` 1개, INLINE이면 빈 배열 |
| `output_targets` | Y | 공통 `role=RESULT` 1개, document semantic role은 RESULT_DOCUMENT_STRUCTURE |

#### 3.3.2 DocumentParseTaskInput (`AiTaskRequest.input`)

| 필드 | 필수 | 규칙 |
|---|---:|---|
| `input_mode` | Y | `ARTIFACT` 또는 `INLINE` |
| `project_id` | Y | project UUID |
| `document_version_id` | Y | source DocumentVersion UUID |
| `structured_plan_id` | Y | 대상 StructuredPlan UUID |
| `validation_run_id` | Y | 이번 ValidationRun UUID |
| `parser_version` | Y | 빈 문자열 금지, 결과에 그대로 반향 |
| `prompt_version` | Y | 빈 문자열 금지, 결과에 그대로 반향 |
| `rubric_version` | Y | 빈 문자열 금지, 결과에 그대로 반향 |
| `document` | Y | 원본과 parser artifact의 식별·무결성 metadata |
| `typed_blocks` | 조건부 | INLINE에서만 canonical 순서의 비어 있지 않은 배열 |
| `source_artifact` | 조건부 | ARTIFACT에서만 semantic role과 공통 artifact ID를 연결 |
| `current_extracted_sections` | Y | 최초 run은 빈 배열, 재검증은 12개 이하 |
| `user_supplements` | Y | 없으면 빈 배열, section당 최대 1개 active 값 |
| `output_requirements` | Y | 서버 고정 계약과 다르면 거부 |

소속 규칙:

- `request_id`, `task_id`, `task_type`, `schema_version`은 공통 envelope에만 존재하며 `input` 내부에 중복하지 않는다.
- `context.correlation_id`도 공통 `context`에만 존재하며 `input` 내부에 중복하지 않는다.
- `artifacts`와 `output_targets`는 공통 envelope에만 존재하며 DocumentParseTaskInput 내부에 중복하지 않는다.
- `input.source_artifact`는 artifact 본문이나 StoredFile 식별자가 아니라, 공통 `artifacts[].artifact_id`를 참조해 `SOURCE_DOCUMENT_BLOCKS` 의미를 부여하는 문서 전용 연결 객체다.
- `artifact_id`는 task 요청 범위의 불투명 식별자다. FastAPI는 이를 PostgreSQL `stored_files.id`로 해석하거나 PostgreSQL 조회에 사용하지 않는다.

### 3.4 Typed block

허용 `type`은 `HEADING`, `PARAGRAPH`, `LIST_ITEM`, `TABLE_CELL`이다.

- `block_id`: 문서 버전 안에서 unique하고 정규식 `^[A-Za-z0-9._:-]{1,100}$`를 만족한다.
- `sequence`: 1부터 시작하는 연속 정수이며 배열 순서와 일치한다.
- `text`: 공백 정규화 후 비어 있지 않으며 최대 20,000자다.
- `heading_level`: HEADING이면 1~9, 아니면 `null`.
- TABLE_CELL은 `table.table_index`, `row_index`, `column_index`를 모두 가진다.
- `location`은 원 DOCX 위치를 추적할 수 있는 parser metadata이며 evidence preview에 사용한다.
- block ID, sequence, table 좌표 중복은 `INVALID_DOCUMENT_BLOCKS`다.

`current_extracted_sections`는 모델의 참고 자료일 뿐 원문 evidence가 아니다. 해당 내용이 typed blocks 또는 active supplement로 재확인되지 않으면 결과에 사용할 수 없다.

## 4. AiTaskResponse와 DocumentParseTaskResult

HTTP `200 OK`의 body:

```json
{
  "request_id": "018f-request-uuid",
  "task_id": "analysis-job-id",
  "task_type": "DOCUMENT_PARSE",
  "status": "SUCCEEDED",
  "schema_version": "1.0",
  "result": {
    "validation_run_id": "validation-run-uuid",
    "overall_passed": false,
    "document_summary": "원문에 근거한 문서 요약",
    "item_results": [{
      "section_code": "BUSINESS_OVERVIEW",
      "status": "PASS",
      "reason": "문제, 가치, 대상과 범위가 확인됨",
      "extracted_content": "typed blocks에서 추출한 내용",
      "effective_content": "검증된 원문 추출과 사용자 보완을 합성한 내용",
      "missing_details": [],
      "evidence_block_ids": ["b-000001", "b-000004"],
      "supplement_reference": {
        "supplement_id": "supplement-uuid",
        "revision": 2
      },
      "confidence": 0.91
    }],
    "provider": {
      "name": "configured-provider",
      "model": "configured-model"
    },
    "versions": {
      "parser_version": "spring-docx-blocks-v2",
      "prompt_version": "business-plan-structure-v2",
      "rubric_version": "business-plan-rubric-v2",
      "schema_version": "1.0"
    },
    "usage": {
      "input_tokens": 12000,
      "output_tokens": 4000,
      "total_tokens": 16000,
      "provider_request_id": "provider-request-id"
    }
  },
  "warnings": [],
  "execution": {
    "handler": "document-parse",
    "handler_version": "1.0"
  },
  "error": null,
  "artifacts": [{
    "role": "RESULT",
    "object_key": "ai-tasks/job-id/RESULT_DOCUMENT_STRUCTURE/result.json",
    "content_type": "application/json",
    "size": 1600000,
    "checksum": "sha256:64-lowercase-hex"
  }]
}
```

`result`가 DocumentParseTaskResult다. `item_results` 예시는 한 건만 표시했지만 실제 응답은 정확히 12건이어야 한다. 순서는 Request의 canonical 순서와 같다. 해당 section이 active supplement를 사용하지 않았으면 `supplement_reference=null`이다.

### 4.1 결과 필드 제한

| 필드 | 제한 |
|---|---|
| 전체 HTTP response body | UTF-8 2 MiB (`2,097,152` bytes) |
| `document_summary` | 1~4,000자 |
| `reason` | 1~2,000자 |
| `extracted_content` | 0~8,000자 |
| `effective_content` | 0~12,000자 |
| `missing_details` | 최대 10개, 각 1~500자 |
| `evidence_block_ids` | 최대 100개, 중복 금지, ID당 최대 100 ASCII자 |
| `supplement_reference` | nullable 단일 object; 요청의 동일 section `supplement_id`와 `revision`만 허용 |
| `confidence` | 0.0~1.0 유한 소수 |
| 공통 `warnings` | 최대 20개, 각 1~500자 |

### 4.2 Worst-case 크기 계산

문자열은 control character를 제거하거나 LF/TAB만 허용하고, non-ASCII를 `\uXXXX`로 강제 escape하지 않는 UTF-8 JSON으로 직렬화한다. Unicode code point당 최악 4 bytes를 적용한다.

| 구성 | 계산 | 최대 bytes |
|---|---:|---:|
| document summary | 4,000 × 4 | 16,000 |
| section content/reason | `(8,000 + 12,000 + 2,000) × 4 × 12` | 1,056,000 |
| missing details | `10 × 500 × 4 × 12` | 240,000 |
| evidence IDs | `100 × 103 JSON bytes × 12` | 123,600 |
| common warnings | `20 × 500 × 4` | 40,000 |
| supplement reference, confidence, provider/usage/version, JSON key·delimiter 여유 | 고정 예산 | 200,000 |
| 합계 |  | **1,675,600** |

`2,097,152 - 1,675,600 = 421,552 bytes`의 약 20.1% 여유가 있다. FastAPI는 serialization 후 실제 byte length를 검사한다. 2 MiB를 넘으면 성공 response나 result artifact를 반환하지 않고 `RESULT_SCHEMA_INVALID`로 실패한다.

## 5. 결과 validation

FastAPI는 provider 응답을 검증한 뒤에만 200을 반환하고, Spring은 저장 전에 같은 규칙을 독립적으로 재검증한다.

1. `item_results`는 정확히 12개다.
2. section code는 중복될 수 없고 canonical 12개 전체와 정확히 일치한다.
3. 배열 순서는 canonical 순서와 일치한다.
4. status는 `PASS` 또는 `REJECT`뿐이다.
5. PASS이면 trim한 `effective_content`가 비어 있지 않다.
6. REJECT이면 trim한 `reason`이 비어 있지 않고 `missing_details`가 1개 이상이다.
7. 모든 evidence block ID는 materialize된 요청 block에 존재하고 해당 content를 실제로 뒷받침한다.
8. nullable `supplement_reference`는 요청의 동일 section active supplement ID와 revision에 정확히 일치한다.
9. `overall_passed`는 12개 status가 모두 PASS인 경우에만 true다.
10. effective content의 모든 사실은 요청 typed blocks 또는 active supplement에 근거해야 한다. 추정, 상식 보충, 외부 검색 사실 생성은 금지한다.
11. response가 크기/개수/문자열 제한을 넘으면 실패한다.
12. 공통 envelope의 request/task/type/schema와 result의 run/version 값이 요청과 일치해야 한다.

Spring은 provider가 보낸 `overall_passed`를 신뢰하지 않고 section status에서 다시 계산한다. 불일치는 `RESULT_SCHEMA_INVALID`로 전체 run을 FAILED 처리하며 부분 section을 projection에 반영하지 않는다.

## 6. Error Response

비-2xx body:

```json
{
  "request_id": "018f-request-uuid",
  "error": {
    "code": "PROVIDER_TIMEOUT",
    "message": "Provider did not complete within the configured deadline.",
    "retryable": true
  }
}
```

이는 현재 `AiServerErrorResponse`의 실제 공통 형태다. task/run/correlation은 response body에 추가하지 않고 Spring이 보유한 request mapping과 `request_id`로 연결한다. HTTP 200의 공통 `error`는 현재 항상 null이다.

현재 공통 endpoint 자체가 생성하는 대표 code는 `INVALID_REQUEST`, `UNKNOWN_TASK_TYPE`, `UNSUPPORTED_SCHEMA_VERSION`, `AI_SERVER_INTERNAL_ERROR`다. 아래 DOCUMENT_PARSE code도 동일 envelope에 들어가며 별도 error body를 만들지 않는다. 처리되지 않은 예외는 현재 공통 `AI_SERVER_INTERNAL_ERROR`로 끝나므로 Spring DOCUMENT_PARSE mapping에서는 이를 `INTERNAL_PROCESSING_ERROR`와 같은 retryable 내부 실패 범주로 기록한다.

| code | HTTP | retryable | 의미 |
|---|---:|---:|---|
| `INVALID_DOCUMENT_BLOCKS` | 422 | false | block 구조, 순서, 크기, checksum 오류 |
| `INVALID_SECTION_CONTRACT` | 422 | false | section/rubric/output 요구가 canonical 계약과 불일치 |
| `PROVIDER_NOT_CONFIGURED` | 503 | false | 실행 profile에 실제 provider 설정 없음 |
| `PROVIDER_AUTH_FAILED` | 502 | false | provider 인증/권한 실패 |
| `PROVIDER_RATE_LIMITED` | 429 | true | provider rate limit |
| `PROVIDER_TIMEOUT` | 504 | true | provider deadline 초과 |
| `PROVIDER_REFUSED` | 422 | false | 안전 정책 등으로 요청 처리 거부 |
| `PROVIDER_MALFORMED_RESPONSE` | 502 | false | JSON 파싱 또는 provider 형식 오류 |
| `EVIDENCE_REFERENCE_INVALID` | 422 | false | 존재하지 않거나 부적절한 evidence reference |
| `RESULT_SCHEMA_INVALID` | 502 | false | 12개 결과/필수 필드/overall 불일치 |
| `INTERNAL_PROCESSING_ERROR` | 500 | true | 예상하지 못한 일시적 내부 오류 |

오류 응답에는 원문, supplement, provider raw response, API key를 넣지 않는다. 진단 세부사항은 비밀정보를 제거한 correlation ID 기반 서버 로그에만 남긴다.

## 7. Timeout과 retry 경계

- Spring의 한 FastAPI 호출 deadline 기본값은 120초다.
- FastAPI의 provider 전체 deadline은 90초, connect timeout은 5초다. 남은 시간은 입력 검증과 응답 검증에 사용한다.
- FastAPI는 한 HTTP task 안에서 provider 호출을 자동 재시도하지 않는다.
- Job 재시도와 backoff는 Spring AnalysisJob이 소유한다. `retryable=true` 오류만 최대 3회까지 재시도하며 배포 설정으로 더 늘릴 수 없다.
- 동일 ValidationRun 재시도는 같은 `task_id`와 `validation_run_id`, 같은 normalized request hash를 사용하고 `request_id`만 새로 만든다.
- FastAPI는 상태를 영속화하지 않는다. 동일 입력의 재실행은 동일 의미의 결과를 내야 하지만 provider 출력 byte 동일성은 보장하지 않는다.
- HTTP 응답을 받지 못한 모호한 실패에서는 Spring이 같은 ValidationRun을 재시도한다. 새 ValidationRun을 만들지 않는다.
- 사용자가 다시 검증을 요청하면 기존 run을 재시도하지 않고 새 ValidationRun과 새 AnalysisJob을 만든다.

## 8. Artifact 계약

- `SOURCE_DOCUMENT_BLOCKS`: Document semantic role. 공통 request artifact의 wire role은 `SOURCE`이며 ARTIFACT mode에서 정확히 1개다.
- `RESULT_DOCUMENT_STRUCTURE`: Document semantic role. 공통 output target/response artifact의 wire role은 `RESULT`이며 운영 요청에서 정확히 1개다.
- artifact upload/download는 presigned URL로만 수행하고 DB credential을 FastAPI에 제공하지 않는다.
- FastAPI는 URL redirect를 따르지 않고 허용된 host, HTTPS, content type, size, checksum, expiry를 검증한다.
- Spring은 result artifact를 DB projection보다 먼저 무결성 검증한다. 검증 실패 시 ValidationRun은 FAILED다.
- INLINE mode에는 SOURCE artifact가 없지만 RESULT output target과 response artifact 계약은 동일하다.

## 9. Provider 및 Mock 정책

- provider interface는 task handler와 분리한다.
- 운영 profile에서 실제 provider가 없으면 `PROVIDER_NOT_CONFIGURED`로 실패한다.
- 인증 실패, timeout, malformed response를 Mock 결과로 대체하지 않는다.
- Mock은 명시적인 local/test/e2e profile과 별도 설정에서만 선택할 수 있다.
- Mock이 생성한 결과에는 provider name을 `mock`으로 기록한다. 운영 project의 ValidationRun, confirmation, confirmed snapshot에는 사용할 수 없다.
- Spring 직접 OpenAI 호출은 이 공식 task 계약의 provider 경로가 아니다.

## 10. 구현 수용 기준

- schema fixture는 canonical PASS 12건, REJECT 포함 12건과 모든 오류 code를 가진다.
- 기존 SYSTEM_SMOKE_TEST, SYSTEM_ARTIFACT_SMOKE_TEST, MARKETING_BANNER_GENERATION fixture는 변경 없이 통과해야 한다.
- FastAPI와 Spring contract test가 같은 fixture로 exact count/order/code/overall/evidence를 검증한다.
- Spring AiTaskClient 공통 검증 뒤 DOCUMENT_PARSE result mapping과 단일 supplement reference를 검증한다.
- ARTIFACT/INLINE 동시 입력, 두 입력 모두 없음, checksum/size/request-hash 불일치 fixture를 거부한다.
- provider raw response가 유효해 보여도 Spring의 독립 validation을 통과하지 못하면 DB projection이 바뀌지 않는다.
- task 처리 중 FastAPI의 PostgreSQL 연결 시도는 없어야 한다.
- parser artifact와 result artifact checksum, request hash, provider/model/version이 ValidationRun에서 추적 가능해야 한다.
