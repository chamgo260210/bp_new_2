# Phase D0 — 사업계획서 문서 구조화 기능 기존 계약 전수 조사

## 0. 조사 기준과 판정 규칙

- 조사 기준 branch: `main`
- 조사 기준 commit: `b5a7199e4431d014c6ccd123e4dca5d679e20caa` (`b5a7199`, `Merge pull request #12 from chamgo260210/integration/ai-task-hub-foundation`)
- 조사일: 2026-07-31 (Asia/Seoul)
- 조사 방법: Frontend, Spring, FastAPI, Flyway/Java migration, OpenAPI, 관련 테스트의 정적 호출 관계와 저장 관계를 추적했다.
- 조사량: 지정 범위 주요 디렉터리의 파일 298개를 전수 검색하고, 아래 파일 지도에 기록한 계약·실행 핵심 파일을 본문 단위로 확인했다.
- 테스트 실행: 이번 Phase는 운영 코드와 baseline을 변경하지 않는 계약 조사이므로 테스트 suite는 실행하지 않았다. 기존 테스트의 존재와 검증 의도만 조사했다.

상태 분류는 다음 의미로 사용한다.

| 상태 | 의미 |
|---|---|
| REAL | 실제 사용자/서버 경로에서 영속화 또는 외부 호출까지 수행한다. |
| PARTIAL | 핵심 골격은 있으나 공식 흐름의 일부가 없거나 다른 원칙으로 동작한다. |
| MOCK | 입력과 무관하거나 결정론적 가짜 결과를 생성한다. |
| DISCONNECTED | 구현은 있으나 조사 대상 실제 경로에서 호출되지 않는다. |
| LEGACY | 호환/과거 인터페이스로 남아 있고 신규 기준 경로가 아니다. |
| TEST_ONLY | 특정 test/dev/e2e profile 또는 fault 주입 전용이다. |
| NOT_IMPLEMENTED | 계약 또는 구현이 없다. |

## 1. 작업 전 Git 상태

요청된 순서로 다음을 실행했다.

```text
git switch main
→ Already on 'main'
→ 실행 환경의 10초 제한 뒤 exit 124가 반환됐으나 branch 전환 결과는 main으로 확인됨

git pull --ff-only origin main
→ Already up to date.
→ origin/main -> FETCH_HEAD
→ 실행 환경의 60초 제한 뒤 exit 124가 반환됐으나 fetch와 fast-forward 확인은 완료됨

git status
→ On branch main
→ Your branch is up to date with 'origin/main'.
→ nothing to commit, working tree clean

git log -3 --oneline --decorate
→ b5a7199 (HEAD -> main, origin/main) Merge pull request #12 from chamgo260210/integration/ai-task-hub-foundation
→ 3c277ee test: enforce frontend merge gate policy
→ a4c6385 test: normalize migration integrity checks
```

초기 작업 트리는 clean이었다. `AGENTS.md`는 저장소에서 발견되지 않았다.

## 2. 핵심 결론

1. 현재 Spring의 canonical section은 제공 코드의 12개 항목과 순서·의미가 모두 1:1 일치한다. 새로운 12개 taxonomy를 만들 이유는 없다.
2. 업로드, 문서 버전, `DOCUMENT_PARSE` Job, Apache POI 파서, 12개 section 저장, 누락 항목 보완/면제, 확정, LegalReview Gate는 Spring 안에 실제 구현되어 있다.
3. 그러나 기본 설정 `app.ai.enabled=false`에서는 `MockAiServiceClient`가 12개 항목을 모두 `PRESENT`로 생성한다. 이 경로는 **MOCK**이며 입력 내용에 따른 검증이 아니다.
4. 실 AI 설정에서는 `OpenAiDocumentStructureAdapter`가 Spring에서 OpenAI 호환 endpoint를 동기 호출한다. 공식 원칙인 `Spring → AnalysisJob → FastAPI → AI Provider`와 다르므로 **LEGACY/PARTIAL**이다.
5. FastAPI의 `AiTaskType`에는 `DOCUMENT_PARSE`가 없고 문서 parser/structure handler/provider interface/문서 schema도 없다. `/internal/v1/tasks`는 존재하지만 문서 구조화에는 **DISCONNECTED/NOT_IMPLEMENTED**다.
6. 사용자 보완과 `WAIVED`는 Spring에서 해당 field를 곧바로 해결된 것으로 계산한다. AI 재검증 Job은 생성되지 않는다. 따라서 `사용자 보완 → AI 재검증 → 전체 PASS` 계약은 **NOT_IMPLEMENTED**다. 현재의 `completionRate=100`은 누락 field가 `FILLED/WAIVED`로 닫혔다는 계산값이며, 향후 AI 검증 결과인 `overallPassed=true`와 동일한 개념이 아니다.
7. LegalReview는 확정된 plan의 section `sourceText`와 `evidenceJson`만 읽는다. `MissingField.userValueJson`과 면제 사유를 읽지 않는다. 보완으로 100%가 된 plan도 법률 검토에는 원래 부족한 추출문만 전달될 수 있다.
8. 사업계획서 원본은 `ObjectStoragePort`가 아니라 `FileStorage`/`LocalFileStorage`를 사용하며 `StoredFile.available(...)`도 `StorageType.LOCAL`로 저장한다. MinIO/S3 object storage는 현재 AI artifact 경로에 별도로 존재한다. 공식 저장 원칙과 불일치한다.
9. Frontend route 자체에는 stage 접근 차단이 없다. LegalReview 화면과 Spring start command가 stage/confirmed-plan 조건을 재검증하므로 서버 Gate는 있으나 탐색 차단은 부분적이다.

## 3. 현재 사용자 흐름

| 단계 | 실제 동작 | 상태 |
|---|---|---|
| `/app/projects/:projectId/plan/documents` 진입 | 문서 목록과 최신 version을 조회하고 DOCX 업로드 UI 표시 | REAL |
| 파일 선택 | `.docx`, MIME, 0 byte, 20 MiB, 단일 파일을 Frontend에서 검사 | REAL |
| 업로드 | multipart `file`, `documentType=BUSINESS_PLAN`, `Idempotency-Key` 전송 | REAL |
| 서버 저장 | 업로드를 다시 검증하고 로컬 파일 저장 후 `StoredFile`, `ProjectDocument`, `DocumentVersion` 저장 | PARTIAL |
| Job 생성 | 같은 transaction에서 `DOCUMENT_PARSE` `AnalysisJob` 생성 | REAL |
| Job 실행 | runner가 활성화된 환경에서 POI parse 후 `AiServiceClient` 호출 | PARTIAL |
| 구조화 조회 | 최신 Job 복구/폴링 후 최신 `StructuredPlan` 조회 | REAL |
| 누락 보완/면제 | field optimistic lock으로 `FILLED` 또는 `WAIVED` 저장, 서버 완성도 재계산 | PARTIAL |
| AI 재검증 | 보완값을 포함한 새 Job/validation run 없음 | NOT_IMPLEMENTED |
| 확정 | DRAFT, 100%, OPEN required 없음, 최신 lock, STRUCTURING stage 확인 후 immutable 처리 | REAL |
| LegalReview 진입 | project stage를 `LEGAL_REVIEW`로 변경하되 review Job은 자동 시작하지 않음 | REAL |
| LegalReview 시작 | 사용자가 별도 버튼을 눌러 confirmed plan 기반 Job 생성 | REAL |

Frontend의 project area/subnavigation은 모든 영역을 링크로 노출한다. `LegalReviewPage`는 stage가 `LEGAL_REVIEW`가 아니면 시작 버튼 대신 차단 안내를 표시하며, Spring도 start 시 Gate를 재검증한다.

## 4. Frontend 파일 지도

| 파일 | 역할 | 상태 |
|---|---|---|
| `frontEnd/src/app/router/AppRouter.jsx` | canonical 문서/구조화/법률 route와 legacy redirect | REAL + LEGACY |
| `frontEnd/src/app/layouts/ProjectLayout.jsx` | project area/subnavigation; stage별 route 차단은 없음 | PARTIAL |
| `frontEnd/src/features/projects/routing/projectRoutes.js` | documents, structure, legal canonical URL | REAL |
| `frontEnd/src/features/document/filePolicy.js` | DOCX, MIME, 20 MiB, empty 검사 | REAL |
| `frontEnd/src/features/documents/api/documentApi.js` | upload/list/version/job/latest-job API | REAL |
| `frontEnd/src/features/documents/hooks/useDocuments.js` | 목록/버전 조회, UUID 기반 업로드 idempotency | REAL |
| `frontEnd/src/features/documents/hooks/useJobRecovery.js` | 최신 Job 복구, 2/5초 polling, 8회 후 수동 대기, backoff | REAL |
| `frontEnd/src/features/documents/model/documentViewModel.js` | Job 상태 문구와 날짜 표시 | REAL |
| `frontEnd/src/features/documents/DocumentPages.jsx` | 업로드, 목록, Job 상태, 12 section, 보완/확정 composition | REAL |
| `frontEnd/src/features/structured-plan/api/structuredPlanApi.js` | latest, missing-field patch, confirm | REAL |
| `frontEnd/src/features/structured-plan/model/structuredPlanViewModel.js` | canonical 순서, status view, lock version, mock 표식 | REAL |
| `frontEnd/src/features/structured-plan/StructuredPlanCompletion.jsx` | FILLED/WAIVED, 충돌 복구, confirm UI, Legal CTA | REAL/PARTIAL |
| `frontEnd/src/features/legal-review/api/legalReviewApi.js` | start/latest/latest Job/plan 조회 | REAL |
| `frontEnd/src/features/legal-review/hooks/useLegalReview.js` | review/Job/confirmed-plan 순서로 복구 및 polling | REAL |
| `frontEnd/src/features/legal-review/LegalReviewPage.jsx` | stage 및 confirmed plan에 따른 start Gate | REAL |

관련 테스트:

- `filePolicy.test.js`: 확장자, MIME, 빈 파일, 크기 경계.
- `documentApi.test.js`: URL, multipart, idempotency header.
- `DocumentPages.test.jsx`: 업로드/목록/구조화 화면 상태.
- `useJobRecovery.test.jsx`: 최신 Job 복구, polling 중단/재개, 결과 조회.
- `structuredPlanApi.test.js`, `structuredPlanViewModel.test.js`: DTO와 canonical order.
- `StructuredPlanCompletion.test.jsx`: FILLED, WAIVED reason, 409 충돌 복구, confirm 및 stage refresh.
- `legalReviewApi.test.js`, `legalReviewViewModel.test.js`: 법률 API와 view mapping.

## 5. Spring Backend 파일 지도

| 영역 | 주요 파일/메서드 | 상태 |
|---|---|---|
| 업로드 Controller | `DocumentController.upload` | REAL |
| 업로드 검증/저장 | `DocumentCommandService.upload`, `BusinessPlanDocxPolicy.validate` | REAL |
| transaction/Job 생성 | `DocumentUploadTransactionService.create` | REAL |
| 문서 모델 | `ProjectDocument`, `DocumentVersion`, `StoredFile` | REAL |
| 문서 저장 구현 | `FileStorage`, `LocalFileStorage` | PARTIAL: object storage 미사용 |
| Job 모델/조회 | `AnalysisJob`, `JobQueryService`, `JobController`, `ProjectJobController` | REAL |
| Job claim/recovery | `JobRunner`, `JobClaimService`, `JobRecoveryService`, wake listener | REAL, 설정 활성화 필요 |
| parse executor | `DocumentParseJobExecutor.execute` | REAL/PARTIAL |
| DOCX parser | `DocxDocumentParser` | REAL |
| 구조화 prompt/request | `DocumentStructurePromptFactory`, `DocumentStructureRequestFactory` | REAL |
| AI port | `AiServiceClient.structureDocument` | PARTIAL: FastAPI task port가 아님 |
| 기본 AI | `MockAiServiceClient.structureDocument` | MOCK |
| 실 AI | `OpenAiDocumentStructureAdapter.structureDocument` | LEGACY: Spring 직접 호출 |
| mapping/persistence | `StructuredPlanMapper.map`, `StructuredPlanPersistenceService.complete` | REAL |
| 구조화 모델 | `StructuredPlan`, `StructuredPlanSection`, `MissingField` | REAL |
| 구조화 조회 | `StructuredPlanQueryService` | REAL |
| 보완/확정 | `StructuredPlanCommandService`, `StructuredPlanCompletionService` | PARTIAL |
| LegalReview Gate | `LegalReviewCommandService.start`, `LegalReviewJobContextService.load` | PARTIAL |

파서는 `XWPFDocument.getBodyElements()` 순서대로 paragraph와 table을 순회한다. paragraph는 heading/list/paragraph로 구분하고 table은 row/column 순서의 cell block으로 펼친다. `sequence`는 전체 본문 순서를 보존한다. heading level, table row/column, source location을 보존하지만 header/footer, image text, embedded object, external link 내용은 추출하지 않는다.

## 6. FastAPI 파일 지도

| 파일 | 현재 역할 | 문서 구조화 판정 |
|---|---|---|
| `ai/app/models/tasks.py` | 공통 task/artifact schema. task type은 smoke 2종과 marketing 1종 | DOCUMENT_PARSE NOT_IMPLEMENTED |
| `ai/app/api/tasks.py` | `POST /internal/v1/tasks`, schema `1.0` 검증 | endpoint REAL, 문서 handler DISCONNECTED |
| `ai/app/services/task_service.py` | task registry/dispatch | DOCUMENT_PARSE NOT_IMPLEMENTED |
| `ai/app/services/artifact_service.py` | presigned URL download/upload, size/MIME/checksum/redirect 검사 | REAL, 문서에는 미연결 |
| `ai/app/services/marketing_task_service.py` | marketing mock-copy handler | MOCK, 문서와 무관 |
| `ai/app/testing/e2e_faults.py` | malformed/checksum/timeout fault | TEST_ONLY |
| `ai/main.py` | health, echo, legacy marketing, internal task router | PARTIAL |
| `ai/tests/test_api.py` | task/artifact/fault/marketing 계약 테스트 | TEST_ONLY |

확인 결과:

- `AiTaskType.DOCUMENT_PARSE`: 없음.
- 문서 task request/response schema: 없음.
- document parser/structure handler: 없음.
- 문서용 Provider interface: 없음.
- 문서 artifact 다운로드: 없음. 공통 artifact transport만 존재한다.
- PostgreSQL 접근: 없음. 이 원칙은 지켜진다.
- `/internal/v1/tasks` 응답은 동기 `SUCCEEDED`만 모델링한다. Spring의 Job 원장과 결합할 문서 task error/result 계약은 없다.

## 7. DB/Flyway 지도

문서 구조화에 직접 관련된 migration은 다음과 같다.

| Migration | 내용 | 상태 |
|---|---|---|
| `V1__create_core_tables.sql` | stored file, document/version, plan/section/missing field, job, legal tables | REAL |
| `V3__extend_document_processing_metadata.sql` | provider/model/prompt/parser/hash, canonical status/evidence/ref, Job source/idempotency | REAL |
| `V4__add_job_execution_control.sql` | claim/retry/heartbeat, display order, source-version unique | REAL |
| `V5__harden_document_integrity.java` | canonical code/status checks, PostgreSQL partial unique active plan document | REAL |
| `V6__add_auth_confirmation_audit.sql` | confirmed user FK | REAL |
| `V7__add_legal_review_vertical_slice.sql` | Job→plan, review→plan/version, prompt unique, input snapshot | REAL |
| `V8__add_feasibility_assessment_vertical_slice.sql` | plan/legal/version snapshot 관계 | 후속 REAL |
| `V9__add_persona_recommendation_vertical_slice.sql` | plan/feasibility/version snapshot 관계 | 후속 REAL |
| `V21__add_financial_analysis.sql`, `V22__backfill_financial_analysis_contract.sql` | financial→feasibility/plan/version | 후속 REAL |
| `V23__add_ai_task_result_lifecycle.sql`, `V24__add_ai_task_artifacts.sql` | FastAPI task 결과와 artifact 원장 | REAL, DOCUMENT_PARSE 미사용 |

버전과 삭제 정책:

- 모든 주요 테이블은 `BaseEntity`의 optimistic `version`과 `deleted_at`을 갖는다.
- 업무 버전은 별도다: `ProjectDocument.currentVersion`, `DocumentVersion.versionNumber`, `StructuredPlan.versionNumber`.
- `DocumentVersion(document_id, version_number)`와 `StructuredPlan(project_id, version_number)`가 unique다.
- 하나의 source document version당 active 여부와 무관하게 plan 하나만 허용하는 DB unique가 있다.
- section은 `(structured_plan_id, section_code)` unique다.
- `missing_fields`에는 `(structured_plan_id, field_code)` unique가 없다.
- PostgreSQL에서만 `uk_active_business_plan_per_project` partial unique index를 생성한다. H2에는 같은 DB 제약이 없고 application lock/검사가 대신한다.
- 삭제는 물리 cascade가 아닌 soft delete 조회 규칙에 의존한다. FK에는 cascade가 없다.

## 8. 현재 API 계약

모든 외부 Spring 경로는 `/api/v1` 아래이며 `ApiResponse<T>` envelope를 반환한다.

| Method/Path | 요청 | 응답 핵심 | 상태 |
|---|---|---|---|
| `POST /projects/{projectId}/documents` | multipart file, documentType, Idempotency-Key | projectId, documentId, versionId, jobId, status; 202 | REAL |
| `GET /projects/{projectId}/documents` | - | documentId/type/currentVersion/status/latestVersionId/updatedAt[] | REAL |
| `GET /documents/{documentId}/versions/{versionId}` | - | file name/size/parseStatus/uploadedAt | REAL |
| `GET /jobs/{jobId}` | - | `JobResponse` 전체 상태/재시도/source/result ref | REAL |
| `GET /projects/{projectId}/jobs/latest?jobType=DOCUMENT_PARSE` | - | 최신 `JobResponse` | REAL |
| `GET /projects/{projectId}/structured-plans/latest` | - | plan, 정확히 12 sections, missingFields, versions, provenance | REAL |
| `PATCH /projects/{projectId}/structured-plans/{planId}/missing-fields/{fieldId}` | status FILLED/WAIVED, value/reason, field lock version | 갱신 field와 새 lock version | REAL |
| `POST /projects/{projectId}/structured-plans/{planId}/confirm` | plan lock version | confirmed plan | REAL |
| `POST /projects/{projectId}/legal-reviews` | body 없음 | reviewId/jobId/planId/sourceVersionId; 202 | REAL |
| `GET /projects/{projectId}/legal-reviews/latest` | - | review/findings/questions/provenance | REAL |

`JobResponse`는 `jobId`, `projectId`, `jobType`, `status`, `progress`, `message`, `attempt`, `nextAttemptAt`, `retryable`, `sourceDocumentVersionId`, timestamps, `errorCode`, `externalRequestId`, result reference, rerun source를 반환한다.

주요 오류 코드는 `FILE_REQUIRED`, `FILE_EMPTY`, `FILE_NAME_INVALID`, `FILE_TOO_LARGE`, `FILE_TYPE_UNSUPPORTED`, `FILE_SIGNATURE_INVALID`, `FILE_STORAGE_FAILED`, `DOCUMENT_UPLOAD_NOT_ALLOWED`, `DOCUMENT_VERSION_NOT_FOUND`, `IDEMPOTENCY_KEY_INVALID`, `IDEMPOTENCY_CONFLICT`, `JOB_NOT_FOUND`, `STRUCTURED_PLAN_NOT_FOUND`, `MISSING_FIELD_NOT_FOUND`, `PLAN_NOT_EDITABLE`, `PLAN_INCOMPLETE`, `RESOURCE_VERSION_CONFLICT`, `PROJECT_STAGE_INVALID`, `LEGAL_REVIEW_INPUT_INVALID`, `ANALYSIS_ALREADY_RUNNING`, `DOCUMENT_PROCESSING_DISABLED`다. Job 내부에는 parser/AI/mapping 실패 코드가 별도로 저장된다.

OpenAPI와 실제 DTO는 위 핵심 필드에서 일치한다. OpenAPI의 latest Job query enum은 `DOCUMENT_PARSE`, `LEGAL_REVIEW`, `FEASIBILITY_ANALYSIS`만 문서화하지만 실제 `JobQueryService`는 persona/smoke/artifact/marketing도 허용한다. 이는 문서 누락이다.

## 9. 현재 ERD 관계

```text
Project
 ├─ 1:N ProjectDocument
 │    └─ 1:N DocumentVersion ── 1:1 StoredFile
 ├─ 1:N AnalysisJob
 │    ├─ N:1 sourceDocumentVersion   (DOCUMENT_PARSE)
 │    ├─ N:1 sourceStructuredPlan    (LEGAL/FEASIBILITY/PERSONA)
 │    ├─ N:1 sourceLegalReview       (FEASIBILITY)
 │    └─ N:1 sourceFeasibility       (PERSONA)
 ├─ 1:N StructuredPlan ── N:1 sourceDocumentVersion
 │    ├─ 1:N StructuredPlanSection
 │    ├─ 1:N MissingField
 │    └─ N:1 confirmedBy User
 └─ 1:N LegalReview
      ├─ 1:1 AnalysisJob
      ├─ N:1 StructuredPlan
      ├─ N:1 sourceDocumentVersion
      ├─ 1:N LegalFinding
      └─ 1:N LegalReviewQuestion
```

`StructuredPlan.rawExtractedJson`에는 원문 전체나 parser block 원장이 아니라 section status/warning processing summary가 저장된다. 원문 block은 요청 시 메모리 객체로 존재할 뿐 별도 DB/artifact로 남지 않는다.

## 10. 현재 section 전체 목록

공통 정책:

- 12개 모두 `required=true`.
- `allowedMissingPolicy=USER_INPUT_REQUIRED`.
- AI 상태는 `PRESENT`, `MISSING`, `PARTIAL`, `INVALID`, mapper 보정용 `UNKNOWN`.
- `extractedContent`는 DB의 `StructuredPlanSection.sourceText`에 저장된다.
- evidence는 `List<String>` → `evidenceJson`; 원문 위치는 block sequence 배열이다.
- AI가 `PRESENT`인데 extracted content가 비면 `INVALID`로 강등한다.
- `PRESENT`가 아니면 section당 `SECTION_{sectionCode}` missing field 하나를 만든다.
- 현재 UI/API는 모든 missing field에 `FILLED`와 `WAIVED`를 허용한다. catalog의 `USER_INPUT_REQUIRED`는 waiver를 막지 않는다.
- `FILLED`는 `userValueJson`, `WAIVED`는 `reason`에 저장된다.
- Frontend 확정 조건은 화면이 복구한 최신 Job의 source와 plan source가 일치하고, status DRAFT, completion 100, OPEN required 0, plan lock 존재, project stage STRUCTURING인 것이다. Spring confirm service는 plan/status/completion/stage/lock은 재검증하지만 해당 plan source가 현재 최신 `DocumentVersion`인지 직접 재검증하지 않으므로 최신 source 서버 Gate는 PARTIAL이다.

| # | sectionCode | 표시명 | 필수 | 상태/필드 | 후속 실제 사용처 |
|---:|---|---|---|---|---|
| 1 | BUSINESS_OVERVIEW | 사업 개요 | Y | 공통 정책 | Legal/Feasibility가 content/evidence 사용 |
| 2 | MARKET_SIZE | 시장 규모 | Y | 공통 정책 | Legal/Feasibility; Persona가 content/status 사용 |
| 3 | TARGET_CUSTOMER | 타겟 고객 | Y | 공통 정책 | Legal/Feasibility; Persona가 content/status 사용 |
| 4 | COMPETITIVE_ANALYSIS | 경쟁 분석 | Y | 공통 정책 | Legal/Feasibility; Persona가 content/status 사용 |
| 5 | PRODUCT_SERVICE | 제품 · 서비스 | Y | 공통 정책 | Legal/Feasibility; Persona가 content/status 사용 |
| 6 | BUSINESS_MODEL | 비즈니스 모델 | Y | 공통 정책 | Legal/Feasibility; Persona가 content/status 사용 |
| 7 | COST_PROFITABILITY | 원가 · 수익성 | Y | 공통 정책 | Legal/Feasibility; financial은 feasibility를 통해 간접 사용 |
| 8 | SALES_GOALS_FINANCIAL_PROJECTIONS | 판매 목표 · 재무 추정 | Y | 공통 정책 | Legal/Feasibility; Persona가 content/status 사용; financial 간접 |
| 9 | TECHNOLOGY_PRODUCTION | 기술 · 생산 | Y | 공통 정책 | Legal/Feasibility |
| 10 | LEGAL_PERMITS | 법률 · 인허가 | Y | 공통 정책 | Legal/Feasibility |
| 11 | SCHEDULE_RISK | 일정 · 리스크 | Y | 공통 정책 | Legal/Feasibility |
| 12 | EVIDENCE_LIST | 근거 자료 목록 | Y | 공통 정책 | Legal/Feasibility |

중요한 소비 차이:

- LegalReview: 12개 section의 `sourceText`와 `evidenceJson`만 읽으며 missing-field 보완/면제는 읽지 않는다.
- Feasibility: 12개 section의 content/status/evidence/block refs와 모든 completion의 userValue/reason을 함께 읽는다.
- Persona: 위 표의 6개 section만 직접 읽고 completion은 실제 값이 아니라 상태 문자열만 읽는다.
- Financial: section을 직접 읽지 않고 feasibility snapshot과 별도 사용자 재무 가정을 사용한다.

## 11. 제공 코드 12개 항목 매핑표

| 제공 코드 12개 항목 | 현재 sectionCode | 일치 여부 | 병합/분리 필요 | 후속 사용처 |
|---|---|---|---|---|
| 사업 개요 | BUSINESS_OVERVIEW | 일치 | 없음 | Legal, Feasibility |
| 시장 규모 | MARKET_SIZE | 일치 | 없음 | Legal, Feasibility, Persona |
| 타깃 고객 | TARGET_CUSTOMER | 의미 일치; 현재 표기는 `타겟 고객` | 코드 분리 불필요, 표시명 표기 결정만 필요 | Legal, Feasibility, Persona |
| 경쟁 분석 | COMPETITIVE_ANALYSIS | 일치 | 없음 | Legal, Feasibility, Persona |
| 제품·서비스 | PRODUCT_SERVICE | 일치 | 없음 | Legal, Feasibility, Persona |
| 비즈니스 모델 | BUSINESS_MODEL | 일치 | 없음 | Legal, Feasibility, Persona |
| 원가·수익성 | COST_PROFITABILITY | 일치 | 없음 | Legal, Feasibility, Financial 간접 |
| 판매 목표·재무 추정 | SALES_GOALS_FINANCIAL_PROJECTIONS | 일치 | 없음 | Legal, Feasibility, Persona, Financial 간접 |
| 기술·생산 | TECHNOLOGY_PRODUCTION | 일치 | 없음 | Legal, Feasibility |
| 법률·인허가 | LEGAL_PERMITS | 일치 | 없음 | Legal, Feasibility |
| 일정·리스크 | SCHEDULE_RISK | 일치 | 현재 legacy `PlanSectionType`에는 SCHEDULE/RISK 두 의미가 있으나 canonical section은 하나 | Legal, Feasibility |
| 근거 자료 목록 | EVIDENCE_LIST | 일치 | 없음 | Legal, Feasibility |

결론은 12/12 canonical mapping 일치다. 다만 `타깃/타겟` 표시명과 `SCHEDULE_RISK`의 legacy type mapping 차이는 계약 문서에서 명시해야 한다.

## 12. DOCUMENT_PARSE 실제 실행 경로

```text
Browser ModernUploadExperience.submit
→ useDocumentUpload.upload
→ documentApi.upload
→ POST /api/v1/projects/{projectId}/documents
→ DocumentController.upload
→ DocumentCommandService.upload
→ BusinessPlanDocxPolicy.validate
→ LocalFileStorage.store
→ DocumentUploadTransactionService.create
→ StoredFile.available(StorageType.LOCAL)
→ ProjectDocument.allocateNextVersion
→ DocumentVersion.uploaded
→ AnalysisJob.queuedDocumentParse
→ DocumentProcessingRequested
→ DocumentProcessingWakeListener / JobRunner.poll
→ JobClaimService.claimOne/claimBatch
→ DocumentParseJobExecutor.execute
→ FileStorage.open
→ DocxDocumentParser.parse
→ DocumentStructureRequestFactory.create
→ AiServiceClient.structureDocument
   ├─ default: MockAiServiceClient                 [MOCK]
   └─ app.ai.enabled=true: OpenAiDocumentStructureAdapter [Spring direct]
→ StructuredPlanMapper.map
→ StructuredPlanPersistenceService.complete
→ StructuredPlan + 12 sections + missing fields 저장
→ DocumentVersion SUCCEEDED/PARTIAL
→ AnalysisJob SUCCEEDED/PARTIAL, resultReference=STRUCTURED_PLAN
→ Project.enterStructuring
→ Frontend useJobRecovery
→ GET latest Job / GET latest StructuredPlan
```

FastAPI는 이 경로에 등장하지 않는다. Job runner 기본값도 `enabled=false`이므로 local 기본 실행에서는 upload 후 QUEUED에 머물 수 있다. compose 환경은 runner를 true로 켜지만 `APP_AI_ENABLED`를 켜지 않아 Spring Mock이 선택된다.

## 13. Mock / Legacy / Test-only 목록

### Mock

| 경로 | 동작 | 판정 |
|---|---|---|
| `MockAiServiceClient.structureDocument` | 12개 모두 PRESENT, 고정 영문 content/evidence, 첫 block을 모든 근거로 복제 | MOCK |
| `application.yaml app.ai.enabled=false` | 위 Mock을 기본 bean으로 선택 | MOCK |
| `compose.yaml` | AI enabled를 true로 설정하지 않아 문서 구조화는 Mock | MOCK |
| Frontend `plan.isMock` alert | mock provider를 사용자에게 표시 | REAL 안전장치 |
| FastAPI marketing banner/copy | 입력 파일 복제와 mock copy; 문서와 무관 | MOCK/DISCONNECTED |
| FastAPI system smoke | `received_input`을 그대로 결과로 반환 | MOCK/TEST 지원 |

### Legacy / Disconnected

| 경로 | 내용 | 판정 |
|---|---|---|
| `DocumentPages.jsx` 주석 처리 `UploadForm` | ModernUploadExperience로 교체되어 bundle 제외 | LEGACY/DISCONNECTED |
| `AppRouter.LegacyProjectRedirect`와 `/projects/:id/...` | 새 `/app/projects/:id/...`로 호환 redirect | LEGACY, 의도된 계약 |
| `AiServiceClient.startJob/getStatus/cancel` | 실 OpenAI adapter가 unsupported로 던지며 호출처 없음 | LEGACY/DISCONNECTED |
| `OpenAiDocumentStructureAdapter` | Spring에서 Provider 직접 동기 호출 | LEGACY/PARTIAL |
| `AiServerTestController` | local/dev header profile의 AI health/marketing probe | TEST_ONLY/LEGACY |
| FastAPI `/api/v1/test`, legacy marketing endpoint | connection/demo surface | TEST_ONLY/LEGACY |
| `/upload-guideline`, `/save-analysis` | 저장소에 구현/계약 없음 | NOT_IMPLEMENTED; 초기 `/upload-guideline`은 가이드 다운로드가 아니라 업로드+분석 endpoint였고 현재 대체 계약은 `POST /api/v1/projects/{projectId}/documents` |
| `@CrossOrigin("*")` | 없음; 중앙 CORS allowlist 사용 | 초기 방식 폐기됨 |

### Test-only / Fault

| 경로 | 내용 | 판정 |
|---|---|---|
| `E2eJobControlController` | `e2e` profile에서 Job wake | TEST_ONLY |
| `ai/app/testing/e2e_faults.py` | malformed response, checksum mismatch, 최대 30초 timeout sleep | TEST_ONLY |
| `scripts/docker-failure-e2e.ps1` | 위 fault 환경을 켜는 E2E harness | TEST_ONLY |
| `RequestHeaderCurrentUserProvider`, `DevHeaderAuthenticationFilter` | test/dev-header-auth 인증 | TEST_ONLY |
| `TestDocxFactory` 및 각 test fixture/mock bean | parser/processing/API test data | TEST_ONLY |

문서 구조화 운영 경로에서 random 결과나 단순 sleep 후 성공은 찾지 못했다. Frontend idempotency fallback의 `Math.random`은 결과 생성이 아니라 UUID 미지원 환경의 요청 key 생성용이다.

## 14. 보완·재검증·확정 기능 현황

| 기능 | 현재 계약 | 판정 |
|---|---|---|
| 누락 field 생성 | PRESENT가 아닌 canonical section당 1개 | REAL |
| 사용자 보완 | 최대 4,000자, `FILLED`, field optimistic lock | REAL |
| 면제 | 최대 500자 사유, `WAIVED`, 필수 section에도 허용 | PARTIAL: 현재 동작이나 “12개 필수 section은 면제 불가, 모두 AI PASS 후 확정”이라는 최종 목표 정책과 충돌 |
| 완성도 재계산 | PRESENT 또는 linked required fields 모두 FILLED/WAIVED면 완료 | REAL이나 정책상 PARTIAL |
| AI 전체 통과 | 현재 `completionRate=100`만 존재하며 AI `overallPassed=true`는 저장·검증되지 않음 | NOT_IMPLEMENTED; 두 값은 별도 개념 |
| AI 재검증 | 새 Job, prompt, provider call, validation history 없음 | NOT_IMPLEMENTED |
| section effective content 갱신 | 보완값은 원래 section sourceText와 분리 유지 | PARTIAL |
| 확정 | Spring은 DRAFT/100/open required 0/stage/lock을 재검증하고 Frontend는 최신 source를 비교 | PARTIAL: Spring confirm service의 최신 DocumentVersion 직접 재검증은 불완전 |
| 확정 후 수정 | plan immutable, UI도 read-only | REAL |
| 최신 문서 보호 | Frontend source version 비교와 server latest-plan 조회 | PARTIAL: confirm service는 plan이 최신 document version인지 직접 비교하지 않음 |

면제 가능 여부는 현재 구현상 모든 generated missing field에 대해 `예`다. 이것은 `allowedMissingPolicy=USER_INPUT_REQUIRED` 및 “12개 필수 항목 전체 PASS”와 충돌할 수 있어 D1 정책 결정이 필요하다.

## 15. 법률 검토 Gate 현황

확정 시 `StructuredPlanCommandService.confirm`이 project stage를 `STRUCTURING → LEGAL_REVIEW`로 변경한다. 법률 Job은 자동 생성하지 않는다.

`LegalReviewCommandService.start`의 서버 Gate:

1. 사용자 write/service policy 통과.
2. owner project 존재.
3. 최신 `CONFIRMED`, completion 100 plan 존재.
4. 같은 plan/prompt의 기존 review가 있으면 idempotent reuse.
5. project stage가 `LEGAL_REVIEW`.
6. active LEGAL_REVIEW Job이 없음.
7. Job은 `sourceStructuredPlan` FK를 갖고 request에는 plan/version/prompt를 기록.

문제점:

- `LegalReviewJobContextService`는 `StructuredPlanSection.sourceText/evidenceJson`만 snapshot으로 만든다.
- `MissingField.userValueJson/reason/status`는 snapshot에 없다.
- 따라서 사용자 보완 또는 waiver가 LegalReview의 “확정된 계획 스냅샷”에 실질적으로 합성되지 않는다.
- Frontend route는 stage와 무관하게 직접 열 수 있고 화면 내부에서만 start를 막는다. 보안/무결성은 서버 Gate가 담당한다.

판정: Gate 자체는 REAL, 확정 입력 스냅샷의 완전성은 PARTIAL.

## 16. 받은 초기 코드 요소별 이식 판정

| 요소 | 판정 | 근거 |
|---|---|---|
| Apache POI 문단 추출 | 현재 구현으로 대체 | 현재 parser가 보안 한도와 typed block을 포함해 더 강함 |
| 표 추출 필요성 | 현재 구현으로 대체 | row/column 순서의 TABLE_CELL 추출이 이미 있음 |
| Heading 추출 필요성 | 현재 구현으로 대체 | style 기반 heading level 추출이 이미 있음 |
| 문서 순서 보존 | 현재 구현으로 대체 | body element 순서 + 전역 block sequence |
| OpenAI Prompt | 변형하여 차용 | “원문 외 생성 금지/12개/사유”는 유지하되 FastAPI provider 계약으로 이동 필요 |
| 12개 항목 | 그대로 차용 | 현재 canonical catalog와 12/12 일치 |
| PASS/REJECT | 변형하여 차용 | 저장 상태는 PRESENT/MISSING/PARTIAL/INVALID/UNKNOWN 유지, view/gate에서 PASS 의미 정의 |
| overallPassed | 변형하여 차용 | 현재 completion/status와 별도로 AI 재검증 결과의 전체 Gate 정의 필요 |
| extractedContent | 그대로 차용 | 현재 DTO/DB/frontend 필드와 일치 |
| reason | 그대로 차용 | 현재 DTO/DB/frontend 필드와 일치 |
| Spring 직접 OpenAI 호출 | 폐기 | FastAPI Provider 경계 원칙 위반 |
| `/upload-guideline` | 현재 구현으로 대체 | 초기 endpoint는 업로드+분석 경로였으며 현재 대체 계약은 `POST /api/v1/projects/{projectId}/documents` |
| `/save-analysis` | 폐기 | Spring이 Job 결과를 검증하고 DB 저장해야 함 |
| Map payload | 폐기 | typed task/DTO/schema 계약 필요 |
| `CrossOrigin("*")` | 폐기 | 중앙 allowlist CORS 유지 |
| API key 위치 | 변형하여 차용 | 환경 secret 원칙은 유지하되 Provider key는 FastAPI 측에 위치 |
| 동기 요청/응답 | 현재 구현으로 대체 | 외부 계약은 AnalysisJob async, 내부 FastAPI 호출도 Job executor가 관리 |

## 17. 유지해야 할 기존 계약

1. 외부 upload/list/version/latest-plan/missing-field/confirm/Job URL과 `ApiResponse` envelope.
2. `Idempotency-Key`와 request fingerprint 재사용/충돌 의미.
3. `ProjectDocument → DocumentVersion → StoredFile` 버전 원장.
4. `AnalysisJob`이 비동기 상태·재시도·result reference의 시스템 원장인 구조.
5. 12개 canonical sectionCode, 순서, 표시명 호환.
6. section의 `status`, `extractedContent`, `reason`, confidence, evidence, block refs.
7. plan/field optimistic lock `version`과 업무 `versionNumber`의 분리.
8. latest source version을 Frontend가 비교하는 복구 UX와 mock 표시.
9. confirm이 LegalReview Job을 자동 시작하지 않고 stage만 이동하는 계약.
10. Legal/Feasibility/Persona/Financial이 plan/version FK를 통해 출처를 고정하는 원칙.
11. FastAPI가 PostgreSQL에 직접 접근하지 않고 artifact를 presigned URL로 운반하는 원칙.

## 18. 교체해야 할 구현

1. 기본 `MockAiServiceClient` 문서 결과를 운영 가능한 FastAPI `DOCUMENT_PARSE` task handler/provider 경로로 교체.
2. Spring 직접 OpenAI adapter를 공식 문서 실행 경로에서 제거하거나 legacy 격리.
3. 사업계획서 원본 `LocalFileStorage`를 `ObjectStoragePort` 기반 MinIO/S3 저장으로 연결.
4. 보완/면제를 단순 완료 처리하는 로직을 “effective input 생성 → AI 재검증 → 검증 이력 저장”으로 교체.
5. LegalReview snapshot이 원래 추출문뿐 아니라 검증된 사용자 보완을 읽도록 교체.
6. Persona가 completion 상태만 읽고 값은 버리는 입력 조립을 검증된 effective snapshot 기준으로 교체.
7. runner가 꺼진 환경에서 QUEUED가 무기한 남는 운영 설정 위험을 배포 검증 대상으로 전환.

## 19. 예상 DB/ERD 변경 후보

아직 migration을 작성하지 않았으며 다음은 D1 의사결정 후보이다.

| 분류 | 후보 |
|---|---|
| 기존 구조로 충분 | ProjectDocument/DocumentVersion 버전, AnalysisJob source/result, 12 section 기본 row, plan confirm metadata, LegalReview plan/version FK |
| 컬럼 확장 필요 | section의 effective/validated content 또는 validation status/provenance; plan의 overall validation/prompt/schema version; StoredFile의 실제 object storage type 사용 |
| 신규 테이블 필요 | 보완 후 AI 재검증 run/history; section별 validation attempt; 정규화된 evidence/provenance; parser block 원장 또는 immutable parse artifact |
| 관계 수정 필요 | DOCUMENT_PARSE source artifact/StoredFile과 AI task artifact 연결; LegalReview가 검증된 effective plan snapshot을 참조하는 관계 |
| 제약조건 추가 필요 | missing field `(structured_plan_id, field_code)` unique; canonical section 필드 NOT NULL; sequence 범위/unique; status/waiver policy check; active source/latest confirm 무결성 |
| 아직 판단 불가 | waiver를 필수 항목에 허용할지, evidence를 JSON으로 유지할지 정규화할지, parser block을 DB와 object artifact 중 어디에 둘지, 재검증마다 새 plan version을 만들지 |

기존 `ai_task_results`/`ai_task_artifacts`를 DOCUMENT_PARSE에 재사용할 수 있으므로 새 generic task table은 우선 필요하지 않다. 다만 section validation history는 현재 plan/field 덮어쓰기 모델만으로 표현할 수 없다.

## 20. 예상 위험 및 회귀 지점

1. 12개 canonical code/순서 변경 시 DB check, OpenAPI enum, Frontend order, prompt, downstream dimension/persona filter가 동시에 깨진다.
2. `PRESENT`와 PASS를 동일시하면 보완 후 재검증 상태를 표현하지 못한다.
3. WAIVED를 완료로 계산하는 현재 동작을 바꾸면 기존 confirm UI/테스트/사용자 데이터가 영향을 받는다.
4. effective content 도입 시 Legal/Feasibility/Persona가 서로 다른 원본을 읽지 않도록 단일 snapshot 계약이 필요하다.
5. source document 최신성 검증을 서버에 추가하면 업로드와 confirm 경합의 409 의미가 바뀔 수 있다.
6. local file에서 S3로 전환할 때 StoredFile `storageType`, cleanup, checksum, orphan reconciliation, test fixture가 회귀 지점이다.
7. FastAPI task 도입 시 Spring timeout/retry와 Provider retry가 중복되지 않도록 책임을 나눠야 한다.
8. FastAPI 동기 `SUCCEEDED` response model은 장시간 parser/provider에 부적합할 수 있다. 다만 외부 사용자 Job은 Spring이 유지해야 한다.
9. parser는 header/footer/image OCR/footnote를 읽지 않아 근거 누락이 생길 수 있다.
10. `sourceText`, `evidenceJson`, `userValueJson`이 TEXT/JSON 문자열이라 schema drift와 잘못된 저장 데이터를 DB가 막지 못한다.
11. PostgreSQL partial unique가 H2에 없어 local/test와 운영의 active document 동시성 결과가 다를 수 있다.
12. OpenAPI latest Job enum 누락처럼 문서와 실제 허용 범위가 이미 일부 어긋난다.

## 21. Phase D1 권장 범위

Phase D1은 구현보다 계약/ERD 확정에 한정하는 것이 안전하다.

1. 12개 canonical section은 유지하고 표시명/설명/required/waiver 정책을 versioned catalog로 확정한다.
2. `PRESENT/MISSING/PARTIAL/INVALID`와 사용자 보완 상태, AI 재검증 PASS/REJECT, `overallPassed`의 상태 전이를 분리 정의한다.
3. 원문 추출값, 사용자 보완값, 검증된 effective value의 우선순위와 immutable snapshot schema를 확정한다.
4. FastAPI `DOCUMENT_PARSE` task request/response/error/provider/artifact 계약을 정의한다. Spring Job/DB 원장 원칙은 유지한다.
5. DOCX 원본과 parse artifact의 S3 object key/checksum/retention 계약을 정한다.
6. Legal/Feasibility/Persona/Financial이 읽을 단일 confirmed snapshot과 section별 소비 필드를 확정한다.
7. validation history/evidence/block artifact의 ERD를 선택하고 필요한 migration 후보만 설계한다.
8. 기존 API 호환 전략과 오류 코드/409/422 의미를 확정한다.
9. Mock profile을 명시적 local/test opt-in으로 제한하는 배포 정책을 정한다.
10. D1 산출물 승인 전 운영 코드, DTO, migration, provider 구현은 시작하지 않는다.

## 22. 미확정 사항

1. 필수 12개 항목에 waiver를 허용할지, 허용한다면 전체 PASS와 어떻게 구분할지.
2. 사용자 보완을 같은 plan의 별도 field로 유지할지 새 plan/version으로 승격할지.
3. AI 재검증 단위가 전체 문서인지 변경 section만인지.
4. `overallPassed`를 plan column으로 저장할지 validation run에서 계산할지.
5. parser block/evidence를 DB 정규화할지 S3 JSON artifact로 보관할지.
6. header/footer, footnote/endnote, textbox, image OCR까지 공식 parser 범위에 넣을지.
7. FastAPI가 parser까지 담당할지, Spring POI parse 후 typed blocks만 FastAPI에 전달할지. 현재 원칙 문구는 “DOCX 구조 파싱” 위치를 확정하지 않는다.
8. OpenAI 또는 다른 Provider의 key/모델/prompt version registry 소유 주체.
9. 기존 confirmed plan 중 WAIVED 또는 보완값이 Legal snapshot에 빠진 데이터의 호환/재검토 정책.
10. source plan 최신성의 기준이 최신 upload version인지, 사용자가 명시적으로 확정한 version인지.
11. legacy Spring OpenAI adapter와 `AiServiceClient` job methods의 제거 시점.
12. H2 local profile을 유지할지 PostgreSQL을 개발/테스트 공통 기준으로 올릴지.

## 부록 A. 기능별 최종 상태 요약

| 기능 | 상태 |
|---|---|
| Frontend upload/list/recovery | REAL |
| Spring upload/version/Job | REAL |
| DOCX paragraph/table/heading/order parse | REAL |
| object storage for original document | NOT_IMPLEMENTED |
| 12-section catalog/mapping/persistence | REAL |
| default document AI result | MOCK |
| Spring direct OpenAI path | LEGACY/PARTIAL |
| FastAPI DOCUMENT_PARSE | NOT_IMPLEMENTED |
| supplement/waiver persistence | REAL |
| AI revalidation after supplement | NOT_IMPLEMENTED |
| confirm and stage transition | REAL |
| LegalReview server Gate | REAL |
| LegalReview effective supplemented snapshot | NOT_IMPLEMENTED |
