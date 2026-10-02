import {
  type SpeechSession,
  mountSpeech,
} from "./vendor/topcit-speech/speech.mjs";

const excluded =
  "pre,table,figure,img,.comic-gen,.diagram-container,nav,button,[data-tts-exclude],.speech-notice";

/** 글 본문에만 TOPCIT2의 문단별 읽기 UI를 연결한다. */
export function mountPostSpeech(
  root: HTMLElement,
  onReady: () => void,
): SpeechSession {
  const marked = new Set<HTMLElement>();
  let bodyReady = false;
  root.setAttribute("data-tts-content", "");
  const mark = () => {
    root
      .querySelectorAll<HTMLElement>(
        ".toastui-editor-contents :is(p,h1,h2,h3,h4,h5,h6,li)",
      )
      .forEach((node) => {
        if (node.closest(excluded) || node.classList.contains("tts-readable"))
          return;
        node.classList.add("tts-readable");
        marked.add(node);
      });
    if (!bodyReady && marked.size > 0) {
      bodyReady = true;
      onReady();
    }
  };
  mark();
  const observer = new MutationObserver(mark);
  observer.observe(root, { childList: true, subtree: true });
  const cleanup = mountSpeech(root);
  return Object.assign(
    () => {
      observer.disconnect();
      cleanup();
      marked.forEach((node) => node.classList.remove("tts-readable"));
      root.removeAttribute("data-tts-content");
    },
    {
      readAll: (trigger: HTMLElement) => {
        mark();
        cleanup.readAll(trigger);
      },
    },
  );
}
