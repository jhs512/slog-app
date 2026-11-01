// 스타터킷은 개발 코드로만 추가·수정한다. 글은 `react-starter-1`처럼 이름과 번호로
// 참조하며, 같은 번호의 내용을 고치면 그 글에 반영되고 새 번호는 자동 적용되지 않는다.

export type StarterKitAsset = "react" | "tailwind";

export interface StarterKitVersion {
  title: string;
  assets: StarterKitAsset[];
  /** 사용자 코드가 그려질 문서 본문. `#root`에 App을 렌더링한다. */
  body: string;
  /** 렌더링 화면 기본 스타일. 사용자가 CSS로 덮어쓸 수 있다. */
  style: string;
}

export const STARTER_KITS: Record<string, Record<number, StarterKitVersion>> = {
  "react-starter": {
    1: {
      title: "React 19",
      assets: ["react"],
      body: '<div id="root"></div>',
      style: "body{margin:16px}",
    },
  },
  "react-tailwind-starter": {
    1: {
      title: "React 19 + Tailwind CSS 4",
      assets: ["react", "tailwind"],
      body: '<div id="root"></div>',
      style: "body{margin:16px}",
    },
  },
};

export type KitLookup =
  | { ok: true; name: string; version: number; kit: StarterKitVersion }
  | { ok: false; name: string; version: number; known: number[] };

/** 펜스 이름이 등록된 킷 이름이면 결과를, 아니면 null을 돌려준다. */
export function lookupKit(fenceName: string): KitLookup | null {
  for (const [name, versions] of Object.entries(STARTER_KITS)) {
    const match = fenceName.match(new RegExp(`^${name}-(\\d+)$`));
    if (!match) continue;
    const version = Number(match[1]);
    const kit = versions[version];
    if (kit) return { ok: true, name, version, kit };
    return {
      ok: false,
      name,
      version,
      known: Object.keys(versions).map(Number),
    };
  }
  return null;
}
