import { expect, test } from "@playwright/test";

import {
  appendMarpTemplate,
  getMarpDecks,
  isMarpDocument,
} from "../../src/lib/business/marpSource";
import {
  parsePostEditorContent,
  withPostEditorConfig,
} from "../../src/lib/business/postEditorConfig";
import { fencedMarpPost, marpSource, mixedPost } from "./marp-fixtures.mjs";

test("Marp 본문과 글 설정·예제 펜스·기존 PPT는 서로 구분된다", () => {
  const config = { title: "제목: 원문 보존", published: true, listed: false };
  const document = withPostEditorConfig(config, marpSource);
  expect(parsePostEditorContent(document)).toEqual({
    ...config,
    content: marpSource,
  });
  expect(parsePostEditorContent(marpSource, config)).toEqual({
    ...config,
    content: marpSource,
  });
  expect(
    parsePostEditorContent("$$config\ntitle: 예전 설정\n$$\n\n본문", config),
  ).toEqual({ ...config, title: "예전 설정", content: "본문" });
  expect(
    parsePostEditorContent("```yml\nmarp: true\ntheme: gaia\n```", config)
      .content,
  ).toContain("marp: true");
  expect(
    parsePostEditorContent(
      "```yml\ntitle: 예전 설정\npublished: false\nlisted: true\n```\n\n" +
        marpSource,
    ).content,
  ).toBe(marpSource);
  expect(isMarpDocument("\uFEFF" + marpSource.replaceAll("\n", "\r\n"))).toBe(
    true,
  );
  expect(isMarpDocument(marpSource.replace("marp: true", "marp: false"))).toBe(
    false,
  );
  expect(getMarpDecks(mixedPost.content).map((deck) => deck.id)).toEqual([
    "new",
  ]);
  expect(getMarpDecks("````markdown\n" + mixedPost.content + "\n````")).toEqual(
    [],
  );
  expect(appendMarpTemplate(mixedPost.content)).toContain("```marp");
  expect(getMarpDecks(fencedMarpPost.content).map((deck) => deck.id)).toEqual([
    "block-1",
    "block-2",
  ]);
  expect(getMarpDecks(fencedMarpPost.content)[0].source).toBe(marpSource);
  expect(
    getMarpDecks("````markdown\n" + fencedMarpPost.content + "\n````"),
  ).toEqual([]);
});

for (const width of [1440, 390]) {
  test(`Marp ${width}px: 테마·4:3·코드·이미지·이동·해시`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const dialogs: string[] = [];
    let imageLoaded = false;
    page.on("response", (response) => {
      if (response.url().endsWith("/globe.svg") && response.status() === 200)
        imageLoaded = true;
    });
    page.on("dialog", async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });
    await page.goto("/p/5");
    const frame = page.frameLocator('iframe[title^="Marp ·"]');
    await expect(
      frame.locator('section[id][data-theme="gaia"][data-size="4:3"]'),
    ).toHaveCount(3);
    await expect(
      frame.getByRole("heading", { name: "한글 Marp 발표" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "다음 슬라이드", exact: true })
      .click();
    await expect(
      frame.getByRole("heading", { name: "이미지와 코드" }),
    ).toBeVisible();
    await expect(frame.locator("code")).toContainText(
      'const separator = "---"',
    );
    await expect(frame.locator('[style*="globe.svg"]')).not.toHaveCount(0);
    await expect.poll(() => imageLoaded).toBe(true);
    const bounds = (await page
      .locator('iframe[title^="Marp ·"]')
      .boundingBox())!;
    expect(bounds.width / bounds.height).toBeCloseTo(4 / 3, 1);
    await page.getByRole("link", { name: "Marp 보기", exact: true }).click();
    await expect(page).toHaveURL(/\/p\/5\/marp\/document/);
    await expect(
      page.locator('iframe[title="Marp 검증 문서 · 1/3"]'),
    ).toBeVisible();
    await page.keyboard.press("End");
    await expect(page).toHaveURL(/#3$/);
    await expect(
      page
        .frameLocator('iframe[title^="Marp 검증 문서 ·"]')
        .getByRole("heading", { name: "마지막 슬라이드" }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.locator('iframe[title="Marp 검증 문서 · 3/3"]'),
    ).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(page).toHaveURL(/#2$/);
    const stage = page.locator('iframe[title="Marp 검증 문서 · 2/3"]');
    const rect = (await stage.boundingBox())!;
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(width + 1);
    expect(rect.y + rect.height).toBeLessThanOrEqual(844);
    const displayedImage = page
      .frameLocator('iframe[title="Marp 검증 문서 · 2/3"]')
      .locator('figure[style*="globe.svg"]');
    await expect(displayedImage).toBeVisible();
    expect(
      await displayedImage.evaluate(async (element) => {
        const url =
          getComputedStyle(element).backgroundImage.match(
            /url\("?(.*?)"?\)/,
          )?.[1];
        const image = new Image();
        image.src = url!;
        await image.decode();
        await new Promise(requestAnimationFrame);
        return image.naturalWidth;
      }),
    ).toBeGreaterThan(0);
    await stage.screenshot({ path: `test-results/marp-${width}.png` });
    if (width === 1440) {
      await page
        .getByRole("button", { name: "전체 화면", exact: true })
        .click();
      await expect
        .poll(() => page.evaluate(() => Boolean(document.fullscreenElement)))
        .toBe(true);
      await page
        .getByRole("button", { name: "전체 화면 종료", exact: true })
        .click();
      await expect
        .poll(() => page.evaluate(() => Boolean(document.fullscreenElement)))
        .toBe(false);
    }
    await page.getByRole("link", { name: "글로 돌아가기" }).click();
    await expect(page).toHaveURL(/\/p\/5$/);
    expect(dialogs).toEqual([]);
  });
}

test("일반 본문·기존 PPT 링크와 Marp 발표가 공존한다", async ({ page }) => {
  await page.goto("/p/6");
  await expect(page.getByText("앞 문단", { exact: true })).toBeVisible();
  await expect(page.getByText("뒤 문단", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "기존 PPT 링크", exact: true }),
  ).toHaveAttribute("href", "/p/6/ppt/old#2");
  await expect(
    page.getByRole("link", { name: "Marp 발표 열기" }),
  ).toHaveAttribute("href", "/p/6/marp/new");
  await page.getByRole("link", { name: "기존 PPT 링크", exact: true }).click();
  await expect(page.locator(".ppt-slide")).toContainText(
    "기존 두 번째 슬라이드",
  );
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".ppt-slide")).toContainText("기존 첫 슬라이드");
  await expect(page.locator(".ppt-slide iframe")).toHaveCount(0);
  await page.goto("/p/6/marp/new#2");
  await expect(page.locator('iframe[title="새 Marp · 2/3"]')).toBeVisible();
});

test("백틱 세 개 marp 블록: 여러 덱·중첩 코드·문단·발표 선택", async ({
  page,
}) => {
  await page.goto("/p/7");
  await expect(page.getByText("앞 문단", { exact: true })).toBeVisible();
  await expect(page.getByText("중간 문단", { exact: true })).toBeVisible();
  await expect(page.getByText("뒤 문단", { exact: true })).toBeVisible();
  const first = page.frameLocator('iframe[title="Marp 1 · 1/3"]');
  await expect(
    first.getByRole("heading", { name: "한글 Marp 발표" }),
  ).toBeVisible();
  await expect(
    page
      .frameLocator('iframe[title="Marp 2 · 1/1"]')
      .locator('section[data-theme="uncover"]'),
  ).toHaveCount(1);
  await page.getByRole("link", { name: "Marp 보기", exact: true }).click();
  await expect(page).toHaveURL(/\/p\/7\/marp$/);
  await page.getByRole("link", { name: "Marp 1", exact: true }).click();
  await expect(page).toHaveURL(/\/p\/7\/marp\/block-1/);
  await expect(page.locator('iframe[title="Marp 1 · 1/3"]')).toBeVisible();
});

test("기본 에디터: Marp 추가는 기존 본문을 보존하고 미리보기에서 즉시 렌더링한다", async ({
  page,
}) => {
  await page.goto("/p/4/edit");
  const content = page.getByPlaceholder("내용을 입력하세요");
  const original = await content.inputValue();
  await page.getByRole("button", { name: "Marp 추가", exact: true }).click();
  expect(await content.inputValue()).toContain(original);
  await page.getByRole("button", { name: "미리보기", exact: true }).click();
  await expect(
    page
      .frameLocator('iframe[title^="Marp 1 ·"]')
      .getByRole("heading", { name: "발표 제목" }),
  ).toBeVisible();
  await content.fill(marpSource);
  await expect(
    page.getByRole("button", { name: "슬라이드 추가" }),
  ).toBeVisible();
  await expect(
    page
      .frameLocator('iframe[title^="Marp ·"]')
      .getByRole("heading", { name: "한글 Marp 발표" }),
  ).toBeVisible();
});

test("VS CODE: Marp frontmatter 저장과 실시간 미리보기", async ({ page }) => {
  await page.goto("/p/5/vscode");
  await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "미리보기", exact: true }).click();
  await expect(
    page
      .frameLocator('iframe[title^="Marp ·"]')
      .getByRole("heading", { name: "한글 Marp 발표" }),
  ).toBeVisible();
  await page.evaluate(
    (source) => window.monaco.editor.getModels()[0].setValue(source),
    marpSource,
  );
  let saved: Record<string, unknown> | undefined;
  await page.route("**/post/api/v1/posts/5", async (route) => {
    if (route.request().method() === "PUT") {
      saved = route.request().postDataJSON();
      await route.fulfill({ json: { resultCode: "200-1", msg: "검증 저장" } });
    } else await route.continue();
  });
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect
    .poll(() => saved)
    .toMatchObject({
      title: "Marp 검증 문서",
      content: marpSource,
      published: true,
    });
});

test("Marp 변환 실패·입력 제한·작성 및 발표 진입", async ({
  page,
  request,
}) => {
  expect(
    (
      await request.post("/api/marp", {
        data: { markdown: "x".repeat(200_001) },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/marp", {
        data: { markdown: "# 슬라이드\n---\n".repeat(201) },
      })
    ).status(),
  ).toBe(400);
  expect((await request.post("/api/marp", { data: null })).status()).toBe(400);
  await page.route("**/api/marp", (route) =>
    route.fulfill({ status: 500, json: { error: "실패" } }),
  );
  await page.goto("/p/5");
  await expect(
    page.getByRole("alert").filter({ hasText: "Marp를 표시할 수 없습니다" }),
  ).toContainText("Marp를 표시할 수 없습니다");
  await page.unroute("**/api/marp");
  await page.goto("/marp");
  const source = page.getByRole("textbox", { name: "Marp 원문" });
  await source.fill(marpSource);
  await page.getByRole("button", { name: "미리보기", exact: true }).click();
  await expect(
    page
      .frameLocator('iframe[title^="Marp 미리보기 ·"]')
      .getByRole("heading", { name: "한글 Marp 발표" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Marp 발표 열기", exact: true })
    .click();
  await expect(page.locator('iframe[title="Marp 발표 · 1/3"]')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator('iframe[title^="Marp 발표 ·"]')).toHaveCount(0);
});

test("늦은 Marp 미리보기 응답은 수정한 원문을 덮어쓰지 않는다", async ({
  page,
}) => {
  let release!: () => void;
  let started = false;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/marp", async (route) => {
    if (route.request().postDataJSON().markdown.includes("느린 응답")) {
      started = true;
      await gate;
      try {
        await route.fulfill({ status: 500, json: { error: "늦은 실패" } });
      } catch {
        /* 중단된 요청 */
      }
    } else await route.continue();
  });
  await page.goto("/marp");
  const source = page.getByRole("textbox", { name: "Marp 원문" });
  await source.fill("---\nmarp: true\n---\n# 느린 응답");
  await page.getByRole("button", { name: "미리보기", exact: true }).click();
  await expect.poll(() => started).toBe(true);
  await source.fill("---\nmarp: true\n---\n# 최신 원문");
  await page.getByRole("button", { name: "미리보기", exact: true }).click();
  await expect(
    page
      .frameLocator('iframe[title^="Marp 미리보기 ·"]')
      .getByRole("heading", { name: "최신 원문" }),
  ).toBeVisible();
  release();
  await expect(
    page
      .frameLocator('iframe[title^="Marp 미리보기 ·"]')
      .getByRole("heading", { name: "최신 원문" }),
  ).toBeVisible();
  await expect(
    page.getByText("Marp를 표시할 수 없습니다", { exact: false }),
  ).toHaveCount(0);
});
