import { type Page, expect, test } from "@playwright/test";

interface MockUtterance {
  text: string;
  rate: number;
  onstart?: () => void;
  onend?: () => void;
  onerror?: () => void;
}
interface SpeechMock extends EventTarget {
  voices: { name: string; lang: string; localService: boolean }[];
  spoken: MockUtterance[];
  canceled: number;
  getVoices(): SpeechMock["voices"];
  cancel(): void;
  resume(): void;
  speak(utterance: MockUtterance): void;
}
declare global {
  interface Window {
    __speechMock: SpeechMock;
  }
}

async function mockSpeech(
  page: Page,
  mode: "korean" | "empty" | "unsupported" = "korean",
) {
  await page.addInitScript((mode) => {
    if (mode === "unsupported") {
      Reflect.deleteProperty(window, "speechSynthesis");
      Reflect.deleteProperty(window, "SpeechSynthesisUtterance");
      return;
    }
    const mock = Object.assign(new EventTarget(), {
      voices:
        mode === "empty"
          ? []
          : [{ name: "한국어 검증 음성", lang: "ko-KR", localService: true }],
      spoken: [] as MockUtterance[],
      canceled: 0,
      getVoices() {
        return this.voices;
      },
      cancel() {
        this.canceled++;
        sessionStorage.setItem("speech-canceled", String(this.canceled));
      },
      resume() {},
      speak(utterance: MockUtterance) {
        this.spoken.push(utterance);
        utterance.onstart?.();
      },
    });
    window.__speechMock = mock;
    Object.defineProperty(window, "speechSynthesis", { value: mock });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: class {
        constructor(public text: string) {}
      },
    });
  }, mode);
}

for (const width of [1440, 390]) {
  test(`본문 전체 읽기 ${width}px: 켜기 후 버튼·처음부터 끝까지·표/이미지 제외`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await mockSpeech(page);
    await page.goto("/p/4");
    const readAll = page.getByRole("button", {
      name: "처음부터 끝까지 읽기",
      exact: true,
    });
    await expect(readAll).toHaveCount(0);
    await page
      .getByRole("button", { name: "읽어주기 켜기", exact: true })
      .click();
    await expect(readAll).toBeEnabled();
    expect(await page.evaluate(() => window.__speechMock.spoken.length)).toBe(
      0,
    );
    await expect(page.locator("table .block-speech-button")).toHaveCount(0);
    await readAll.click();
    await expect(page.locator(".speech-controls")).toHaveAttribute(
      "data-state",
      "speaking",
    );
    await page.getByRole("button", { name: "일시정지", exact: true }).click();
    await expect(page.locator(".speech-controls")).toHaveAttribute(
      "data-state",
      "paused",
    );
    await page.getByRole("button", { name: "이어읽기", exact: true }).click();
    const text = await page.evaluate(() => {
      window.__speechMock.spoken.splice(
        0,
        window.__speechMock.spoken.length - 1,
      );
      for (let i = 0; i < 100; i++) {
        const count = window.__speechMock.spoken.length;
        window.__speechMock.spoken.at(-1)?.onend?.();
        if (window.__speechMock.spoken.length === count) break;
      }
      return window.__speechMock.spoken
        .map((utterance) => utterance.text)
        .join(" ");
    });
    expect(text).toContain("읽기 제목");
    expect(text).toContain("첫 문장입니다.");
    expect(text).toContain("마지막 문장입니다.");
    expect(text).toContain("곱하기");
    expect(text).toContain("본문 끝 문장입니다.");
    expect(text).not.toMatch(
      /표의 내용|접힌|숨겨진|보조 UI|console|만화 읽기|이미지 설명/,
    );
    await expect(page.locator(".speech-controls")).toHaveAttribute(
      "data-state",
      "ended",
    );
    await readAll.click();
    expect(
      await page.evaluate(() => window.__speechMock.spoken.at(-1)?.text),
    ).toContain("읽기 제목");
    await page.getByRole("button", { name: "정지", exact: true }).click();
    await page
      .getByRole("button", { name: "읽어주기 끄기", exact: true })
      .click();
    await expect(readAll).toHaveCount(0);
    await expect(page.locator(".speech-controls,.speech-active")).toHaveCount(
      0,
    );
  });

  test(`읽어주기 ${width}px: 재생·문장 이동·강조·속도·일시정지·정리`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await mockSpeech(page);
    await page.goto("/p/4");
    await page
      .getByRole("button", { name: "읽어주기 켜기", exact: true })
      .click();
    const paragraph = page
      .locator(".toastui-editor-contents p")
      .filter({ hasText: "첫 문장입니다." })
      .first();
    const read = paragraph.getByRole("button", {
      name: "이 텍스트 읽기",
      exact: true,
    });
    await expect(read).toBeVisible();
    await expect(
      page.locator(
        "pre .block-speech-button, .comic-gen .block-speech-button, nav .block-speech-button, [hidden] .block-speech-button",
      ),
    ).toHaveCount(0);
    const details = page.locator("details").filter({ hasText: "접힌 설명" });
    await expect(details.locator(".block-speech-button")).toHaveCount(0);
    expect(await page.evaluate(() => window.__speechMock.spoken.length)).toBe(
      0,
    );
    await read.click();
    const panel = page.getByRole("region", { name: "텍스트 읽어주기" });
    await expect(panel).toBeVisible();
    await expect(
      panel.getByRole("button", { name: "이전 문장", exact: true }),
    ).toBeDisabled();
    await expect(panel.locator(".speech-current-sentence p")).toHaveText(
      "첫 문장입니다.",
    );
    expect(
      await page.evaluate(() => window.__speechMock.spoken.at(-1)?.text),
    ).toBe("첫 문장입니다.");
    expect(
      await page.evaluate(
        () =>
          CSS.highlights.has("speech-sentence") ||
          !!document.querySelector(".speech-range-overlay"),
      ),
    ).toBe(true);
    const box = await panel.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(844);
    await panel.getByRole("combobox", { name: "읽기 속도" }).selectOption("3");
    expect(
      await page.evaluate(() => window.__speechMock.spoken.at(-1)?.rate),
    ).toBe(1);
    await panel.getByRole("button", { name: "다음 문장", exact: true }).click();
    expect(
      await page.evaluate(() => window.__speechMock.spoken.at(-1)?.text),
    ).toBe("에이피아이와 디비를 설명합니다.");
    expect(
      await page.evaluate(() => window.__speechMock.spoken.at(-1)?.rate),
    ).toBe(3);
    await page.evaluate(() => window.__speechMock.spoken[0].onend?.());
    await expect(panel.locator(".speech-current-sentence p")).toHaveText(
      "API와 DB를 설명합니다.",
    );
    await panel.getByRole("button", { name: "일시정지", exact: true }).click();
    await expect(panel).toHaveAttribute("data-state", "paused");
    await panel.getByRole("button", { name: "이어읽기", exact: true }).click();
    await expect(panel).toHaveAttribute("data-state", "speaking");
    await panel.getByRole("button", { name: "이전 문장", exact: true }).click();
    await expect(panel.locator(".speech-current-sentence p")).toHaveText(
      "첫 문장입니다.",
    );
    await page.screenshot({ path: `test-results/speech-${width}.png` });
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(read).toBeFocused();
    expect(
      await page.evaluate(() => CSS.highlights.has("speech-sentence")),
    ).toBe(false);
    await page
      .locator(".toastui-editor-contents p")
      .filter({ hasText: "연산은" })
      .getByRole("button", { name: "이 텍스트 읽기", exact: true })
      .click();
    expect(
      await page.evaluate(() => window.__speechMock.spoken.at(-1)?.text),
    ).toContain("곱하기");
    expect(
      await page.evaluate(() => window.__speechMock.spoken.at(-1)?.text),
    ).not.toContain("²");
    await panel.getByRole("button", { name: "정지", exact: true }).click();
    await details.getByText("접힌 설명", { exact: true }).click();
    const detailsRead = details.getByRole("button", {
      name: "이 텍스트 읽기",
      exact: true,
    });
    await expect(detailsRead).toBeVisible();
    await detailsRead.click();
    await expect(panel).toBeVisible();
    await details.getByText("접힌 설명", { exact: true }).click();
    await expect(panel).toBeHidden();
    await expect(details.locator(".block-speech-button")).toHaveCount(0);
    await read.click();
    await page
      .getByRole("button", { name: "읽어주기 끄기", exact: true })
      .click();
    await expect(
      page.locator(".speech-controls, .block-speech-button"),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "읽어주기 켜기", exact: true })
      .click();
    await read.click();
    await expect(
      panel.getByRole("combobox", { name: "읽기 속도" }),
    ).toHaveValue("3");
    await page.goto("/p/1");
    await expect(page.locator(".speech-controls")).toHaveCount(0);
    expect(
      Number(
        await page.evaluate(() => sessionStorage.getItem("speech-canceled")),
      ),
    ).toBeGreaterThan(0);
  });
}

test("한국어 음성 없음·늦은 음성 로딩·재생 오류·본문 교체", async ({
  page,
}) => {
  await mockSpeech(page, "empty");
  await page.goto("/p/4");
  await page
    .getByRole("button", { name: "읽어주기 켜기", exact: true })
    .click();
  const paragraph = page
    .locator(".toastui-editor-contents p")
    .filter({ hasText: "첫 문장입니다." })
    .first();
  const read = paragraph.getByRole("button", {
    name: "이 텍스트 읽기",
    exact: true,
  });
  await read.click();
  await expect(page.locator(".speech-notice")).toContainText(
    "한국어 음성을 찾지 못했습니다",
  );
  await expect(page.locator(".speech-notice")).toBeVisible();
  await page.evaluate(() => {
    window.__speechMock.voices = [
      { name: "한국어", lang: "ko-KR", localService: true },
    ];
    window.__speechMock.dispatchEvent(new Event("voiceschanged"));
  });
  await read.click();
  const panel = page.locator(".speech-controls");
  await expect(panel).toHaveAttribute("data-state", "speaking");
  await page.evaluate(() => window.__speechMock.spoken.at(-1)?.onerror?.());
  await expect(panel).toHaveAttribute("data-state", "error");
  await expect(panel).toContainText("음성 재생이 멈췄습니다");
  await panel.getByRole("button", { name: "읽어주기 닫기 및 정지" }).click();
  await read.click();
  await paragraph.evaluate((el) => {
    el.textContent = "수정된 본문입니다.";
  });
  await expect(panel).toBeHidden();
  await expect(
    page
      .locator(".toastui-editor-contents p")
      .filter({ hasText: "수정된 본문입니다." })
      .getByRole("button", { name: "이 텍스트 읽기", exact: true }),
  ).toBeVisible();
});

test("읽어주기 미지원 브라우저 안내", async ({ page }) => {
  await mockSpeech(page, "unsupported");
  await page.goto("/p/4");
  await page
    .getByRole("button", { name: "읽어주기 켜기", exact: true })
    .click();
  await expect(
    page.getByText("이 브라우저는 읽어주기를 지원하지 않습니다.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".block-speech-button")).toHaveCount(0);
});

test("문장 강조 대체 경로도 본문·선택을 유지하고 정리한다", async ({
  page,
}) => {
  await mockSpeech(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, "Highlight", { value: undefined });
  });
  await page.goto("/p/4");
  const paragraph = page
    .locator(".toastui-editor-contents p")
    .filter({ hasText: "첫 문장입니다." })
    .first();
  const text = await paragraph.textContent();
  await page
    .getByRole("button", { name: "읽어주기 켜기", exact: true })
    .click();
  await paragraph
    .getByRole("button", { name: "이 텍스트 읽기", exact: true })
    .click();
  await expect(page.locator(".speech-range-overlay")).toBeAttached();
  expect(
    await page.locator(".speech-range-overlay span").count(),
  ).toBeGreaterThan(0);
  expect(await paragraph.textContent()).toBe(text);
  expect(await page.evaluate(() => getSelection()?.toString())).toBe("");
  await page.getByRole("button", { name: "정지", exact: true }).click();
  await expect(page.locator(".speech-range-overlay")).toHaveCount(0);
});
