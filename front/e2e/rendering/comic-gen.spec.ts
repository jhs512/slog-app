import { type Locator, expect, test } from "@playwright/test";

import { convertCodeBlocksToDiagramSyntax } from "../../src/lib/business/markdownUtils";
import { fence, koreanSource, source } from "./fixtures.mjs";

async function expectContained(image: Locator, region: Locator) {
  await expect
    .poll(async () => {
      const bounds = (await image.boundingBox())!;
      const available = await region.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          width:
            el.clientWidth -
            parseFloat(style.paddingLeft) -
            parseFloat(style.paddingRight),
          height:
            el.clientHeight -
            parseFloat(style.paddingTop) -
            parseFloat(style.paddingBottom),
          horizontalOverflow: el.scrollWidth - el.clientWidth,
          verticalOverflow: el.scrollHeight - el.clientHeight,
        };
      });
      return (
        bounds.width <= available.width + 1 &&
        bounds.height <= available.height + 1 &&
        available.horizontalOverflow <= 1 &&
        available.verticalOverflow <= 1
      );
    })
    .toBe(true);
}

test("VS CODE 미리보기에서도 수정한 만화가 표시된다", async ({ page }) => {
  await page.goto("/p/1/vscode");
  await page.getByRole("button", { name: "미리보기", exact: true }).click();
  await expect(page.locator(".comic-gen img")).toHaveCount(3);
  await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 30_000 });
  await page.evaluate(
    (body) => {
      window.monaco.editor.getModels()[0].setValue(body);
    },
    "```yml\ntitle: 검증용 제목\npublished: false\nlisted: false\n```\n\n" +
      fence(koreanSource.replace("요청과 응답", "VS CODE 수정")),
  );
  await expect(page.locator(".comic-gen img")).toHaveCount(1);
  await expect(page.locator(".comic-gen img").first()).toHaveAttribute(
    "alt",
    "VS CODE 수정 · 1/4",
  );
  await page
    .locator(".comic-gen")
    .screenshot({ path: "test-results/comic-gen-preview.png" });
});

test("다이어그램 전처리가 만화 대사·바깥 예제 펜스를 변형하지 않는다", () => {
  const embedded = fence(
    "dialogue:\n  - text: |-\n      ```uml\n      A -> B\n      ```",
  );
  expect(convertCodeBlocksToDiagramSyntax(embedded)).toBe(embedded);
  const example = "````markdown\n```uml\nA -> B\n```\n````";
  expect(convertCodeBlocksToDiagramSyntax(example)).toBe(example);
  expect(
    convertCodeBlocksToDiagramSyntax(
      "```plantuml\nA -> B\n```\n\n```math\nx^2\n```",
    ),
  ).toBe("$$uml\nA -> B\n$$\n\n$$katex\nx^2\n$$");
});

test("SDK 로딩 실패가 다른 문단을 깨뜨리지 않는다", async ({ page }) => {
  await page.route("**/*vendor_comic-gen*", (route) => route.abort());
  await page.goto("/p/1");
  await expect(
    page.locator(".comic-gen").first().getByRole("alert"),
  ).toContainText("만화를 표시할 수 없습니다");
  await expect(
    page
      .locator(".toastui-editor-contents")
      .getByText("뒤 문단", { exact: true }),
  ).toBeVisible();
});

test("게시물: 네 컷·여러 블록·오류·중첩 펜스·details를 독립적으로 렌더링", async ({
  page,
}) => {
  const dialogs: string[] = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  await page.goto("/p/1");
  const blocks = page.locator(".comic-gen");
  await expect(blocks).toHaveCount(5);
  await expect(blocks.nth(0).locator("img")).toHaveCount(1);
  await expect(blocks.nth(1).locator("img")).toHaveCount(1);
  await expect(blocks.nth(2).getByRole("alert")).toContainText(
    "만화를 표시할 수 없습니다",
  );
  await expect(blocks.nth(3).getByRole("alert")).toContainText(
    "만화를 표시할 수 없습니다",
  );
  await expect(blocks.first().locator("img").first()).toHaveAttribute(
    "alt",
    "요청과 응답 · 1/4",
  );
  await expect(blocks.nth(1).locator("img").first()).toHaveAttribute(
    "alt",
    "다른 만화 · 1/4",
  );
  await expect(blocks.last().locator("img")).toHaveCount(1);
  await expect(blocks.last()).toBeHidden();
  await page.getByText("안쪽 만화", { exact: true }).click();
  await expect(blocks.last()).toBeVisible();
  const contents = page.locator(".toastui-editor-contents");
  await expect(contents.locator("pre code").first()).toContainText(
    "```comic-gen",
  );
  await expect(contents.locator("s, script")).toHaveCount(0);
  await expect(contents.getByText("뒤 문단", { exact: true })).toBeVisible();
  expect(dialogs).toEqual([]);
  const svg = await blocks
    .first()
    .locator("img")
    .first()
    .evaluate(async (img: HTMLImageElement) => (await fetch(img.src)).text());
  expect(svg).toContain("&lt;script&gt;");
  await expect
    .poll(() =>
      blocks
        .first()
        .locator("img")
        .first()
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalHeight > 0,
        ),
    )
    .toBe(true);
});

for (const width of [1440, 390]) {
  test(`뷰어 ${width}px: 원본 배치·확대·스크롤·키보드 닫기`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/p/1");
    const card = page
      .getByRole("button", { name: "요청과 응답 · 만화 읽기", exact: true })
      .first();
    await expect(card).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await card.focus();
    await page.keyboard.press("Enter");
    const viewer = page.getByRole("dialog", {
      name: "요청과 응답",
      exact: true,
    });
    await expect(viewer).toBeVisible();
    await expect(viewer.getByRole("button", { name: "닫기" })).toBeFocused();
    const image = viewer.getByRole("img", { name: "요청과 응답", exact: true });
    const svg = await image.evaluate(async (img: HTMLImageElement) =>
      (await fetch(img.src)).text(),
    );
    expect([...svg.matchAll(/data-panel="(\d+)"/g)].map((m) => m[1])).toEqual([
      "0",
      "1",
      "2",
      "3",
    ]);
    expect(svg).toContain("&lt;script&gt;");
    const region = viewer.getByRole("region", { name: "만화 읽기 영역" });
    const preventOverflow = viewer.getByRole("checkbox", {
      name: "화면 넘침 방지",
    });
    const zoom = viewer.getByLabel("보기 크기");
    await expect(preventOverflow).toBeChecked();
    await expect(zoom).toHaveValue("1");
    await expect(zoom.locator("option")).toHaveText(["100%", "150%", "200%"]);
    await expectContained(image, region);
    const bounds = await image.boundingBox();
    expect(bounds!.width).toBeLessThan(width);
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    await page.keyboard.press("Tab");
    await expect(preventOverflow).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(zoom).toBeFocused();
    await zoom.selectOption("2");
    await expectContained(image, region);
    await preventOverflow.uncheck();
    await expect(zoom).toHaveValue("2");
    await expect
      .poll(async () => (await image.boundingBox())!.width)
      .toBe(1440);
    await zoom.selectOption("1");
    await expect.poll(async () => (await image.boundingBox())!.width).toBe(720);
    await zoom.selectOption("1.5");
    await expect
      .poll(async () => (await image.boundingBox())!.width)
      .toBe(1080);
    await zoom.selectOption("2");
    await expect
      .poll(async () => (await image.boundingBox())!.width)
      .toBe(1440);
    expect(await region.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
      true,
    );
    expect(
      await region.evaluate((el) => el.scrollHeight > el.clientHeight),
    ).toBe(true);
    await region.focus();
    await page.keyboard.press("ArrowDown");
    await expect
      .poll(() => region.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(0);
    await page.keyboard.press("Tab");
    await expect(viewer.getByRole("button", { name: "닫기" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(region).toBeFocused();
    await preventOverflow.check();
    await expect(zoom).toHaveValue("2");
    await expectContained(image, region);
    const fittedHeight = (await image.boundingBox())!.height;
    await page.setViewportSize({ width, height: 540 });
    await expectContained(image, region);
    await expect
      .poll(async () => (await image.boundingBox())!.height)
      .toBeLessThan(fittedHeight);
    const viewportHeight = await region.evaluate((el) => el.clientHeight);
    const help = viewer.locator(".comic-viewer-help");
    const helpText = await help.textContent();
    await help.evaluate((el) => {
      el.textContent = el.textContent!.repeat(5);
    });
    await expect
      .poll(() => region.evaluate((el) => el.clientHeight))
      .toBeLessThan(viewportHeight);
    await expectContained(image, region);
    await help.evaluate((el: HTMLElement) => {
      el.style.height = "1000px";
    });
    await expect
      .poll(() => image.evaluate((el) => el.getBoundingClientRect().width))
      .toBe(0);
    await help.evaluate((el: HTMLElement, text) => {
      el.style.height = "";
      el.textContent = text;
    }, helpText);
    await page.setViewportSize({ width: 280, height: 1000 });
    await expectContained(image, region);
    const innerWidth = await region.evaluate((el) => {
      const style = getComputedStyle(el);
      return (
        el.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight)
      );
    });
    await expect
      .poll(async () => (await image.boundingBox())!.width)
      .toBeCloseTo(innerWidth, 0);
    await page.setViewportSize({ width, height: 844 });
    await expectContained(image, region);
    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
    await expect(card).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
      "hidden",
    );
    await card.click();
    await expect(zoom).toHaveValue("1");
    await expect(preventOverflow).toBeChecked();
    await expectContained(image, region);
    expect(await region.evaluate((el) => el.scrollTop)).toBe(0);
    await page.screenshot({ path: `test-results/comic-viewer-${width}.png` });
    await viewer.getByRole("button", { name: "닫기" }).click();
    await expect(viewer).toBeHidden();
  });
}
test("편집 미리보기: 입력 변경·오류 복구·블록 삭제가 즉시 반영된다", async ({
  page,
}) => {
  await page.goto("/p/1/edit");
  const input = page.getByPlaceholder("내용을 입력하세요");
  await expect(input).toBeVisible();
  await input.fill(fence(koreanSource));
  await page.getByRole("button", { name: "미리보기", exact: true }).click();
  await expect(page.locator(".comic-gen img")).toHaveCount(1);
  await input.fill(fence("잘못된 입력"));
  await expect(page.locator(".comic-gen [role=alert]")).toBeVisible();
  await input.fill(fence(source.replace("요청과 응답", "수정한 만화")));
  await expect(page.locator(".comic-gen img").first()).toHaveAttribute(
    "alt",
    "수정한 만화 · 1/4",
  );
  await page.getByRole("button", { name: "수정한 만화 · 만화 읽기" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.evaluate(() => {
    const root = document.querySelector(".comic-gen")!;
    root.remove();
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
  await input.fill("일반 문단");
  await expect(page.locator(".comic-gen")).toHaveCount(0);
  await expect(page.locator(".toastui-editor-contents")).toContainText(
    "일반 문단",
  );
});

for (const width of [1440, 390]) {
  test(`한글·영어 ${width}px: 같은 카드와 원본 SVG를 뷰어로 표시`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/p/2");
    const cards = page.getByRole("button", {
      name: "요청과 응답 · 만화 읽기",
      exact: true,
    });
    await expect(cards).toHaveCount(2);
    await expect(page.locator(".comic-gen [role=alert]")).toHaveCount(0);
    const outputs: string[] = [];
    for (let index = 0; index < 2; index++) {
      await expect(cards.nth(index)).toContainText("4컷");
      await cards.nth(index).click();
      const viewer = page.getByRole("dialog", {
        name: "요청과 응답",
        exact: true,
      });
      await expect(viewer).toBeVisible();
      const img = viewer.getByRole("img", { name: "요청과 응답", exact: true });
      outputs.push(
        await img.evaluate(async (el: HTMLImageElement) =>
          (await fetch(el.src)).text(),
        ),
      );
      await viewer.getByRole("checkbox", { name: "화면 넘침 방지" }).uncheck();
      await viewer.getByLabel("보기 크기").selectOption("2");
      await expect
        .poll(async () => (await img.boundingBox())!.width)
        .toBe(1440);
      await page.keyboard.press("Escape");
      await expect(cards.nth(index)).toBeFocused();
    }
    expect(outputs[1]).toBe(outputs[0]);
    expect(
      [...outputs[1].matchAll(/data-panel="(\d+)"/g)].map((m) => m[1]),
    ).toEqual(["0", "1", "2", "3"]);
  });
}
