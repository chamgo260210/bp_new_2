# Deployment Architecture

- Status: TARGET_CANONICAL
- Last Reviewed Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Scope: Target deployable boundaries and operational dependencies
- Supersedes: Legacy local and Compose architecture documents
- Implementation Status: NOT_STARTED

배포 단위는 Frontend, Spring WAS, AI Server, RDB, Object Storage와 필요한 외부 AI/법령 연결이다. 브라우저는 Spring public endpoint만 사용하고 AI Server는 내부 네트워크에서 Spring 요청만 허용한다.

health/readiness는 RDB, Storage, AI Server, 법령 API 상태를 구분해야 하며 Admin은 연결 상태를 조회할 수 있어야 한다. 현재 Docker Compose는 baseline일 뿐 Target 배포 완료를 의미하지 않는다. topology, scaling, secret manager와 observability 제품은 구현 Phase에서 결정한다.
