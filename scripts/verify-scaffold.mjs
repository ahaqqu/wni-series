#!/usr/bin/env node
/**
 * Scaffold integrity check.
 *
 * Guards the Phase 0 + pre-alpha landing-page contract: the repo must contain
 * the four approved documents, multi-game boundaries, CI/deploy/verification
 * scaffolding, and the shipped landing/waitlist entrypoints.
 */
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import process from 'node:process';

const requiredDirs = [
  'docs/games/pejuang-nafkah',
  'docs/games/_template',
  'docs/adr',
  'docs/verification',
  'docs/runbooks',
  'apps/platform',
  'apps/play',
  'services/api',
  'packages/gamekit',
  'packages/ui',
  'packages/contracts',
  'packages/content-schema',
  'games/pejuang-nafkah',
  'games/_template',
  'data',
  'infra',
  'scripts',
  '.github/workflows',
];

const requiredFiles = [
  'docs/games/pejuang-nafkah/specs.md',
  'docs/games/pejuang-nafkah/design.md',
  'docs/games/pejuang-nafkah/plan.md',
  'docs/games/pejuang-nafkah/architecture.md',
  'docs/games/pejuang-nafkah/brand.md',
  'docs/games/pejuang-nafkah/research/PROTOCOL.md',
  'docs/games/pejuang-nafkah/status.md',
  'docs/adr/README.md',
  'docs/adr/0001-research-first.md',
  'docs/adr/0000-template.md',
  'docs/games/pejuang-nafkah/research/2026-10-refresh.md',
  'docs/games/pejuang-nafkah/research/2026-10-live-data-and-mayar.md',
  'docs/games/pejuang-nafkah/research/2026-10-phase-1-research-plan.md',
  'docs/verification/README.md',
  'docs/runbooks/README.md',
  'docs/runbooks/payments.md',
  'docs/runbooks/live-data.md',
  'games/pejuang-nafkah/game.manifest.json',
  'games/pejuang-nafkah/README.md',
  'games/_template/game.manifest.json',
  'games/_template/README.md',
  'AGENTS.md',
  'SECURITY.md',
  'README.md',
  'package.json',
  'pnpm-workspace.yaml',
  'pnpm-lock.yaml',
  'turbo.json',
  'apps/platform/package.json',
  'apps/platform/src/pages/index.astro',
  'apps/platform/src/components/Hero.astro',
  'apps/platform/src/components/Ticker.astro',
  'apps/platform/src/components/BangNafkah.astro',
  'apps/platform/src/layouts/Base.astro',
  'apps/platform/src/scripts/motion.ts',
  'apps/platform/public/images/og.jpg',
  'apps/platform/public/images/route-map.svg',
  'apps/play/package.json',
  'games/pejuang-nafkah/package.json',
  'services/api/package.json',
  'services/api/src/server.ts',
  'services/api/migrations/001_waitlist.sql',
  'services/api/Dockerfile',
  'packages/gamekit/package.json',
  'packages/ui/package.json',
  'packages/contracts/package.json',
  'packages/content-schema/package.json',
  'packages/config/package.json',
  '.env.example',
  '.github/workflows/ci.yml',
  '.github/workflows/deploy.yml',
  '.github/dependabot.yml',
  'infra/caddy/Caddyfile',
  'infra/compose/compose.yaml',
  'infra/cloudflared/README.md',
  'scripts/check-internal-links.mjs',
  'scripts/verify-scaffold.mjs',
  'scripts/verify-landing.mjs',
];

const requiredHeadings = {
  'docs/games/pejuang-nafkah/specs.md': [
    '## 5. Product principles',
    '## 6. Core objectives',
    '## 9. Functional requirements',
    '## 12. Security and anti-fraud requirements',
    '## 16. Release criteria',
  ],
  'docs/games/pejuang-nafkah/design.md': [
    '## 2. Design pillars',
    '## 4. Dual mode design',
    '## 7. One-hand UX',
    '## 10. Web design',
    '## 11. Monetization design',
  ],
  'docs/games/pejuang-nafkah/plan.md': [
    '## 3. Phase overview',
    '## 4. Phase details',
    '## 5. Verification system',
    '## 10. Definition of Done',
  ],
  'docs/games/pejuang-nafkah/architecture.md': [
    '## 3. Architecture decisions',
    '## 10. Payments, subscriptions, and entitlements',
    '## 11. Security architecture',
    '## 12. Privacy architecture',
    '## 14. Deployment and operations',
    '## 15. Multi-game / series extension',
  ],
};

const forbiddenInCoreDocs = ['Paywuz', 'paywuz'];

const errors = [];

async function exists(target) {
  try {
    await access(target, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

for (const dir of requiredDirs) {
  if (!(await exists(dir))) errors.push(`missing directory: ${dir}`);
}

for (const file of requiredFiles) {
  if (!(await exists(file))) errors.push(`missing file: ${file}`);
}

for (const [file, headings] of Object.entries(requiredHeadings)) {
  if (!(await exists(file))) continue;
  const content = await readFile(file, 'utf8');
  for (const heading of headings) {
    if (!content.includes(heading)) errors.push(`${file} missing heading: ${heading}`);
  }
}

const coreDocs = [
  'docs/games/pejuang-nafkah/specs.md',
  'docs/games/pejuang-nafkah/design.md',
  'docs/games/pejuang-nafkah/plan.md',
  'docs/games/pejuang-nafkah/architecture.md',
  'docs/games/pejuang-nafkah/brand.md',
  'docs/games/pejuang-nafkah/research/PROTOCOL.md',
];

for (const file of coreDocs) {
  if (!(await exists(file))) continue;
  const content = await readFile(file, 'utf8');
  for (const forbidden of forbiddenInCoreDocs) {
    if (content.includes(forbidden)) errors.push(`${file} still mentions ${forbidden}`);
  }
  if (!content.includes('wniseries.ahaqqu.com') && file.endsWith('specs.md')) {
    errors.push(`${file} must name the canonical host`);
  }
  if (!content.includes('wniseries@gmail.com') && file.endsWith('specs.md')) {
    errors.push(`${file} must name the support email`);
  }
}

const manifestFiles = [
  'games/pejuang-nafkah/game.manifest.json',
  'games/_template/game.manifest.json',
];
for (const file of manifestFiles) {
  if (!(await exists(file))) continue;
  try {
    const manifest = JSON.parse(await readFile(file, 'utf8'));
    for (const key of ['slug', 'title', 'series', 'version', 'status', 'modes', 'entry']) {
      if (!(key in manifest)) errors.push(`${file} missing manifest key: ${key}`);
    }
  } catch (error) {
    errors.push(`${file} is not valid JSON: ${error.message}`);
  }
}

if (await exists('.env'))
  errors.push('.env exists in the repository; secrets must stay out of git');

if (errors.length > 0) {
  console.error(`\n✗ Scaffold verification failed (${errors.length}):\n`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log('✓ Scaffold integrity OK');
console.log(
  `  ${requiredDirs.length} directories, ${requiredFiles.length} files, ${Object.keys(requiredHeadings).length} documents`,
);
