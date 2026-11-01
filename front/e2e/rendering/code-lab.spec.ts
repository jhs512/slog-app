import { Page, expect, test } from "@playwright/test";

const POST = "/p/8";

const block = (page: Page, text: string) =>
  page.locator(".code-lab-block").filter({ hasText: text });

async function openLab(page: Page, text: string) {
  const play = block(page, text).locator(".code-lab-play");
  await play.click();
  const dialog = page.getByTestId("code-lab-dialog");
  await expect(dialog).toBeVisible();
  return { play, dialog };
}

const frame = (page: Page) =>
  page.frameLocator("[data-testid=code-lab-dialog] iframe.code-lab-frame");
const consoleOf = (page: Page) => page.getByTestId("code-lab-console");
const status = (page: Page) => page.getByTestId("code-lab-status");

async function replaceCode(page: Page, code: string) {
  await page.getByTestId("code-lab-editor").fill(code);
}

test.beforeEach(async ({ page }) => {
  await page.goto(POST);
  await expect(page.locator(".code-lab-play").first()).toBeVisible();
});

test("작성자가 표시한 블록에만 재생 버튼이 있고 기존 렌더링은 유지된다", async ({
  page,
}) => {
  await expect(page.locator(".code-lab-play")).toHaveCount(13);
  await expect(page.locator(".code-lab-note")).toHaveCount(2);
  await expect(page.locator(".code-lab-note").first()).toContainText(
    "버전 9이 없습니다",
  );
  await expect(page.locator(".code-lab-note").last()).toContainText(
    "rust 코드는 브라우저 실행을 지원하지 않습니다",
  );
  const plain = page
    .locator(".toastui-editor-contents pre")
    .filter({ hasText: "int main(void) { return 0; }" });
  await expect(plain).toHaveCount(1);
  await expect(
    page.locator(".code-lab-block pre", {
      hasText: "int main(void) { return 0; }",
    }),
  ).toHaveCount(0);
  await expect(page.locator('img[alt="Mermaid Diagram"]')).toHaveCount(1);
  await page.locator("details summary", { hasText: "접힌 예제" }).click();
  await expect(
    block(page, "접힌 블록").locator(".code-lab-play"),
  ).toBeVisible();
});

test("HTML 실험: 최초 자동 실행, 수정 후 수동 실행, 닫고 다시 열면 원문으로 초기화", async ({
  page,
}) => {
  const requests: { url: string; body: string | null }[] = [];
  page.on("request", (req) =>
    requests.push({ url: req.url(), body: req.postData() }),
  );
  const { play } = await openLab(page, 'getElementById("inc")');
  await expect(status(page)).toHaveText("완료");
  await expect(frame(page).locator("#msg")).toHaveText("0회");
  await frame(page).locator("#inc").click();
  await expect(frame(page).locator("#msg")).toHaveText("1회");
  await expect(consoleOf(page)).toContainText("클릭 1");
  const dom = page.getByTestId("code-lab-dom");
  await expect(dom).toContainText("<li>");
  await expect(dom).toContainText('"클릭 1"');
  await expect(dom).not.toContainText("data-slog-lab");

  const editor = page.getByTestId("code-lab-editor");
  const original = await editor.inputValue();
  await replaceCode(page, original.replaceAll("회", "번"));
  await page.waitForTimeout(300);
  await expect(frame(page).locator("#msg")).toHaveText("1회");
  await page.getByTestId("code-lab-run").click();
  await expect(frame(page).locator("#msg")).toHaveText("0번");
  await expect(consoleOf(page)).not.toContainText("클릭 1");

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("code-lab-dialog")).toHaveCount(0);
  await expect(play).toBeFocused();
  await expect(page.locator("iframe.code-lab-frame")).toHaveCount(0);

  await play.click();
  await expect(editor).toHaveValue(original);
  await expect(frame(page).locator("#msg")).toHaveText("0회");
  await expect(consoleOf(page)).toHaveText("출력이 없습니다.");

  const foreign = requests.filter(
    ({ url }) =>
      !url.startsWith("http://localhost:3007/") &&
      !url.startsWith("http://127.0.0.1:8097/") &&
      !url.startsWith("data:") &&
      !url.startsWith("blob:") &&
      !url.startsWith("about:") &&
      // 글 본문 Mermaid 다이어그램 이미지(코드 실험과 무관, 운영 빌드에서 늦게 요청됨)
      !url.startsWith("https://mermaid.ink/"),
  );
  expect(foreign).toEqual([]);
  expect(
    requests.filter(({ body }) => body?.includes("getElementById")),
  ).toEqual([]);
});

test("웹 렌더링 기본 글꼴은 Pretendard이고 작성 CSS로 덮어쓸 수 있다", async ({
  page,
}) => {
  await openLab(page, "작성자 글꼴");
  const view = frame(page);
  await expect(view.locator("#base")).toBeVisible();
  const fonts = await view.locator("body").evaluate(async () => {
    await document.fonts.ready;
    await document.fonts.load('16px "Pretendard Variable"');
    return {
      base: getComputedStyle(document.getElementById("base")!).fontFamily,
      custom: getComputedStyle(document.getElementById("custom")!).fontFamily,
      loaded: document.fonts.check('16px "Pretendard Variable"'),
    };
  });
  expect(fonts.base).toContain("Pretendard Variable");
  expect(fonts.custom).toBe("serif");
  expect(fonts.loaded).toBe(true);
  const editorFont = await page
    .getByTestId("code-lab-editor")
    .evaluate((el) => getComputedStyle(el).fontFamily);
  expect(editorFont).not.toContain("Pretendard");
});

test("JavaScript: 선입력, 과다 출력, 중지, 오래된 결과 폐기", async ({
  page,
}) => {
  await openLab(page, "const age = Number(prompt());");
  await expect(status(page)).toHaveText("완료");
  await expect(consoleOf(page)).toContainText("안녕 null 1");
  await page.getByTestId("code-lab-input").fill("민수\n20");
  await page.getByTestId("code-lab-run").click();
  await expect(consoleOf(page)).toContainText("안녕 민수 21");
  await expect(consoleOf(page)).toContainText("{list: [1, 2, 3]}");

  await replaceCode(page, "for (let i = 0; i < 2000; i++) console.log(i);");
  await page.getByTestId("code-lab-run").click();
  await expect(consoleOf(page)).toContainText("이후 출력은 생략합니다");
  await expect(consoleOf(page)).not.toContainText("1999");

  await replaceCode(page, "while (true) {}");
  await page.getByTestId("code-lab-run").click();
  await expect(status(page)).toHaveText("실행 중");
  expect(await page.evaluate(() => 1 + 1)).toBe(2);
  await page.getByTestId("code-lab-stop").click();
  await expect(status(page)).toContainText("중지됨");

  await replaceCode(
    page,
    'setTimeout(() => console.log("늦은 결과"), 400); console.log("첫 실행");',
  );
  await page.getByTestId("code-lab-run").click();
  await expect(consoleOf(page)).toContainText("첫 실행");
  await replaceCode(page, 'console.log("새 실행");');
  await page.getByTestId("code-lab-run").click();
  await expect(consoleOf(page)).toContainText("새 실행");
  await page.waitForTimeout(800);
  await expect(consoleOf(page)).not.toContainText("늦은 결과");
});

test("TypeScript: 브라우저에서 변환해 실행하고 컴파일 오류를 표시한다", async ({
  page,
}) => {
  await openLab(page, "interface Point");
  await expect(consoleOf(page)).toContainText("{x: 4, y: 6}");
  await replaceCode(page, "const x: = 1;");
  await page.getByTestId("code-lab-run").click();
  await expect(status(page)).toContainText("컴파일 오류");
  await expect(consoleOf(page)).toContainText("1행");
});

test("React: 렌더링·실제 DOM·React VDOM 패널이 서로 다른 데이터를 보인다", async ({
  page,
}) => {
  const { dialog } = await openLab(page, "function Counter");
  await expect(frame(page).locator("button")).toHaveText("count 0");
  await frame(page).locator("button").click();
  await expect(frame(page).locator("button")).toHaveText("count 2");

  const vdom = page.getByTestId("code-lab-vdom");
  await expect(vdom).toContainText("<App>");
  await expect(vdom).toContainText("<Counter>");
  await expect(vdom).toContainText("step=2");
  await expect(vdom).toContainText("state[0]=2");
  await expect(vdom).toContainText("react-dom 19.2.3");

  const dom = page.getByTestId("code-lab-dom");
  await expect(dom).toContainText('<button>"count ""2"');
  await expect(dom).toContainText('<div id="root">');
  await expect(dom).not.toContainText("Counter");
  await expect(vdom).not.toContainText('id="root"');
  await expect(dialog.locator('[data-panel="render"]')).toBeVisible();

  await replaceCode(
    page,
    "export default function App() { while (true) {} return null; }",
  );
  await page.getByTestId("code-lab-run").click();
  await expect(consoleOf(page)).toContainText(
    "반복문이 1.5초를 넘어 중단했습니다",
    // React 는 렌더 오류 뒤 한 번 더 렌더하므로 제한 시간이 두 번 걸린다.
    { timeout: 15_000 },
  );
  await expect(status(page)).toContainText("렌더링 중 오류");
  expect(await page.evaluate(() => 1 + 1)).toBe(2);
});

test("React+Tailwind 킷은 별도 킷으로 Tailwind 클래스를 적용한다", async ({
  page,
}) => {
  await openLab(page, "테일윈드");
  const color = await frame(page)
    .locator("#tw")
    .evaluate((el) => getComputedStyle(el).color);
  expect(color).not.toBe("rgb(0, 0, 0)");
  const weight = await frame(page)
    .locator("#tw")
    .evaluate((el) => getComputedStyle(el).fontWeight);
  expect(weight).toBe("700");
});

const memoryView = (page: Page) =>
  page.frameLocator("[data-testid=code-lab-memory] iframe");

async function lastStep(page: Page) {
  await memoryView(page).getByRole("button", { name: "마지막 »" }).click();
}

test("C: 선입력과 JSCPP 추적으로 배열·포인터·malloc/free 메모리를 표시한다", async ({
  page,
}) => {
  await openLab(page, "malloc(sizeof(int) * n)");
  // 원본 JSCPP 경로와 같이 선입력 없이 scanf 가 EOF 를 만나면 실행 오류로 끝난다.
  await expect(status(page)).toContainText("입력 부족", { timeout: 30_000 });
  await expect(consoleOf(page)).toContainText("입력 부족: 6행 scanf");
  await page.getByTestId("code-lab-input").fill("4");
  await page.getByTestId("code-lab-run").click();
  await expect(consoleOf(page)).toContainText("n=4 p=20 last=9");
  await expect(consoleOf(page)).toContainText("정상 종료");
  const view = memoryView(page);
  await expect(view.locator(".tv-slider")).toBeVisible();
  await lastStep(page);
  await expect(view.locator(".tv-memory-summary")).toContainText("malloc 1");
  await expect(view.locator(".tv-memory-summary")).toContainText("free 1");
  await expect(view.locator(".viz")).toContainText("arr");

  await replaceCode(page, "int main( {");
  await page.getByTestId("code-lab-run").click();
  await expect(status(page)).toContainText("컴파일 오류");
  await expect(consoleOf(page)).toContainText("오류");

  await replaceCode(page, "int main(void) { while (1) {} }");
  await page.getByTestId("code-lab-run").click();
  await expect(status(page)).toHaveText("실행 중");
  expect(await page.evaluate(() => 1 + 1)).toBe(2);
  await page.getByTestId("code-lab-stop").click();
  await expect(status(page)).toContainText("중지됨");
});

test("C: typedef struct 연결 리스트의 할당·해제를 단계별로 본다", async ({
  page,
}) => {
  await openLab(page, "typedef struct Node");
  await expect(status(page)).toHaveText("완료", { timeout: 30_000 });
  await expect(consoleOf(page)).toContainText(/10\s+20\s+30/);
  const view = memoryView(page);
  await lastStep(page);
  await expect(view.locator(".tv-memory-summary")).toContainText("malloc 3");
  await expect(view.locator(".tv-memory-summary")).toContainText("free 3");
  await view.getByRole("button", { name: "« 처음" }).click();
  const slider = view.locator(".tv-slider");
  const max = Number(await slider.getAttribute("max"));
  await slider.fill(String(Math.floor(max / 2)));
  await expect(view.locator(".viz")).toContainText("Node");
});

test("C: 실행 중 닫고 다시 열면 이전 실행 없이 원문으로 처음부터 실행한다", async ({
  page,
}) => {
  const { play } = await openLab(page, "malloc(sizeof(int) * n)");
  await replaceCode(page, "int main(void) { while (1) {} }");
  await page.getByTestId("code-lab-run").click();
  await page.getByTestId("code-lab-close").click();
  await expect(page.getByTestId("code-lab-dialog")).toHaveCount(0);
  await play.click();
  await expect(page.getByTestId("code-lab-editor")).toHaveValue(/malloc/);
  await expect(page.getByTestId("code-lab-input")).toHaveValue("");
  await expect(status(page)).toContainText("입력 부족", { timeout: 30_000 });
  await expect(
    consoleOf(page).locator("div", { hasText: "입력 부족 ·" }),
  ).toHaveCount(1);
  await expect(consoleOf(page)).not.toContainText("시간 제한");
});

test("C++: 브라우저 Clang으로 컴파일하고 선입력·참조·new/delete 메모리를 표시한다", async ({
  page,
}) => {
  test.setTimeout(240_000);
  const requests: string[] = [];
  page.on("request", (req) => requests.push(req.url()));
  await openLab(page, "std::cin >> n");
  await expect(status(page)).toHaveText("완료", { timeout: 180_000 });
  await expect(consoleOf(page)).toContainText("15 14");
  await page.getByTestId("code-lab-input").fill("5");
  await page.getByTestId("code-lab-run").click();
  await expect(consoleOf(page)).toContainText("11 10", { timeout: 120_000 });
  const view = memoryView(page);
  await lastStep(page);
  await expect(view.locator(".viz")).toContainText("해제됨");
  await view.getByRole("button", { name: "« 처음" }).click();
  const slider = view.locator(".tv-slider");
  const max = Number(await slider.getAttribute("max"));
  let sawNode = false;
  for (let i = 0; i <= max && !sawNode; i++) {
    await slider.fill(String(i));
    sawNode = (await view.locator(".viz").textContent())!.includes("Node");
  }
  expect(sawNode).toBe(true);
  expect(
    requests.some((url) =>
      url.endsWith("/code-lab/jmv/browsercc-0.1.1/clang.wasm.gz"),
    ),
  ).toBe(true);
  expect(
    requests.filter(
      (url) =>
        !url.startsWith("http://localhost:3007/") &&
        // 다른 사이트에 둔 실행기(개발 환경은 127.0.0.1)의 정적 런타임 자산
        !url.startsWith("http://127.0.0.1:3007/code-lab/") &&
        !url.startsWith("http://127.0.0.1:8097/") &&
        !/^(data|blob|about):/.test(url) &&
        !url.includes("mermaid.ink"),
    ),
  ).toEqual([]);

  // include 와 감싸기 줄 수만큼 밀리지 않고 원래 4행으로 보고해야 한다.
  await replaceCode(
    page,
    "#include <iostream>\n\nint main() {\n  int x = ;\n}",
  );
  await page.getByTestId("code-lab-run").click();
  await expect(status(page)).toContainText("컴파일 오류", { timeout: 120_000 });
  await expect(consoleOf(page)).toContainText("4행");
  await expect(consoleOf(page)).toContainText("main.cpp:4:");
});

test("사용자 코드의 네트워크 요청은 sandbox 정책으로 막힌다", async ({
  page,
}) => {
  const fromSandbox: string[] = [];
  page.on("request", (req) => {
    if (req.frame() !== page.mainFrame()) fromSandbox.push(req.url());
  });
  await openLab(page, 'getElementById("inc")');
  await replaceCode(
    page,
    '<script>fetch("http://127.0.0.1:8097/member/api/v1/auth/me", { credentials: "include" }).then(() => console.log("요청 성공"), () => console.log("요청 차단"));</script>',
  );
  await page.getByTestId("code-lab-run").click();
  await expect(consoleOf(page)).toContainText("요청 차단");
  await expect(consoleOf(page)).not.toContainText("요청 성공");
  // 런타임 자산 요청이 잡히는지로 수집 자체를 확인한 뒤 API 요청이 없음을 본다.
  expect(fromSandbox.some((url) => url.endsWith("/code-lab/runtime.js"))).toBe(
    true,
  );
  expect(fromSandbox.filter((url) => url.includes("/auth/me"))).toEqual([]);
});

test("패널 열고 닫기·배치·크기 조절은 기억하고 코드와 입력은 기억하지 않는다", async ({
  page,
}) => {
  const { play } = await openLab(page, "malloc(sizeof(int) * n)");
  const dialog = page.getByTestId("code-lab-dialog");
  await expect(dialog.locator("[data-panel]")).toHaveCount(4);
  await expect(status(page)).toContainText("입력 부족", { timeout: 30_000 });
  await dialog.getByRole("button", { name: "메모리 패널 닫기" }).click();
  await expect(dialog.locator('[data-panel="memory"]')).toHaveCount(0);
  await expect(
    dialog.getByRole("button", { name: "메모리", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByTestId("code-lab-layout").selectOption("stack");
  const handle = dialog.getByRole("separator").first();
  const before = Number(await handle.getAttribute("aria-valuenow"));
  await handle.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  const after = Number(await handle.getAttribute("aria-valuenow"));
  expect(after).toBeGreaterThan(before);
  await replaceCode(page, "// 임시 수정");
  await page.getByTestId("code-lab-input").fill("7");
  await page.getByTestId("code-lab-close").click();
  await expect(play).toBeFocused();

  await page.reload();
  await openLab(page, "malloc(sizeof(int) * n)");
  await expect(page.getByTestId("code-lab-layout")).toHaveValue("stack");
  await expect(dialog.locator('[data-panel="memory"]')).toHaveCount(0);
  await expect(dialog.getByRole("separator").first()).toHaveAttribute(
    "aria-valuenow",
    String(after),
  );
  await expect(page.getByTestId("code-lab-editor")).toHaveValue(/malloc/);
  await expect(page.getByTestId("code-lab-input")).toHaveValue("");
  await dialog.getByRole("button", { name: "메모리", exact: true }).click();
  await expect(dialog.locator('[data-panel="memory"]')).toBeVisible();

  const stored = await page.evaluate(() =>
    Object.entries(localStorage).filter(([key]) =>
      key.startsWith("slog.codeLab"),
    ),
  );
  expect(JSON.stringify(stored)).not.toContain("malloc");
});

test("접힌 블록과 모바일 화면에서도 실험을 열고 닫는다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await page.locator("details summary", { hasText: "접힌 예제" }).click();
  await openLab(page, "접힌 블록");
  await expect(consoleOf(page)).toContainText("접힌 블록");
  const box = await page.getByTestId("code-lab-dialog").boundingBox();
  expect(box!.width).toBeLessThanOrEqual(390);
  await page.getByTestId("code-lab-close").click();
  await expect(page.getByTestId("code-lab-dialog")).toHaveCount(0);
});

test("JavaScript 메모리(js memory): 원본 JS 추적기로 객체 별칭과 선입력을 추적한다", async ({
  page,
}) => {
  await openLab(page, "const alias = head;");
  await expect(status(page)).toHaveText("완료", { timeout: 60_000 });
  await expect(consoleOf(page)).toContainText("손님 10 2");
  await page.getByTestId("code-lab-input").fill("민수");
  await page.getByTestId("code-lab-run").click();
  await expect(consoleOf(page)).toContainText("민수 10 2");
  const view = memoryView(page);
  await lastStep(page);
  await expect(view.locator(".viz")).toContainText("alias");
  await expect(view.locator(".viz")).toContainText("head");
  await replaceCode(page, "while (true) {}");
  await page.getByTestId("code-lab-run").click();
  await expect(status(page)).toContainText(/중지됨|오류/, { timeout: 30_000 });
});

test("Python: Pyodide 추적·선입력·실행 간 전역 격리·중지 후 재실행", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await openLab(page, "class Node:");
  await expect(status(page)).toHaveText("완료", { timeout: 120_000 });
  await expect(consoleOf(page)).toContainText("손님 10 2");
  await page.getByTestId("code-lab-input").fill("민수");
  await page.getByTestId("code-lab-run").click();
  await expect(consoleOf(page)).toContainText("민수 10 2");
  const view = memoryView(page);
  await lastStep(page);
  await expect(view.locator(".viz")).toContainText("Node");
  await expect(view.locator(".viz")).toContainText("alias");

  await replaceCode(page, "secret = 42\nprint('set')");
  await page.getByTestId("code-lab-run").click();
  await expect(consoleOf(page)).toContainText("set");
  await replaceCode(page, "print('secret' in globals())");
  await page.getByTestId("code-lab-run").click();
  await expect(consoleOf(page)).toContainText("False");

  await replaceCode(page, "import time\ntime.sleep(60)");
  await page.getByTestId("code-lab-run").click();
  await expect(status(page)).toHaveText("실행 중", { timeout: 30_000 });
  await page.getByTestId("code-lab-stop").click();
  await expect(status(page)).toContainText("중지됨");
  await replaceCode(page, "print(6 * 7)");
  await page.getByTestId("code-lab-run").click();
  await expect(consoleOf(page)).toContainText("42", { timeout: 120_000 });
});

test("Java: CheerpJ 공식 CDN에서 컴파일·선입력·객체 메모리, static 상태 비누출, 중지 후 재실행", async ({
  page,
}) => {
  test.setTimeout(600_000);
  const { play } = await openLab(page, "static int runs");
  await expect(status(page)).toHaveText("완료", { timeout: 420_000 });
  await expect(consoleOf(page)).toContainText("3 6 [3, 4] runs=1");
  await expect(
    page.getByRole("link", { name: "Built with CheerpJ" }),
  ).toBeVisible();
  await page.getByTestId("code-lab-input").fill("5");
  await page.getByTestId("code-lab-run").click();
  await expect(consoleOf(page)).toContainText("5 10 [5, 6] runs=1", {
    timeout: 120_000,
  });
  const view = memoryView(page);
  await lastStep(page);
  await expect(view.locator(".viz")).toContainText("Node");

  await replaceCode(
    page,
    "public class Main {\n  public static void main(String[] args) {\n    int x = ;\n  }\n}",
  );
  await page.getByTestId("code-lab-run").click();
  await expect(status(page)).toContainText("컴파일 오류", { timeout: 120_000 });
  await expect(consoleOf(page)).toContainText("3행");

  await page.getByTestId("code-lab-close").click();
  await play.click();
  await expect(page.getByTestId("code-lab-editor")).toHaveValue(
    /static int runs/,
  );
  await page.getByTestId("code-lab-stop").click();
  await expect(status(page)).toContainText("중지됨");
  await page.getByTestId("code-lab-run").click();
  await expect(consoleOf(page)).toContainText("3 6 [3, 4] runs=1", {
    timeout: 420_000,
  });
});

test("C: 선입력이 모자라 scanf가 멈추면 입력 부족으로 안내한다", async ({
  page,
}) => {
  await openLab(page, "malloc(sizeof(int) * n)");
  await expect(status(page)).toContainText("입력 부족", { timeout: 60_000 });
  await expect(consoleOf(page)).toContainText(
    "입력 부족: 6행 scanf가 읽을 입력이 없습니다.",
  );
  await expect(consoleOf(page)).not.toContainText("Memory overflow");
});

test("메모리 실행기: 사용자 Python 코드의 슬로그 API 요청은 실행기 CSP로 막힌다", async ({
  page,
}) => {
  test.setTimeout(180_000);
  // CSP 로 막힌 요청도 request 이벤트는 생기므로 실제로 응답을 받은 요청만 센다.
  const apiCalls: string[] = [];
  const blocked: string[] = [];
  page.on("requestfinished", (req) => {
    if (req.url().includes("/auth/me") && req.frame() !== page.mainFrame()) {
      apiCalls.push(req.url());
    }
  });
  page.on("requestfailed", (req) => {
    if (req.url().includes("/auth/me")) {
      blocked.push(req.failure()?.errorText ?? "");
    }
  });
  await openLab(page, "class Node:");
  await expect(status(page)).toHaveText("완료", { timeout: 120_000 });
  await replaceCode(
    page,
    [
      "try:",
      "    from pyodide.http import open_url",
      "    open_url('http://127.0.0.1:8097/member/api/v1/auth/me?probe=code-lab-isolation')",
      "    print('요청 성공')",
      "except Exception:",
      "    print('요청 차단')",
    ].join("\n"),
  );
  await page.getByTestId("code-lab-run").click();
  await expect(consoleOf(page)).toContainText("요청 차단", { timeout: 60_000 });
  await expect(consoleOf(page)).not.toContainText("요청 성공");
  expect(apiCalls).toEqual([]);
  expect(blocked.length).toBeGreaterThan(0);
  const probe = await page.request.get("http://127.0.0.1:8097/__probe-hits");
  expect(await probe.json()).toEqual({ hits: 0 });
});

test("메모리 실행기: 팝업을 닫으면 런타임을 버려 다음 팝업에 상태가 이어지지 않는다", async ({
  page,
}) => {
  test.setTimeout(240_000);
  const { play } = await openLab(page, "class Node:");
  await expect(status(page)).toHaveText("완료", { timeout: 120_000 });
  await replaceCode(
    page,
    "import builtins\nbuiltins.poison = 1\nprint('오염')",
  );
  await page.getByTestId("code-lab-run").click();
  await expect(consoleOf(page)).toContainText("오염");
  await replaceCode(
    page,
    "import builtins\nprint('같은 팝업', hasattr(builtins, 'poison'))",
  );
  await page.getByTestId("code-lab-run").click();
  await expect(consoleOf(page)).toContainText("같은 팝업 True");
  await page.getByTestId("code-lab-close").click();
  await expect(page.locator('iframe[title="코드 실험 실행기"]')).toHaveCount(0);
  await play.click();
  await expect(status(page)).toHaveText("완료", { timeout: 120_000 });
  await replaceCode(
    page,
    "import builtins\nprint('새 팝업', hasattr(builtins, 'poison'))",
  );
  await page.getByTestId("code-lab-run").click();
  await expect(consoleOf(page)).toContainText("새 팝업 False");
});
