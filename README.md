# AI 사업검증 플랫폼

사업계획서 DOCX를 구조화하고 법률 사전검토, 사업 타당성 평가, 데이터 기반 페르소나·고객 검증 계획, 통합 보고서까지 연결하는 교육·데모용 플랫폼입니다.

기존 Phase 11 기준선 위에 관리자 운영 기능과 Persona 검증 MVP, 마케팅 콘텐츠 MVP, 재무·수익성 분석 G1-R working tree가 추가되어 있습니다. 아직 최종 커밋 전이므로 Verified HEAD를 임의로 갱신하지 않았습니다. 상세 As-built 문서는 [`docs/current/README.md`](docs/current/README.md)에서 확인합니다.

## 빠른 시작

- Backend: Java 17, Spring Boot 4.1.0, `cd backend && gradlew.bat bootRun`
- Frontend: Node 22, `cd frontEnd && npm.cmd ci && npm.cmd run dev`
- 로컬 API: `VITE_API_BASE_URL=http://127.0.0.1:8080/api/v1`
- 통합 보고서: `/app/projects/:projectId/report`
- 재무·수익성 분석: `/app/projects/:projectId/review/financial`
- API 계약: [`docs/api/openapi.yaml`](docs/api/openapi.yaml)
- 실행·데모: [`LOCAL_DEVELOPMENT_AND_DEMO.md`](docs/current/LOCAL_DEVELOPMENT_AND_DEMO.md)
- 품질 게이트: [`TESTING_AND_QUALITY_GATE.md`](docs/current/TESTING_AND_QUALITY_GATE.md)

## 현재 범위

인증, 프로젝트, DOCX 업로드·비동기 파싱, 구조화·보완·확정, 법률 사전검토, 사업 타당성, 결정론적 재무·수익성 분석, Persona 추천·선택, 예상 패널 인터뷰, 예상 시장 반응, 마케팅 콘텐츠 제작, 통합 보고서를 제공합니다.

기본 AI는 Mock입니다. 결과를 실제 시장·법률·고객 사실로 오인하면 안 됩니다. 비밀값은 환경변수로만 제공하고 커밋하지 마십시오.

## 알려진 한계

재무 결과는 사용자 확인 가정에 따른 결정론적 예상값이며 회계·세무·투자 자문이 아닙니다. 패널·시장 반응은 실제 조사나 확률 예측이 아니고, 마케팅 콘텐츠는 실제 이미지 생성 AI가 아닌 검증 결과 기반 템플릿 MVP입니다. 실제 AI 운영 인증, 외부 회계·시장 데이터, 보고서 snapshot/version/share, 서버 PDF, password reset/MFA, HttpOnly refresh cookie는 아직 없습니다.
