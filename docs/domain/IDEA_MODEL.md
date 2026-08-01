# Idea Model Direction

- Status: DRAFT_CONTRACT
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P2
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: IdeaVersion and IdeaSource boundary
- Supersedes: StructuredPlan input model
- Implementation Status: NOT_STARTED

목적은 불완전한 아이디어와 출처를 version 단위로 보존하는 것이다. IdeaSource는 TEXT, FILE, QUESTION_RESPONSE를 지원하며 문서는 중심 aggregate가 아니다. 초기 FILE allowlist는 DOCX와 일반 텍스트이고 PDF, XLSX, PPTX는 제외한다. 기존 DOCX parser는 FILE 처리 구현 후보일 뿐 Workflow 계약이 아니다.

Spring이 FILE을 수신·저장·검증·추출하고 AI Server에는 추출된 text만 bounded contract로 전달한다. P2.2에서 source별 metadata, normalization 결과, version 생성 규칙, allowlist 표현과 검증 field를 결정한다. 상류는 Project와 사용자 입력이며 하류는 LegalReviewRun과 ConceptGenerationRun이다.
