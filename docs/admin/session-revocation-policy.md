# 세션 철회 정책

| 이벤트 | securityVersion 증가 | Refresh Token 철회 | 기존 Access Token | 재로그인 |
| --- | --- | --- | --- | --- |
| 비밀번호 변경 | 예 | 전체 | 다음 요청부터 거부 | 필요 |
| Role 변경 | 예 | 전체 | 다음 요청부터 거부 | 필요 |
| Status 변경 | 예 | 전체 | 다음 요청부터 거부 | 필요 |
| 관리자 세션 종료 | 예 | 전체 | 다음 요청부터 거부 | 필요 |
| 본인 탈퇴·관리자 삭제 | 예 | 전체 | `deletedAt` 검증으로 즉시 거부 | 불가 |

Access Token Decoder는 DB의 현재 사용자와 `securityVersion`을 매 요청 확인한다.
Refresh 회전은 저장된 Token 상태, Token JTI, 사용자 ACTIVE·미삭제 상태와
`securityVersion` Claim을 함께 확인한다.

본인 탈퇴와 관리자 삭제 Command는 같은 트랜잭션에서 Soft Delete, 비식별화,
`securityVersion` 증가, 모든 Refresh Token 철회와 Audit를 수행한다. 프로젝트와
문서·분석·감사 참조는 보존한다.
