# Security Architecture

- Status: TARGET_CANONICAL
- Last Reviewed Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Scope: Authentication, authorization, data protection and secure coding
- Supersedes: Legacy security and admin policy documents
- Implementation Status: NOT_STARTED

JWT/refresh, admin role, Project owner scope와 cross-owner 404를 유지한다. Controller뿐 아니라 repository/service 경계에서 소유권을 강제하고 식별자 존재를 누출하지 않는다.

비밀값은 환경에서 주입하며 코드·문서·로그에 기록하지 않는다. 외부 응답, 파일명, content type, URL, prompt 입력과 AI 출력을 신뢰하지 않고 길이·schema·허용 목록을 검증한다. 오류 응답은 내부 stack, provider body, credential을 숨긴다.

RDB와 Object Storage는 Spring만 접근한다. 감사 로그는 보안·관리 동작의 actor, target, result, request correlation을 남기되 민감정보를 최소화한다.
