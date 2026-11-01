// 코드 실험의 브라우저 런타임을 public/code-lab/ 에 만든다. dev/build 전에 실행된다.
// 사용자 코드는 이 파일들을 받아 브라우저 안에서만 컴파일·실행한다.
import { build } from "esbuild";
import { createReadStream, createWriteStream } from "node:fs";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { createGzip } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "code-lab");
const require = createRequire(import.meta.url);
const src = (path) => join(root, "src", "lib", path);

await mkdir(out, { recursive: true });

const bundles = [
  ["codeLab/sandbox/runtime.ts", "runtime.js"],
  ["codeLab/sandbox/compiler.worker.ts", "compiler.js"],
  ["codeLab/sandbox/react.ts", "react-19.js"],
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

// ─── C·C++·Python·Java·JS 메모리 비주얼라이저 (Java-memory-visualizer 5762765) ───
// 검증된 추적기·렌더러는 vendor/jmv 에 원본 그대로 두고, 아래 PATCHES 만 복사할 때 적용한다.
// 원본이 바뀌어 기준 문자열이 없으면 빌드를 멈춰 조용히 어긋나지 않게 한다.
const jmv = join(out, "jmv");
const jmvVendor = src("business/vendor/jmv");
const browsercc = join(jmv, "browsercc-0.1.1");
await mkdir(join(jmv, "licenses"), { recursive: true });
await mkdir(browsercc, { recursive: true });

const PATCHES = {
  // CheerpJ 의 /app/ 은 실행기 출처의 루트다. Java 자산을 이 폴더 아래로 옮긴다.
  "runtime-config.js": [
    [
      "export const VENDOR = '/app/web/vendor';",
      "export const VENDOR = '/app/code-lab/jmv/java';",
    ],
  ],
  "language-worker.js": [
    [
      "await import('/web/vendor/pyodide-314.0.7/pyodide.mjs')",
      "await import(new URL('./pyodide-314.0.7/pyodide.mjs',import.meta.url).href)",
    ],
    [
      "loadPyodide({ indexURL: '/web/vendor/pyodide-314.0.7/' })",
      "loadPyodide({ indexURL: new URL('./pyodide-314.0.7/',import.meta.url).href })",
    ],
  ],
  "cpp-tracer.js": [
    // 원본은 사이트 루트의 /web/vendor 를 쓴다. 이 모듈 옆 폴더로 바꾼다.
    [
      "const BASE='/web/vendor/browsercc-0.1.1/';",
      "const BASE=new URL('./browsercc-0.1.1/',import.meta.url).href;",
    ],
    // AST 단계 진단은 namespace 감싸기 앞부분 줄 수만큼 밀려 있다. 원래 줄 번호로 되돌린다.
    [
      "if(astCompiler.callMain(astArgs)!==0)return diagnostic(errors);",
      "if(astCompiler.callMain(astArgs)!==0){const shift=(new TextDecoder().decode(new TextEncoder().encode(wrapped.source).slice(0,wrapped.prefixBytes)).match(/\\n/g)||[]).length;return diagnostic(errors.replace(/main\\.cpp:(\\d+):/g,(_,n)=>`main.cpp:${Math.max(1,Number(n)-shift)}:`).replace(/^(\\s*)(\\d+)( \\|)/gm,(_,a,n,b)=>a+Math.max(1,Number(n)-shift)+b));}",
    ],
  ],
};

/** 텍스트 모듈에만 패치를 적용하고 jar 같은 이진 파일과 하위 폴더는 그대로 복사한다. */
async function copyTree(from, to) {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const source = join(from, entry.name);
    const target = join(to, entry.name);
    if (entry.isDirectory()) {
      await copyTree(source, target);
    } else if (PATCHES[entry.name]) {
      let text = await readFile(source, "utf8");
      for (const [before, after] of PATCHES[entry.name]) {
        if (!text.includes(before))
          throw new Error(`${entry.name} 패치 기준이 없습니다: ${before}`);
        text = text.replace(before, () => after);
      }
      await writeFile(target, text);
    } else if (entry.name !== "README.md") {
      await copyFile(source, target);
    }
  }
}
await copyTree(jmvVendor, jmv);
for (const file of ["jmv-memory.js", "jmv-runner.js", "jmv-runner.html"]) {
  await copyFile(
    src(`codeLab/sandbox/${file}`),
    join(jmv, file === "jmv-runner.html" ? "runner.html" : file),
  );
}

const pyodide = join(jmv, "pyodide-314.0.7");
await mkdir(pyodide, { recursive: true });
const pyDist = dirname(require.resolve("pyodide/package.json"));
for (const file of [
  "pyodide.mjs",
  "pyodide.asm.mjs",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json",
]) {
  await copyFile(join(pyDist, file), join(pyodide, file));
}

const ccDist = join(dirname(require.resolve("browsercc/package.json")), "dist");
for (const file of ["clang.js", "lld.js"]) {
  await copyFile(join(ccDist, file), join(browsercc, file));
}
await copyFile(
  join(dirname(require.resolve("browsercc/package.json")), "LICENSE"),
  join(jmv, "licenses", "browsercc-LICENSE"),
).catch(() => {});
// 컴파일러·sysroot 는 원본 운영과 같이 gzip 으로 두고 브라우저가 DecompressionStream 으로 푼다.
// 압축이 오래 걸리므로 원본보다 새 결과가 있으면 다시 만들지 않는다.
await Promise.all(
  ["clang.wasm", "lld.wasm", "sysroot.tar"].map(async (file) => {
    const from = join(ccDist, file);
    const to = join(browsercc, `${file}.gz`);
    const [source, target] = await Promise.all([
      stat(from),
      stat(to).catch(() => null),
    ]);
    if (target && target.mtimeMs >= source.mtimeMs && target.size > 0) return;
    await pipeline(
      createReadStream(from),
      createGzip({ level: 9 }),
      createWriteStream(to),
    );
  }),
);
