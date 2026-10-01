import { type Locator, type Page, expect, test } from "@playwright/test";

import { fence } from "./fixtures.mjs";

async function point(image: Locator, index: number, right: boolean) {
  return image.evaluate(
    async (img: HTMLImageElement, { index, right }) => {
      const xml = new DOMParser().parseFromString(
        await (await fetch(img.src)).text(),
        "image/svg+xml",
      );
      const group = xml.querySelectorAll("g[data-panel]")[index];
      const values = group
        .getAttribute("transform")!
        .match(/translate\(([^)]+)\)/)![1]
        .split(/[ ,]+/)
        .map(Number);
      const rect = group.querySelector("rect")!;
      const box = img.getBoundingClientRect(),
        scale = box.width / Number(xml.documentElement.getAttribute("width"));
      return {
        x:
          box.x +
          (values[0] +
            Number(rect.getAttribute("x")) +
            Number(rect.getAttribute("width")) * (right ? 0.75 : 0.25)) *
            scale,
        y:
          box.y +
          (values[1] +
            Number(rect.getAttribute("y")) +
            Number(rect.getAttribute("height")) / 2) *
            scale,
      };
    },
    { index, right },
  );
}
async function clickPanel(
  page: Page,
  image: Locator,
  index: number,
  right: boolean,
  touch: boolean,
) {
  const p = await point(image, index, right);
  if (touch) await page.touchscreen.tap(p.x, p.y);
  else await page.mouse.click(p.x, p.y);
}
for (const width of [1440, 390]) {
  test(`컷 이동 ${width}px: 클릭·터치·키보드·경계·드래그·1~30컷`, async ({
    browser,
  }) => {
    test.setTimeout(60_000);
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      hasTouch: width === 390,
    });
    const page = await context.newPage();
    try {
      await page.goto("http://localhost:3007/p/1/edit");
      const input = page.getByPlaceholder("내용을 입력하세요");
      await page.getByRole("button", { name: "미리보기", exact: true }).click();
      for (const count of [1, 2, 7, 30]) {
        const panels = Array.from({ length: count }, (_, i) => ({
          인물: ["a"],
          대사: Array.from({ length: i === count - 1 ? 4 : 1 }, (_, j) => ({
            화자: "a",
            내용: `컷 ${i + 1} 대사 ${j + 1}`,
          })),
        }));
        await input.fill(
          fence(
            `제목: 이동 ${count}컷\n등장인물: {a: {그림: 서버}}\n컷: ${JSON.stringify(panels)}`,
          ),
        );
        const card = page.getByRole("button", {
          name: `이동 ${count}컷 · 만화 읽기`,
          exact: true,
        });
        await card.click();
        const viewer = page.getByRole("dialog"),
          image = viewer.getByRole("img"),
          region = viewer.getByRole("region");
        const previous = viewer.getByRole("button", {
            name: "이전 컷",
            exact: true,
          }),
          next = viewer.getByRole("button", { name: "다음 컷", exact: true }),
          status = viewer.getByRole("status");
        await expect(status).toHaveText(`1 / ${count}컷`);
        await expect(previous).toBeDisabled();
        await clickPanel(page, image, 0, false, width === 390);
        await expect(status).toHaveText(`1 / ${count}컷`);
        if (count > 1) {
          await clickPanel(page, image, 0, true, width === 390);
          await expect(status).toHaveText(`2 / ${count}컷`);
          await clickPanel(page, image, 1, false, width === 390);
          await expect(status).toHaveText(`1 / ${count}컷`);
          // 원래 자리로 돌아온 드래그도 이동으로 처리하지 않는다.
          const p = await point(image, 0, true);
          await page.mouse.move(p.x, p.y);
          await page.mouse.down();
          await page.mouse.move(p.x - 30, p.y + 20);
          await page.mouse.move(p.x, p.y);
          await page.mouse.up();
          await expect(status).toHaveText(`1 / ${count}컷`);
          await region.focus();
          await page.keyboard.press("ArrowRight");
          await expect(status).toHaveText(`2 / ${count}컷`);
          for (let i = 2; i < count; i++) {
            await expect(next).toBeVisible();
            const bounds = (await next.boundingBox())!;
            await page.mouse.click(
              bounds.x + bounds.width / 2,
              bounds.y + bounds.height / 2,
            );
            await expect(status).toHaveText(`${i + 1} / ${count}컷`);
          }
          await expect(next).toBeDisabled();
          const before = await region.evaluate((el) => ({
            x: el.scrollLeft,
            y: el.scrollTop,
          }));
          await clickPanel(page, image, count - 1, true, width === 390);
          await expect(status).toHaveText(`${count} / ${count}컷`);
          expect(
            await region.evaluate((el) => ({
              x: el.scrollLeft,
              y: el.scrollTop,
            })),
          ).toEqual(before);
          await region.focus();
          await page.keyboard.press("ArrowLeft");
          await expect(status).toHaveText(`${count - 1} / ${count}컷`);
          // 크기 조작은 컷 이동으로 처리하지 않는다.
          await viewer
            .getByRole("checkbox", { name: "화면 넘침 방지" })
            .uncheck();
          await viewer.getByLabel("보기 크기").selectOption("2");
          await expect
            .poll(() =>
              image.evaluate((el) => el.getBoundingClientRect().width),
            )
            .toBe(1440);
        } else await expect(next).toBeDisabled();
        await page.keyboard.press("Escape");
        await card.click();
        await expect(viewer.getByRole("status")).toHaveText(`1 / ${count}컷`);
        await page.keyboard.press("Escape");
      }
    } finally {
      await context.close();
    }
  });
}

test("가로 배치: 공개 뷰어가 실제 SVG 좌표로 좌우 스크롤한다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/p/1");
  await page.evaluate(async () => {
    const url =
      "https://cdn.jsdelivr.net/gh/jhs512/comic-gen@v0.5.0/cdn/comic-gen.viewer.js";
    const sdk = await import(url);
    if (sdk.renderComic || sdk.renderComicAsync)
      throw new Error("선택형 뷰어에 렌더러 의존성 포함");
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="400" aria-label="가로 만화"><g transform="translate(40 60)"><g data-panel="0"><rect width="300" height="240" fill="pink"/></g><g data-panel="1" transform="translate(400 0)"><rect width="300" height="280" fill="lightblue"/></g><g data-panel="2" transform="translate(800 0)"><rect width="300" height="240" fill="orange"/></g></g></svg>';
    sdk.createComicViewer().open({
      svg,
      width: 1400,
      height: 400,
      diagnostics: [],
      panels: [0, 1, 2].map((index) => ({
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><g data-panel="${index}"><rect width="300" height="${index === 1 ? 280 : 240}" fill="pink"/></g></svg>`,
        width: 300,
        height: 400,
        index,
      })),
    });
  });
  const viewer = page.getByRole("dialog");
  await viewer.getByRole("checkbox").uncheck();
  const viewport = viewer.getByRole("region", { name: "만화 읽기 영역" });
  const status = viewer.getByRole("status");
  await viewport.focus();
  await page.keyboard.press("ArrowRight");
  await expect(status).toHaveText("2 / 3컷");
  const secondOffset = await viewport.evaluate((el) => el.scrollLeft);
  expect(secondOffset).toBeGreaterThan(300);
  await page.keyboard.press("ArrowRight");
  await expect(status).toHaveText("3 / 3컷");
  expect(await viewport.evaluate((el) => el.scrollLeft)).toBeGreaterThan(
    secondOffset,
  );
  await viewer.getByRole("button", { name: "이전 컷", exact: true }).click();
  await expect(status).toHaveText("2 / 3컷");
  await viewport.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(status).toHaveText("1 / 3컷");
  await expect(
    viewer.getByRole("button", { name: "이전 컷", exact: true }),
  ).toBeDisabled();
});
