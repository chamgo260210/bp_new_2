# 관리자 권한 정책

## 권한 경계

관리자 요청은 다음 계층을 모두 통과해야 한다.

1. JWT 또는 개발 전용 Header 인증이 `ROLE_ADMIN` Authority를 제공한다.
2. Spring Security가 `/api/v1/admin/**`를 `hasRole("ADMIN")`으로 제한한다.
3. `AdminAccessService`가 DB의 현재 사용자 Role, ACTIVE 상태, soft-delete 여부를
   다시 확인한다.
4. 각 작업 Service가 자기 계정·마지막 관리자·재인증 정책을 검사한다.

비인증 요청은 401, USER Authority는 403이다.

## Profile

| Profile | 인증 | 관리자 Route |
| --- | --- | --- |
| 운영 및 기본 | Access JWT | `ROLE_ADMIN` 필요 |
| `dev-header-auth` | `X-User-Id`와 `X-User-Role` | `X-User-Role: ADMIN` 필요 |
| `test` | Mock Authentication 또는 테스트 Header | `ROLE_ADMIN` 필요 |

개발 Header Filter는 `test`, `dev-header-auth`에서만 Bean으로 생성된다. 운영
Profile에서는 Header 인증이 활성화되지 않는다. test에서 Role Header가 생략된
기존 일반 사용자 Fixture는 `ROLE_USER`로 취급하며 관리자 API를 통과하지 못한다.

## USER와 ADMIN

- USER는 자신의 워크스페이스, 프로젝트와 기존 결과에 접근한다.
- ADMIN은 관리자 콘솔의 사용자·프로젝트·감사·설정 조회와 허용된 운영 변경을
  수행한다.
- ADMIN 권한은 일반 사용자 프로젝트 내용을 임의 수정하거나 삭제할 권한을
  의미하지 않는다.

## 마지막 관리자와 자기 계정

- 활성 ADMIN이 한 명이면 강등, 잠금, 비활성화를 거부한다.
- 활성 관리자 목록을 비관적 쓰기 잠금으로 조회해 동시 변경을 직렬화한다.
- 현재 관리자는 자신의 ADMIN 강등, 잠금, 비활성화, 모든 세션 종료를 수행할 수
  없다.
- Frontend의 비활성화 표시는 안내일 뿐이며 Backend 검사가 최종 기준이다.

## Token 상태

Access Token 검증은 사용자 존재, `deletedAt == null`, ACTIVE 상태,
`securityVersion` 일치를 확인한다. Refresh Token 회전도 같은 현재 사용자
상태와 Claim 버전을 확인한다. Role·Status·비밀번호·세션 변경 후에는
`securityVersion`을 올리고 Refresh Token을 철회한다.
