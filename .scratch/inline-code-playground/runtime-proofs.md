# 런타임 실증 결과: Java · C++ · Rust · Go (티켓 01 잔여분)

검증일 2026-11-01. 브라우저는 Playwright headless Chromium(HeadlessChrome/151)이고, `front/node_modules/@playwright/test`의 `chromium.launch()`로 띄웠다. 내려받은 자산과 스크립트는 저장소 밖 `C:/Users/jangk/AppData/Local/Temp/codelab-probe/`에 있다(`scripts/`는 직접 작성한 하네스, 나머지는 받은 자산).

판정 표기는 세 가지다. VERIFIED는 headless Chromium에서 직접 컴파일·실행까지 확인한 것, NOT VERIFIED는 확인하지 못한 것, EXCLUDED는 근거가 있어 제외한 것이다.

## 요약

| 언어 | 후보 | 판정 | 실행 위치 | 다운로드 크기 | COOP/COEP | 선입력(stdin) |
|---|---|---|---|---|---|---|
| C++ | wasm-clang (binji, clang 8.0.1 + lld + libc++) | VERIFIED | 로컬 정적 서버(자체 호스팅) | 원본 60.4MB / gzip 약 19MB | 불필요 (`crossOriginIsolated=false`에서 동작) | VERIFIED |
| C++ | JSCPP 2.0.9 (인터프리터) | VERIFIED, 그러나 C++로는 부적합 | 로컬 정적 서버 | 402KB / gzip 73KB | 불필요 | VERIFIED |
| Java | TeaVM 온라인 javac (teavm-javac, wasm-gc) | VERIFIED (부분 지원) | 로컬 정적 서버(teavm.org 자산 미러) | 약 7MB (디버그 파일 제외 시 약 6MB) | 불필요 | 미지원 (Scanner 없음, `System.in` null) |
| Java | CheerpJ | EXCLUDED | - | - | - | - |
| Rust | rubrc v1 (rustc + LLVM wasm32-wasip1) | VERIFIED, 단 조건부 | 공개 정적 데모 `rubrc.pages.dev/v1/` | brotli 약 57MB | 필요 (SharedArrayBuffer) | 미지원 (`os error 58`) |
| Go | GopherJS 플레이그라운드 1.20.1 (go1.20.14) | VERIFIED | 공개 정적 데모 `gopherjs.github.io/playground/` | gzip 약 4.3MB와 import 패키지 zip | 불필요 | 미지원 (`read /dev/stdin: not implemented on js`) |

Rust와 Go는 공개 정적 사이트에서 검증했고 자체 호스팅 미러는 돌려보지 않았다. 두 경우 모두 네트워크 요청은 정적 자산 호스트(`rubrc.pages.dev`, `oligamiq.github.io`, `gopherjs.github.io`, UI용 `esm.sh`)뿐이었고, 컴파일·실행 API 호출은 없었다. 사용자 소스는 브라우저 안에서 컴파일됐다. 미리 컴파일된 사용자 WASM을 실행한 것이 아니다.

## C++

### wasm-clang (권장)

- 자산 출처는 `https://binji.github.io/wasm-clang/{clang,lld,memfs,sysroot.tar,shared.js}`이고, 리포는 `binji/wasm-clang`(Apache-2.0, 마지막 push 2023-12)이다. 바이너리는 LLVM 8.0.1(Apache-2.0 with LLVM exception)과 wasi-libc, libc++이다.
- 크기(원본 / gzip -9)는 다음과 같다.
  - clang: 31,214,472 / 10,519,136
  - lld: 19,490,094 / 6,705,467
  - sysroot.tar: 9,297,920 / 1,812,655
  - memfs: 345,442 / 18,558
  - shared.js: 23,973
- 서버 응답에 COOP/COEP 헤더가 없었고, 페이지는 `crossOriginIsolated=false`였다. SharedArrayBuffer 없이 동작한다.
- 실행 결과(로컬 정적 서버, 하네스 `scripts/wasmclang/run.cjs`, 결과 `scripts/wasmclang/result.json`):
  - `vector`, `string`, `map`, `struct`/집합 초기화, `class`, range-for, `cin` 선입력(`"5\n5 3 1 4 2\nslog\n"`)을 넣은 프로그램은 exit 0으로 끝났다. 출력은 `map=2`, `1 2 3 4 5`, `sum=15 name=slog len=4`, `12`였다. 콜드 기준 시간은 ready 50ms, 컴파일 1.24s(clang 모듈 컴파일 포함), 링크 126ms, 실행 10ms였다.
  - 컴파일 오류는 clang 진단으로 나온다(`test.cc:2:22: error: expected expression`, `use of undeclared identifier 'y'`). 진단은 `-fcolor-diagnostics` 때문에 ANSI 색 코드가 섞여 나온다.
  - `return 3`은 `ProcExit(3)`으로 종료 코드 3을 얻는다.
  - 무한 루프는 8초 타임아웃 뒤 `worker.terminate()`로 멈췄다. 이후 새 Worker에서 다음 실행이 정상 동작했다.
- 알려진 한계:
  - `std::sort`를 쓰면 링크에서 실패한다(`wasm-ld: error: libc++.a(algorithm.cpp.obj): undefined symbol: __lttf2`). compiler-rt builtins(long double 비교)가 sysroot에 없기 때문이다. 해결하려면 builtins를 다시 빌드해 넣거나 `__lttf2` 등을 스텁으로 링크해야 한다. 이 해결책은 검증하지 않았다.
  - clang 8은 2019년 버전이다. C++17 일부와 C++20은 기대하기 어렵다(표준 플래그는 따로 검증하지 않음).
  - 같은 툴체인에서 `-x c`로 바꾸면 C도 컴파일된다(코드상 확인, C 실행은 미검증). 부모 쪽 C 구현과 툴체인을 공유할 수 있다.

#### 통합 레시피 (검증한 그대로)

1. 위 다섯 파일을 정적 자산으로 둔다(예: `/codelab/cpp/`). `Content-Type: application/wasm`은 필요 없다. 코드가 `WebAssembly.compile(arrayBuffer)`를 쓴다.
2. 전용 Worker 파일:

```js
self.importScripts('shared.js');           // 전역 API, MemFS 정의
let phase = 'init';
const api = new API({
  readBuffer: async (f) => (await fetch(f)).arrayBuffer(),
  compileStreaming: async (f) => WebAssembly.compile(await (await fetch(f)).arrayBuffer()),
  hostWrite: (s) => self.postMessage({ type: 'write', phase, s }),   // 진단·stdout 모두 여기로
});
self.onmessage = async ({ data: { code, input } }) => {
  try {
    await api.ready;                                         // memfs + sysroot untar
    phase = 'compile'; await api.compile({ input: 'test.cc', contents: code, obj: 'test.o' });
    phase = 'link';    await api.link('test.o', 'test.wasm');
    const mod = await WebAssembly.compile(api.memfs.getFileContents('test.wasm'));
    api.memfs.setStdinStr(input);                            // 선입력 전체를 stdin으로
    phase = 'run';
    let exit = 0;
    try { await api.run(mod, 'test.wasm'); } catch (x) { exit = x.code ?? 'trap:' + x.message; }
    self.postMessage({ type: 'done', exit });
  } catch (x) { self.postMessage({ type: 'fail', phase, msg: String(x.message || x) }); }
};
```

3. 출력은 `hostWrite` 문자열 조각으로 온다. `phase`로 컴파일 진단, 링크, 프로그램 stdout을 나눈다. `API.run`/`hostLog`가 넣는 `> clang -cc1 ...` 줄과 ANSI 코드는 UI에서 걸러낸다. 진단 단계에서는 `-fcolor-diagnostics`를 빼는 패치도 고려한다.
4. 중지는 메인 스레드 타이머에서 `worker.terminate()`로 한다. 종료 뒤 Worker를 새로 만들면 clang과 lld 모듈 캐시(`moduleCache`)가 사라진다. 다음 실행 때 HTTP 캐시에서 다시 받아 `WebAssembly.compile`을 다시 한다(로컬 측정 약 1초).
5. 라이선스 고지 대상은 Apache-2.0(wasm-clang)과 LLVM/libc++/wasi-libc다.

### JSCPP 2.0.9 (C++로는 부적합)

- npm `JSCPP@2.0.9`, MIT 라이선스이고 마지막 수정은 2022-06이다. 의존성은 `lodash`, `pegjs-util`, `printf`다.
- 번들은 `esbuild worker-entry.js --bundle --minify --format=iife --platform=browser --alias:util=<shim> --alias:stream=<shim>`로 만들었다. `printf`가 node `util`·`stream`을 require해서 shim이 필요했다. 결과는 402,274B, gzip 73,480B다.
- API는 `JSCPP.run(code, inputString, { stdio: { write: s => ... } })`가 종료 코드를 동기로 반환한다. stdin은 두 번째 인자의 문자열이다. Worker 안에서 실행하고 `terminate()`로 멈춘다.
- 결과(하네스 `scripts/cpp/run.cjs`, 결과 `scripts/cpp/result.json`):
  - `cin` 루프, 배열, `char[]` 입력, `<cstring>`은 동작했다(`5 4 3 2 1 \nsum=15`).
  - `<vector>`는 `cannot find library: vector`, `<string>`은 `cannot find library: string`으로 실패했다.
  - `struct P` 파라미터는 `type struct P is not defined`, `class`는 파싱 실패였다.
  - 문법 오류는 PEG 파서 메시지(`line 3 (column 22) ... Expected ...`)로 나오고, 미선언 변수는 `3:22 variable y does not exist`로 나온다.
  - 무한 루프는 terminate로 멈췄다.
- 결론적으로 README에도 "Object-oriented features, Namespaces 미구현"이라고 적혀 있다. 일반 C++ 학습 예제를 받기 어렵다. "C 서브셋 인터프리터"로만 쓸 수 있다.

## Java

### TeaVM 온라인 javac (VERIFIED, 부분 지원)

- 출처는 `https://teavm.org/playground/`(Apache 디렉터리 리스팅)이고 UI HTML은 `/playground/2/`다. 소스는 `konsoletyper/teavm-javac`로, OpenJDK javac와 TeaVM을 TeaVM으로 하나의 wasm-gc 모듈로 컴파일한 것이다. TeaVM은 Apache-2.0이다. javac는 OpenJDK 유래라 GPLv2+Classpath Exception으로 추정되는데, teavm-javac 리포에 LICENSE 파일이 없다(GitHub API `license` NotFound). 배포 전에 저자에게 확인해야 한다.
- 실제로 받은 자산(바이트)은 다음과 같다.
  - `compiler.wasm` 4,126,432
  - `runtime-classlib-teavm.bin` 2,377,497
  - `compile-classlib-teavm.bin` 199,668
  - `compiler.wasm.teadbg` 1,047,320 (디버그용, 생략 가능)
  - `compiler.wasm-runtime.js` 11,642
  - `frame.js` 1,960
  - `worker.js` 289
  - UI(`wasm-gc/ui.wasm` 등) 약 0.1MB
- wasm-gc가 필요하다(Chrome 119+). `crossOriginIsolated=false`에서 동작했다.
- 흐름: Worker(`worker.js`가 `compiler.wasm`의 `installWorker()` 호출)에서 javac와 TeaVM이 Java 소스를 wasm으로 컴파일한다. 결과 wasm을 iframe(`frame.js`)에서 `load(bytes, { installImports(o){ o.teavmConsole.putcharStdout = ... } })`로 실행하고, stdout은 글자 단위 콜백으로 받는다.
- 결과(로컬 미러, 하네스 `scripts/java/run.cjs`):
  - ArrayList, `Collections.sort`, HashMap, record, stream, `toList`, 람다, 제네릭, 인터페이스와 추상 클래스, StringBuilder, `Math.sqrt`, `String.format("%d-%s")`는 동작했다. Run 클릭부터 출력까지 약 2.6초가 걸렸다.
  - 컴파일 오류는 `ERROR at Main.java(4:14) illegal start of expression` 형식으로 나온다.
  - 런타임 의미론에 문제가 있다.
    - `Scanner`는 컴파일 오류가 나고(`cannot find symbol class Scanner`), `BufferedReader(System.in)`은 TeaVM 링크 오류가 난다.
    - `System.in.read()`는 `dereferencing a null pointer` 트랩이다. 선입력을 넣을 수 없다.
    - `NullPointerException`과 `ArrayIndexOutOfBoundsException`이 Java 예외가 아니라 wasm 트랩으로 나와 `catch`할 수 없다.
    - `String.format("%05.2f")`는 null pointer 트랩이다.
    - `getClass()`와 `Throwable.getMessage()`는 컴파일 classlib에 없다(`cannot find symbol`).
  - 무한 루프는 플레이그라운드가 실행을 같은 프로세스 iframe에서 해서 페이지 전체가 멈췄다. 하네스가 타임아웃으로 죽었다. 통합하려면 실행 wasm을 Worker에서 돌려야 하는데, 이 부분은 NOT VERIFIED다.
- 결론: 브라우저 안 Java 컴파일과 실행 자체는 VERIFIED다. 다만 stdin이 없고, 예외 처리와 classlib이 불완전해서 "Java 학습 예제"를 그대로 받기 어렵다. 지원하려면 TeaVM classlib을 직접 빌드해야 한다(stdin과 예외 검사 옵션). 이 작업은 별도 실험이 필요하다.

### CheerpJ (EXCLUDED)

- `https://cheerpj.com/docs/licensing` 원문: "CheerpJ is free for personal, educational and hobby use", "Community use loads CheerpJ from the CheerpJ CDN", "Serving the CheerpJ runtime from anywhere other than the CheerpJ CDN counts as self-hosting".
- `https://cheerpj.com/licensing/`: Small Business는 "£100 per developer per month", 자체 호스팅은 "£5,000 a year"다.
- 광고가 붙는 공개 블로그는 상업 용도에 가깝다. 무료 조건이면 외부 CDN 의존과 크레딧 표시가 필요하고, 정적 자산 자체 호스팅에는 유료 라이선스가 필요하다. 그래서 제외했다.
- DoppioJVM은 이번에 받아 보지 않았다(NOT VERIFIED, Java 8 시절이고 유지보수 중단).

## Rust

### rubrc v1 (VERIFIED, 단 조건부)

- 데모는 `https://rubrc.pages.dev/v1/`, 리포는 `oligamiq/rubrc`다. README 원문은 "This project requires Cross-Origin-Opener-Policy (COOP) and Cross-Origin-Embedder-Policy (COEP) headers"이다. `package.json`에 `"license": "MIT OR Apache-2.0"`이 있지만 LICENSE 파일은 없다. 툴체인 자산 리포 `oligamiq/rust_wasm`에도 LICENSE 파일이 없다. rustc와 LLVM 자체는 MIT/Apache-2.0이다.
- 다운로드(brotli, content-length 기준)는 다음과 같다.
  - `oligamiq.github.io/rust_wasm/v0.2.0/rustc_opt.wasm.br` 19,754,495
  - `wasm32-wasip1.tar.br` 18,879,640
  - `llvm_opt.wasm.br` 18,479,017
  - 합계 약 57MB이고, 여기에 brotli 디코더 wasm과 UI가 더해진다.
- 격리: `mini-coi.js` 서비스 워커가 응답에 `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`, `Cross-Origin-Resource-Policy: cross-origin`을 붙인다. 그래서 `crossOriginIsolated=true`가 된다. SharedArrayBuffer와 스레드 wasm이 필수다.
- 결과(하네스 `scripts/rust/edit.cjs`, Monaco에 소스를 입력하고 "Compile and Run" 클릭):
  - Vec, `sort`, HashMap, trait/impl, 튜플 구조체가 들어간 소스를 컴파일해 `MARK [1, 2, 3, 4, 5] sum=15 map=2 area=9`를 출력했다.
  - stdin은 `Err("Not supported (os error 58)")`였다.
  - 컴파일 오류에는 rustc 진단 전체가 나온다(`error[E0425]: cannot find value y`, `error[E0308]: mismatched types`).
  - 패닉은 `index out of bounds: the len is 0 but the index is 3`과 `RuntimeError: unreachable`로 나온다.
  - 데모 UI 버그가 하나 있다. 컴파일이 실패해도 이전 `/tmp/main.wasm`을 다시 실행한다. 통합 시 컴파일 전에 산출물을 지워야 한다.
  - 시간: 툴체인 준비(페이지 로드 후 rustc 첫 실행) 약 7초였다. 컴파일 1회 시간은 하네스 폴링 조건이 맞지 않아 정확히 재지 못했다(NOT VERIFIED). 이전 실행에서 실패 컴파일과 실행이 6초 안에 끝났다.
- 제약 판단: 사용자 규칙상 호스트 앱의 전역 격리 헤더를 바꿀 수 없다. cross-origin isolation은 최상위 문서 단위라서 글 페이지 안의 모달이나 iframe으로는 불가능하다. 가능한 길은 전용 경로(예: `/codelab/rust/`)를 새 최상위 창(`window.open`)으로 열고, 그 경로에만 헤더나 범위 한정 서비스 워커(mini-coi 방식)를 두는 것이다. 이 방식도 COOP same-origin이라 opener 연결이 끊긴다. 약 57MB 다운로드와 stdin 미지원도 남는다. 자체 호스팅 미러와 새 창 방식은 NOT VERIFIED다.

## Go

### GopherJS 플레이그라운드 (VERIFIED)

- 데모는 `https://gopherjs.github.io/playground/`, 리포는 `gopherjs/gopherjs.github.io`의 `playground/`다. 라이선스는 BSD-2-Clause(`playground/LICENSE`, Copyright 2013 Richard Musiol)다. 버전 표기는 `1.20.1+go1.20.14`다.
- 자산(원본 / gzip)은 다음과 같다.
  - `playground.js`(UI와 컴파일러) 6,139,076 / 952,714
  - `compile.js`(Worker 컴파일러) 21,413,850 / 3,334,076
  - `pkg/<import>.zip`(미리 컴파일된 표준 라이브러리 아카이브, 이미 압축됨)은 import에 따라 받는다. `fmt` 98KB, `reflect` 240KB, `runtime` 20KB 등이다. 표준 라이브러리 zip은 62개다.
  - UI용 React는 `esm.sh`에서 받는다. 자체 호스팅 시 교체 대상이다.
- `crossOriginIsolated=false`에서 동작한다.
- 결과(하네스 `scripts/go/run.cjs`, 케이스 `scripts/go/cases.json`):
  - slice, `sort.Ints`, map, 메서드가 있는 struct, `strings.ToUpper`, `fmt.Sprintf("%05.2f|%q")` 결과는 `[1 2 3 4 5] sum= 15 map= 2 7 SLOG`, `03.14|"q"`였다.
  - goroutine, 버퍼 채널, `sync.WaitGroup`, `defer`와 `recover`는 `goroutines sum 5`, `recovered: runtime error: index out of range`를 출력했다.
  - 컴파일 오류는 `main.go:7:14: undefined: y`, 타입 오류는 `main.go:6:14: cannot use "s" (untyped string constant) as int value`로 나온다. 끝에 `GopherJS build failed.`가 붙는다.
  - stdin은 `fmt.Scan` 결과가 `scan 0 read /dev/stdin: not implemented on js 0`이었다. 선입력은 GopherJS의 js `syscall`을 shim(node `fs.readSync` 흉내)으로 메우면 될 가능성이 있다. 이 방법은 NOT VERIFIED다.
  - 무한 루프의 중지 방식은 확인하지 못했다(NOT VERIFIED). 통합 시 컴파일 결과 JS를 Worker에서 돌리고 `terminate()`로 멈추는 구성을 별도로 검증해야 한다.
- 한계: Go 1.20 기준이다. 출력은 네이티브 Go가 아니라 JS 트랜스파일이다(goroutine은 GopherJS 스케줄러로 돈다). 자체 호스팅 미러는 돌려보지 않았다.
- johnstarich/go-wasm(hackpad)은 `go.johnstarich.com` 연결에 실패했고, 리포 마지막 push가 2023-04다. 받아 보지 않았다(NOT VERIFIED). yaegi는 로컬에 Go 툴체인이 없어 wasm 빌드를 시도하지 않았다(NOT VERIFIED).

## 실행한 명령 요약

- 패키지 확인: `npm view JSCPP version license dist.unpackedSize`, `npm pack JSCPP`, `npm install --ignore-scripts JSCPP@2.0.9`(scratch 디렉터리에서 실행)
- JSCPP 번들: `node front/node_modules/esbuild/bin/esbuild worker-entry.js --bundle --minify --format=iife --platform=browser --alias:util=shims/util.js --alias:stream=shims/stream.js --outfile=www/jscpp-worker.js`
- wasm-clang 자산: `curl -sL -o <f> https://binji.github.io/wasm-clang/<f>`
- TeaVM 미러: `node scripts/mirror.mjs https://teavm.org/playground/ teavm/root`(디렉터리 리스팅을 재귀로 받음). UI HTML은 `curl https://teavm.org/playground/2/`로 받았다.
- 각 하네스는 `PW=<front/node_modules/@playwright/test> node scripts/<lang>/run.cjs`로 돌렸다. C++과 Java는 node `http` 정적 서버를 띄운 뒤 headless Chromium으로 접속했고, Rust와 Go는 공개 데모에 직접 접속했다.
