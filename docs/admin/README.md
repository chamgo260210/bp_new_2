# 관리자 콘솔 운영 문서

이 디렉터리는 현재 저장소에 구현된 관리자 운영 정책과 수동 검증 절차를 정리한다.

## 구현 완료

- JWT Role Authority와 Spring Security의 `/api/v1/admin/**` ADMIN 제한
- DB의 현재 Role·Status·soft-delete·`securityVersion` 재검증
- Role·Status 변경 및 세션 종료 시 Access/Refresh Token 무효화
- 마지막 활성 관리자와 자기 계정 보호
- 위험 작업 재인증과 목적 제한 1회용 Action Token
- 회원가입·문서 처리·유지보수 모드 정책
- Users·Projects·Audit 검색, 페이지네이션, 상세 SideSheet
- 구조화된 성공·실패 관리자 감사
- 설정 변경자와 변경 시각을 포함한 Settings 운영 화면
- 일반 USER 본인 탈퇴와 `USER_DELETE` 재인증 기반 관리자 Soft Delete
- 실제 기준 카탈로그 기반 군집 Persona 허용 목록과 프로젝트별 선택

## 현재 미연동

- AI Service Registry와 AI Job 서버
- AI Job 재시도·취소·강제 실패 처리
- 실시간 운영 상태 Push, SIEM, 감사 Export

미연동 AI 응답은 `available=false`, `reason=AI_SERVER_NOT_CONNECTED`,
`items=[]`로 구분한다. 가짜 수치나 성공률은 표시하지 않는다.

## 사용자 E2E 필요

CI 구성과 실제 브라우저 E2E는 이번 구현 범위에서 실행하지 않았다.
[수동 E2E 체크리스트](manual-e2e-checklist.md)에 따라 운영 환경과 동일한
Profile, Viewport, 키보드 조작을 확인해야 한다.

## 문서

- [권한 정책](authorization-policy.md)
- [Bootstrap 관리자](bootstrap-admin.md)
- [위험 작업 재인증](reauthentication-policy.md)
- [세션 철회](session-revocation-policy.md)
- [서비스 정책 Matrix](service-policy-matrix.md)
- [감사 정책](audit-policy.md)
- [계정 삭제 정책](account-deletion-policy.md)
- [군집 Persona 정책](cluster-persona-policy.md)
- [AI 연동 예정 계약](ai-integration-contract.md)
- [수동 E2E 체크리스트](manual-e2e-checklist.md)

## Migration

| Version | 목적 |
| --- | --- |
| V11 | 관리자 상태 메타데이터와 서비스 설정 |
| V12 | 사용자 `security_version` |
| V13 | 관리자 재인증 Action Token |
| V14 | 비활성화 사유 |
| V15 | 구조화된 관리자 감사 필드 |
| V16 | Legacy 서비스 설정 Key를 canonical Key로 통합 |
| V17 | 군집 Persona 노출 정책과 프로젝트별 선택 |

적용된 Migration은 수정하지 않는다. 운영 DB 적용 후 변경이 필요하면 다음
Version을 추가한다.

## 향후 확장

Access Token 검증은 즉시 세션 차단을 우선해 요청마다 사용자 Security Snapshot을
DB에서 확인한다. 성능 측정 후 짧은 TTL Cache 또는 Redis Snapshot을 도입할 수
있지만, `securityVersion` 변경 시 무효화 경계를 먼저 설계해야 한다.
