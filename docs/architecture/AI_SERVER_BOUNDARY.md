# AI Server Boundary

- Status: TARGET_CANONICAL
- Last Reviewed Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Scope: AI orchestration responsibilities and hard prohibitions
- Supersedes: Legacy AI integration documents
- Implementation Status: NOT_STARTED

AI Server는 Agent, MCP, model, prompt, AI 평가와 provider 오류 정규화를 관리한다. 한국 법률 검토에 필요한 법령 MCP와 법제처 API 연결도 이 경계에 속한다.

AI Server는 Spring과만 통신한다. RDB, Object Storage, presigned URL, 업무 산출물 로컬 영속 저장에 접근하지 않는다. 입력은 Spring이 전달하고 결과는 Spring으로 반환한다. AI Server는 Project/TaskRun 상태의 source of truth가 아니다.

payload 크기, streaming, timeout, retry 분담과 provider 선택은 이후 계약 Phase에서 결정한다.
