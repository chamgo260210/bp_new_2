# 계정 삭제 정책

## 공통 원칙

계정 삭제는 Hard Delete가 아니라 즉시 접근을 차단하는 Soft Delete다. 사용자 행과
프로젝트·문서·분석·감사 참조는 보존한다. Hard Delete와 삭제 복구는 현재 지원하지
않는다.

삭제 트랜잭션은 사용자 행을 잠근 뒤 다음을 함께 처리한다.

1. 상태를 `DISABLED`로 변경하고 `deletedAt`을 기록한다.
2. `securityVersion`을 증가시키고 모든 Refresh Token을 철회한다.
3. username을 `deleted-{userId}-{uniqueSuffix}`로 교체하고 email을 `null`로 만든다.
4. displayName은 `탈퇴한 사용자`, 조직·부서·직책은 `null`로 비식별화한다.
5. 변경된 계정 상태만 Before·After에 담아 감사한다.

Access Token 검증은 미삭제 사용자를 요구하므로 탈퇴 직후 기존 Access Token도
거부된다. Refresh Token 회전 역시 미삭제·ACTIVE 상태와 `securityVersion`을
검증한다.

## 본인 회원 탈퇴

일반 USER는 `DELETE /api/v1/users/me`에서 현재 비밀번호와 확인 문구 `회원탈퇴`를
제출한다. 탈퇴 사유는 선택 사항이다. ADMIN은 이 경로로 탈퇴할 수 없으며 다른
관리자가 관리자 콘솔에서 처리해야 한다. 성공 후 Frontend는 메모리의 Access·Refresh
Token과 Auth Session을 지우고 로그인 화면으로 전환한다.

## 관리자 사용자 삭제

관리자는 `DELETE /api/v1/admin/users/{userId}`를 사용한다. 사유와 현재 관리자
비밀번호 재인증이 필수이며 Purpose는 `USER_DELETE`다. Action Token 소비와 삭제는
같은 트랜잭션에서 처리한다.

- 현재 관리자 자신의 계정 삭제는 금지한다.
- 마지막 활성 관리자 삭제는 활성 관리자 행 비관적 잠금으로 차단한다.
- 이미 삭제된 계정은 다시 삭제할 수 없다.
- 삭제 사용자는 Users 기본 목록과 상세에서 제외한다.
- 기존 프로젝트 상세는 소유자를 `탈퇴한 사용자`와 User ID로 표시하고 상세 Link를
  제공하지 않는다.

감사 Action은 본인 탈퇴 `USER_SELF_DELETED`, 관리자 삭제
`USER_DELETED_BY_ADMIN`이다. 비밀번호, Access/Refresh Token, Action Token 원문과
개인정보 전체 Snapshot은 저장하지 않는다.
