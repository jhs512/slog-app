import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

import { fence, source, umlEnglishSource, umlSource } from "./fixtures.mjs";

for (const width of [1440, 390]) {
  test(`Mermaid UML ${width}px: 클래스·시퀀스·인물·대사·맞춤·이동`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/p/3");
    const card = page.getByRole("button", {
      name: "UML 설명 · 만화 읽기",
      exact: true,
    });
    await expect(card).toBeVisible({ timeout: 60_000 });
    await expect(card).toContainText("2컷");
    await card.click();
    const viewer = page.getByRole("dialog"),
      img = viewer.getByRole("img"),
      region = viewer.getByRole("region");
    const checks = await img.evaluate(async (el: HTMLImageElement) => {
      await el.decode();
      const svg = await (await fetch(el.src)).text();
      const xml = new DOMParser().parseFromString(svg, "image/svg+xml");
      return {
        svg,
        diagrams: xml.querySelectorAll('[data-diagram="mermaid"]').length,
        scenes: xml.querySelectorAll('[data-scene="true"]').length,
        unsafe: xml.querySelectorAll("script,foreignObject,iframe").length,
        heights: [...xml.querySelectorAll("g[data-panel]")].map((g) =>
          Number(g.querySelector("rect")!.getAttribute("height")),
        ),
        width: Number(xml.documentElement.getAttribute("width")),
      };
    });
    expect(checks.diagrams).toBe(2);
    expect(checks.scenes).toBe(2);
    expect(checks.unsafe).toBe(0);
    for (const text of [
      "Member",
      "Order",
      "방문자",
      "서버",
      "회원 한 명이 여러 주문",
      "요청과 응답 순서",
    ])
      expect(checks.svg).toContain(text);
    const available = await region.evaluate((el) => {
      const s = getComputedStyle(el);
      return (
        el.clientHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom)
      );
    });
    const displayedWidth = (await img.boundingBox())!.width;
    expect(
      (Math.max(...checks.heights) * displayedWidth) / checks.width,
    ).toBeLessThanOrEqual(available + 1);
    await region.focus();
    await page.keyboard.press("ArrowRight");
    await expect(viewer.getByRole("status")).toHaveText("2 / 2컷");
    expect(await region.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    await page.screenshot({ path: `test-results/comic-uml-${width}.png` });
    await viewer.getByRole("checkbox", { name: "화면 넘침 방지" }).uncheck();
    await viewer.getByLabel("보기 크기").selectOption("2");
    await expect
      .poll(() => img.evaluate((el) => el.getBoundingClientRect().width))
      .toBe(1440);
    await page.keyboard.press("Escape");
    await expect(card).toBeFocused();
  });
}

test("일반 만화는 Mermaid를 로딩하지 않는다", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes("/mermaid@")) requests.push(req.url());
  });
  await page.goto("/p/1");
  await expect(page.locator(".comic-card")).toHaveCount(3);
  expect(requests).toEqual([]);
});

test("Mermaid CDN 실패·문법 오류 안내와 미리보기 복구", async ({ page }) => {
  test.setTimeout(90_000);
  await page.route("**/mermaid@11.17.2/**", (route) => route.abort());
  await page.goto("/p/1/edit");
  const input = page.getByPlaceholder("내용을 입력하세요");
  await input.fill(fence(umlSource));
  await page.getByRole("button", { name: "미리보기", exact: true }).click();
  await expect(page.locator(".comic-gen [role=alert]")).toContainText(
    "컷 1.다이어그램",
    { timeout: 30_000 },
  );
  await input.fill(fence(source));
  await expect(page.locator(".comic-card")).toHaveCount(1);
  await page.unroute("**/mermaid@11.17.2/**");
  await input.fill(fence(umlSource.replace("classDiagram", "wrongDiagram")));
  await expect(page.locator(".comic-gen [role=alert]")).toContainText(
    "컷 1.다이어그램",
    { timeout: 60_000 },
  );
  await input.fill(fence(umlSource));
  await expect(
    page.getByRole("button", { name: "UML 설명 · 만화 읽기", exact: true }),
  ).toBeVisible({ timeout: 60_000 });
  await expect(page.locator("[data-comic-diagram-temporary]")).toHaveCount(0);
});

test("본문 교체·삭제 뒤 늦은 비동기 결과를 버린다", async ({ page }) => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"><text x="10" y="30">검증 다이어그램</text></svg>';
  const isolated =
    '<iframe src="data:text/html;charset=UTF-8;base64,' +
    Buffer.from(svg).toString("base64") +
    '"></iframe>';
  await page.route("**/mermaid@11.17.2/**", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `export default {initialize(){},async render(){await new Promise(resolve=>{parent.__finishDiagram=resolve});return {svg:${JSON.stringify(isolated)}}}}`,
    }),
  );
  await page.goto("/p/1/edit");
  const input = page.getByPlaceholder("내용을 입력하세요");
  await input.fill(fence(umlSource));
  await page.getByRole("button", { name: "미리보기", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          typeof (window as unknown as { __finishDiagram?: () => void })
            .__finishDiagram,
      ),
    )
    .toBe("function");
  await input.fill(fence(source));
  await expect(page.locator(".comic-card")).toHaveCount(1);
  // 첫 컷을 완료하면 두 번째 다이어그램도 지연되므로 두 번 해제한다.
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => {
      const w = window as unknown as { __finishDiagram?: () => void };
      w.__finishDiagram?.();
      delete w.__finishDiagram;
    });
    if (i === 0)
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              typeof (window as unknown as { __finishDiagram?: () => void })
                .__finishDiagram,
          ),
        )
        .toBe("function");
  }
  await expect(page.locator("[data-comic-diagram-temporary]")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "요청과 응답 · 만화 읽기", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "UML 설명 · 만화 읽기", exact: true }),
  ).toHaveCount(0);
  await input.fill("일반 문단");
  await expect(page.locator(".comic-gen")).toHaveCount(0);
});

test("공개 SDK 비동기 SVG 결과로 PNG 생성", async ({ page }) => {
  test.setTimeout(90_000);
  const code = readFileSync(
    "src/lib/business/vendor/comic-gen.render.js",
    "utf8",
  );
  await page.goto("/p/1");
  const result = await page.evaluate(
    async ({ code, source, english }) => {
      const sdk = await import(
        URL.createObjectURL(new Blob([code], { type: "text/javascript" }))
      );
      if (sdk.mountComicCard || sdk.createComicViewer)
        throw new Error("렌더 전용 SDK에 뷰어 의존성 포함");
      const output = await sdk.renderComicAsync(source);
      if (output.diagnostics.length)
        return { diagnostics: output.diagnostics, type: "", size: 0 };
      const equivalent = await sdk.renderComicAsync(english);
      // SVG 간 ID 충돌 방지용 생성 prefix만 정규화한다.
      const normalize = (svg: string) =>
        svg.replace(/cg-[a-z0-9]+-\d+-[a-z0-9]+/g, "cg-normalized");
      if (normalize(output.svg) !== normalize(equivalent.svg))
        throw new Error("한글·영어 UML 출력 불일치");
      const png = await sdk.exportPng(output, 0.5);
      const img = new Image();
      img.src = URL.createObjectURL(png);
      await img.decode();
      return {
        diagnostics: output.diagnostics,
        type: png.type,
        size: png.size,
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
    },
    { code, source: umlSource, english: umlEnglishSource },
  );
  expect(result.diagnostics).toEqual([]);
  expect(result.type).toBe("image/png");
  expect(result.size).toBeGreaterThan(1000);
  expect(result.width).toBe(360);
});

test("VS CODE 미리보기에서 클래스·시퀀스 컷 표시", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/p/1/vscode");
  await page.getByRole("button", { name: "미리보기", exact: true }).click();
  await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 30_000 });
  await page.evaluate(
    (body) => window.monaco.editor.getModels()[0].setValue(body),
    "```yml\ntitle: UML 검증\npublished: false\nlisted: false\n```\n\n" +
      fence(umlSource),
  );
  const card = page.getByRole("button", {
    name: "UML 설명 · 만화 읽기",
    exact: true,
  });
  await expect(card).toBeVisible({ timeout: 60_000 });
  await card.click();
  const svg = await page
    .getByRole("dialog")
    .getByRole("img")
    .evaluate(async (img: HTMLImageElement) => (await fetch(img.src)).text());
  expect(svg.match(/data-diagram="mermaid"/g)).toHaveLength(2);
});
