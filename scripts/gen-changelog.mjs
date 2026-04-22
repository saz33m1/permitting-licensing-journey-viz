#!/usr/bin/env node
// Regenerate CHANGELOG.md from src/lib/data/releases.json.
// Run with: npm run changelog
//
// Keeps the methodology-page release history and the root-level
// changelog in sync from a single source of truth.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const dataPath = resolve(repoRoot, 'src/lib/data/releases.json');
const outPath = resolve(repoRoot, 'CHANGELOG.md');

const { releases } = JSON.parse(readFileSync(dataPath, 'utf8'));

const dateFmt = new Intl.DateTimeFormat('en-US', {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
	timeZone: 'UTC'
});
const formatDate = (iso) => dateFmt.format(new Date(iso + 'T00:00:00Z'));

const lines = [];
lines.push("# What's new");
lines.push('');
lines.push(
	'Recent updates to the Permit & License Journey Explorer. The same list is rendered in context on the [Methodology page](https://saz33m1.github.io/permitting-licensing-journeys/methodology#whats-new).'
);
lines.push('');
lines.push(
	'This file is generated from `src/lib/data/releases.json` — run `npm run changelog` after editing releases.'
);
lines.push('');

for (const r of releases) {
	lines.push(`## v${r.version} — ${formatDate(r.date)} — ${r.title}`);
	lines.push('');
	lines.push(r.lead);
	lines.push('');
	for (const c of r.changes) {
		lines.push(`- **${c.title}** ${c.body}`);
	}
	lines.push('');
}

writeFileSync(outPath, lines.join('\n'), 'utf8');

console.log(`Wrote ${outPath} (${releases.length} release${releases.length === 1 ? '' : 's'}).`);
