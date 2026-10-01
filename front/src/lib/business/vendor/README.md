# Comic Gen v0.5.0

공개 렌더 전용 SDK와 선택형 뷰어를 수정 없이 포함한다. Slog는 `renderComicAsync` 결과를 공용 `mountComicCard`에 전달하고 반환된 cleanup으로 뷰어·Blob URL·스타일을 정리한다. 별도 뷰어·컷 이동 구현은 유지하지 않는다. 렌더 전용 파일은 뷰어를, 뷰어 전용 파일은 렌더러·YAML·Mermaid를 import하지 않는다.

- 출처: https://cdn.jsdelivr.net/gh/jhs512/comic-gen@v0.5.0/cdn/ 아래 파일
- 저장소: https://github.com/jhs512/comic-gen/tree/v0.5.0
- 태그 커밋: `3f42d174414cf8e321791c92b9548626a3fe6d9d`

| 파일                  | SHA-256                                                            |
| --------------------- | ------------------------------------------------------------------ |
| comic-gen.render.js   | `05d9336f9c37e59a3b2b921cce12fef49cc34ec58c62b1b6abde3611d9324be6` |
| comic-gen.render.d.ts | `cd3ad67ec94051147e50fa232b31bcdbd13edea1c03601ae615bf4b837652ecc` |
| comic-gen.viewer.js   | `d929b496776ae0a91d6e5bb80e1ac3cad22cd8fddf1c843d352042ecaa91dbaa` |
| comic-gen.viewer.d.ts | `e97ef5e7de567e56f54e24545963e981718c46ebe92ea298c127bfa0ba1bbbb9` |

일반 만화는 런타임 CDN 요청 없이 렌더링한다. 다이어그램 컷은 필요할 때만 v0.5.0의 `cdn/comic-gen.mermaid.js`와 Mermaid 11.17.2의 https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.esm.min.mjs 및 같은 경로의 ESM 청크를 불러온다. 격리된 프레임에서 모듈을 로드하여 Monaco의 AMD 전역을 변경하지 않는다. 사용자 SVG는 Blob 이미지로 표시한다.

비동기 SDK는 AbortSignal을 받지 않는다. Slog는 블록 수명을 렌더 전후에 검사해 삭제·교체된 블록의 늦은 완료 결과를 버린다. SDK의 임시 Mermaid DOM은 SDK가 finally에서 해제한다.

업데이트할 때 공개 태그의 JS와 선언 파일을 다운로드하고 해시를 갱신한 뒤 `pnpm exec playwright test --config playwright.rendering.config.ts`로 일반 만화·UML·PC/모바일·VS CODE 미리보기를 확인한다. `main` URL이나 미배포 파일은 사용하지 않는다. `.gitattributes`로 원본 바이트를 보존하며 vendor 파일을 포맷하지 않는다.

번들 YAML 파서의 저작권·ISC 라이선스 고지는 `YAML-LICENSE`에 보관한다.
