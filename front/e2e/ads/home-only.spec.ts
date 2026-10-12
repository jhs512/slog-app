import { type Page, expect, test } from "@playwright/test";

const adScript =
  'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]';

async function noAds(page: Page) {
  await expect(page.locator(adScript)).toHaveCount(0);
  await expect(page.locator("ins.adsbygoogle, #mock-auto-ad")).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => "adsbygoogle" in window))
    .toBe(false);
}

test.beforeEach(async ({ page }) => {
  await page.route("**/pagead2.googlesyndication.com/**", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `const render = () => {
          document.querySelectorAll('ins.adsbygoogle').forEach(el => {el.style.height = '100px'});
          if (document.body && !document.getElementById('mock-auto-ad')) {
            const ad = document.createElement('div');
            ad.id = 'mock-auto-ad'; ad.textContent = '자동 광고';
            document.body.append(ad);
          }
        };
        window.adsbygoogle = {push: render};
        setInterval(render, 50);`,
    }),
  );
  await page.route("**/googletagmanager.com/**", (route) => route.abort());
});

for (const path of ["/p/4", "/p/3", "/p", "/privacy", "/missing-page"]) {
  test(`직접 진입 ${path}: 광고 스크립트와 슬롯 없음`, async ({ page }) => {
    await page.goto(path);
    await noAds(page);
  });
}

for (const width of [1440, 390]) {
  test(`홈 → 상세 → 뒤로/앞으로 → 홈 ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.locator(adScript)).toHaveCount(1);
    await expect(page.locator("ins.adsbygoogle")).toHaveAttribute(
      "data-ad-slot",
      "1234567890",
    );
    await expect(page.locator("#mock-auto-ad")).toBeVisible();
    await testInfo.attach("home", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
    await page.locator('a[href="/p/4"]').first().click();
    await expect(page).toHaveURL(/\/p\/4$/);
    await noAds(page);
    await testInfo.attach("detail", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("ins.adsbygoogle")).toBeVisible();
    await expect(page.locator("#mock-auto-ad")).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(/\/p\/4$/);
    await noAds(page);
    await page.locator('footer a[href="/"]').click();
    await expect(page.locator(adScript)).toHaveCount(1);
    await expect(page.locator("ins.adsbygoogle")).toBeVisible();
  });
}
