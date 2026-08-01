# Phase D2 — 문서 원본 Object Storage 전환 및 Parser Artifact 구현

## 1. 기준

- 기준 branch/commit: `main` / `6d6a8c058151159246726ceee1799084a1012971`
- 작업 branch: `feature/document-parser-artifact-d2`
- migration: `V26__add_document_parser_artifact.sql`
- D1의 12개 section, 외부 API URL, AnalysisJob 원장, 기존 Mock/OpenAI adapter는 변경하지 않았다.
- FastAPI DOCUMENT_PARSE와 실제 Provider는 구현하지 않았다.

## 2. 변경 파일

### 운영 코드

- `document/application`
  - `DocumentCommandService`
  - `DocumentUploadTransactionService`
- `document/application/processing`
  - `DocumentJobContext`, `DocumentJobContextService`
  - `DocumentJobProgressService`, `DocumentParseJobExecutor`
  - `ParserArtifactSerializer`, `ParserArtifactPayload`
  - `ParserArtifactObjectService`, `StoredParserArtifact`
- `document/entity/DocumentVersion`
- `document/dto/response/DocumentVersionResponse`
- `document/parsing`
  - `ParsedDocument`, `ParsedDocumentBlock`
  - `docx/DocxDocumentParser`
- `file/entity/StoredFile`
- `file/object/ObjectKeyGenerator`
- `db/migration/V26__add_document_parser_artifact.sql`

### 테스트

- migration: `Phase3MigrationTests`
- upload/API: `DocumentApiIntegrationTests`, `DocumentCommandServiceTests`, `DocumentUploadTransactionServiceTests`
- parser: `DocxDocumentParserTests`, `StructuredPlanMapperTests`
- artifact: `ParserArtifactSerializerTests`, `ParserArtifactObjectServiceTests`
- Job regression: `DocumentProcessingIntegrationTests`
- object storage: `ObjectKeyGeneratorTests`, `S3ObjectStorageMinioTests`

## 3. 최종 원본 Object Storage 흐름

```text
POST /api/v1/projects/{projectId}/documents
→ 기존 BusinessPlanDocxPolicy
→ 기존 Idempotency-Key/fingerprint 조회
→ project row lock
→ ProjectDocument 및 DocumentVersion ID 확보
→ 최종 source object key 생성
→ ObjectStoragePort.store
→ returned size/content-type/checksum + object metadata size/content-type 검증
→ StoredFile(storageType=ObjectStoragePort.storageType)
→ DocumentVersion + DOCUMENT_PARSE AnalysisJob commit
```

compose 운영 경로는 `OBJECT_STORAGE_PROVIDER=s3`이므로 MinIO private bucket과 `StorageType.S3_COMPATIBLE`을 사용한다. local/test profile의 local ObjectStorage adapter도 같은 object-key 계약을 사용한다.

사용자 파일명은 `StoredFile.originalFilename`에만 보존하며 object key에는 포함하지 않는다.

## 4. Object key

원본:

```text
projects/{projectId}/documents/{documentId}/versions/{documentVersionId}/source/{uuid}.docx
```

parser temporary:

```text
projects/{projectId}/documents/{documentId}/versions/{documentVersionId}/parser/tmp/{uuid}.json
```

parser final:

```text
projects/{projectId}/documents/{documentId}/versions/{documentVersionId}/parser/{parserVersion}/{checksum}.json
```

parserVersion은 object-key safe character 외 문자를 `_`로 바꾼다. checksum은 64자 lowercase SHA-256만 허용한다.

## 5. Transaction과 보상

원본 upload는 DB ID가 object key에 필요하므로 `DocumentUploadTransactionService.create` 안에서 수행한다.

- object upload 실패: transaction rollback, DocumentVersion/StoredFile/Job commit 금지
- object upload 뒤 DB rollback: transaction synchronization이 object를 best-effort 삭제
- store 호출 자체가 실패한 경우에도 알려진 final key를 best-effort 삭제
- cleanup 실패 또는 process crash: 기존 reconciliation 서비스가 DB에 없는 key를 찾는 운영 fallback
- 현재 `StorageInventory`는 local filesystem inventory 구현이다. S3 listing/quarantine inventory adapter는 후속 운영 강화 항목이다.

parser artifact는 object upload 후 `DocumentJobProgressService` transaction에서 StoredFile과 DocumentVersion FK를 함께 저장한다. 이 transaction이 실패하면 executor가 새 final artifact를 보상 삭제한다. temporary object는 성공/실패와 무관하게 정리한다.

## 6. 기존 LOCAL 호환

기존 `StoredFile.storageType=LOCAL`과 `FileStorage` 데이터는 backfill하거나 이동하지 않는다.

Document parser의 source open 규칙:

1. `S3_COMPATIBLE`: ObjectStoragePort
2. `LOCAL`이고 동일 key가 local ObjectStorage에 존재: ObjectStoragePort
3. 그 외 기존 LOCAL row: 기존 FileStorage

모든 경로에서 parser 실행 전에 실제 byte 수와 SHA-256을 StoredFile metadata와 비교한다.

## 7. Parser 변경

기존 `DocxDocumentParser`와 Apache POI XWPF 본문 순회를 유지한다.

- parser name: `apache-poi-xwpf`
- parser version: `spring-docx-blocks-v2`
- body element 순서 보존
- paragraph, heading, list item, table cell 보존
- 공백-only block 제거
- text line ending을 LF로 정규화
- sequence는 배열 index+1
- block ID는 `b-000001` 형식
- table coordinate는 table/row/column index 전체를 보존
- parser limits 유지
- plainText join도 LF로 고정

## 8. 지원 및 미지원 범위

| 대상 | 정책 |
|---|---|
| 본문 paragraph/heading/list/table | 지원 |
| header/footer | 미추출, 존재 시 `HEADER_FOOTER_NOT_EXTRACTED` |
| footnote/endnote | 미추출, package entry 존재 시 `FOOTNOTES_ENDNOTES_NOT_EXTRACTED` |
| textbox | 완전 지원하지 않음, document XML에서 감지 시 `TEXTBOXES_NOT_EXTRACTED` |
| embedded/OLE object | 미추출 warning 또는 위험 형식 거부 |
| external link 내용 | 따라가지 않음 |
| image | 미추출 warning |
| image-only DOCX | `DOCUMENT_EMPTY` parser error |
| OCR | D2에서 미구현 |
| 암호화/OLE2/매크로/손상 DOCX | 명확한 parser error |

warnings는 중복 제거·정렬 후 최대 20개다. 초과하면 마지막 값이 `WARNINGS_TRUNCATED`다.

## 9. Parser artifact schema

```json
{
  "schemaVersion": "document-blocks-v1",
  "parser": {
    "name": "apache-poi-xwpf",
    "version": "spring-docx-blocks-v2"
  },
  "document": {
    "documentVersionId": "123",
    "sourceChecksumSha256": "...",
    "languageHint": "ko"
  },
  "summary": {
    "blockCount": 2,
    "totalCharacters": 42,
    "paragraphCount": 1,
    "headingCount": 0,
    "listItemCount": 0,
    "tableCellCount": 1
  },
  "warnings": [],
  "blocks": [
    {
      "blockId": "b-000001",
      "sequence": 1,
      "type": "PARAGRAPH",
      "text": "...",
      "headingLevel": null,
      "table": null,
      "location": {
        "path": "body/paragraph[1]"
      }
    }
  ]
}
```

TABLE_CELL의 `table`은 `tableIndex`, `rowIndex`, `columnIndex`를 가진다.

## 10. Canonicalization과 checksum

artifact 전용 규칙:

- UTF-8
- 코드의 `LinkedHashMap` 삽입 순서로 key order 고정
- compact JSON, pretty print와 후행 newline 없음
- text/문서 결합 line ending은 LF
- volatile `parsedAt`, object URL, temporary key를 artifact에서 제외
- warnings 정렬
- 최종 serialized bytes의 SHA-256을 checksum으로 사용
- block sequence/ID와 table coordinate를 serialization 전에 검증

이 구현은 RFC 8785 전체 준수를 주장하지 않는다. D1 INLINE request canonicalization은 별도 FastAPI task 계약이며 D2 artifact serializer와 동일 구현으로 간주하지 않는다.

동일 documentVersion identity, 동일 source checksum, 동일 parser version과 동일 parsed blocks이면 artifact bytes와 checksum이 같다. schema에 documentVersionId가 포함되므로 서로 다른 DocumentVersion의 checksum 동일성을 보장하지 않는다.

## 11. Parser artifact 저장 순서

```text
source open
→ source size/SHA-256 검증
→ DocxDocumentParser
→ canonical JSON bytes
→ SHA-256
→ temporary object upload 및 metadata 검증
→ checksum final key upload 및 metadata 검증
→ temporary delete
→ StoredFile AVAILABLE
→ DocumentVersion parser artifact FK/metadata
→ parserArtifactStatus SUCCEEDED
→ AnalysisJob step EVALUATING
```

final key가 이미 존재하는 retry는 object bytes를 다시 읽어 size/checksum이 동일한 경우에만 재사용한다.

## 12. DB와 API

V26은 `document_versions`에 다음 nullable additive 필드를 추가한다.

- `parser_artifact_stored_file_id`
- `parser_artifact_status`
- `parser_block_count`
- `parser_artifact_checksum_sha256`
- `parser_artifact_schema_version`
- `parsed_at`

기존 `parser_version`을 재사용한다.

제약:

- StoredFile FK
- parser artifact StoredFile unique
- checksum lowercase SHA-256 check
- artifact 존재 시 block count 양수
- artifact FK/checksum/schema/parsedAt 동시 완결성
- 기존 row와 LOCAL 데이터는 null 상태로 유지

`GET /api/v1/documents/{documentId}/versions/{versionId}`에는 다음 nullable additive field만 추가했다.

- `parserArtifactStatus`
- `parserVersion`
- `parserArtifactSchemaVersion`
- `parserBlockCount`
- `parsedAt`

object key, presigned URL, checksum은 노출하지 않는다.

## 13. AnalysisJob 단계와 남은 Mock

초기 실행:

```text
QUEUED
→ claim
→ PARSING
→ parser artifact DB 연결
→ EVALUATING
→ 기존 AiServiceClient
→ PERSISTING
→ 기존 StructuredPlan 저장
```

D2는 기존 Mock 및 Spring direct OpenAI adapter를 삭제하지 않았다. 다만 source 검증, parser, canonical serialization, temporary/final artifact 저장과 DB 연결 중 하나라도 실패하면 `AiServiceClient.structureDocument`에 도달하지 않는다.

## 14. 테스트

추가·강화한 검증:

- source object key와 사용자 filename 분리
- source size/checksum과 rollback delete
- upload idempotency 회귀
- LOCAL legacy/open 및 local ObjectStorage 경계
- block ID/sequence/table coordinate
- parser version, empty/corrupt/encrypted/image/header 정책
- artifact exact JSON과 결정성/checksum
- temporary/final upload 실패 cleanup
- parser artifact StoredFile/DocumentVersion 연결
- parser 실패 시 기존 AI 경로 차단
- H2 migration V26/FK/column
- MinIO source/artifact key upload/read

### 14.1 최종 diff 실행 결과

| 구분 | 실행 명령 | 결과 | 종료 코드 |
|---|---|---|---:|
| 전체 Backend 회귀 | `./gradlew clean test --console=plain` | 최종 D2 diff 기준 `BUILD SUCCESSFUL in 2m 21s` | 0 |
| 실제 MinIO 통합 | `./gradlew minioTest --console=plain` | 실제 MinIO를 대상으로 source/parser artifact 저장·조회 검증 `BUILD SUCCESSFUL` | 0 |

MinIO 검증 종료 후 사용한 서버를 종료했으며 59000/59001 포트에 남은 LISTENING socket이 없음을 확인했다.

### 14.2 실행 완료와 작성만 완료된 검증의 구분

실제로 실행해 통과한 검증:

- 최종 D2 diff 전체 Backend `clean test`
- 실제 MinIO 대상 `minioTest`
- H2 기반 V26 migration/FK/column 검증을 포함한 Backend test

테스트 코드 또는 검증 항목은 작성했지만 현재 환경에서 실제 PostgreSQL로 실행하지 못한 검증:

- PostgreSQL fresh V1→V26 migration
- 기존 LOCAL StoredFile/DocumentVersion을 포함한 V25→V26 upgrade
- PostgreSQL 고유 FK, unique, check constraint 거부 시나리오
- PostgreSQL 기반 Spring context 및 `ddl-auto=validate`

### 14.3 PostgreSQL 검증 상태

실제 PostgreSQL V26 migration은 현재 환경에서 미검증이다. Docker CLI가 없고 완전한 PostgreSQL server runtime도 없어 실행하지 못했으며, 이는 코드 실패가 아니라 환경 검증 공백이다. CI 또는 정상적인 PostgreSQL 환경에서 fresh V1→V26, V25→V26 upgrade, 기존 LOCAL row 보존 및 V26 제약 검증을 완료해야 한다.

## 15. D3 인계 지점

- `DocumentVersion.parserArtifactStoredFile`이 SOURCE_DOCUMENT_BLOCKS 원장이다.
- D3 Spring AiTaskClient request builder는 이 StoredFile을 공통 `artifacts[0] role=SOURCE`로 매핑한다.
- `input.source_artifact.artifact_id`는 task 범위 opaque ID로 매핑한다.
- D3/D4 executor는 parser artifact가 정상인 재검증에서 DOCX를 다시 parse하지 않는다.
- 기존 `AiServiceClient` 호출 지점은 `DocumentParseJobExecutor`의 artifact 저장 다음에 있어 FastAPI task 호출로 교체 가능하다.

## 16. 알려진 제한

- S3 orphan listing/quarantine inventory adapter는 아직 없다. transaction rollback delete와 local reconciliation만 구현됐다.
- 실제 PostgreSQL V26 fresh/upgrade 및 제약 검증이 대기 중이다.
- parser artifact는 JSON 압축을 사용하지 않는다.
- header/footer/footnote/textbox/image/OCR 내용은 구조화 입력에 포함되지 않는다.
- parser artifact가 만들어진 뒤 기존 Mock/OpenAI 단계가 실패하면 artifact는 재시도를 위해 유지된다.
- ValidationRun, snapshot, supplement 재검증은 D4/D5 범위라 생성하지 않았다.
