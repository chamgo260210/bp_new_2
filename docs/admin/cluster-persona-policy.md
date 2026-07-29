# 군집 페르소나 운영 정책

## 데이터 구분

`baseline_personas`의 `persona-catalog-v1` 56개 행이 현재 운영 가능한 원본
카탈로그다. 새 군집 계산이나 Seed 생성은 이 기능에서 수행하지 않는다.

- 추천 Persona는 프로젝트 분석 결과인 `persona_recommendations`와 item에 보존된다.
- 군집 카탈로그 노출은 `cluster_persona_policies`에서 별도로 관리한다.
- 사용자의 최종 선택은 `project_persona_selections`에 프로젝트당 한 행으로 저장한다.

추천 결과와 사용자 선택은 서로 독립적이다. 추천 Persona는 `추천`으로 계속
강조하지만 선택을 자동 확정하지 않는다. 사용자가 다른 Persona를 선택하면 추천
Badge는 원래 항목에, 선택 Badge는 선택한 항목에 표시한다.

## 전역 활성화와 허용 목록

`CLUSTER_PERSONA_ENABLED=false`가 기본값이다. 기능을 켜려면 활성 카탈로그 Persona가
하나 이상 허용 목록에 있어야 한다. 전역 기능이 켜진 상태에서는 마지막 허용
Persona를 숨길 수 없다.

- 최대 노출 수: 6개
- 사용자 최초 표시 수: 3개
- 표시 순서: 관리자가 지정한 `displayOrder`
- 관리자 변경 가능 범위: 노출 여부와 순서
- 관리자 변경 불가 범위: Persona 이름, 설명, 원본 군집 데이터

정책 Migration은 기존 Persona를 자동으로 노출하지 않는다. 운영자가 실제
카탈로그를 검토해 허용한 항목만 정책 행으로 생성한다.

## 사용자 API와 선택

`GET /api/v1/projects/{projectId}/personas/available`은 프로젝트 소유자에게만
관리자가 허용한 Persona의 ID, 이름, 요약과 최대 3개 키워드를 반환한다. 원본 개인
데이터, Feature Vector, 전체 분석 JSON과 관리자 변경 정보는 반환하지 않는다.

`PUT /api/v1/projects/{projectId}/personas/selection`은 다음을 모두 검증한다.

- 현재 사용자 ACTIVE·미삭제
- 프로젝트 소유권과 프로젝트 미삭제
- 전역 기능 활성
- Persona가 현재 카탈로그에서 활성 상태
- 관리자 허용 목록 포함
- 유지보수 모드 쓰기 가능

기존 선택 Persona가 나중에 숨김 처리되어도 선택 행은 보존한다. 사용자 화면에는
현재 사용 중지 상태를 표시하고 다른 Persona를 자동 선택하지 않는다.

## 감사

관리자 감사 Action은 `CLUSTER_PERSONA_POLICY_CHANGED`,
`CLUSTER_PERSONA_VISIBILITY_CHANGED`, `CLUSTER_PERSONA_ORDER_CHANGED`다.
Before·After에는 설정값, Persona ID, 노출 여부와 순서만 저장하며 Persona 원본
데이터 전체를 저장하지 않는다.

일반 사용자 선택은 Domain Audit `PROJECT_PERSONA_SELECTED`로 기록하며 관리자
감사 목록에 모든 사용자 선택을 섞지 않는다.
