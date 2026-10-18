import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://127.0.0.1:5188';

const run = async () => {
  const browser = await chromium.launch({ channel: 'chromium', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`page: ${e.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.__THREE_GAME_TEST_HOOKS__));

  await page.evaluate(async () => {
    await window.__THREE_GAME_TEST_HOOKS__.setState('active-play');
    window.__THREE_GAME_TEST_HOOKS__.setPausedForScreenshot(false);
  });

  await page.mouse.move(640, 400);
  await page.mouse.down();
  for (let x = 400; x <= 900; x += 50) {
    await page.mouse.move(x, 400);
    await page.waitForTimeout(80);
  }
  await page.mouse.up();
  await page.waitForTimeout(800);

  const motorDiag = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__());

  // KRL path
  await page.evaluate(async () => {
    await window.__THREE_GAME_TEST_HOOKS__.setState({ state: 'active-play', mode: 'krl' });
    window.__THREE_GAME_TEST_HOOKS__.setPausedForScreenshot(false);
  });
  await page.mouse.move(500, 360);
  await page.mouse.down();
  await page.mouse.move(700, 360, { steps: 8 });
  await page.waitForTimeout(500);
  await page.mouse.up();
  const krlDiag = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__());

  const result = {
    ok: errors.length === 0,
    errors,
    motorDiag,
    krlDiag,
    checks: {
      calls: krlDiag.calls > 0,
      triangles: krlDiag.triangles > 100,
      progressed: (motorDiag.score?.distanceM ?? 0) > 0,
      modeSwitched: krlDiag.mode === 'krl',
      healthPresent: typeof krlDiag.score?.health === 'number',
    },
  };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  process.exit(result.ok && result.checks.calls && result.checks.triangles && result.checks.modeSwitched ? 0 : 1);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
