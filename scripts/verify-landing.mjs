#!/usr/bin/env node
/**
 * Pre-alpha landing page verification.
 *
 * Usage:
 *   LANDING_URL=http://127.0.0.1:4322 node scripts/verify-landing.mjs
 *
 * Requires a running preview/dev server. Writes screenshots and a small JSON
 * report under artifacts/verification/landing/<date>/ (gitignored).
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const url = process.env.LANDING_URL ?? 'http://127.0.0.1:4322';
const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
const outDir = `artifacts/verification/landing/${date}`;
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const errors = [];
const results = {};

async function open(viewport, options = {}) {
  const page = await browser.newPage({ viewport, ...options });
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto(url, { waitUntil: 'networkidle' });
  return page;
}

const desktop = await open({ width: 1440, height: 1000 });
await desktop
  .waitForFunction(
    () => document.querySelector('[data-hero-canvas]')?.getAttribute('data-ready') === 'true',
    null,
    { timeout: 15000 },
  )
  .catch(() => undefined);
await desktop.waitForTimeout(500);
results.desktop = await desktop.evaluate(() => ({
  ready: document.querySelector('[data-hero-canvas]')?.getAttribute('data-ready') ?? null,
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  title: document.title,
  sections: document.querySelectorAll('section').length,
}));
await desktop.screenshot({ path: `${outDir}/desktop-hero.png` });

const mobile = await open(
  { width: 390, height: 844 },
  { isMobile: true, hasTouch: true, reducedMotion: 'reduce' },
);
await mobile.waitForTimeout(800);
results.mobile = await mobile.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  bodyWidth: document.body.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}));
await mobile.screenshot({ path: `${outDir}/mobile-hero.png` });
await mobile.evaluate(() => document.querySelector('#rute')?.scrollIntoView());
await mobile.waitForTimeout(900);
await mobile.screenshot({ path: `${outDir}/mobile-route.png` });

results.errors = errors;
results.url = url;
await writeFile(`${outDir}/report.json`, JSON.stringify(results, null, 2));

console.log(JSON.stringify(results, null, 2));
if (errors.length > 0) process.exitCode = 1;
await browser.close();
