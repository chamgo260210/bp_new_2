# Re-foundation Acceptance Criteria

- Status: TARGET_CANONICAL
- Last Reviewed Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Scope: Cross-phase acceptance conditions
- Supersedes: Legacy phase readiness documents
- Implementation Status: NOT_STARTED

각 Phase는 지정 범위만 구현하고 Target/Current 상태를 구분한다. 인증·owner scope·Spring의 RDB/Object Storage 소유권은 회귀하지 않아야 하며 AI Server의 RDB/Storage/로컬 업무 산출물 저장은 없어야 한다.

기존 migration은 불변이며 변경은 신규 migration으로 수행한다. legacy compatibility endpoint/redirect를 만들지 않는다. 코드·테스트·canonical 문서가 함께 일치하고 실제 검증 결과를 보고해야 완료다.
