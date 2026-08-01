# Open Decisions

- Status: TARGET_CANONICAL
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P1
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: Decisions intentionally deferred beyond Phase 1.1
- Supersedes: Open questions dispersed across legacy documents
- Implementation Status: NOT_STARTED

| Decision ID | Status | Introduced Phase | Due Phase | Decision topic | Options | Impact scope |
|---|---|---|---|---|---|---|
| OD-001 | OPEN | P1 | P2 | 초기 FILE 지원 형식 | DOCX only; common office subset; extensible allowlist | parser, upload, UX, tests |
| OD-002 | OPEN | P1 | P2/P3 | 대용량 Spring–AI 전송 | bounded inline; chunk/stream; Spring-mediated temporary channel | internal API, memory, timeout, binary AI |
| OD-003 | OPEN | P1 | P2 | Workflow 상태와 gate | strict sequential; optional gates; state + capability model | domain, API, UI, stale |
| OD-004 | OPEN | P1 | P2 | Concept Quick/Detailed 분석 입력 | shared core + depth; analysis-specific inputs | domain, prompt, provenance |
| OD-005 | OPEN | P1 | P2 | Persona Three-Layer 상세 축 | needs/context/behavior 계열 후보; 다른 reviewed taxonomy | domain, UI, interview |
| OD-006 | OPEN | P1 | P2 | Final Report 초기 export | PDF; Markdown; HTML; staged subset | renderer, Storage, UI |
| OD-007 | OPEN | P1 | P2/P3 | TaskRun transaction과 attempt 경계 | single aggregate; separated attempt transaction; outbox/event wake | DB, concurrency, retry |
| OD-008 | OPEN | P1 | 구현 slice 전 | AI model/provider/library | provider abstraction 후보; model per task | AI Server, cost, quality tests |
| OD-009 | OPEN | P1 | P2/P4 | 법령 MCP·법제처 API 연동 방식 | MCP primary/API fallback; API primary/MCP enrichment; coordinated source adapter | provenance, availability, legal UX |

## Governance

OPEN 결정은 due phase의 구현 시작 전에 ACCEPTED, REJECTED 또는 DEFERRED로 갱신하고 [Decision Log](../governance/DECISION_LOG.md)에 채택 결정을 기록한다. 상세 schema를 결론 전에 canonical 사실로 서술하지 않는다.
