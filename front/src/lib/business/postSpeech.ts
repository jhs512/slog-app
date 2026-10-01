import { mountSpeech } from "./vendor/topcit-speech/speech.mjs";

const excluded =
  "pre,.comic-gen,.diagram-container,nav,button,[data-tts-exclude],.speech-notice";

/** 글 본문에만 TOPCIT2의 문단별 읽기 UI를 연결한다. */
export function mountPostSpeech(root: HTMLElement): () => void {
  const marked = new Set<HTMLElement>();
  root.setAttribute("data-tts-content", "");
  const mark = () => {
    root
      .querySelectorAll<HTMLElement>(
        ".toastui-editor-contents :is(p,h1,h2,h3,h4,h5,h6,li,td,th)",
      )
      .forEach((node) => {
        if (node.closest(excluded) || node.classList.contains("tts-readable"))
          return;
        node.classList.add("tts-readable");
        marked.add(node);
      });
  };
  mark();
  const observer = new MutationObserver(mark);
  observer.observe(root, { childList: true, subtree: true });
  const cleanup = mountSpeech(root);
  return () => {
    observer.disconnect();
    cleanup();
    marked.forEach((node) => node.classList.remove("tts-readable"));
    root.removeAttribute("data-tts-content");
  };
}
