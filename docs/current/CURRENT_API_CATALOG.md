# Current API catalog

- Status: Current
- Verified HEAD: pending final commit
- OpenAPI: `0.11.0-g1r-working-tree`

모든 path는 `/api/v1` 아래에 있습니다.

| Methods | Path family | Frontend consumer |
|---|---|---|
| POST | `/auth/signup`, `/auth/login`, `/auth/refresh`, `/auth/logout` | auth |
| GET | `/users/me` | auth shell |
| GET, POST | `/projects` | project list/create |
| GET, PATCH | `/projects/{projectId}` | layout/dashboard |
| GET, multipart POST | `/projects/{projectId}/documents` | document |
| GET | `/documents/{documentId}/versions/{versionId}` | document |
| GET | `/jobs/{jobId}` | polling |
| GET | `/projects/{projectId}/jobs/latest?jobType=` | recovery/report |
| GET | `/projects/{projectId}/structured-plans/latest` | structure/report |
| PATCH | `.../structured-plans/{planId}/missing-fields/{fieldId}` | completion |
| POST | `.../structured-plans/{planId}/confirm` | confirmation |
| POST, GET latest | `/projects/{projectId}/legal-reviews` | legal/report |
| POST, GET latest | `/projects/{projectId}/feasibility-assessments` | feasibility/report |
| GET | `/personas/catalog` | personas |
| POST, GET latest | `/projects/{projectId}/persona-recommendations` | personas/report |
| GET | `/projects/{projectId}/financial-analysis/source` | financial source |
| GET, POST | `/projects/{projectId}/financial-analyses` | financial list/create |
| GET, PATCH, DELETE | `/projects/{projectId}/financial-analyses/{analysisId}` | financial detail/update/soft-delete |
| POST | `/projects/{projectId}/financial-analyses/{analysisId}/run` | deterministic calculation |
| POST | `/projects/{projectId}/financial-analyses/{analysisId}/duplicate` | duplicate draft |
| CRUD + run | `/projects/{projectId}/panel-interviews` | expected interview MVP |
| CRUD + run | `/projects/{projectId}/market-responses` | expected market response MVP |
| CRUD + versions | `/projects/{projectId}/marketing-contents` | marketing workspace MVP |

오류는 공통 envelope를 사용합니다. 재무 목록은 월별 결과 JSON을 포함하지 않고, 통합 보고서는 최신 완료 요약을 찾은 뒤 상세 API를 별도로 조회합니다. `/reports` 저장 API는 존재하지 않습니다.
