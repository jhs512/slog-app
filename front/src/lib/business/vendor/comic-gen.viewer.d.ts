export interface ComicViewerOptions {
    /** The connected element to focus when this reading session closes. */
    trigger?: HTMLElement;
}
interface ComicViewerImage {
    svg: string;
    width: number;
    height: number;
    diagnostics?: readonly string[];
}
export interface ComicViewerPanel extends ComicViewerImage {
    index: number;
}
export interface ComicViewerResult extends ComicViewerImage {
    panels: readonly ComicViewerPanel[];
}
export interface ComicViewer {
    readonly isOpen: boolean;
    open(result: ComicViewerResult, options?: ComicViewerOptions): void;
    close(): void;
    destroy(): void;
}
/** A renderer-independent viewer for completed synchronous or asynchronous results. */
export declare function createComicViewer(): ComicViewer;
/** Replace a host container with a preview card; call cleanup before replacing it. */
export declare function mountComicCard(container: HTMLElement, input: ComicViewerResult): () => void;
export {};
export { createComicViewer as 만화뷰어만들기, mountComicCard as 만화카드붙이기 };
