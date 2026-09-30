/** Comic Gen v0.2.1에서 사용하는 공개 API. 원본 출처는 README.md 참고. */
export function renderPanels(
  source: string,
  options: { width: number; panelFormat: "phone" | "compact" },
): {
  diagnostics: string[];
  panels: { svg: string; width: number; height: number; index: number }[];
};
