# Implementation Phases

- Status: TARGET_CANONICAL
- Last Reviewed Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Scope: Ordered re-foundation delivery sequence
- Supersedes: Legacy phase readiness and changelog documents
- Implementation Status: NOT_STARTED

1. Phase 1: canonical product/architecture documentation reset.
2. Phase 2: domain, workflow state, provenance, API/AI contract와 초기 file/report 범위 상세화.
3. Stable platform guard: regression suite 분리, /api/v2와 TaskRun 기반 마련, AI/data/storage 경계 강제.
4. Idea intake/normalization과 Korean Legal Review vertical slices.
5. Concept generation, quick assessment, shortlist, detailed analysis, selection slices.
6. Three-Layer Persona Card와 독립 interview slices.
7. Marketing Workspace와 Persona 기반 시안 상대 비교.
8. persisted Final Report/version/export.
9. Target Admin/Service Policy/Landing copy 전환.
10. legacy route/API/code/test 제거, 신규 Flyway drop migration, artifact 정리, 최종 contract/quality gate 전환.

각 Phase는 앞 단계의 contract와 대체 테스트를 선행 조건으로 하며 다음 Phase 기능을 미리 구현하지 않는다.
