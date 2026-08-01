# Stable Core Regression

- Status: TARGET_CANONICAL
- Last Reviewed Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Scope: Capabilities protected throughout re-foundation
- Supersedes: Stable-core portions of legacy coverage documents
- Implementation Status: PARTIAL

보호 범위는 auth, JWT/refresh, admin authorization, Project CRUD, Project owner scope, cross-owner 404, Object Storage integrity, Flyway fresh/upgrade/validate, 공통 오류, audit다.

각 legacy 삭제 Phase 전에 영향 테스트를 stable-core suite와 신규 slice로 분류한다. 대체 테스트가 생기기 전에는 기존 관련 테스트를 삭제하지 않는다. 현재 테스트 존재가 canonical suite 완성을 뜻하지 않는다.
