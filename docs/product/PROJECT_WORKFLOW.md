# Current Project Workflow

- Status: CURRENT_CANONICAL
- Baseline date: 2026-08-04
- Scope: 현재 공식 Journey와 보존 MVP의 경계

## 공식 Journey

`Idea 입력 → AI 해석 → Idea Origin 보완·확정 → Legal Precheck → Legal Guardrail → Concept 생성 → Origin Integrity → Concept Legal Validation → 적격 Concept 3개 표시`

| 단계 | 입력/결정 | 현재 결과와 gate |
|---|---|---|
| Idea | TEXT 또는 FILE 원문 | owner-scoped IdeaSource 저장 |
| AI 해석 | 현재 IdeaSource | Origin Draft, metadata, 보완 질문 |
| Idea Origin | 사용자 답변과 출처 | 필수 질문을 확인한 immutable CONFIRMED version |
| Legal Precheck | confirmed Origin | 법률 상태, source/evidence, 추가 질문, revision 제안 |
| Legal Guardrail | adopted Precheck | Concept 생성의 hard/conditional/prohibited 구조 |
| Concept 생성 | Origin + Guardrail | 제한된 round/candidate budget의 draft batch |
| Origin Integrity | 사용자 확정값과 trace | 불일치 draft 폐기 |
| Concept Legal Validation | Guardrail batch | 법률 위반 draft 폐기 |
| 적격 Concept 3개 | 두 검증 PASS | ELIGIBLE 3개 표시 후 공식 Journey 종료 |

Idea Origin 변경은 이전 Legal/Concept 결과를 current 입력으로 사용하지 못하게 한다. 기존 결과는 history/evidence로 보존한다. 적격 수가 부족하면 실패 후보를 노출하거나 기준을 낮추지 않고 Origin 또는 Legal 입력 보완을 요구한다.

## 보존된 기존 MVP 실험 기능

Quick Assessment → Shortlist → Detailed Analysis → Concept Selection → Persona → Interview → Marketing → Final Report 코드/API/Route는 보존한다. 현재 공식 Journey에서 자동 실행하거나 자동 이동하지 않는다. 별도 제품 결정 전에는 현재 Journey의 완료 단계로 간주하지 않는다.

## 실행 방식

- Legal Precheck: Persistent Worker TaskRun
- Concept eligibility: In-memory Executor + TaskRun
- Idea 및 일부 보존 MVP: Service 내부 동기 claim/execute
- 모든 기능을 202/polling으로 통일하지 않음

Public endpoint와 실제 status/envelope는 [Public API v2 As-Is](../contracts/PUBLIC_API_V2_CONTRACT.md)를 따른다.
