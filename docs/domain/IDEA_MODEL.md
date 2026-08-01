# Idea Model Direction

- Status: DRAFT_CONTRACT
- Last Reviewed Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Scope: IdeaVersion and IdeaSource boundary
- Supersedes: StructuredPlan input model
- Implementation Status: NOT_STARTED

목적은 불완전한 아이디어와 출처를 version 단위로 보존하는 것이다. IdeaSource는 TEXT, FILE, QUESTION_RESPONSE를 지원 가능한 유형으로 두며 문서는 중심 aggregate가 아니다. 기존 DOCX parser는 FILE 처리 구현 후보일 뿐 Workflow 계약이 아니다.

Phase 2에서 source별 metadata, normalization 결과, version 생성 규칙, 초기 파일 형식과 검증을 결정한다. 상류는 Project와 사용자 입력이며 하류는 LegalReviewRun과 ConceptGenerationRun이다.
