#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

import { parseDeckText } from '../src/lib/deckTextParser.js';
import { fetchLimitlessPrice } from '../src/lib/limitless.js';

const ROOT = process.cwd();
const DECKS_PATH = path.join(ROOT, 'src', 'data', 'decks.json');
const CARDS_PATH = path.join(ROOT, 'src', 'data', 'cards.json');

async function readJson(p) {
  const s = await fs.readFile(p, 'utf8');
  return JSON.parse(s);
}

async function writeJson(p, obj) {
  await fs.writeFile(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

async function main() {
  const decks = await readJson(DECKS_PATH);
  const unique = new Map();

  for (const d of decks) {
    const { lines } = parseDeckText(d.raw);
    for (const l of lines) unique.set(l.key, { set: l.set, number: l.number });
  }

  const cache = await readJson(CARDS_PATH).catch(() => ({ refreshedAt: null, cards: {} }));
  if (!cache.cards) cache.cards = {};

  const errors = {};
  let updated = 0;

  for (const [key, v] of unique.entries()) {
    try {
      // fetchLimitlessPrice returns { market, low, mid, high }
      cache.cards[key] = await fetchLimitlessPrice(v.set, v.number);
      updated++;
    } catch (e) {
      errors[key] = e instanceof Error ? e.message : 'unknown error';
    }
  }

  cache.refreshedAt = new Date().toISOString();
  await writeJson(CARDS_PATH, cache);

  const errCount = Object.keys(errors).length;
  console.log(
    `Refreshed ${updated}/${unique.size} cards. Errors: ${errCount}. refreshedAt=${cache.refreshedAt}`
  );

  if (errCount) {
    // non-zero exit so GH action can show failure, but still write file.
    process.exitCode = 2;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
