# Target System Architecture

- Status: TARGET_CANONICAL
- Last Reviewed Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Scope: Target component responsibilities and communication
- Supersedes: Legacy as-built architecture documents
- Implementation Status: NOT_STARTED

Frontend는 Spring WAS만 호출한다. Spring은 인증·인가, Project Workflow, TaskRun 상태, 입력·결과 검증, RDB와 Object Storage를 소유한다. AI Server는 Spring 요청만 받아 Agent, MCP, 모델, prompt와 AI 평가를 수행하고 결과를 Spring에 반환한다.

AI Server의 RDB/Object Storage 직접 접근, presigned GET/PUT, 업무 산출물 로컬 영속 저장은 금지한다. 외부 법령 MCP·법제처 API와 AI provider는 AI Server가 관리하되, 업무 결과의 채택과 저장은 Spring이 결정한다.

신규 Workflow는 /api/v2를 목표 namespace로 사용하고 stable core는 기존 /api/v1을 유지할 수 있다.
