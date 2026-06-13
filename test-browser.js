const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.error(`PAGE LOG ERROR: ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.error(`PAGE ERROR: ${err.message}`);
  });
  
  await page.goto('https://localhost:5173/');
  await page.waitForTimeout(2000);
  await browser.close();
})();
