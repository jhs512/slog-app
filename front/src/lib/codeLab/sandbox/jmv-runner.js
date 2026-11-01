// 코드 실험 실행기. 슬로그와 다른 사이트에서 열린 iframe 안에서 Java-memory-visualizer 의
// language-runtime.js(C·C++·Python·JS Worker)와 runtime.js(Java/CheerpJ)를 그대로 부른다.
// 부모가 ?host= 로 알려 준 출처의 메시지만 받는다.
import { cancelLanguageRun, runLanguage } from "./language-runtime.js";

const CHANNEL = "slog-jmv-runner";
const host = new URLSearchParams(location.search).get("host");
let java = null;

const send = (message) =>
  window.parent.postMessage({ channel: CHANNEL, ...message }, host);

async function run({ id, language, source, stdin }) {
  const status = (text) => send({ type: "status", id, text });
  try {
    let doc;
    if (language === "java") {
      java ??= import("./runtime.js");
      const { runJava } = await java;
      doc = await runJava({ source, stdin, objects: true }, status);
    } else {
      doc = await runLanguage({ language, source, stdin }, status);
    }
    send({ type: "result", id, doc });
  } catch (error) {
    send({ type: "error", id, message: String(error?.message || error) });
  }
}

window.addEventListener("message", (event) => {
  if (!host || event.source !== window.parent || event.origin !== host) return;
  const data = event.data;
  if (data?.channel !== CHANNEL) return;
  if (data.type === "cancel") cancelLanguageRun();
  else if (data.type === "run") run(data);
});

if (host) send({ type: "ready" });
