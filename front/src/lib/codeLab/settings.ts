import { ENGINE_PANELS, LabEngine, PANEL_IDS, PanelId } from "./lab";

export const LAYOUTS = ["side", "stack", "columns"] as const;
export type LayoutId = (typeof LAYOUTS)[number];

export const LAYOUT_LABELS: Record<LayoutId, string> = {
  side: "코드 왼쪽",
  stack: "코드 위",
  columns: "가로 나열",
};

/** 화면 설정만 저장한다. 코드·입력·출력·실행 상태는 저장하지 않는다. */
export interface WorkspaceSettings {
  layout: LayoutId;
  open: PanelId[];
  /** 패널(및 코드 외 묶음 `rest`)의 상대 크기 */
  weights: Partial<Record<PanelId | "rest", number>>;
}

const KEY_PREFIX = "slog.codeLab.settings.v1.";

export function defaultSettings(engine: LabEngine): WorkspaceSettings {
  return { layout: "side", open: [...ENGINE_PANELS[engine]], weights: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** 저장값은 외부 입력이므로 엔진이 지원하는 패널만 남기고 나머지는 기본값으로 되돌린다. */
export function parseSettings(
  engine: LabEngine,
  raw: unknown,
): WorkspaceSettings {
  const fallback = defaultSettings(engine);
  if (!isRecord(raw)) return fallback;
  const available = ENGINE_PANELS[engine];
  const layout = LAYOUTS.find((id) => id === raw.layout) ?? fallback.layout;
  const open = Array.isArray(raw.open)
    ? available.filter((id) => (raw.open as unknown[]).includes(id))
    : fallback.open;
  const weights: WorkspaceSettings["weights"] = {};
  if (isRecord(raw.weights)) {
    for (const key of [...PANEL_IDS, "rest"] as const) {
      const value = raw.weights[key];
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        weights[key] = Math.min(Math.max(value, 0.05), 20);
      }
    }
  }
  return { layout, open, weights };
}

export function loadSettings(engine: LabEngine): WorkspaceSettings {
  try {
    const stored = localStorage.getItem(KEY_PREFIX + engine);
    return parseSettings(engine, stored ? JSON.parse(stored) : null);
  } catch {
    return defaultSettings(engine);
  }
}

export function saveSettings(engine: LabEngine, settings: WorkspaceSettings) {
  try {
    localStorage.setItem(KEY_PREFIX + engine, JSON.stringify(settings));
  } catch {
    // 저장소가 막힌 환경에서는 현재 팝업에서만 설정을 유지한다.
  }
}
