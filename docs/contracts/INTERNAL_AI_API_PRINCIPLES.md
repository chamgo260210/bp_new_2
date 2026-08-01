# Internal AI API Principles

- Status: DRAFT_CONTRACT
- Last Reviewed Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Scope: Spring to AI Server task communication
- Supersedes: Legacy direct-provider and presigned artifact contracts
- Implementation Status: NOT_STARTED

Spring은 TaskRun identity, task type/version, 입력, 제한과 correlation을 전달한다. AI Server는 실행 결과, provenance, 경고와 정규화된 오류를 반환한다. Spring이 검증·저장하고 상태를 확정한다.

Storage URL/credential, RDB identity 조회, provider 비밀값 역전달은 금지한다. 상세 payload와 대용량 전송 방식은 Phase 2 또는 플랫폼 Phase에서 결정한다.
