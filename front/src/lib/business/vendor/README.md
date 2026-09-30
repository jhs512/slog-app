# Comic Gen v0.2.1

`comic-gen.js`는 공개된 단일 파일 SDK를 수정 없이 포함한다. YAML 파서와 SVG 에셋이 포함되어 런타임 CDN 요청 없이 브라우저에서 렌더링한다.

- 출처: https://cdn.jsdelivr.net/gh/jhs512/comic-gen@v0.2.1/cdn/comic-gen.js
- 저장소: https://github.com/jhs512/comic-gen/tree/v0.2.1
- 태그 커밋: `04eff00ef7a4a91585f80c91dd478519f070d448`
- SHA-256: `ab48007219b734be76064321ee5fedfdeb2415089563e14ddcf8625babe96c1e`

업데이트할 때 새 공개 태그의 SDK를 다운로드하고 해시·선언 파일을 갱신한 뒤 `pnpm exec playwright test --config playwright.rendering.config.ts`로 컷별 출력을 확인한다. `main` URL이나 미배포 파일은 사용하지 않는다.

번들에 포함된 YAML 파서의 저작권·ISC 라이선스 고지는 `YAML-LICENSE`에 보관한다. slog에서는 `renderPanels`만 사용하며 SDK의 DOM 삽입 API 대신 SVG를 Blob 이미지로 표시한다.
