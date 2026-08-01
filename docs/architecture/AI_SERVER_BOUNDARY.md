# AI Server Boundary

- Status: TARGET_CANONICAL
- Code Baseline Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Document Phase: P1
- Introduced In Commit: 1549a8efa0aeb2ca400f4795c1c44b34868e4722
- Scope: AI orchestration, trust boundary and failure responsibilities
- Supersedes: Legacy AI integration documents
- Implementation Status: NOT_STARTED

## Responsibilities

AI Server는 Agent, MCP, model, prompt, AI 평가, provider client와 provider 오류 정규화를 관리한다. Korean Legal Review를 위한 법령 MCP와 법제처 API 연결도 AI Server 경계에 속한다.

Spring이 전달한 task input만 사용하며 Project, owner, DB entity 또는 Storage object를 직접 조회하지 않는다. 결과는 Spring이 검증할 수 있는 identity, contract version, provenance, warning/error 방향을 포함한다.

## Hard prohibitions

- RDB driver, repository, SQL, migration
- S3/MinIO SDK, bucket credential, object key lookup
- presigned GET/PUT 또는 임의 Storage URL
- 업무 입력·결과의 local file persistence
- browser가 호출하는 public endpoint
- TaskRun 최종 상태나 사용자 결정을 자체 확정

## Trust boundary

Spring 입력도 AI Server 관점에서 size/schema/task allowlist를 검증한다. MCP/provider 출력은 신뢰하지 않고 parsing, citation, length와 allowed result type을 검사한다. AI Server의 결과 역시 Spring에서 다시 검증한다.

## Failure isolation

Provider/MCP별 timeout과 오류는 다른 TaskAttempt나 PersonaInterview로 전파하지 않는다. Persona 실행은 독립 context를 사용한다. retry 권고는 반환할 수 있지만 실제 retry와 최종 상태는 Spring이 결정한다. health는 process live와 provider/MCP dependency readiness를 구분한다.

## Current gap

현재 FastAPI artifact service의 presigned HTTP I/O와 mock banner local outputs는 Target에서 제거 대상이다. 상세 payload/streaming/model/library는 아직 미결정이다.
