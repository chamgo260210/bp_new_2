# 관리자 위험 작업 재인증

## 적용 작업

| 작업 | Purpose |
| --- | --- |
| USER ↔ ADMIN Role 변경 | `USER_ROLE_CHANGE` |
| ACTIVE/LOCKED → DISABLED | `USER_DISABLE` |
| 유지보수 모드 활성화 | `MAINTENANCE_MODE_ENABLE` |

잠금·잠금 해제·활성 복귀·세션 종료·유지보수 해제는 현재 비밀번호 재인증 없이
사유 Confirm을 사용한다.

## 발급

`POST /api/v1/admin/reauthenticate`에 현재 관리자 비밀번호와 Purpose를 전달한다.
성공하면 약 5분 동안 유효한 Action Token을 반환한다.

DB에는 Token 원문이 아닌 SHA-256 Hash, 관리자 ID, Purpose, 발급 당시
`securityVersion`, 만료 시각, 사용 시각을 저장한다. Token 원문은 Audit와 로그에
기록하지 않는다.

## 소비

위험 작업은 `X-Admin-Action-Token` Header를 받는다. 비관적 쓰기 잠금으로 Token
행을 읽고 다음을 검사한다.

- 현재 관리자 ACTIVE·ADMIN·미삭제
- 관리자 ID와 `securityVersion`
- Purpose
- 만료 여부
- 기존 소비 여부

Role·Status·설정 변경 Service의 트랜잭션 안에서 Token을 소비하므로 실제 작업이
Rollback되면 소비도 Rollback된다.

## 오류와 감사

주요 오류는 `REAUTHENTICATION_REQUIRED`,
`ADMIN_REAUTHENTICATION_FAILED`, `ADMIN_REAUTHENTICATION_EXPIRED`,
`ADMIN_REAUTHENTICATION_PURPOSE_MISMATCH`,
`ADMIN_ACTION_TOKEN_ALREADY_USED`다. 재인증 성공과 실패, 위험 작업 성공과
정책 실패를 구조화해 감사하되 비밀번호와 Token 원문은 제외한다.
