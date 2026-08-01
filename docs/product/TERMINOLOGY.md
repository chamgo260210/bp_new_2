# Canonical Terminology

- Status: TARGET_CANONICAL
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P2
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Product language and prohibited legacy claims
- Supersedes: Terminology embedded in legacy product documents
- Implementation Status: NOT_STARTED

Project는 하나의 아이디어 검증 과정 전체다. IdeaSource logical type은 TEXT 또는 FILE이며 질문 응답 UI는 TEXT source capture 방식이다. ConceptCandidate는 생성된 후보 identity이고 ConceptVersion은 그 후보의 immutable 내용이다. Persona Interview는 하나의 exact PersonaCard를 기준으로 독립 수행한다. Marketing A/B Comparison은 실제 사용자 실험이 아닌 exact asset versions의 상대 비교다. Final Report는 저장·version 조회·HTML view·PDF export 가능한 immutable snapshot history다. TaskRun은 Spring이 관리하는 업무 요청, TaskAttempt는 개별 실행, TaskResult는 수신·검증·채택 evidence다.

`Run`은 AI/업무 실행, `Attempt`는 retry 가능한 개별 시도, `Result`는 실행 응답/evidence, `Version`은 immutable 업무 내용, `Decision`/`Selection`은 사용자 선택, `Stage`는 현재 Workflow 표시, `Capability`는 실제 실행 가능 여부, `STALE`은 exact upstream 기준 유효성 상실을 뜻한다.

Target 문서에서 StructuredPlan, 12개 고정 section, FILLED/WAIVED, fixed cluster persona, market response prediction, purchase probability, runtime report를 신규 기능 명칭으로 사용하지 않는다.
