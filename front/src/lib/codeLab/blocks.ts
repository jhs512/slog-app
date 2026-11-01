// Markdown 코드 블록 렌더러와 문서 화면을 잇는다. 렌더러는 실행용 블록에 표시만 남기고,
// 화면에 붙은 뒤 재생 버튼을 단다(Toast UI 의 HTML 정리 과정에서 이벤트가 사라지지 않게).
import { escapeHtml } from "../business/markdownUtils";
import { LabDefinition, parseLabFence } from "./lab";

interface Token {
  type: string;
  content?: string;
}

/**
 * 코드 블록 렌더 결과를 실험용으로 감싼다. 실행용이 아니면 null 을 돌려 기존 렌더를 쓰게 한다.
 * `render` 에는 하이라이트에 쓸 언어 이름을 넘긴다.
 */
export function renderLabBlock(
  info: string,
  source: string,
  render: (highlight: string) => Token[],
): Token[] | null {
  const fence = parseLabFence(info);
  if (!fence) return null;
  if (fence.kind === "unsupported") {
    return [
      ...render(fence.highlight),
      {
        type: "html",
        content: `<p class="code-lab-note" role="note">${escapeHtml(fence.reason)}</p>`,
      },
    ];
  }
  return [
    {
      type: "html",
      // Toast UI 의 HTML 정리는 `</style>` 같은 닫는 태그가 든 속성을 지우므로 인코딩해 담는다.
      content: `<div class="code-lab-block" data-code-lab-info="${encodeURIComponent(info)}" data-code-lab-source="${encodeURIComponent(source)}">`,
    },
    ...render(fence.lab.highlight),
    { type: "html", content: "</div>" },
  ];
}

export interface LabOpenRequest {
  lab: LabDefinition;
  source: string;
  trigger: HTMLButtonElement;
}

/**
 * 뷰어 안의 실행용 블록에 재생 버튼을 붙인다. 클릭은 root 에서 위임받아 처리하므로
 * 문서가 바뀌어 다시 관찰해도 이전 콜백이 남지 않는다. 반환 함수로 관찰을 끝낸다.
 */
export function observeLabBlocks(
  root: HTMLElement,
  onOpen: (request: LabOpenRequest) => void,
): () => void {
  const attach = () => {
    root
      .querySelectorAll<HTMLElement>(".code-lab-block[data-code-lab-info]")
      .forEach((block) => {
        if (block.querySelector(":scope > .code-lab-play")) return;
        const fence = parseLabFence(
          decodeURIComponent(block.dataset.codeLabInfo ?? ""),
        );
        if (fence?.kind !== "runnable") return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "code-lab-play";
        button.setAttribute("aria-label", `${fence.lab.title} 코드 실험 열기`);
        button.setAttribute("aria-haspopup", "dialog");
        button.title = "코드 실험 열기";
        button.textContent = "▶";
        block.prepend(button);
      });
  };
  const onClick = (event: MouseEvent) => {
    const button = (event.target as Element | null)?.closest?.(
      ".code-lab-play",
    );
    const block = button?.parentElement;
    if (!(button instanceof HTMLButtonElement) || !block) return;
    const fence = parseLabFence(
      decodeURIComponent(block.dataset.codeLabInfo ?? ""),
    );
    if (fence?.kind !== "runnable") return;
    onOpen({
      lab: fence.lab,
      source: decodeURIComponent(block.dataset.codeLabSource ?? ""),
      trigger: button,
    });
  };
  attach();
  root.addEventListener("click", onClick);
  const observer = new MutationObserver(attach);
  observer.observe(root, { childList: true, subtree: true });
  return () => {
    observer.disconnect();
    root.removeEventListener("click", onClick);
  };
}
