import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { checkA11y } from 'axe-playwright'; 

test('site layout WCAG A and AA standards', async ({page}, testInfo ) => {
  await page.goto(process.env.BASE_URL || "http://localhost:4321");
  let contentHeight = await page.evaluate(() => document.querySelector('html')?.scrollHeight);
  if (contentHeight == null) {
    contentHeight = 932;
  }
  page.setViewportSize({width: 1792, height: contentHeight} );
  const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  await testInfo.attach('accessibility-scan-results', {
    body: JSON.stringify(accessibilityScanResults, null, 2),
    contentType: 'application/json',
  });
  await checkA11y(page, undefined, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
  expect(accessibilityScanResults.violations).toEqual([]);
});