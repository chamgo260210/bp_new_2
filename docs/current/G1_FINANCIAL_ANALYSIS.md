# G1 재무·수익성 분석 구현 현황

현재 소스 기준으로 재무 분석은 `FINANCIAL` 프로젝트 단계에서 제공된다.

- 화면: `/app/projects/:projectId/review/financial`
- API: `/api/v1/projects/{projectId}/financial-analyses`
- 전제: 소유자가 완료한 사업 타당성 분석과 확정 구조화 계획
- 쓰기 제한: 유지보수 모드에서는 생성·수정·실행·복제·삭제가 차단되고 기존 결과 조회는 허용된다.
- 결과: 보수·기준·낙관 시나리오, 월별 현금흐름, 손익분기, 운영자금, 단일 변수 민감도

외부 회계 서비스나 실제 AI 예측 모델은 연결하지 않았다. 모든 수치는 BigDecimal 기반의 결정론적 계산이며, 실제 성과 보장이나 회계·세무·투자 자문이 아니다.
# G1-R Migration compatibility

V21은 기존 `financial_analyses` 행을 삭제하거나 재작성하지 않고 신규 참조·결과 컬럼과 인덱스를 추가한다. V22는 기존 행의 필수 신규 필드만 안전한 값으로 Backfill하고 Entity의 NOT NULL 계약과 맞춘다. 기존 PK, 프로젝트·Job 참조, 금액, 결과 JSON은 유지한다.
