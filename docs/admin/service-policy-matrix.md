# 서비스 정책 적용 Matrix

이 문서는 현재 구현된 API와 화면에 적용된 운영 정책만 정리한다. `MAINTENANCE_MODE`는 인증된 사용자의 상태 변경을 중단하는 상위 정책이며, `DOCUMENT_PROCESSING_ENABLED`는 문서 업로드와 문서 기반 신규 분석 시작을 별도로 통제한다.

V16 Migration은 Legacy camelCase Key를 대문자 canonical Key로 통합한다. 두 형식이
동시에 존재하면 canonical 값을 우선하고 Legacy 행을 제거하므로 런타임에서는
canonical Key만 조회한다.

| Endpoint 또는 기능 | Method | 로그인 | Maintenance OFF | Maintenance ON USER | Maintenance ON ADMIN | Document Processing OFF |
| --- | --- | --- | --- | --- | --- | --- |
| 공개 서비스 정책 조회 | `GET /api/v1/service-policy` | 불필요 | 허용 | 허용 | 허용 | Boolean 상태만 조회 |
| 회원가입 | `POST /api/v1/auth/signup` | 불필요 | `REGISTRATION_ENABLED`에 따름 | `REGISTRATION_ENABLED`에 따름 | 동일 | 영향 없음 |
| 로그인·토큰 갱신·로그아웃 | `POST /api/v1/auth/login`, `/refresh`, `/logout` | 로그아웃만 필요 | 허용 | 허용 | 허용 | 영향 없음 |
| 내 정보 조회 | `GET /api/v1/users/me` | 필요 | 허용 | 허용 | 허용 | 영향 없음 |
| 프로필 수정 | `PATCH /api/v1/users/me` | 필요 | 허용 | `MAINTENANCE_MODE_ENABLED` | 허용 | 영향 없음 |
| 비밀번호 변경 | `POST /api/v1/users/me/password` | 필요 | 허용 | `MAINTENANCE_MODE_ENABLED` | 허용 | 영향 없음 |
| 프로젝트 목록·상세 | `GET /api/v1/projects`, `/projects/{id}` | 필요 | 허용 | 허용 | 허용 | 영향 없음 |
| 프로젝트 생성 | `POST /api/v1/projects` | 필요 | 허용 | `MAINTENANCE_MODE_ENABLED` | 허용 | 영향 없음 |
| 프로젝트 수정 | `PATCH /api/v1/projects/{id}` | 필요 | 허용 | `MAINTENANCE_MODE_ENABLED` | 허용 | 영향 없음 |
| 프로젝트 삭제 | `DELETE /api/v1/projects/{id}` | 필요 | 허용 | `MAINTENANCE_MODE_ENABLED` | 허용 | 영향 없음 |
| 문서 목록·버전 조회 | `GET /api/v1/projects/{id}/documents`, 문서 버전 조회 | 필요 | 허용 | 허용 | 허용 | 허용 |
| 최초 문서·새 버전 업로드 및 파싱 시작 | `POST /api/v1/projects/{id}/documents` | 필요 | 허용 | `MAINTENANCE_MODE_ENABLED` | 설정이 켜진 경우 허용 | `DOCUMENT_PROCESSING_DISABLED` |
| 구조화 결과 조회 | `GET /api/v1/projects/{id}/structured-plans/latest` | 필요 | 허용 | 허용 | 허용 | 허용 |
| 구조화 보완 항목 저장 | `PATCH .../structured-plans/{planId}/missing-fields/{fieldId}` | 필요 | 허용 | `MAINTENANCE_MODE_ENABLED` | 허용 | 기존 결과의 수동 보완은 허용 |
| 구조화 계획 확정 | `POST .../structured-plans/{planId}/confirm` | 필요 | 허용 | `MAINTENANCE_MODE_ENABLED` | 허용 | 기존 결과 확정은 허용 |
| 법률·규제 분석 시작 | `POST /api/v1/projects/{id}/legal-reviews` | 필요 | 허용 | `MAINTENANCE_MODE_ENABLED` | 설정이 켜진 경우 허용 | `DOCUMENT_PROCESSING_DISABLED` |
| 사업성 분석 시작 | `POST /api/v1/projects/{id}/feasibility-assessments` | 필요 | 허용 | `MAINTENANCE_MODE_ENABLED` | 설정이 켜진 경우 허용 | `DOCUMENT_PROCESSING_DISABLED` |
| Persona 추천 시작 | `POST /api/v1/projects/{id}/persona-recommendations` | 필요 | 허용 | `MAINTENANCE_MODE_ENABLED` | 설정이 켜진 경우 허용 | `DOCUMENT_PROCESSING_DISABLED` |
| 기존 분석·Persona·Job 결과 조회 | 각 `GET` 조회 API | 필요 | 허용 | 허용 | 허용 | 허용 |
| 허용 군집 Persona 조회 | `GET /api/v1/projects/{id}/personas/available` | 필요 | `CLUSTER_PERSONA_ENABLED`에 따름 | 조회 허용 | 허용 | 영향 없음 |
| 프로젝트 Persona 선택 | `PUT /api/v1/projects/{id}/personas/selection` | 필요 | 전역 기능·허용 목록에 따름 | `MAINTENANCE_MODE_ENABLED` | 허용 | 영향 없음 |
| 군집 Persona 운영 | `GET/PATCH/PUT /api/v1/admin/personas/**` | ADMIN 필요 | 허용 | 해당 없음 | 허용 | 영향 없음 |
| 관리자 운영 API | `/api/v1/admin/**` | ADMIN 필요 | 허용 | 해당 없음 | 허용 | 관리·설정 변경 허용 |
| Health Check | `GET /actuator/health` | 불필요 | 허용 | 허용 | 허용 | 영향 없음 |

## 오류 우선순위

문서 기반 변경 작업에서는 `MAINTENANCE_MODE`를 먼저 확인한다. 두 설정이 동시에 비활성 상태이면 일반 USER에게 `MAINTENANCE_MODE_ENABLED`를 우선 반환하고, 유지보수 모드가 아니면서 문서 처리만 중지된 경우 `DOCUMENT_PROCESSING_DISABLED`를 반환한다.

## 현재 존재하지 않는 쓰기 계약

현재 저장소에는 별도의 문서 수동 재처리·재시도, Panel·Simulation 실행, Report 생성, Marketing 결과 생성 Endpoint가 없다. 기존 Report 조회·인쇄·다운로드 기능은 읽기 기능으로 유지한다. 해당 Command API가 추가될 때 이 Matrix와 `ServicePolicyService` 적용 경계를 함께 갱신해야 한다.

## 운영 결정

유지보수 중 일반 사용자의 비밀번호 변경도 일반 쓰기 중단 원칙에 따라 차단한다. 보안 사고로 긴급 변경이 필요한 경우 관리자가 유지보수 모드를 해제하거나 계정 세션을 철회한 뒤 처리한다. 관리자 콘솔과 관리자 설정 변경은 유지보수 모드 해제를 위해 항상 접근 가능해야 한다.

군집 Persona 선택은 프로젝트 쓰기 작업으로 취급한다. 전역 기능이 꺼졌거나 허용
목록에서 제거된 Persona는 새로 선택할 수 없으며, 기존 선택 기록은 자동 변경하지
않는다.
