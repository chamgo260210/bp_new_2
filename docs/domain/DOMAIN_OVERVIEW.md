# Target Domain Overview

- Status: DRAFT_CONTRACT
- Last Reviewed Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Scope: Aggregate directions and relationships
- Supersedes: Legacy backend domain and ERD documents
- Implementation Status: NOT_STARTED

Target aggregate 방향은 `Project` 아래 `IdeaVersion/IdeaSource`, `LegalReviewRun`, `ConceptGenerationRun/ConceptCandidate/ConceptVersion`, `ConceptAssessmentRun`, `DetailedAnalysisRun`, `ConceptSelection`, `PersonaStudy/PersonaCard/PersonaInterview`, `MarketingWorkspace/MarketingGenerationRun/MarketingAsset/MarketingComparisonRun`, `FinalReport/FinalReportVersion`을 둔다.

불변조건은 Project owner scope, versioned input/result, AI 권고와 사용자 결정의 분리, provenance 보존이다. 상세 field, cardinality, table, cascade와 상태는 Phase 2에서 결정한다.
