export type DeckSection = 'pokemon' | 'trainer' | 'energy' | 'unknown';

export type DeckCardLine = {
  count: number;
  name: string;
  set: string;
  number: string;
  section: DeckSection;
  key: string; // `${set}-${number}`
};

const SECTION_HEADERS: Array<{ re: RegExp; section: DeckSection }> = [
  { re: /^pok[ée]mon/i, section: 'pokemon' },
  { re: /^trainer/i, section: 'trainer' },
  { re: /^energy/i, section: 'energy' },
];

function parseLine(line: string, section: DeckSection): DeckCardLine | null {
  // Format: "4 Raging Bolt ex TEF 123" (also supports "4x" and collector numbers like "PR-SV 149")
  const m = line.trim().match(/^([0-9]+)x?\s+(.+?)\s+([A-Z0-9-]{2,})\s+([0-9A-Z]+)$/);
  if (!m) return null;
  const count = Number(m[1]);
  const name = m[2].trim();
  const set = m[3].trim();
  const number = m[4].trim();
  return {
    count,
    name,
    set,
    number,
    section,
    key: `${set}-${number}`,
  };
}

export function parseDeckText(raw: string): { lines: DeckCardLine[]; totalCards: number } {
  const out: DeckCardLine[] = [];
  let section: DeckSection = 'unknown';

  for (const originalLine of raw.split(/\r?\n/)) {
    const line = originalLine.trim();
    if (!line) continue;

    // Ignore title-ish lines like "Raging Bolt Deck: Pokémon: 14"
    if (/deck:/i.test(line)) continue;

    for (const h of SECTION_HEADERS) {
      if (h.re.test(line)) {
        section = h.section;
        // header might contain counts, ignore
        continue;
      }
    }

    const parsed = parseLine(line, section);
    if (parsed) out.push(parsed);
  }

  const totalCards = out.reduce((sum, l) => sum + l.count, 0);
  return { lines: out, totalCards };
}

export function groupBySection(lines: DeckCardLine[]) {
  const grouped: Record<DeckSection, DeckCardLine[]> = {
    pokemon: [],
    trainer: [],
    energy: [],
    unknown: [],
  };
  for (const l of lines) grouped[l.section].push(l);
  return grouped;
}
