#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

async function fetchLimitlessPrice(set, number) {
  const url = `https://limitlesstcg.com/api/cards/${encodeURIComponent(set)}/${encodeURIComponent(number)}`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'user-agent': 'pokemon-deck-deckbuilder/1.0' },
  });

  if (!res.ok) {
    throw new Error(`Limitless fetch failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (typeof json?.market_price === 'number') {
    return {
      market: json.market_price,
      low: typeof json.low_price === 'number' ? json.low_price : undefined,
      mid: typeof json.mid_price === 'number' ? json.mid_price : undefined,
      high: typeof json.high_price === 'number' ? json.high_price : undefined,
    };
  }

  const prices = json?.tcgplayer?.prices;
  const variant =
    prices?.normal ??
    prices?.holofoil ??
    prices?.reverseHolofoil ??
    prices?.firstEditionHolofoil;

  if (!variant) return {};
  const { market, low, mid, high } = variant;
  return {
    market: typeof market === 'number' ? market : undefined,
    low: typeof low === 'number' ? low : undefined,
    mid: typeof mid === 'number' ? mid : undefined,
    high: typeof high === 'number' ? high : undefined,
  };
}


function parseDeckText(raw) {
  const SECTION_HEADERS = [
    { re: /^pok[ée]mon/i, section: 'pokemon' },
    { re: /^trainer/i, section: 'trainer' },
    { re: /^energy/i, section: 'energy' },
  ];

  const out = [];
  let section = 'unknown';

  for (const originalLine of raw.split(/\r?\n/)) {
    const line = originalLine.trim();
    if (!line) continue;
    if (/deck:/i.test(line)) continue;

    for (const h of SECTION_HEADERS) {
      if (h.re.test(line)) {
        section = h.section;
      }
    }

    const m = line.match(/^([0-9]+)x?\s+(.+?)\s+([A-Z0-9-]{2,})\s+([0-9A-Z]+)$/);
    if (!m) continue;
    const count = Number(m[1]);
    const set = m[3];
    const number = m[4];
    out.push({
      count,
      set,
      number,
      section,
      key: `${set}-${number}`,
    });
  }

  return { lines: out };
}

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
