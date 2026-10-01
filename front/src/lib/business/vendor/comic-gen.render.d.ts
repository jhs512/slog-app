export interface RenderOptions {
    너비?: number;
    글꼴?: string;
    글꼴버전?: string;
    컷비율?: "기본" | "모바일" | "compact" | "phone";
    width?: number;
    font?: string;
    fontVersion?: string;
    panelFormat?: "compact" | "phone" | "기본" | "모바일";
}
export interface RenderResult {
    svg: string;
    width: number;
    height: number;
    diagnostics: string[];
    cache?: {
        hits: number;
        misses: number;
        bytes: number;
    };
}
export interface PanelResult extends RenderResult {
    index: number;
}
export interface PanelsResult extends RenderResult {
    panels: PanelResult[];
}
export declare function createRenderer(maxCacheBytes?: number): {
    render: (source: string, options?: RenderOptions) => PanelsResult;
    renderPanels: (source: string, options?: RenderOptions) => PanelsResult;
    renderAsync: (source: string, options?: RenderOptions) => Promise<PanelsResult>;
    renderPanelsAsync: (source: string, options?: RenderOptions) => Promise<PanelsResult>;
    clearCache: () => void;
};
export declare const renderComic: (source: string, options?: RenderOptions) => PanelsResult;
export declare const renderPanels: (source: string, options?: RenderOptions) => PanelsResult;
export declare const renderComicAsync: (source: string, options?: RenderOptions) => Promise<PanelsResult>;
export declare const renderPanelsAsync: (source: string, options?: RenderOptions) => Promise<PanelsResult>;

export declare function downloadBlob(blob: Blob, filename: string): void;
export declare function exportPng(result: RenderResult, scale?: number): Promise<Blob>;

export declare const assetVersion = "1";
/** The authored Korean surface normalizes into the existing resolved English model. */
declare const syntaxFields: {
    readonly comic: {
        readonly title: "제목";
        readonly cast: "등장인물";
        readonly panels: "컷";
    };
    readonly cast: {
        readonly asset: "그림";
        readonly label: "이름표";
    };
    readonly panel: {
        readonly mode: "구성";
        readonly actors: "인물";
        readonly dialogue: "대사";
        readonly transfer: "전달";
        readonly removeActors: "제외인물";
        readonly diagram: "다이어그램";
    };
    readonly actor: {
        readonly id: "식별자";
        readonly expression: "표정";
        readonly gesture: "손모양";
        readonly holding: "든소품";
        readonly x: "가로위치";
        readonly y: "세로위치";
        readonly scale: "배율";
    };
    readonly dialogue: {
        readonly from: "화자";
        readonly to: "상대";
        readonly text: "내용";
        readonly x: "가로위치";
        readonly y: "세로위치";
        readonly fontSize: "글자크기";
    };
    readonly transfer: {
        readonly from: "주는인물";
        readonly to: "받는인물";
        readonly prop: "소품";
    };
    readonly diagram: {
        readonly type: "종류";
        readonly source: "원문";
        readonly title: "제목";
        readonly height: "높이";
    };
    readonly options: {
        readonly width: "너비";
        readonly font: "글꼴";
        readonly fontVersion: "글꼴버전";
        readonly panelFormat: "컷비율";
    };
};
declare const syntaxValues: {
    readonly asset: {
        readonly client: "클라이언트";
        readonly server: "서버";
        readonly database: "데이터베이스";
    };
    readonly expression: {
        readonly neutral: "보통";
        readonly happy: "기쁨";
        readonly confused: "어리둥절";
        readonly sad: "슬픔";
        readonly angry: "화남";
    };
    readonly gesture: {
        readonly wave: "인사손";
        readonly point: "가리키는손";
    };
    readonly prop: {
        readonly request: "요청";
        readonly data: "데이터";
        readonly key: "열쇠";
    };
    readonly mode: {
        readonly full: "전체";
        readonly before: "이전";
    };
    readonly panelFormat: {
        readonly compact: "기본";
        readonly phone: "모바일";
    };
    readonly diagramType: {
        readonly mermaid: "머메이드";
    };
};

export { renderComic as 만화그리기, renderPanels as 컷그리기, createRenderer as 렌더러만들기, renderComicAsync as 만화그리기비동기, renderPanelsAsync as 컷그리기비동기, syntaxFields as 문법항목, syntaxValues as 문법값 };
