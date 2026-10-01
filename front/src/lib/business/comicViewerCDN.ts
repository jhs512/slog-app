type ViewerSDK = typeof import("./vendor/comic-gen.viewer");

export const COMIC_VIEWER_CDN =
  "https://cdn.jsdelivr.net/gh/jhs512/comic-gen@v0.5.0/cdn/comic-gen.viewer.js";

let pending: Promise<ViewerSDK> | undefined;
let attempt = 0;

/** 모든 블록이 공식 모듈 하나를 공유한다. 실패한 요청만 새 URL로 재시도한다. */
export function loadComicViewer(): Promise<ViewerSDK> {
  if (pending) return pending;
  const url = attempt++
    ? `${COMIC_VIEWER_CDN}?slog-retry=${attempt - 1}`
    : COMIC_VIEWER_CDN;
  pending = new Promise<ViewerSDK>((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error("공식 만화 뷰어 CDN 응답 시간이 초과되었습니다.")),
      15000,
    );
    // 브라우저의 ESM 로더를 사용한다. 번들·eval·로컬 복사 뷰어를 만들지 않는다.
    void import(/* webpackIgnore: true */ url)
      .then((sdk: ViewerSDK) => {
        if (
          typeof sdk.mountComicCard !== "function" ||
          typeof sdk.createComicViewer !== "function"
        )
          throw new Error("공식 만화 뷰어 API를 확인할 수 없습니다.");
        resolve(sdk);
      })
      .catch(reject)
      .finally(() => window.clearTimeout(timer));
  }).catch((error: unknown) => {
    pending = undefined;
    throw error;
  });
  return pending;
}
