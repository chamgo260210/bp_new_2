# Functional Requirements

- Status: TARGET_CANONICAL
- Last Reviewed Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Scope: Target functional capabilities without detailed schemas
- Supersedes: Legacy feature and product requirement documents
- Implementation Status: NOT_STARTED

## Project and input

- 인증된 사용자는 owner-scoped Project를 생성·조회·수정·삭제할 수 있어야 한다.
- Project는 여러 IdeaVersion과 출처를 보유할 수 있어야 한다.
- IdeaSource는 TEXT, FILE, QUESTION_RESPONSE를 지원 가능한 유형으로 둔다.
- 파일 지원 형식은 확장 가능해야 하며 초기 목록은 Phase 2에서 결정한다.

## Review and decision

- 법률 검토는 한국 법령 MCP와 법제처 API의 출처를 추적해야 한다.
- 여러 concept 후보의 생성, 평가, shortlist, 상세 분석, 사용자 선택을 지원해야 한다.
- Persona Card와 독립 Interview를 지원해야 한다.
- Marketing asset 생성·관리와 Persona 기반 상대 비교를 지원해야 한다.

## Report and operations

- Final Report는 구조화 snapshot과 version metadata를 RDB에 저장해야 한다.
- PDF, Markdown, HTML 등 export artifact는 Spring이 관리하는 Object Storage에 저장할 수 있어야 한다.
- Admin은 사용자/역할, 프로젝트 운영, 감사, 범용 정책, TaskRun/Storage/AI·법령 연결 상태를 다뤄야 한다.
- 범용 Service Policy는 maintenance, project creation, file upload, AI execution, report generation 허용 방향을 가져야 한다.
