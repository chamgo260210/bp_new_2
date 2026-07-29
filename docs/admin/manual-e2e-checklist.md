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
