# Persona 검증 정보 구조

## 목적

프로젝트의 Persona 검증 영역은 다음 세 기능을 독립된 진입점으로 제공한다.

| 기능 | Route | 현재 상태 |
|---|---|---|
| 패널 인터뷰 | `/app/projects/{projectId}/validate/interview` | Persona 기반 예상 답변·요약 MVP |
| 시장 반응 예측 | `/app/projects/{projectId}/validate/market-response` | 결정론적 상대 지표 비교 MVP |
| 마케팅 콘텐츠 제작 | `/app/projects/{projectId}/validate/marketing` | 템플릿 기반 MVP 제공 |

상위 Hub는 `/app/projects/{projectId}/validate`이며, 기존 Persona 추천·선택 화면은
`/app/projects/{projectId}/validate/personas`에서 유지한다. 과거 panel/market/marketing
주소는 대응되는 새 Route로 이동한다.

## 상태 표시 원칙

- 실행 결과가 없으면 `아직 실행하지 않음`으로 표시한다.
- 초안은 `초안 작성 중`, 완료 결과는 `최근 완료`, 실패 결과는 `최근 실패`로 표시한다.
- 질문·메시지 수와 실제 마지막 저장·완료 시각만 표시하며 가짜 진행률을 만들지 않는다.
- 예상 인터뷰와 시장 반응은 실제 조사 결과가 아님을 모든 결과 화면에 표시한다.

## 결과 연결

Hub는 Draft를 우선해 `초안 작성 중`을 표시하고, Draft가 없으면 최근 Completed, Failed,
미시작 순으로 상태를 계산한다. 삭제된 항목은 각 목록 API에서 제외된다.

패널 결과는 Persona ID와 `panelInterviewId`를 시장 반응 작성 화면에 전달한다. 패널과 시장
반응 결과는 Marketing 신규 작성 화면에 결과 ID를 전달하고, 서버가 안전한 Summary만 Source
Snapshot으로 저장한다. 원문 질문·답변 전체, 점수 Matrix, 문서 원문과 개인 데이터는 복제하지 않는다.
