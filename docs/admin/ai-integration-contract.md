# AI 관리자 연동 예정 계약

## 현재 상태

AI 서버는 아직 연결되지 않았다. 현재 관리자 API는 다음 의미의 응답만 제공한다.

```json
{
  "available": false,
  "reason": "AI_SERVER_NOT_CONNECTED",
  "items": []
}
```

Overview Job 지표는 `pending`, `running`, `failed`를 `null`로 반환해 0건과 수집
불가를 구분한다. 재시도·취소·강제 실패 버튼은 제공하지 않는다.

## 예정 Service DTO

```text
serviceKey
displayName
category
status
version
lastHeartbeatAt
latencyMs
errorCode
message
capabilities
```

내부 인증정보와 민감한 Base URL은 노출하지 않고 안전한 Endpoint Alias를 사용한다.

## 예정 Job DTO

```text
jobId
projectId
ownerId
jobType
status
progress
attempt
maxAttempts
queuedAt
startedAt
completedAt
errorCode
errorMessage
correlationId
```

이 항목은 연동 예정 계약이며 현재 구현 완료를 의미하지 않는다. 실제 AI 서버의
인증, Retry idempotency, 취소 가능 상태와 오류 체계를 확정한 뒤 Command API를
추가한다.
