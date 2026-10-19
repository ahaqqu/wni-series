#!/usr/bin/env node
/**
 * Minimal internal Markdown link checker.
 *
 * - Checks relative links in repository Markdown files.
 * - Skips external URLs, anchors, mailto:, tel:, and absolute site paths.
 * - Ignores fenced code blocks so examples do not create false positives.
 *
 * This is intentionally dependency-free so it runs before any app exists.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.astro',
  '.turbo',
  'coverage',
  'playwright-report',
  'test-results',
  '.pnpm-store',
  'artifacts',
]);
const SKIP_FILES = new Set(['pnpm-lock.yaml']);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.isFile() && entry.name.endsWith('.md') && !SKIP_FILES.has(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function stripCodeBlocks(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '');
}

function extractLinks(markdown) {
  const links = new Set();
  const inline = /!?\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const reference = /^\s*\[[^\]]+]:\s+(\S+)/gm;
  for (const match of markdown.matchAll(inline)) links.add(match[1]);
  for (const match of markdown.matchAll(reference)) links.add(match[1]);
  return [...links];
}

function isExternal(target) {
  return (
    target.startsWith('http://') ||
    target.startsWith('https://') ||
    target.startsWith('mailto:') ||
    target.startsWith('tel:') ||
    target.startsWith('#') ||
    target.startsWith('/') ||
    target.startsWith('data:')
  );
}

function cleanTarget(target) {
  let value = target.trim();
  if (value.startsWith('<') && value.endsWith('>')) value = value.slice(1, -1);
  value = value.split('#')[0] ?? '';
  value = value.split('?')[0] ?? '';
  try {
    value = decodeURIComponent(value);
  } catch {
    // keep raw value if it is not valid percent-encoding
  }
  return value;
}

const files = await walk(ROOT);
const errors = [];
let checked = 0;

for (const file of files) {
  const markdown = stripCodeBlocks(await readFile(file, 'utf8'));
  for (const raw of extractLinks(markdown)) {
    if (!raw || isExternal(raw)) continue;
    const target = cleanTarget(raw);
    if (!target) continue;
    const resolved = path.resolve(path.dirname(file), target);
    if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) {
      errors.push(`${path.relative(ROOT, file)} -> ${raw} (escapes repository)`);
      continue;
    }
    checked += 1;
    if (!existsSync(resolved)) {
      errors.push(`${path.relative(ROOT, file)} -> ${raw} (missing)`);
      continue;
    }
    const info = await stat(resolved);
    if (info.isDirectory()) {
      const indexCandidates = ['README.md', 'index.md', 'index.html'];
      const hasIndex = indexCandidates.some((name) => existsSync(path.join(resolved, name)));
      if (!hasIndex)
        errors.push(`${path.relative(ROOT, file)} -> ${raw} (directory without index)`);
    }
  }
}

if (errors.length > 0) {
  console.error(`\n✗ Internal link check failed (${errors.length}):\n`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`✓ Internal links OK (${checked} checked across ${files.length} files)`);
