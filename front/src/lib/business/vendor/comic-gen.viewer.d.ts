export interface ComicViewerState {
    readonly zoom: number;
    readonly preventOverflow: boolean;
    /** Zero-based index in result.panels. */
    readonly panelIndex: number;
}
export interface ComicViewerOptions {
    /** Defaults to false, preserving existing backdrop behavior. */
    closeOnBackdrop?: boolean;
    /** Close when clicking empty reading-area space outside the artwork; defaults to false. */
    closeOnEmptyArea?: boolean;
    /** Defaults to true. Does not affect programmatic close(). */
    closeOnEscape?: boolean;
    /** Defaults to true; independent of other dismissal options. */
    showCloseButton?: boolean;
    /** Positive scale up to 10; defaults to 1. Fit may cap displayed size. */
    zoom?: number;
    /** Fit the largest individual panel in the viewport; defaults to true. */
    preventOverflow?: boolean;
    /** Initial zero-based panel index; defaults to 0. */
    panelIndex?: number;
    /** Called on open, view changes, and close (null). */
    onChange?: (state: Readonly<ComicViewerState> | null) => void;
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
    readonly state: Readonly<ComicViewerState> | null;
    setView(view: Partial<ComicViewerState>): void;
    open(result: ComicViewerResult, options?: ComicViewerOptions): void;
    close(): void;
    destroy(): void;
}
/** A renderer-independent viewer for completed synchronous or asynchronous results. */
export declare function createComicViewer(defaults?: ComicViewerOptions): ComicViewer;
/** Replace a host container with a preview card; call cleanup before replacing it. */
export declare function mountComicCard(container: HTMLElement, input: ComicViewerResult, options?: ComicViewerOptions): () => void;
export {};
export { createComicViewer as 만화뷰어만들기, mountComicCard as 만화카드붙이기 };
