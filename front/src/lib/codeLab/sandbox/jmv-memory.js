// 메모리 패널 iframe(null origin) 안에서 Java-memory-visualizer 의 TraceView 를 띄운다.
// 부모가 보낸 실행 기록(doc)만 그리며 사용자 코드를 실행하지 않는다.
import { TraceView } from "./render.js";

const { token, hostOrigin } = window.__SLOG_JMV__;
let view = null;

window.addEventListener("message", (event) => {
  if (event.source !== window.parent || event.origin !== hostOrigin) return;
  const data = event.data;
  if (!data || data.channel !== "slog-code-lab-memory" || data.token !== token)
    return;
  view?.destroy();
  view = null;
  const root = document.getElementById("viz");
  const doc = data.doc;
  if (!doc?.trace?.length) {
    root.textContent =
      doc?.status === "compile_error"
        ? "컴파일 오류로 실행 기록이 없습니다. 콘솔을 확인하세요."
        : "실행 기록이 없습니다.";
    return;
  }
  view = new TraceView(root, doc);
});

window.parent.postMessage(
  { channel: "slog-code-lab-memory", token, type: "ready" },
  hostOrigin,
);
