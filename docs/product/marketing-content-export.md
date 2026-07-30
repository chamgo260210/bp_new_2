# 마케팅 콘텐츠 Export

## PNG 렌더링

Preview와 Export는 동일한 `marketingRenderer.js`의 Canvas Layout 함수를 사용한다.
Preview는 화면에 맞게 축소하지만 Export Canvas는 저장된 실제 width/height를 사용한다.
브라우저 폰트 로딩 완료 후 PNG Blob을 만들고 사용자의 장치로 다운로드한다.
한국어 줄바꿈은 `Intl.Segmenter`의 단어 경계를 우선 사용한다.

확인 항목:

- 결과 Pixel이 저장 규격과 일치하는지
- Headline 자동 줄바꿈과 최대 줄 수에서 잘림이 없는지
- CTA와 보조 문구가 안전 영역 안에 있는지
- Gradient/Pattern/투명도 결과가 Preview와 일치하는지
- 320px 및 4096px 경계 규격에서 브라우저 메모리 오류가 없는지
- 한국어 폰트 로딩 전 Export가 시작되지 않는지

Export Dialog는 파일명, 형식, 실제 Pixel, 비율, 배경 포함 여부를 표시한다. Headline,
Subheadline, 본문 또는 CTA가 Layout의 최대 줄/폭을 넘으면 경고를 표시하고 다운로드를
시작하지 않는다. 사용자가 카피나 크기를 조정한 후 다시 검사를 통과해야 한다.

## 현재 제한

- PNG만 지원한다.
- JPEG와 A4 PDF는 후속 범위다.
- 외부 URL 이미지를 Canvas에 사용하지 않는다.
- 이미지 업로드 Asset 계약이 없어 CORS 오염 가능성이 있는 이미지는 받지 않는다.
- Client-side Export이므로 서버 감사 로그에는 기록되지 않는다.

향후 동일 Origin Asset 서비스가 연결되면 MIME/확장자/파일 크기/Pixel 크기 검증과 안전한
Blob 전달을 먼저 추가한 뒤 이미지 배경과 로고를 Renderer 입력으로 확장한다.
