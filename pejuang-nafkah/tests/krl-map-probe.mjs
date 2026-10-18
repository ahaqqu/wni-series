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

  // Start KRL
  await page.evaluate(async () => {
    await window.__THREE_GAME_TEST_HOOKS__.setState({ state: 'active-play', mode: 'krl' });
    window.__THREE_GAME_TEST_HOOKS__.setPausedForScreenshot(false);
  });
  await page.waitForTimeout(400);

  // Board: drag toward left (train side) and hold to squeeze in
  await page.mouse.move(640, 360);
  await page.mouse.down();
  await page.mouse.move(180, 360, { steps: 12 });
  await page.waitForTimeout(700);
  // keep holding (brace/desak) until we enter
  await page.waitForTimeout(1200);
  await page.mouse.up();

  await page.waitForTimeout(1500);

  const diag = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__());
  const mapVisible = await page.evaluate(() => {
    const el = document.getElementById('krl-map');
    return el && !el.classList.contains('hidden');
  });
  const mapText = await page.evaluate(() => {
    const g = (id) => document.getElementById(id)?.textContent ?? '';
    return {
      current: g('krl-current'),
      next: g('krl-next'),
      remaining: g('krl-remaining'),
      phase: g('krl-phase'),
      line: g('krl-line-label'),
      door: g('krl-door'),
      pathLen: document.getElementById('krl-map-path')?.getAttribute('d')?.length ?? 0,
      stopCount: document.getElementById('krl-map-stops')?.childElementCount ?? 0,
      trainCx: document.getElementById('krl-train-dot')?.getAttribute('cx'),
    };
  });

  await page.screenshot({ path: 'artifacts/pass-8/krl-interior-map.png', fullPage: false });

  // Move inside coach
  await page.mouse.move(640, 400);
  await page.mouse.down();
  await page.mouse.move(820, 400, { steps: 8 });
  await page.waitForTimeout(400);
  await page.mouse.up();
  await page.waitForTimeout(2000);
  const after = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__());

  const result = {
    ok: errors.length === 0,
    errors,
    mapVisible,
    mapText,
    diag,
    after,
    checks: {
      noErrors: errors.length === 0,
      mapVisible,
      hasStations: mapText.stopCount >= 3,
      hasPath: mapText.pathLen > 10,
      namedStations: ['Jurangmangu', 'Pondok Ranji', 'Kebayoran'].some((n) =>
        JSON.stringify(mapText).includes(n),
      ),
      progressed: (after.score?.distanceM ?? 0) > (diag.score?.distanceM ?? 0) - 0.001,
      modeKrl: (after.mode ?? diag.mode) === 'krl',
    },
  };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  const pass =
    result.checks.noErrors &&
    result.checks.mapVisible &&
    result.checks.hasStations &&
    result.checks.hasPath &&
    result.checks.namedStations;
  process.exit(pass ? 0 : 1);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
