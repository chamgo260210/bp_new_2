# Current to Target Mapping

- Status: TARGET_CANONICAL
- Last Reviewed Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Scope: Reuse, replacement and deletion boundaries
- Supersedes: Phase 0 audit output and legacy code audits
- Implementation Status: NOT_STARTED

## Stable platform

인증/JWT/refresh, admin authorization, Project owner scope, Spring JPA/Flyway, Spring Object Storage port, audit, 공통 오류는 유지한다. 문서 upload/version/parser, job claim/retry/recovery, AI task envelope와 artifact integrity는 신규 경계에 맞춰 재사용한다.

## Replacement

StructuredPlan/고정 12 section/FILLED·WAIVED 중심을 IdeaVersion/IdeaSource와 신규 domain run으로 대체한다. AnalysisJob을 신규 중심으로 확장하지 않고 TaskRun/TaskAttempt/TaskResult/TaskArtifact 방향을 채택한다. runtime report를 persisted FinalReportVersion으로 대체한다.

## Deletion

legal/feasibility/financial legacy slices, fixed-cluster Persona, persona recommendation, panel interview, market response, legacy marketing workflow와 compatibility route/API를 제거한다. 신규 기능이 같은 이름의 legacy 계약을 암묵적으로 승계하지 않는다.
