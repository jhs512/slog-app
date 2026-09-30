import { expect, test } from "@playwright/test";

import { convertCodeBlocksToDiagramSyntax } from "../../src/lib/business/markdownUtils";
import { fence, source } from "./fixtures.mjs";

test("VS CODE 미리보기에서도 수정한 만화가 표시된다", async ({ page }) => {
  await page.goto("/p/1/vscode");
  await page.getByRole("button", { name: "미리보기", exact: true }).click();
  await expect(page.locator(".comic-gen img")).toHaveCount(12);
  await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 30_000 });
  await page.evaluate(
    (body) => {
      window.monaco.editor.getModels()[0].setValue(body);
    },
    "```yml\ntitle: 검증용 제목\npublished: false\nlisted: false\n```\n\n" +
      fence(source.replace("요청과 응답", "VS CODE 수정")),
  );
  await expect(page.locator(".comic-gen img")).toHaveCount(4);
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
  await expect(blocks.nth(0).locator("img")).toHaveCount(4);
  await expect(blocks.nth(1).locator("img")).toHaveCount(4);
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
  await expect(blocks.last().locator("img")).toHaveCount(4);
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
          (img: HTMLImageElement) =>
            img.complete && img.naturalHeight > img.naturalWidth,
        ),
    )
    .toBe(true);
});

test("모바일: 각 컷이 세로로 배치되고 가로로 넘치지 않는다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/p/1");
  const imgs = page.locator(".comic-gen").first().locator("img");
  await expect(imgs).toHaveCount(4);
  const bounds = await imgs.evaluateAll((nodes) =>
    nodes.map((node) => {
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    }),
  );
  for (const [index, bound] of bounds.entries()) {
    expect(bound.x).toBeGreaterThanOrEqual(0);
    expect(bound.x + bound.width).toBeLessThanOrEqual(390);
    expect(bound.height).toBeGreaterThan(bound.width);
    if (index)
      expect(bound.y).toBeGreaterThan(
        bounds[index - 1].y + bounds[index - 1].height,
      );
  }
});

test("편집 미리보기: 입력 변경·오류 복구·블록 삭제가 즉시 반영된다", async ({
  page,
}) => {
  await page.goto("/p/1/edit");
  const input = page.getByPlaceholder("내용을 입력하세요");
  await expect(input).toBeVisible();
  await input.fill(fence(source));
  await page.getByRole("button", { name: "미리보기", exact: true }).click();
  await expect(page.locator(".comic-gen img")).toHaveCount(4);
  await input.fill(fence("잘못된 입력"));
  await expect(page.locator(".comic-gen [role=alert]")).toBeVisible();
  await input.fill(fence(source.replace("요청과 응답", "수정한 만화")));
  await expect(page.locator(".comic-gen img").first()).toHaveAttribute(
    "alt",
    "수정한 만화 · 1/4",
  );
  await input.fill("일반 문단");
  await expect(page.locator(".comic-gen")).toHaveCount(0);
  await expect(page.locator(".toastui-editor-contents")).toContainText(
    "일반 문단",
  );
});
