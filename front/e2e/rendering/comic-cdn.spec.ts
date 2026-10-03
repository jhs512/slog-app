import { expect, test } from "@playwright/test";

import { fence, source } from "./fixtures.mjs";

const viewerURL =
  "https://cdn.jsdelivr.net/gh/jhs512/comic-gen@v0.7.1/cdn/comic-gen.viewer.js";

test("공식 CDN: 여러 블록은 요청 하나를 공유하고 CSP 아래에서 동작한다", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().startsWith(viewerURL)) requests.push(request.url());
  });
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const meta = document.createElement("meta");
      meta.httpEquiv = "Content-Security-Policy";
      meta.content =
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net";
      document.head.append(meta);
    });
  });
  await page.goto("/p/2");
  await expect(page.locator(".comic-card")).toHaveCount(2);
  expect(requests).toEqual([viewerURL]);
  await page.locator(".comic-card").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("status")).toHaveText(
    "1 / 4컷",
  );
  await page.keyboard.press("Escape");
  await page.locator(".comic-card").last().click();
  expect(requests).toEqual([viewerURL]);
});

test("CDN 실패: 같은 실패를 공유하고 새 요청으로 재시도한다", async ({
  page,
}) => {
  let requests = 0;
  await page.route(`${viewerURL}*`, async (route) => {
    requests++;
    if (requests === 1) await route.abort("failed");
    else await route.continue();
  });
  await page.goto("/p/2");
  const retry = page.getByRole("button", {
    name: "만화 다시 불러오기",
    exact: true,
  });
  await expect(retry).toHaveCount(2);
  expect(requests).toBe(1);
  await retry.first().click();
  await expect(page.locator(".comic-card")).toHaveCount(1);
  expect(requests).toBe(2);
  await retry.click();
  await expect(page.locator(".comic-card")).toHaveCount(2);
  expect(requests).toBe(2);
});

test("CDN 지연: 블록 삭제 후 늦은 결과를 버리고 다시 삽입하면 공유 모듈을 쓴다", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0;
  await page.route(`${viewerURL}*`, async (route) => {
    requests++;
    await gate;
    await route.continue();
  });
  await page.goto("/p/1/edit");
  const input = page.getByPlaceholder("내용을 입력하세요");
  await input.fill(fence(source));
  expect(requests).toBe(0);
  await page.getByRole("button", { name: "미리보기", exact: true }).click();
  await expect.poll(() => requests).toBe(1);
  await input.fill("만화 없는 본문");
  await expect(page.locator(".comic-gen")).toHaveCount(0);
  release();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await input.fill(fence(source));
  await expect(page.locator(".comic-card")).toHaveCount(1);
  expect(requests).toBe(1);
  await page.locator(".comic-card").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await input.evaluate((element: HTMLTextAreaElement) => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!.call(element, "모두 지움");
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("[data-comic-gen-viewer-styles]")).toHaveCount(0);
});

test("CDN 시간 초과: 영구 로딩 대신 재시도를 제공하고 늦은 결과는 버린다", async ({
  page,
}) => {
  test.setTimeout(35_000);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0;
  await page.route(`${viewerURL}*`, async (route) => {
    requests++;
    if (requests === 1) await gate;
    await route.continue();
  });
  await page.goto("/p/2");
  const retry = page.getByRole("button", {
    name: "만화 다시 불러오기",
    exact: true,
  });
  await expect(retry).toHaveCount(2, { timeout: 20_000 });
  await expect(page.locator(".comic-gen").first()).toHaveAttribute(
    "aria-busy",
    "false",
  );
  const originalResponse = page.waitForResponse(viewerURL);
  release();
  await originalResponse;
  await expect(retry).toHaveCount(2);
  await retry.first().click();
  await expect(page.locator(".comic-card")).toHaveCount(1);
  expect(requests).toBe(2);
});

for (const width of [1440, 390]) {
  test(`닫기 ${width}px: 내부 클릭 유지·Escape·배경 클릭·초점 복원`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/p/1");
    const card = page.locator(".comic-card").first();
    await card.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.locator("h2").click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(card).toBeFocused();
    await card.click();
    await expect(dialog).toBeVisible();
    const region = dialog.getByRole("region", { name: "만화 읽기 영역" });
    const area = await region.boundingBox();
    const image = await region.locator("img").boundingBox();
    expect(image!.x).toBeGreaterThan(area!.x + 2);
    await page.mouse.click(image!.x + image!.width / 2, image!.y + 80);
    await expect(dialog).toBeVisible();
    await page.mouse.move(image!.x + 30, image!.y + 80);
    await page.mouse.down();
    await page.mouse.move(area!.x + 2, area!.y + 100);
    await page.mouse.up();
    await expect(dialog).toBeVisible();
    await page.mouse.click(area!.x + 2, area!.y + 100);
    await expect(dialog).toBeHidden();
    await expect(card).toBeFocused();
    if (width > 1000) {
      for (const x of [2, width - 2]) {
        await card.click();
        await expect(dialog).toBeVisible();
        const box = await dialog.boundingBox();
        expect(x < box!.x || x > box!.x + box!.width).toBe(true);
        await page.mouse.click(x, 422);
        await expect(dialog).toBeHidden();
        await expect(card).toBeFocused();
      }
      await card.click();
      const box = await dialog.boundingBox();
      await page.mouse.move(box!.x + 50, box!.y + 50);
      await page.mouse.down();
      await page.mouse.move(2, 422);
      await page.mouse.up();
      await expect(dialog).toBeVisible();
    }
    await page.screenshot({ path: `test-results/comic-dismiss-${width}.png` });
  });
}
