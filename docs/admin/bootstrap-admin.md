# Bootstrap 관리자 생성

## 환경변수

```text
BOOTSTRAP_ADMIN_ENABLED=true
BOOTSTRAP_ADMIN_USERNAME=<관리자 username>
BOOTSTRAP_ADMIN_EMAIL=<관리자 email>
BOOTSTRAP_ADMIN_PASSWORD=<Secret 저장소의 비밀번호>
```

실제 Secret은 `.env` 예제, 문서, Git 이력, 로그에 기록하지 않는다.

## 시작 검증

Bootstrap이 활성화되면 Username, Email, Password 필수값을 확인한다.
Username과 Password는 일반 회원가입과 동일한 `AuthService` 정책을 사용하고,
Email 형식도 검증한다. 누락이나 정책 위반은 애플리케이션 시작 실패로 처리한다.
비밀번호 원문은 오류와 로그에 출력하지 않는다.

## 충돌 처리

- 동일 Username과 Email이 같은 ADMIN을 가리키면 생성하지 않는다.
- Username 또는 Email이 다른 계정에 속하면 시작을 실패시킨다.
- 일반 USER와의 충돌을 자동 승격으로 해결하지 않는다.
- 삭제됐거나 다른 계정과 충돌하는 값을 새 Bootstrap 계정으로 덮어쓰지 않는다.

## 운영 절차

1. Secret 저장소에 Bootstrap 값을 넣고 최초 ADMIN을 생성한다.
2. 해당 ADMIN으로 로그인하고 관리자 콘솔 접근을 확인한다.
3. 필요하면 재인증 Flow를 통해 추가 ADMIN을 지정한다.
4. `BOOTSTRAP_ADMIN_ENABLED=false`로 전환한다.
5. Bootstrap 비밀번호 Secret을 폐기하거나 Rotation한다.

Bootstrap 기능을 상시 활성화하지 않는다.
