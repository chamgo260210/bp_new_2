# 관리자 감사 로그 정책

## 감사 대상

관리자 재인증 성공·실패, 목적 제한 Action Token 검증 실패, 사용자 Role·상태 변경,
사용자 세션 종료, 본인 탈퇴·관리자 사용자 삭제, 서비스 설정 변경을 기록한다. 일반
입력 오타와 무관한 Validation 오류 전체를 기록하지 않고 보안·권한·운영 정책
위반을 중심으로 실패를 기록한다.

## 성공과 실패

- 성공 기록은 실제 변경과 같은 트랜잭션에 참여한다. 감사 기록 저장이 실패하면 실제 변경도 Rollback한다.
- 실패 기록은 `REQUIRES_NEW` 트랜잭션으로 저장한다. 실패 감사 저장 자체가 실패하면 서버 로그에 남기되 원래 사용자 오류 코드와 응답을 변경하지 않는다.
- 한 작업의 성공 이벤트는 한 번만 기록한다.

## 저장 필드

수행 사용자, 제한된 Action·Result·Target Type, 대상 ID와 표시명, 변경 사유, 변경
전후 값, 오류 코드, Request ID, IP, User Agent, 발생 시각을 저장한다. Before·After에는
실제로 변경된 필드만 포함하며 Entity 전체 Snapshot을 저장하지 않는다. 계정 삭제는
User ID와 계정 상태 변경만 저장하고 탈퇴 전 username·email·조직 정보는 저장하지
않는다.

## 민감정보 제외

다음 값은 감사 로그에 저장하지 않는다.

- 비밀번호
- Access Token, Refresh Token, 관리자 Action Token 원문
- Authorization Header와 Cookie
- 문서 및 사업계획서 원문
- 내부 Storage Key
- 사용자 개인정보 전체 Snapshot

## 요청 환경

IP는 신뢰 Proxy 정책이 확정되지 않은 현재 배포 구조에서 `request.getRemoteAddr()`를 사용한다. `X-Forwarded-For`는 신뢰하지 않는다. User Agent는 최대 500자, Request ID는 최대 100자로 제한한다.

## 기존 데이터 호환

기존 `event_type`, `aggregate_type`, `metadata_json` 컬럼은 유지한다. 신규 구조 필드가 없는 기존 행은 `SUCCESS`로 해석하고 안전하게 Metadata를 파싱해 Before·After·사유를 구성한다. 잘못된 JSON은 원문을 화면에 노출하지 않고 빈 Object와 파싱 오류 상태로 반환한다.

## 변경 불가와 보존

관리자 API는 감사 로그의 조회만 제공하며 수정·삭제 API를 제공하지 않는다. CSV Export, 실시간 스트리밍, SIEM 연동은 현재 범위가 아니다.

감사 로그 보존 기간은 운영 정책 확정이 필요하다. 보존 기간과 별도 보관소가 결정되기 전에는 임의 삭제 작업을 구성하지 않는다.
