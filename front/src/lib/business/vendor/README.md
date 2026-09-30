# Comic Gen v0.3.0

`comic-gen.js`는 공개된 단일 파일 SDK를 수정 없이 포함한다. YAML 파서와 SVG 에셋이 포함되어 런타임 CDN 요청 없이 브라우저에서 렌더링한다.

- 출처: https://cdn.jsdelivr.net/gh/jhs512/comic-gen@v0.3.0/cdn/comic-gen.js
- 저장소: https://github.com/jhs512/comic-gen/tree/v0.3.0
- 태그 커밋: `290d54fbbd1b44a9c0c3e691f64d5bf1428d40d1`
- SHA-256: `ebe81ba4771ae843dd6bef196f6eed3a5eecd78f66ca22dd3b143bbad3b8874d`

업데이트할 때 새 공개 태그의 SDK를 다운로드하고 해시·선언 파일을 갱신한 뒤 `pnpm exec playwright test --config playwright.rendering.config.ts`로 카드와 PC/모바일 뷰어를 확인한다. `main` URL이나 미배포 파일은 사용하지 않는다.

번들에 포함된 YAML 파서의 저작권·ISC 라이선스 고지는 `YAML-LICENSE`에 보관한다. Slog에서는 `renderComic`의 전체 SVG와 첫 컷 SVG를 사용하며 SDK의 DOM 삽입 API 대신 SVG를 Blob 이미지로 표시한다.

카드·뷰어 UX는 comic-gen의 로컬 src/embed.ts, src/embed-styles.ts 구현을 참고해 Slog의 comicViewer.ts와 globals.css에 적용했다. SDK 번들은 공개 v0.3.0을 그대로 유지하고, 사용자 SVG를 DOM에 삽입하지 않으며 미리보기 삭제 시 뷰어와 Blob URL을 정리한다.
