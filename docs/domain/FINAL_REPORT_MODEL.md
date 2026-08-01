# Final Report Model Direction

- Status: DRAFT_CONTRACT
- Last Reviewed Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Scope: Persisted report snapshots and exports
- Supersedes: Browser-composed runtime report
- Implementation Status: NOT_STARTED

FinalReportVersion은 생성 시점의 구조화 snapshot과 provenance를 고정한다. RDB에는 snapshot과 version metadata를, Object Storage에는 export artifact를 Spring이 저장한다.

현재·이전 version을 조회하며 AI 권고와 사용자 결정을 분리한다. 상세 schema와 초기 PDF·Markdown·HTML 지원 범위는 Phase 2 이후 확정한다.
