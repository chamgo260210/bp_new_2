# 관리자 콘솔 수동 E2E 체크리스트

CI와 실제 브라우저 E2E는 별도 수행한다. 각 시나리오는 실제 결과와 통과 여부를
기록한다.

| 시나리오 | 사전 조건 | 실행 절차 | 예상 결과 | 실제 결과 | 통과 | 비고 |
| --- | --- | --- | --- | --- | --- | --- |
| ADMIN 로그인 | 활성 ADMIN | 로그인 | `/admin`, ADMIN Badge |  |  |  |
| USER 관리자 API 거부 | 활성 USER Token | `/api/v1/admin/overview` 호출 | 403 |  |  |  |
| 비인증 관리자 API 거부 | Token 없음 | 관리자 API 호출 | 401 |  |  |  |
| ADMIN 승격 | USER, 관리자 비밀번호 | Role 변경 Dialog 제출 | 재인증 후 승격, 기존 세션 거부 |  |  |  |
| ADMIN 강등 | 활성 ADMIN 2명 이상 | Role 변경 Dialog 제출 | 재인증 후 강등 |  |  |  |
| 계정 비활성화 | ACTIVE/LOCKED USER | DISABLED Dialog 제출 | 재인증, 기존 Token 거부 |  |  |  |
| 마지막 관리자 보호 | 활성 ADMIN 1명 | 강등·잠금·비활성화 | 정책 오류, 상태 유지 |  |  |  |
| 자기 계정 보호 | 현재 ADMIN | 자기 변경·세션 종료 | 정책 오류 |  |  |  |
| 본인 회원 탈퇴 | 활성 USER | 비밀번호·`회원탈퇴` 제출 | 세션 제거, 로그인 이동, 기존 Token 거부 |  |  |  |
| 탈퇴 검증 실패 | 활성 USER | 틀린 비밀번호·확인 문구 제출 | Dialog 유지, Field 오류 |  |  |  |
| 관리자 사용자 삭제 | ADMIN과 대상 USER | USER_DELETE 재인증 후 삭제 | 목록·상세 제외, 프로젝트 참조 유지 |  |  |  |
| 관리자 자기 삭제 | 현재 ADMIN 상세 | 삭제 시도 | 버튼 제한 및 Backend 정책 오류 |  |  |  |
| 마지막 관리자 삭제 | 활성 ADMIN 1명 | 관리자 삭제 시도 | 정책 오류, 상태 유지 |  |  |  |
| 세션 종료 | 다른 USER | 모든 세션 종료 | 기존 Access/Refresh 거부 |  |  |  |
| 유지보수 활성화 | Maintenance OFF | 사유·비밀번호 제출 | USER 쓰기 차단, 조회 유지 |  |  |  |
| 유지보수 해제 | Maintenance ON | 사유 제출 | 재인증 없이 쓰기 복구 |  |  |  |
| 회원가입 중지 | Registration OFF | Signup 진입·제출 | 안내와 실제 disabled |  |  |  |
| 문서 처리 중지 | Document Processing OFF | 업로드·분석 시도 | CTA disabled, 기존 조회 유지 |  |  |  |
| Persona 전역 활성 | 허용 Persona 1개 이상 | Settings에서 기능 활성화 | Public Policy와 사용자 Section 반영 |  |  |  |
| Persona 최소·최대 정책 | 기능 ON 또는 6개 허용 | 마지막 숨김·7번째 표시 시도 | 정책 오류, 기존 상태 유지 |  |  |  |
| Persona 표시 순서 | 허용 Persona 2개 이상 | 위로·아래로 변경 | 서버 재조회 후 사용자 순서 반영 |  |  |  |
| 추천·선택 Badge | 추천 결과와 허용 목록 | 추천 외 Persona 선택 | 추천과 선택 Badge가 서로 유지 |  |  |  |
| Persona 선택 유지 | 선택된 Persona | 관리자가 해당 Persona 숨김 | 선택 기록 보존, 사용 중지 안내 |  |  |  |
| Persona 모바일 카드 | 허용 Persona 4개 이상 | 390×844에서 펼치기·가로 이동 | Scroll Snap, 키보드 선택 가능 |  |  |  |
| Users 검색 | 사용자 데이터 | 한글 IME 입력·필터·페이지 이동·뒤로가기 | Debounce, URL 복원 |  |  |  |
| Projects 필터 | 프로젝트 데이터 | 날짜 경계와 필터·정렬 적용 | 서버 페이지 결과와 일치 |  |  |  |
| 프로젝트 상세 URL | Project ID | 상세 URL 직접 접근 | 목록 배경과 Sheet |  |  |  |
| Audit 성공·실패 | 위험 작업 실행 | Action/Result 필터와 상세 확인 | Before/After·오류 구조화 |  |  |  |
| Audit Target 이동 | USER/PROJECT Audit | Target Link 선택 | Sheet 중첩 없이 대상 상세 |  |  |  |
| Overlay 키보드 | 상세/Confirm 열림 | Tab·Shift+Tab·Escape | Focus Trap·닫기·복원 |  |  |  |
| Backdrop | Sheet/Dialog 열림 | Backdrop 선택 | 정책에 맞게 닫힘 |  |  |  |
| 모바일 Drawer | 390×844 | 메뉴 열기·탐색·Escape | Focus Trap, 메뉴 선택 후 닫힘 |  |  |  |
| 반응형 Table | 1024/390 Viewport | Users·Projects·Audit 확인 | 가로 Scroll, Header 유지 |  |  |  |
| 관리자 로그아웃 | 로그인 ADMIN | 계정 메뉴 로그아웃 | 전역 Auth Transition 후 로그인 |  |  |  |

권장 Viewport는 1440×900, 1280×800, 1024×768, 390×844다. 상태는 색상뿐 아니라
텍스트 Label로 확인하고, Screen Reader의 Dialog 제목과 설명 연결도 점검한다.

## E3 군집 Persona 인수검사 준비

### 사전 조건과 기록값

검수 전 아래 값을 실제 로컬 데이터에서 확인해 기록한다. Token과 비밀번호는
체크리스트나 화면 캡처에 남기지 않는다.

| 항목 | 준비값 |
| --- | --- |
| 관리자 | ACTIVE ADMIN 1명 |
| 일반 사용자 | ACTIVE USER 1명 |
| 프로젝트 | 일반 사용자가 소유한 미삭제 프로젝트 1개 |
| 추천 결과 프로젝트 | Persona 추천이 완료된 프로젝트 1개. 없으면 추천·선택 분리 항목은 `미검증` |
| 카탈로그 | `persona-catalog-v1` 56개 |
| 최초 정책 | `CLUSTER_PERSONA_ENABLED=false`, 허용 Persona 0개 |
| 요청 추적 | 브라우저 Network의 Request URL, Status, 응답 오류 코드만 기록 |

### 관리자 Settings

| 절차 | 예상 결과 | 실제 결과 | 통과 | 비고 |
| --- | --- | --- | --- | --- |
| `/admin/settings`의 `Persona 운영`으로 이동 | 전역 군집 Persona Row와 56개 카탈로그 Card가 렌더링됨 |  |  |  |
| 임의 Card의 이름·설명·키워드 확인 | 키워드는 최대 3개, 내부 JSON·원본 Feature는 노출되지 않음 |  |  |  |
| 숨김 Persona 1개를 `표시하기` | 사유 Dialog 제출 후 `표시 중 1/6`, 변경자·시각 갱신 |  |  |  |
| 전역 기능을 활성화 | 사유 Dialog 제출 후 상태 Badge와 Public Policy가 활성으로 갱신 |  |  |  |
| 표시 Persona의 `위로`·`아래로`를 키보드로 실행 | 서버 재조회 후 순서 변경, 첫/마지막의 불가능한 방향은 disabled |  |  |  |
| 6개까지 표시 후 7번째 표시 | `CLUSTER_PERSONA_LIMIT_EXCEEDED`, 기존 6개 상태 유지 |  |  |  |
| 전역 기능 ON에서 한 개만 남긴 후 `숨기기` | `CLUSTER_PERSONA_SELECTION_REQUIRED`, 마지막 Card 유지 |  |  |  |
| 관리자 탭을 새로고침 | 노출 여부·순서·변경자·시각이 서버 값으로 복원 |  |  |  |

56개 Card의 실제 탐색 시간이 과도한지는 별도로 기록한다. 현재 구현에는
서버 페이지네이션이나 내용 편집이 없으며, 단순 탐색성 문제가 실제 결함으로
확인될 때만 후속 범위를 정한다.

### 일반 사용자 Persona 화면

| 절차 | 예상 결과 | 실제 결과 | 통과 | 비고 |
| --- | --- | --- | --- | --- |
| 전역 기능 OFF에서 추천 결과 화면 진입 | 기존 추천 결과는 유지되고 추가 Persona Section은 표시되지 않음 |  |  |  |
| 기능 ON·허용 Persona 1개 이상에서 다시 진입 | `사용 가능한 페르소나` Section과 관리자 순서가 반영됨 |  |  |  |
| 허용 Persona 4개 이상 확인 | 최초 3개만 표시되고 `다른 페르소나 보기`와 `접기`가 동작 |  |  |  |
| 추천 Persona와 다른 Card 선택 | 선택 요청 중 중복 버튼 disabled, 성공 후 추천 Badge와 선택됨 Badge가 서로 다른 Card에 유지 |  |  |  |
| 선택된 Card를 다시 선택 | 선택 버튼이 disabled여서 중복 요청이 발생하지 않음 |  |  |  |
| 관리자 탭에서 선택 Persona를 숨긴 뒤 사용자 탭으로 복귀 | Window Focus 재조회 후 선택 기록 안내와 `현재 사용 중지` 상태 표시, 자동 대체 없음 |  |  |  |
| 숨김 Persona ID로 선택 API 호출 | 409 `CLUSTER_PERSONA_NOT_ALLOWED`, 이전 선택 유지 |  |  |  |
| 유지보수 모드 ON에서 선택 변경 | CTA disabled 또는 503 `MAINTENANCE_MODE_ENABLED`, 기존 결과 조회 유지 |  |  |  |

추천 결과 Fixture가 없는 로컬 DB에서는 추천 Badge 조합을 추측해 통과 처리하지
않고 `미검증`으로 남긴다.

### 반응형·접근성

| Viewport/입력 | 확인 절차 | 예상 결과 | 실제 결과 | 통과 |
| --- | --- | --- | --- | --- |
| 1440×900 | 6개 Card 펼침 | 3열, Badge·버튼 겹침 없음 |  |  |
| 1024×768 | 관리자 56개 Card와 사용자 Card 확인 | 2열 중심으로 재배치, 본문 가로 넘침 없음 |  |  |
| 768px 전후 | 펼치기·접기와 순서 버튼 사용 | Focus outline 유지, 버튼이 Card 밖으로 넘치지 않음 |  |  |
| 390×844 | 사용자 Card를 순서대로 탐색 | Compact 1열 또는 가로 Scroll이 끊기지 않고 모든 정보 접근 가능 |  |  |
| Keyboard | Tab·Shift+Tab·Enter로 표시/숨김·순서·선택·펼치기 실행 | 모든 기능에 접근 가능한 이름과 Focus 표시 존재 |  |  |
| Screen Reader | Loading·성공·오류 상태 확인 | Loading 상태와 정책 오류가 텍스트로 전달되고 Badge가 색상에만 의존하지 않음 |  |  |

### 두 탭 갱신

1. 관리자 탭에서 Persona 노출 여부 또는 순서를 변경한다.
2. 사용자 탭으로 전환한다.
3. Window Focus당 목록 요청이 한 번 발생하는지 Network에서 확인한다.
4. 최신 목록이 반영되고, Focus를 유지하는 동안 반복 요청이 이어지지 않는지
   10초 이상 관찰한다.
