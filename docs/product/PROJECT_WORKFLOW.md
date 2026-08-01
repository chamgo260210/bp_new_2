# Target Project Workflow

- Status: TARGET_CANONICAL
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P1
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Ordered workflow, gates, version and stale principles
- Supersedes: StructuredPlan-centered workflow documents
- Implementation Status: NOT_STARTED

## Canonical order

Idea Intake → Idea Normalization → Korean Legal Review → Concept Builder → Quick Assessment → Shortlist → Detailed Analysis → Concept Selection → Three-Layer Persona Cards → Independent Persona Interviews → Marketing Workspace → Persona-Based Marketing A/B Comparison → Persisted Final Report.

## Stage purposes

Idea 단계는 입력 형식을 일반화하고 현재 IdeaVersion을 만든다. Legal 단계는 한국 법률 근거와 실패 가능성을 기록한다. Concept/Quick 단계는 넓게 대안을 만든 뒤 상세 분석 비용을 들일 shortlist를 정한다. Detailed 단계는 Quick 결과를 반복하는 것이 아니라 선택에 필요한 더 깊은 시장·BM·기술운영·재무 근거를 만든다.

Concept Selection은 AI 추천과 구별되는 사용자 gate다. Persona 단계는 선택된 concept에 종속되고 각 interview는 독립 실행한다. Marketing 단계는 asset workspace와 상대 비교를 제공한다. Report 단계는 선택된 input/result version을 고정한 snapshot이다.

## Gate directions

- Idea Normalization 이후 사용자가 현재 아이디어를 확인한다.
- 법률 실패 또는 수정 권고 후 입력 수정과 새 review run을 허용한다.
- Quick Assessment 이후 사용자가 shortlist를 확정한다.
- Detailed Analysis 이후 사용자가 concept를 선택한다.
- Persona Card와 Marketing asset은 downstream 실행 전에 사용자가 검토할 수 있어야 한다.
- Final Report 생성은 포함할 current versions를 Spring이 검증한 뒤 수행한다.

정확한 필수/선택 gate와 상태 enum은 P2에서 결정한다.

## Version and stale

업무 결과는 생성 당시 upstream version을 참조한다. upstream 변경은 과거 결과를 삭제하지 않지만 current 후보에서 제외하거나 stale로 표시하는 방향이다. stale 결과의 재사용·복사·재실행 정책은 명시적이어야 한다.

## Failure and retry

Workflow 상태와 TaskRun 상태는 분리한다. timeout/retry 후 성공한 attempt만으로 이전 사용자 결정을 암묵적으로 교체하지 않는다. 법령/AI 장애는 실패 provenance를 남기고 재시도 가능성을 Spring이 판단한다. Persona interview 하나의 실패가 다른 Persona 결과를 오염시키지 않는다.

## Exclusions

문서 완성률, 고정 section completion, Persona 토론, 시장반응/구매확률, 실제 A/B conversion, runtime-only report는 Target Workflow에 포함하지 않는다.
