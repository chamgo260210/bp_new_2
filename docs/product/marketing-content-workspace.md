# 마케팅 콘텐츠 제작 Workspace

## 현재 제공 범위

프로젝트 소유자는 여러 콘텐츠와 버전을 만들 수 있다. 콘텐츠 메타데이터와 최신 편집본은
`marketing_contents`, `marketing_content_versions`에 분리 저장한다. 삭제는 Soft Delete이며
버전은 보존한다.

지원 목적:

- 브랜드·서비스 인지도
- 제품·서비스 소개
- 이벤트 홍보
- 상담·신청 유도
- 구매 전환
- 재방문·재구매

지원 채널은 Social, Display Ad, Web Banner, Print Poster, Presentation, Custom이다.
기본 규격은 1080×1080, 1080×1350, 1200×628, 1920×1080, 1080×1920,
A4 2480×3508이다. Custom은 가로·세로 320~4096px 범위에서만 저장된다.

## 생성 방식과 Source Snapshot

AI Gateway는 현재 연결되어 있지 않다. 카피는 Persona, 프로젝트 요약, 목적, 톤,
사용자 메시지를 조합하는 `VALIDATION_TEMPLATE` 방식이며 UI에는 “검증 결과 기반 초안”으로
표시한다.

생성 시점 Snapshot에는 다음 안전한 요약만 저장한다.

- 프로젝트명·요약·업종
- 선택 또는 추천 Persona의 식별자·표시명·대표 특성
- 사용자가 입력한 핵심 메시지
- 법률 검토와 사업성 결과의 요약
- 완료된 패널 인터뷰의 공통 요구·우려·구매 동기·거부 요인·메시지 요약
- 완료된 시장 반응의 우수 Persona·메시지·CTA·채널·긍정/부정 요인 요약
- Snapshot 시각

문서 원문, 개인 데이터, Storage Key, 내부 Feature Vector는 저장하지 않는다. 원본 분석이
나중에 바뀌어도 기존 시안의 생성 근거는 유지한다.

예상 인터뷰와 예상 시장 반응 결과 화면은 `panelInterviewId`, `marketResponseId`를 신규
Marketing Route Query로 전달한다. 서버는 같은 프로젝트의 미삭제 `COMPLETED` 결과만 허용한다.
시장 반응에 완료 인터뷰가 연결되어 있으면 인터뷰도 함께 반영할 수 있다.

Snapshot은 콘텐츠 생성 후 자동으로 최신 분석으로 바뀌지 않는다. 사용자가
`검증 결과 다시 불러오기`에서 결과를 선택해야 새 Snapshot이 저장된다. Source만 갱신하면
카피는 유지되고, 새 카피 초안을 선택하면 기존 편집본을 보존한 새 버전을 만든다.

## 편집과 버전

Headline, Subheadline, 본문, CTA, 보조 문구를 직접 수정할 수 있다. 템플릿은
`HERO_CENTER`, `SPLIT_VISUAL`, `EDITORIAL_POSTER`, `MINIMAL_CARD` 네 가지다.
배경색/Gradient/Pattern, Accent, 텍스트 색상, 정렬, 제목 크기와 CTA/Persona Tag 노출을
편집한다.

편집은 약 1초 Debounce로 자동 저장하며 수동 저장과 실패 재시도를 제공한다. 새 버전 저장은 현재 편집본을
불변 이력으로 추가한다. 이전 버전은 확인하고 현재 편집본으로 복제할 수 있다.
버전에는 Snapshot 버전, Source 변경 여부, 카피 변경 여부와 Template을 표시한다.

카피 초안은 시장 반응의 우수 메시지, 인터뷰의 공통 요구·구매 동기, 추천 CTA를 우선한다.
카피 편집 영역에는 반영 근거를 짧게 표시한다. Preset은 신뢰 근거 부족, 행동 유도 신호,
명확성 요구를 기준으로 설명 가능한 순서로 추천하며 무작위 값은 사용하지 않는다.

로고·사용자 배경 이미지 업로드는 안전한 Asset 저장 및 MIME/크기/악성 SVG 검증 계약이 아직
없어 제공하지 않는다. 가짜 이미지 생성도 제공하지 않는다.

## 권한과 운영 정책

- 조회: ACTIVE·미삭제 사용자이면서 프로젝트 소유자
- 생성/수정/삭제/다른 초안/버전 저장: 위 조건 + 유지보수 쓰기 허용
- 유지보수 중 기존 시안 조회와 저장된 데이터의 Client PNG Export는 허용
- 삭제된 콘텐츠는 기본 목록에서 제외

도메인 감사 이벤트는 생성, 수정, 버전 생성, Source 갱신, 삭제를 기록한다. Source 갱신
감사에는 결과 ID와 Snapshot 버전만 저장하며 전체 Snapshot은 저장하지 않는다. Client에서 수행되는 PNG
Export는 서버에 요청하지 않으므로 서버 감사 이벤트를 만들지 않는다.
