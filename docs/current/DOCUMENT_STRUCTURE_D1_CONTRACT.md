# Phase D1 — 사업계획서 구조화 최종 계약

## 1. 문서 지위

- 기준 commit: `8283acb5889e800a8fad5f59e354c247c09aac68`
- 계약 버전: `document-structure-contract-v1`
- canonical rubric 버전: `business-plan-rubric-v2`
- AI task schema 버전: `1.0`
- prompt 버전: `business-plan-structure-v2`

이 문서는 D2~D6 구현의 규범 문서다. `MUST`, `MUST NOT`, `SHOULD`는 각각 필수, 금지, 권고를 뜻한다. 기존 외부 API를 유지해야 하는 경우에도 이 문서의 데이터 무결성 규칙을 우회할 수 없다.

## 2. 기능 목적

사업계획서 구조화 기능은 원본 DOCX와 사용자 보완에서 확인 가능한 사실만 사용해 12개 canonical section을 구조화하고, section별 완전성을 검증하며, 모든 section이 PASS한 시점의 불변 입력 원장을 생성한다.

공식 흐름은 다음과 같다.

```text
DOCX upload
→ Spring object storage 저장
→ Spring DocxDocumentParser typed blocks 생성
→ parser block JSON artifact 저장
→ Spring AnalysisJob/ValidationRun 생성
→ FastAPI DOCUMENT_PARSE
→ AI Provider
→ Spring schema/evidence/overall 검증
→ section validation 저장
→ 사용자 supplement
→ 전체 12개 재검증
→ 최신 ValidationRun overallPassed=true
→ 사용자 확정
→ immutable ConfirmedStructuredPlanSnapshot
→ Legal / Feasibility / Financial / Persona / Marketing / Report
```

Spring은 PostgreSQL, 프로젝트 단계, 문서/plan 버전, AnalysisJob, ValidationRun, snapshot의 유일한 원장이다. FastAPI는 PostgreSQL에 직접 접근하거나 확정 여부를 판단하지 않는다.

## 3. 용어 정의

| 용어 | 정의 |
|---|---|
| DocumentVersion | 한 번 업로드된 원본 DOCX의 불변 버전 |
| Parser Artifact | `DocxDocumentParser`가 생성한 typed blocks 전체를 담은 불변 JSON object |
| Typed Block | 순서와 위치를 가진 `HEADING`, `PARAGRAPH`, `LIST_ITEM`, `TABLE_CELL` 단위 |
| StructuredPlan | 한 DocumentVersion에서 파생된 구조화 작업의 업무 버전 |
| Extracted Content | 원본 typed blocks에서 AI가 추출·요약한 section 내용 |
| Supplement | 사용자가 REJECT section에 제공한 추가 사실. 12개 필수 section을 면제하지 않는다. |
| Effective Content | 특정 ValidationRun이 원본 추출과 supplement를 함께 검증하여 승인한 후속 서비스용 내용 |
| ValidationRun | 같은 plan을 전체 12개 section 대상으로 한 번 검증한 불변 실행 기록 |
| Section Validation | ValidationRun 안의 section별 PASS/REJECT 판정 |
| overallPassed | 정확히 12개 Section Validation이 모두 PASS일 때만 true인 계산·저장 값 |
| Confirmed Snapshot | 확정 시 최신 PASS ValidationRun을 복제해 만든 불변 후속 입력 원장 |
| Current Completion Rate | 기존 누락 field의 FILLED/WAIVED 여부를 세는 legacy 계산값 |

`completionRate=100`과 `overallPassed=true`는 다르다. 전자는 legacy UI 완성도이고, 후자만 D1 이후 확정 Gate다.

## 4. Versioned canonical rubric

### 4.1 공통 규칙

- rubric ID는 `business-plan-rubric-v2`다.
- code와 순서는 아래 12개로 고정한다.
- 모든 section은 필수다.
- section 결과 status는 `PASS` 또는 `REJECT`만 허용한다.
- `PASS`는 내용의 사업적 성공 가능성을 뜻하지 않는다. 후속 분석이 가능한 최소 정보가 원문 또는 supplement에 근거해 존재한다는 뜻이다.
- 수치가 필요한 section에서 문서가 수치를 제공하지 않으면, 범위·산식·가정·출처 중 rubric이 요구하는 최소 근거를 supplement로 받아야 한다.
- 사실이 사업에 적용되지 않는 경우 사용자가 section을 면제할 수 없다. 적용되지 않는다는 사실과 근거가 effectiveContent에 명시되고 rubric을 충족하면 PASS할 수 있다.
- `EVIDENCE_LIST` 자체도 필수다. 외부 URL이 없더라도 내부 조사, 견적, 인터뷰, 가정의 출처와 상태가 식별되어야 한다.

### 4.2 Section별 최소 PASS 기준

| 순서 | sectionCode | 표시명 | 최소 PASS 기준 |
|---:|---|---|---|
| 1 | BUSINESS_OVERVIEW | 사업 개요 | 해결하려는 문제, 제안 가치, 제공 대상, 사업 범위 또는 현재 단계가 식별된다. 단순 회사/아이디어 명칭만으로는 부족하다. |
| 2 | MARKET_SIZE | 시장 규모 | 대상 시장의 경계와 규모 판단 근거가 있다. 금액/고객 수/거래량 중 하나 이상의 수치 또는 검증 가능한 산정 방법·출처가 있어야 한다. |
| 3 | TARGET_CUSTOMER | 타겟 고객 | 구매 또는 사용 주체, 핵심 특성/상황, 해결할 pain 또는 need가 식별된다. “모든 사람” 같은 무구분 서술은 REJECT다. |
| 4 | COMPETITIVE_ANALYSIS | 경쟁 분석 | 직접/간접 대안 또는 현행 해결 방식이 식별되고, 최소 하나의 비교 기준과 차별점/열위가 설명된다. |
| 5 | PRODUCT_SERVICE | 제품 · 서비스 | 핵심 기능/제공물, 사용 또는 제공 방식, 고객이 얻는 결과가 식별된다. |
| 6 | BUSINESS_MODEL | 비즈니스 모델 | 지불 주체, 수익 발생 방식, 가격/과금 단위 또는 이를 결정할 명시적 가정, 핵심 유통/거래 구조가 있다. |
| 7 | COST_PROFITABILITY | 원가 · 수익성 | 주요 고정비/변동비 또는 원가 구성, 단위 경제성/마진 판단에 필요한 수치나 산식·가정이 있다. |
| 8 | SALES_GOALS_FINANCIAL_PROJECTIONS | 판매 목표 · 재무 추정 | 기간이 명시된 판매/매출 목표와 계산 근거 또는 핵심 가정이 있다. 목표 숫자만 있고 기간·산식이 없으면 REJECT다. |
| 9 | TECHNOLOGY_PRODUCTION | 기술 · 생산 | 구현/생산/운영 방식, 필요한 핵심 자원·역량, 현재 준비 수준 또는 외부 의존성이 식별된다. |
| 10 | LEGAL_PERMITS | 법률 · 인허가 | 적용 가능성이 있는 법률·인허가·개인정보·계약·지식재산 영역 또는 비적용 판단의 사실 근거가 있다. 법률 자문이나 법령 창작을 요구하지 않는다. |
| 11 | SCHEDULE_RISK | 일정 · 리스크 | 주요 milestone/기간과 최소 하나의 핵심 위험, 영향 또는 대응 방향이 있다. 일정이나 위험 중 하나만 있으면 REJECT다. |
| 12 | EVIDENCE_LIST | 근거 자료 목록 | 핵심 주장에 사용한 자료/견적/인터뷰/조사/내부 가정을 식별할 수 있고, 각 항목의 출처 유형 또는 미검증 상태가 구분된다. |

### 4.3 Rubric 변경 규칙

- code 삭제·이름 변경·순서 변경은 major 계약 변경이며 기존 snapshot을 재해석하지 않는다.
- PASS 기준 문구 변경은 새 `rubricVersion`을 발급한다.
- ValidationRun과 snapshot은 사용한 rubricVersion을 반드시 저장한다.
- 새 rubric 배포는 기존 confirmed snapshot을 자동 무효화하지 않는다.

## 5. 현재 상태와 목표 상태 매핑

| 현재 값/동작 | 목표 값/동작 | 전환 규칙 |
|---|---|---|
| `StructuredItemStatus.PRESENT` | `PASS` 후보 | AI task와 Spring 검증을 모두 통과해야 PASS |
| `MISSING/PARTIAL/INVALID/UNKNOWN` | `REJECT` | reason과 missingDetails 필수 |
| `MissingField.OPEN` | supplement 미입력 | section REJECT 유지 |
| `MissingField.FILLED` | active supplement 존재 | 재검증 전에는 PASS가 아님 |
| `MissingField.WAIVED` | legacy-only | 신규 변경 금지, 신규 확정 Gate 통과 불가 |
| `completionRate=100` | legacy 표시값 | confirmation 근거로 사용 금지 |
| `StructuredPlan.DRAFT` | `DRAFT` | 첫 ValidationRun 전 또는 실패 후 |
| `StructuredPlan.NEEDS_INPUT` | `NEEDS_INPUT` | 최신 성공 run에 REJECT 존재 |
| `StructuredPlan.CONFIRMED` | `CONFIRMED` + snapshot | snapshot 없는 legacy confirmed는 별도 표시 |
| 현재 “완료 가능” | `READY_TO_CONFIRM` | 최신 성공 run의 overallPassed=true |

## 6. StructuredPlan 상태 전이

목표 상태는 `DRAFT`, `NEEDS_INPUT`, `READY_TO_CONFIRM`, `CONFIRMED`, `SUPERSEDED`다.

```text
new DocumentVersion
  → DRAFT
  → latest successful run overallPassed=false → NEEDS_INPUT
  → supplement saved                      → NEEDS_INPUT
  → latest successful run overallPassed=true  → READY_TO_CONFIRM
  → user confirm + snapshot created           → CONFIRMED

newer DocumentVersion creates new plan
  → previous non-confirmed plan → SUPERSEDED
```

규칙:

- ValidationRun이 QUEUED/RUNNING인 동안 plan의 직전 안정 상태는 유지하되 `activeValidationRunId`로 쓰기를 제어한다.
- 첫 run이 FAILED이면 plan은 DRAFT에 남는다.
- 재검증이 FAILED이면 기존 성공 run의 결과를 삭제하지 않지만 확정은 금지한다. 확정은 반드시 “최신 run”이 SUCCEEDED/PASS여야 한다.
- CONFIRMED plan은 수정·supplement·재검증할 수 없다.
- 동일 plan에 새 DOCX 내용을 덮어쓰지 않는다.

## 7. ValidationRun 상태 전이

상태는 `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `CANCELED`다.

```text
QUEUED → RUNNING → SUCCEEDED
                 ├─ overallPassed=true
                 └─ overallPassed=false
QUEUED/RUNNING → FAILED
QUEUED         → CANCELED
```

- `SUCCEEDED`는 기술적으로 유효한 12개 결과가 저장됐다는 뜻이며 business completeness의 PASS/REJECT와 다르다.
- `FAILED`는 schema/provider/timeout/internal 오류로 유효 결과를 만들지 못했다는 뜻이다.
- 한 plan에는 QUEUED/RUNNING run이 동시에 하나만 존재해야 한다.
- run number는 plan별 1부터 단조 증가한다.
- run은 생성 후 입력 identity, 결과, provider provenance를 수정하지 않는다.

## 8. PASS/REJECT 및 overallPassed

### 8.1 Section 판정

PASS 조건:

1. 해당 rubric 최소 기준을 충족한다.
2. effectiveContent가 공백이 아니다.
3. effectiveContent의 모든 사실이 요청 typed blocks 또는 해당 section의 active supplement에 근거한다.
4. evidence block ID가 최소 하나 존재한다. 단, 내용이 supplement에만 근거하면 supplement reference가 필수이고 block evidence는 빈 배열일 수 있다.
5. reason은 판정 근거를 설명한다.

REJECT 조건:

- rubric의 필수 세부사항이 하나라도 부족하거나,
- 근거 없는 사실이 필요하거나,
- 입력이 상충해 단일 effectiveContent를 확정할 수 없거나,
- 비적용 주장의 사실 근거가 부족한 경우다.

REJECT에는 비어 있지 않은 `reason`과 하나 이상의 `missingDetails`가 필수다.

### 8.2 전체 판정

```text
overallPassed =
  itemResults.size == 12
  AND every canonical code appears exactly once in canonical order
  AND every item.status == PASS
  AND every PASS item effectiveContent is non-blank
  AND every evidence/supplement reference is valid
```

Spring은 FastAPI가 반환한 overallPassed를 신뢰만 하지 않고 위 식으로 재계산한다. 두 값이 다르면 run은 `FAILED/RESULT_SCHEMA_INVALID`로 끝난다.

## 9. Supplement와 effectiveContent

### 9.1 Supplement 규칙

- supplement는 REJECT section code에 귀속된다.
- 하나의 plan/section에는 하나의 active supplement가 있고 optimistic lock version을 가진다.
- 사용자는 원문을 삭제하거나 바꾸는 대신 부족한 사실만 제공한다.
- supplement 저장은 section을 PASS로 바꾸지 않는다.
- 저장 후 `supplementChanged=true`가 되며 새 전체 재검증이 필요하다.
- 12개 필수 section에 `WAIVED` 전이는 금지한다.
- legacy WAIVED row는 읽기 전용으로 남기며 수정·복제·자동 PASS 처리하지 않는다.

### 9.2 입력 우선순위

AI 검증 입력의 사실 출처 우선순위는 다음과 같다.

1. 원본 typed blocks
2. 해당 section의 최신 active supplement
3. 직전 ValidationRun의 extractedContent는 탐색 힌트로만 사용

직전 extractedContent나 모델 출력은 새로운 사실의 출처가 아니다. 원문과 supplement가 충돌하면 AI가 임의 선택하지 않고 REJECT하며 충돌을 missingDetails에 기록한다.

### 9.3 Effective content 생성

```text
typed blocks의 검증된 원문 사실
+ 해당 section active supplement의 검증된 사실
→ AI가 출처를 유지하며 통합
→ Spring이 schema/reference 검증
→ SectionValidation.effectiveContent
```

- 후속 서비스는 원문 추출과 supplement를 직접 합성하지 않는다.
- latest PASS run의 effectiveContent만 확정 후보가 된다.
- supplement 문장을 그대로 복사할 필요는 없으나 의미를 확대하거나 새 사실을 만들 수 없다.
- PASS run 이후 supplement가 변경되면 기존 effectiveContent는 이력으로 유지하되 확정 자격을 잃는다.

## 10. 새 문서 버전과 재검증

| 구분 | 새 DOCX | 같은 plan supplement 재검증 |
|---|---|---|
| DocumentVersion | 새 row | 유지 |
| StructuredPlan | 새 version/row | 유지 |
| Parser Artifact | 새 artifact | 유지 |
| ValidationRun | run #1 생성 | run number 증가 |
| section 기본 추출 | 새 문서에서 생성 | current sections를 힌트로 전달 |
| active supplement | 자동 승계 금지 | 최신 값을 사용 |
| 이전 결과 | 이력 유지 | 이력 유지 |

이전 plan의 supplement를 새 문서 plan으로 자동 복제하지 않는다. UI가 사용자가 검토한 뒤 명시적으로 재입력하도록 해야 한다.

## 11. Confirmation 조건

Spring confirm transaction은 다음을 모두 잠금 하에서 재검증해야 한다.

1. 요청 user가 project owner 또는 명시적 confirm 권한을 가지고 write policy를 통과한다.
2. plan이 해당 project에 속하고 soft-deleted/superseded/confirmed 상태가 아니다.
3. plan sourceDocumentVersion이 해당 active ProjectDocument의 최신 version이다.
4. 최신 ValidationRun이 존재하고 `SUCCEEDED`다.
5. 최신 ValidationRun `overallPassed=true`.
6. 최신 run 뒤 supplement 또는 section source 변경이 없다.
7. active QUEUED/RUNNING ValidationRun이 없다.
8. 요청 plan optimistic lock version과 현재 version이 같다.
9. project stage가 `STRUCTURING`이다.
10. 같은 plan에 confirmed snapshot이 아직 없다.

성공 transaction은 plan을 CONFIRMED로 바꾸고 snapshot 및 정확히 12개 snapshot section을 생성한 뒤 project를 LEGAL_REVIEW로 이동한다. 하나라도 실패하면 모두 rollback한다.

## 12. Immutable ConfirmedStructuredPlanSnapshot

- snapshot은 plan당 최대 하나다.
- plan, source DocumentVersion, parser artifact, ValidationRun, rubric/prompt/schema/provider/model identity를 고정한다.
- snapshot section은 정확히 12개이며 canonical order와 code가 unique다.
- 각 snapshot section은 `effectiveContent`, `extractedContent`, reason, evidence block IDs, supplement provenance를 복제한다.
- snapshot과 snapshot section은 update 및 soft delete를 허용하지 않는다.
- 원본 DOCX나 parser artifact의 retention은 해당 snapshot이 참조하는 동안 만료될 수 없다.
- 후속 결과는 snapshot ID를 source FK 또는 immutable source identity로 저장한다.
- 새 rubric이나 Provider 배포는 기존 snapshot을 다시 계산하지 않는다.

## 13. 후속 서비스 공통 소비 계약

모든 후속 서비스는 다음 공통 envelope를 Spring에서 받는다.

```json
{
  "snapshotId": 501,
  "projectId": 10,
  "structuredPlanId": 31,
  "documentVersionId": 44,
  "validationRunId": 82,
  "rubricVersion": "business-plan-rubric-v2",
  "sections": [
    {
      "sectionCode": "BUSINESS_OVERVIEW",
      "sequence": 1,
      "effectiveContent": "...",
      "evidenceBlockIds": ["b-0001"]
    }
  ]
}
```

공통 규칙:

- 후속 서비스는 mutable `structured_plan_sections` 또는 `missing_fields`를 직접 읽지 않는다.
- 후속 서비스는 supplement를 합성하거나 PASS를 재해석하지 않는다.
- 필수 소비 section이 snapshot에 없으면 source contract 오류로 실패한다.
- 모든 후속 Job/결과는 `snapshotId`를 기록한다.

### 13.1 서비스별 필수 section

`필수`는 해당 서비스 요청에 반드시 전달할 section이고, 그 외 section도 context로 전달할 수 있다.

| 서비스 | 필수 section |
|---|---|
| Legal | BUSINESS_OVERVIEW, TARGET_CUSTOMER, PRODUCT_SERVICE, BUSINESS_MODEL, TECHNOLOGY_PRODUCTION, LEGAL_PERMITS, SCHEDULE_RISK, EVIDENCE_LIST |
| Feasibility | 12개 전체 |
| Financial | BUSINESS_OVERVIEW, BUSINESS_MODEL, COST_PROFITABILITY, SALES_GOALS_FINANCIAL_PROJECTIONS, SCHEDULE_RISK, EVIDENCE_LIST |
| Persona | MARKET_SIZE, TARGET_CUSTOMER, COMPETITIVE_ANALYSIS, PRODUCT_SERVICE, BUSINESS_MODEL, SALES_GOALS_FINANCIAL_PROJECTIONS, EVIDENCE_LIST |
| Marketing | BUSINESS_OVERVIEW, TARGET_CUSTOMER, COMPETITIVE_ANALYSIS, PRODUCT_SERVICE, BUSINESS_MODEL, EVIDENCE_LIST |
| Report | 12개 전체와 각 후속 분석 source identity |

## 14. Waiver 폐지와 NOT_APPLICABLE

- 신규 rubric에서 12개 section은 모두 mandatory이며 `WAIVED`를 허용하지 않는다.
- `NOT_APPLICABLE`은 section status가 아니다.
- 사업상 비적용인 경우에도 section은 존재하고 effectiveContent에 비적용 대상, 판단 근거, 확인 필요사항을 기록해야 한다.
- 비적용 근거가 rubric을 충족하면 PASS, 부족하면 REJECT다.
- AI는 법률·규제 비적용을 확정적 법률 판단으로 표현할 수 없다.

## 15. 호환성 및 기존 데이터

### 15.1 외부 계약

- 기존 upload/list/version/job/latest-plan/confirm URL과 response envelope는 유지한다.
- 기존 fields는 제거하지 않고 목표 fields를 additive하게 노출한다.
- 기존 `completionRate`는 `legacyCompletionRate` 의미로 유지할 수 있으나 confirmation Gate에서는 사용하지 않는다.
- 기존 section status는 transitional display mapping에만 사용한다.

### 15.2 기존 confirmed plan

snapshot이 없는 기존 confirmed plan은 `LEGACY_CONFIRMED` 호환 상태로 조회한다.

- `FILLED` 또는 `WAIVED`가 있는 legacy confirmed plan을 자동 PASS 또는 snapshot으로 backfill하지 않는다.
- WAIVED를 effectiveContent로 자동 변환하지 않는다.
- 원본/parser artifact가 없으면 자동 재검증하지 않는다.
- 새 후속 분석을 시작하기 전 사용자가 “새 문서 분석” 또는 “재검증 가능 데이터에 대한 명시적 revalidation”을 수행해야 한다.
- 기존 완료된 후속 결과는 source 표시를 legacy로 유지하며 삭제하지 않는다.
- backfill은 식별자/legacy flag처럼 사실 손실이 없는 값에만 허용한다.

## 16. Runtime Mock 정책

- production/staging shared runtime은 실제 Provider 설정을 필수로 한다.
- Provider 미설정 시 `PROVIDER_NOT_CONFIGURED`로 run을 실패시킨다.
- 인증 실패, timeout, rate limit, malformed response에서 Mock으로 fallback하지 않는다.
- Mock은 명시적 `local`, `test`, `e2e` profile과 별도 opt-in flag가 동시에 있을 때만 허용한다.
- Mock 결과는 provider=`mock`, model, fixture/rule version, `mock=true`를 저장·응답하고 UI에 항상 표시한다.
- Mock run은 production project를 확정할 수 없다.
- Spring 직접 OpenAI adapter는 전환 기간 legacy로 남을 수 있으나 공식 DOCUMENT_PARSE executor에서 호출하지 않는다.

## 17. 확정된 설계와 남은 구현 선택

확정:

- Spring parser와 typed blocks 유지.
- FastAPI 전체 12개 검증.
- plan version과 validation run 분리.
- mandatory section waiver 폐지.
- latest PASS run만 confirm.
- immutable snapshot 단일 후속 원장.
- 원본과 parser artifact object storage 보관.

구현 단계에서 선택 가능하지만 계약을 바꿀 수 없는 항목:

- JSON artifact 압축 여부.
- AI task response 최대 크기는 schema `1.0`의 UTF-8 1 MiB로 고정하고, 변경 시 새 schemaVersion을 발급한다.
- Provider별 SDK/HTTP 구현.
- UI의 시각적 배치와 문구 세부 표현.
