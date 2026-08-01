# Final Report Model Direction

- Status: DRAFT_CONTRACT
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P2
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Persisted report snapshots and exports
- Supersedes: Browser-composed runtime report
- Implementation Status: NOT_STARTED

FinalReportVersion은 생성 시점의 구조화 snapshot과 provenance를 고정한다. RDB에는 snapshot과 version metadata를 저장하고 초기 view는 이 snapshot에 기반한 HTML로 제공한다. Object Storage에는 Spring이 생성·검증·저장한 PDF export를 둔다.

현재·이전 version을 조회하며 AI 권고와 사용자 결정을 분리한다. Markdown export와 browser runtime 조립 결과는 초기 Final Report에서 제외한다. P2.2에서 structured snapshot, HTML view와 PDF artifact의 상세 logical schema와 provenance를 결정한다.
