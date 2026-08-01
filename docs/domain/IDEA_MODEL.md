# Idea Logical Model

- Status: DRAFT_CONTRACT
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P2
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: IdeaSource, extraction and immutable IdeaVersion logical schema
- Supersedes: StructuredPlan input model
- Implementation Status: NOT_STARTED

## Aggregate ownership

`Project` owns IdeaSource and IdeaVersion history. 둘 다 Project owner scope 대상이다. IdeaSource는 입력 evidence, IdeaVersion은 정규화·확정된 업무 내용이며 문서가 aggregate root가 되지 않는다.

## IdeaSource

| Concern | Logical contract |
|---|---|
| Identifier | 안정적인 IdeaSource identifier |
| Owner | Project composition; 정확히 한 Project |
| Source type | `TEXT` 또는 `FILE`. 질문 응답 UI는 응답 묶음을 `TEXT` source로 capture하며 별도 domain source type을 만들지 않음 |
| FILE allowlist | 초기 `DOCX`, plain text. PDF/XLSX/PPTX 제외; allowlist는 확장 가능 |
| Semantics | 원본 사용자 입력, capture channel, 표시 이름, FILE metadata/StoredFile reference 방향 |
| Mutability | 원본 content와 FILE reference는 immutable; validation/extraction/archive lifecycle만 mutable |
| Version | source 수정은 새 IdeaSource 생성. parser 변경·재실행은 새 IdeaSourceExtraction version 생성 |
| Time | 접수/생성 시각, lifecycle 마지막 갱신 시각 |
| Concurrency | lifecycle/current-extraction 갱신에 optimistic concurrency 필요 |
| Lifecycle | `RECEIVED`, `VALIDATED`, `EXTRACTED`, `REJECTED`, `QUARANTINED`, `ARCHIVED` |
| Provenance | USER 입력 actor, capture channel, content checksum; AI proposal로 분류하지 않음 |
| Delete | archive/reference 해제 우선. FILE bytes 삭제는 Spring retention과 RDB reference 확인 후 수행 |
| Uniqueness | source identifier 전역 유일; FILE Storage reference는 owner·artifact lifecycle 규칙과 일치 |

FILE metadata와 bytes는 Spring이 소유한다. AI Server에는 filename, object key, Storage URL, presigned URL 또는 FILE bytes를 전달하지 않고 검증된 extracted content만 전달한다.

## IdeaSourceExtraction

IdeaSourceExtraction은 source 원본과 AI/domain 입력 사이의 immutable 변환 결과다.

| Concern | Logical contract |
|---|---|
| Identifier/owner | extraction identifier; 정확히 한 IdeaSource 소유, 동일 Project scope 상속 |
| Cardinality | IdeaSource `1:N` extraction history; current successful extraction 최대 하나 |
| Input reference | exact IdeaSource identifier와 원본 checksum |
| Semantics | extracted content, extractor/parser contract version, extraction warnings, content checksum, language/encoding 방향 |
| Mutability/version | immutable, source-local extraction version number 유일 |
| Time | 시작/완료 또는 생성 시각; 실패 evidence 시각 포함 |
| Concurrency | content update 없음; current extraction pointer 변경만 optimistic concurrency |
| Lifecycle | `SUCCEEDED`, `FAILED`; current validity는 `CURRENT` 또는 `STALE` |
| Provenance | parser/extractor identity와 version; AI 생성 content가 아님 |
| Delete | source와 함께 retention 관리; IdeaVersion이 참조 중이면 삭제 금지 방향 |

TEXT source도 canonical content/checksum을 고정하기 위해 direct extraction record를 가질 수 있다. FILE source는 Spring parser가 DOCX/plain text를 추출한다. 상세 extraction block schema와 size limit은 후속 contract에서 정한다.

## IdeaVersion

IdeaVersion은 Project별 immutable idea snapshot이다.

| Concern | Logical contract |
|---|---|
| Identifier/owner | IdeaVersion identifier; Project composition과 owner scope |
| Cardinality | Project `1:N`; version number는 Project 안에서 유일하고 단조 증가 |
| Required semantics | 원본 사용자 입력 표현, normalized description, facts, assumptions, constraints, open questions/research needs |
| Readiness | `UNDER_SPECIFIED`, `APPROPRIATE`, `OVER_SPECIFIED` |
| Source references | 하나 이상 exact IdeaSource/IdeaSourceExtraction reference. source와 version은 논리 N:M |
| Created by | `USER` 또는 `AI_ASSISTED`; actor와 생성 방식을 보존 |
| AI/user boundary | AI_ASSISTED normalization은 proposal provenance를 가지며 사용자가 확정한 content/시각을 별도 기록. AI가 사용자 확인을 대신하지 않음 |
| Mutability | immutable. 수정·correction은 새 version |
| Lifecycle/validity | `DRAFT`, `CONFIRMED`, `SUPERSEDED`; `CURRENT` 또는 `STALE` validity |
| Time | 생성 시각, 사용자 확정 시각 방향 |
| Concurrency | immutable content에는 불필요; Project current IdeaVersion pointer 변경에는 필수 |
| Input snapshot | source/extraction identifiers, checksums와 normalization contract version |
| Delete | history/provenance 보존; archive 가능, downstream 참조 중 hard delete 금지 |
| Uniqueness | Project + version number; current confirmed IdeaVersion 최대 하나 |

## Current reference and stale rules

- Project current IdeaVersion은 같은 Project의 `CONFIRMED` version만 가리킨다.
- 새 current IdeaVersion 설정은 이전 IdeaVersion 자체를 삭제하지 않는다.
- 이전 IdeaVersion을 exact input으로 사용한 LegalReviewRun, ConceptGenerationRun과 모든 transitive downstream은 `STALE`이다.
- Legal correction은 기존 IdeaVersion을 직접 수정하지 않고 correction provenance를 포함한 새 IdeaVersion과 새 legal chain을 만든다.
