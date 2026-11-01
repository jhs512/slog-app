// 코드 실험의 브라우저 런타임을 public/code-lab/ 에 만든다. dev/build 전에 실행된다.
// 사용자 코드는 이 파일들을 받아 브라우저 안에서만 컴파일·실행한다.
import { build } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "code-lab");
const require = createRequire(import.meta.url);
const src = (path) => join(root, "src", "lib", path);

await mkdir(out, { recursive: true });

const bundles = [
  ["codeLab/sandbox/runtime.ts", "runtime.js"],
  ["codeLab/sandbox/compiler.worker.ts", "compiler.js"],
  ["codeLab/sandbox/react.ts", "react-19.js"],
  ["business/vendor/c-it/engine/worker.ts", "c-worker.js"],
];

await Promise.all(
  bundles.map(([entry, file]) =>
    build({
      entryPoints: [src(entry)],
      outfile: join(out, file),
      bundle: true,
      format: "iife",
      target: "es2020",
      minify: file !== "runtime.js",
      define: { "process.env.NODE_ENV": '"production"' },
      logLevel: "warning",
    }),
  ),
);

await Promise.all([
  copyFile(
    require.resolve("@babel/standalone/babel.min.js"),
    join(out, "babel.min.js"),
  ),
  copyFile(require.resolve("@tailwindcss/browser"), join(out, "tailwind-4.js")),
  copyFile(
    join(
      dirname(require.resolve("pretendard/package.json")),
      "dist/web/variable/woff2/PretendardVariable.woff2",
    ),
    join(out, "PretendardVariable.woff2"),
  ),
]);
