# Non-Functional Requirements

- Status: TARGET_CANONICAL
- Last Reviewed Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Scope: Security, integrity, reliability and operability requirements
- Supersedes: Legacy quality, security and operations documents
- Implementation Status: NOT_STARTED

- Frontend는 Spring WAS만 호출한다.
- Spring은 RDB와 Object Storage의 유일한 관리 주체다.
- AI Server는 Spring과만 통신하며 RDB, Object Storage, 업무 산출물 로컬 영속 저장에 접근하지 않는다.
- 모든 Project resource는 owner scope를 적용하고 cross-owner resource 존재를 누출하지 않아야 한다.
- 인증 token, 비밀값, 외부 API 자격증명은 저장소와 문서에 실제 값으로 기록하지 않는다.
- TaskRun 상태, 재시도, 결과 검증과 저장은 Spring이 source of truth로 관리한다.
- 입력·AI 결과·사용자 결정·외부 근거의 provenance를 보존한다.
- export artifact는 무결성, content type, 크기, 소유권 검증을 통과해야 한다.
- fresh/upgrade/validate Flyway 경로와 stable-core 회귀를 CI에서 보호해야 한다.
- 장애 시 민감한 provider 응답이나 내부 예외를 사용자에게 노출하지 않는다.
