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

## 2. 전송 규칙

- JSON wire name은 기존 FastAPI 관례에 맞춰 `snake_case`로 고정한다. 외부 API의 camelCase DTO와 Spring 내부 모델은 adapter에서 명시적으로 변환한다.
- `Content-Type`은 `application/json; charset=utf-8`이다.
- Spring은 parser artifact의 checksum과 block manifest를 검증한 뒤 typed blocks를 요청에 포함한다. artifact 자체는 Object Storage의 불변 원장으로 유지한다.
- FastAPI가 artifact를 직접 내려받아야 하는 배포에서는 같은 요청의 `artifacts`에 presigned GET descriptor를 함께 넣는다. 이 경우에도 handler가 검증을 시작하기 전 `input.typed_blocks`로 materialize하며, 두 표현의 checksum이 다르면 `INVALID_DOCUMENT_BLOCKS`다.
- request body 최대 크기는 12 MiB, typed block 수는 최대 10,000개, 모든 block text 합은 최대 2,000,000 Unicode code point다.
- response body 최대 크기는 UTF-8 기준 1 MiB다.

## 3. Request

### 3.1 전체 예시

```json
{
  "schema_version": "1.0",
  "task_type": "DOCUMENT_PARSE",
  "task_id": "018f-task-uuid",
  "request_id": "018f-request-uuid",
  "correlation_id": "trace-or-correlation-id",
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
  "input": {
    "typed_blocks": [
      {
        "block_id": "b-000001",
        "sequence": 1,
        "type": "HEADING",
        "text": "사업 개요",
        "heading_level": 1,
        "table": null,
        "location": {
          "body_element_index": 0,
          "paragraph_index": 0
        }
      }
    ],
    "current_extracted_sections": [
      {
        "section_code": "BUSINESS_OVERVIEW",
        "extracted_content": "이전 성공 run의 추출 내용",
        "evidence_block_ids": ["b-000001"]
      }
    ],
    "user_supplements": [
      {
        "section_code": "MARKET_SIZE",
        "supplement_id": "supplement-uuid",
        "revision": 2,
        "content": "시장 규모 산정식과 출처",
        "updated_at": "2026-07-31T10:00:00Z"
      }
    ]
  },
  "output_requirements": {
    "canonical_section_codes": [
      "BUSINESS_OVERVIEW",
      "MARKET_SIZE",
      "TARGET_CUSTOMER",
      "COMPETITIVE_ANALYSIS",
      "PRODUCT_SERVICE",
      "BUSINESS_MODEL",
      "COST_PROFITABILITY",
      "SALES_GOALS_FINANCIAL_PROJECTIONS",
      "TECHNOLOGY_PRODUCTION",
      "LEGAL_PERMITS",
      "SCHEDULE_RISK",
      "EVIDENCE_LIST"
    ],
    "required_item_count": 12,
    "allowed_statuses": ["PASS", "REJECT"],
    "include_evidence_block_ids": true,
    "max_response_bytes": 1048576
  },
  "artifacts": [
    {
      "role": "SOURCE_DOCUMENT_BLOCKS",
      "stored_file_id": "stored-file-uuid",
      "url": "https://object-storage/presigned",
      "method": "GET",
      "content_type": "application/json",
      "size_bytes": 284130,
      "checksum_sha256": "64 lowercase hex",
      "expires_at": "2026-07-31T10:05:00Z"
    }
  ]
}
```

### 3.2 필드 규칙

| 필드 | 필수 | 규칙 |
|---|---:|---|
| `schema_version` | Y | 정확히 `1.0` |
| `task_type` | Y | 정확히 `DOCUMENT_PARSE` |
| `task_id` | Y | AnalysisJob 외부 task 식별자, 재시도 동안 동일 |
| `request_id` | Y | 개별 HTTP 시도 식별자, 시도마다 새 값 |
| `correlation_id` | Y | 전 구간 로그 상관키 |
| project/document/plan/run ID | Y | UUID, 서로 다른 업무 원장을 명시 |
| parser/prompt/rubric version | Y | 빈 문자열 금지, 결과에 그대로 반향 |
| `document` | Y | 원본과 parser artifact의 식별·무결성 metadata |
| `typed_blocks` | Y | canonical 순서의 비어 있지 않은 배열 |
| `current_extracted_sections` | Y | 최초 run은 빈 배열, 재검증은 12개 이하 |
| `user_supplements` | Y | 없으면 빈 배열, section당 최대 1개 active 값 |
| `output_requirements` | Y | 서버 고정 계약과 다르면 거부 |
| `artifacts` | 조건부 | presigned download를 사용할 때 `SOURCE_DOCUMENT_BLOCKS` 1개 |

### 3.3 Typed block

허용 `type`은 `HEADING`, `PARAGRAPH`, `LIST_ITEM`, `TABLE_CELL`이다.

- `block_id`: 문서 버전 안에서 unique하고 정규식 `^[A-Za-z0-9._:-]{1,100}$`를 만족한다.
- `sequence`: 1부터 시작하는 연속 정수이며 배열 순서와 일치한다.
- `text`: 공백 정규화 후 비어 있지 않으며 최대 20,000자다.
- `heading_level`: HEADING이면 1~9, 아니면 `null`.
- TABLE_CELL은 `table.table_index`, `row_index`, `column_index`를 모두 가진다.
- `location`은 원 DOCX 위치를 추적할 수 있는 parser metadata이며 evidence preview에 사용한다.
- block ID, sequence, table 좌표 중복은 `INVALID_DOCUMENT_BLOCKS`다.

`current_extracted_sections`는 모델의 참고 자료일 뿐 원문 evidence가 아니다. 해당 내용이 typed blocks 또는 active supplement로 재확인되지 않으면 결과에 사용할 수 없다.

## 4. Success Response

HTTP `200 OK`의 body:

```json
{
  "schema_version": "1.0",
  "task_type": "DOCUMENT_PARSE",
  "task_id": "018f-task-uuid",
  "request_id": "018f-request-uuid",
  "correlation_id": "trace-or-correlation-id",
  "validation_run_id": "validation-run-uuid",
  "overall_passed": false,
  "document_summary": "원문에 근거한 문서 요약",
  "item_results": [
    {
      "section_code": "BUSINESS_OVERVIEW",
      "status": "PASS",
      "reason": "사업 주체, 문제, 해결책, 목표와 범위가 확인됨",
      "extracted_content": "typed blocks에서 추출한 내용",
      "effective_content": "검증된 원문 추출과 사용자 보완을 합성한 내용",
      "missing_details": [],
      "evidence_block_ids": ["b-000001", "b-000004"],
      "supplement_ids": [],
      "confidence": 0.91
    }
  ],
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
  },
  "warnings": []
}
```

`item_results` 예시는 한 건만 표시했지만 실제 응답은 정확히 12건이어야 한다. 순서는 Request의 `canonical_section_codes` 순서와 같다.

### 4.1 결과 필드 제한

| 필드 | 제한 |
|---|---|
| `document_summary` | 1~8,000자 |
| `reason` | 1~4,000자 |
| `extracted_content` | 0~32,000자 |
| `effective_content` | 0~48,000자 |
| `missing_details` | 최대 20개, 각 1~1,000자 |
| `evidence_block_ids` | 최대 200개, 중복 금지 |
| `supplement_ids` | 요청에 있던 해당 section supplement ID만 허용 |
| `confidence` | 0.0~1.0 유한 소수 |
| `warnings` | 최대 50개, 각 1~1,000자 |

## 5. 결과 validation

FastAPI는 provider 응답을 검증한 뒤에만 200을 반환하고, Spring은 저장 전에 같은 규칙을 독립적으로 재검증한다.

1. `item_results`는 정확히 12개다.
2. section code는 중복될 수 없고 canonical 12개 전체와 정확히 일치한다.
3. 배열 순서는 canonical 순서와 일치한다.
4. status는 `PASS` 또는 `REJECT`뿐이다.
5. PASS이면 trim한 `effective_content`가 비어 있지 않다.
6. REJECT이면 trim한 `reason`이 비어 있지 않고 `missing_details`가 1개 이상이다.
7. 모든 evidence block ID는 요청 typed blocks에 존재하고 해당 content를 실제로 뒷받침한다.
8. 모든 supplement ID는 요청의 동일 section active supplement에 존재한다.
9. `overall_passed`는 12개 status가 모두 PASS인 경우에만 true다.
10. effective content의 모든 사실은 요청 typed blocks 또는 active supplement에 근거해야 한다. 추정, 상식 보충, 외부 검색 사실 생성은 금지한다.
11. response가 크기/개수/문자열 제한을 넘으면 실패한다.
12. 요청과 응답의 task, run, correlation 및 version 값이 일치해야 한다.

Spring은 provider가 보낸 `overall_passed`를 신뢰하지 않고 section status에서 다시 계산한다. 불일치는 `RESULT_SCHEMA_INVALID`로 전체 run을 FAILED 처리하며 부분 section을 projection에 반영하지 않는다.

## 6. Error Response

비-2xx body:

```json
{
  "error": {
    "code": "PROVIDER_TIMEOUT",
    "message": "Provider did not complete within the configured deadline.",
    "retryable": true,
    "details": {},
    "task_id": "018f-task-uuid",
    "request_id": "018f-request-uuid",
    "correlation_id": "trace-or-correlation-id"
  }
}
```

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

- `SOURCE_DOCUMENT_BLOCKS`: Spring parser가 만든 JSON. FastAPI 입력 근거다.
- `RESULT_DOCUMENT_STRUCTURE`: FastAPI의 검증 완료 response 원문. Spring이 `ai_task_results`와 `ai_task_artifacts`에 연결할 수 있다.
- artifact upload/download는 presigned URL로만 수행하고 DB credential을 FastAPI에 제공하지 않는다.
- FastAPI는 URL redirect를 따르지 않고 허용된 host, HTTPS, content type, size, checksum, expiry를 검증한다.
- Spring은 result artifact를 DB projection보다 먼저 무결성 검증한다. 검증 실패 시 ValidationRun은 FAILED다.

## 9. Provider 및 Mock 정책

- provider interface는 task handler와 분리한다.
- 운영 profile에서 실제 provider가 없으면 `PROVIDER_NOT_CONFIGURED`로 실패한다.
- 인증 실패, timeout, malformed response를 Mock 결과로 대체하지 않는다.
- Mock은 명시적인 local/test/e2e profile과 별도 설정에서만 선택할 수 있다.
- Mock이 생성한 결과에는 provider name을 `mock`으로 기록한다. 운영 project의 ValidationRun, confirmation, confirmed snapshot에는 사용할 수 없다.
- Spring 직접 OpenAI 호출은 이 공식 task 계약의 provider 경로가 아니다.

## 10. 구현 수용 기준

- schema fixture는 canonical PASS 12건, REJECT 포함 12건과 모든 오류 code를 가진다.
- FastAPI와 Spring contract test가 같은 fixture로 exact count/order/code/overall/evidence를 검증한다.
- provider raw response가 유효해 보여도 Spring의 독립 validation을 통과하지 못하면 DB projection이 바뀌지 않는다.
- task 처리 중 FastAPI의 PostgreSQL 연결 시도는 없어야 한다.
- parser artifact와 result artifact checksum, request hash, provider/model/version이 ValidationRun에서 추적 가능해야 한다.
