export interface ComicResult {
  svg: string;
  width: number;
  height: number;
  diagnostics: string[];
  panels: { svg: string; width: number; height: number; index: number }[];
}
/** Comic Gen v0.2.1 공개 API. 원본 출처는 README.md 참고. */
export function renderComic(
  source: string,
  options?: { width?: number; panelFormat?: "phone" | "compact" },
): ComicResult;
export function renderPanels(
  source: string,
  options?: { width?: number; panelFormat?: "phone" | "compact" },
): ComicResult;
