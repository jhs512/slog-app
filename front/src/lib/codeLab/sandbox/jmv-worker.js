// Java-memory-visualizer(5762765)의 C·C++ 추적기를 그대로 부르는 실행 워커.
// language-worker.js 의 C/C++ 경로와 같고, 실행 중 입력 없이 선입력만 받는다.
// build-code-lab.mjs 가 public/code-lab/jmv/ 에 추적기 모듈과 함께 복사한다.
import { traceC } from "./c-tracer.js";

self.onmessage = async ({ data }) => {
  const { language, source, stdin } = data;
  try {
    if (language === "c") {
      const { default: engine } = await import("./c-engine.js");
      self.postMessage({ type: "ready" });
      self.postMessage({
        type: "result",
        doc: traceC(engine, { source, stdin }),
      });
    } else if (language === "cpp") {
      const { prepareCPP, traceCPP } = await import("./cpp-tracer.js");
      const runtime = await prepareCPP();
      self.postMessage({ type: "ready" });
      self.postMessage({
        type: "result",
        doc: await traceCPP({ source, stdin }, runtime),
      });
    } else {
      throw new Error("지원하지 않는 언어입니다.");
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      message: String(error?.message || error),
    });
  }
};
