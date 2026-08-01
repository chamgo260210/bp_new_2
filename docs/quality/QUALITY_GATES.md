# Quality Gates

- Status: TARGET_CANONICAL
- Last Reviewed Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Scope: Required repository and delivery gates
- Supersedes: Legacy quality gate documents
- Implementation Status: PARTIAL

필수 gate는 backend unit/integration, PostgreSQL Flyway, Object Storage integrity, frontend lint/test/build, AI contract/pytest, public contract 검증, Docker integration, secret/security/dependency scan이다.

변경 Phase는 대응 문서·테스트를 함께 갱신하고 실행하지 못한 검사를 통과로 기록하지 않는다. 현재 CI에는 FastAPI pytest 전용 job이 없어 후속 보강이 필요하다.
