import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { JourneyData } from '../../types';
import { PHASES, JURISDICTIONS_ORDER } from '../../stores/app.svelte';

const data: JourneyData = JSON.parse(
	readFileSync(join(process.cwd(), 'static/data/journeys.json'), 'utf8')
);

describe('journeys.json shape', () => {
	it('has the four expected top-level arrays', () => {
		expect(Array.isArray(data.jurisdictions)).toBe(true);
		expect(Array.isArray(data.categories)).toBe(true);
		expect(Array.isArray(data.plcNodes)).toBe(true);
		expect(Array.isArray(data.journeys)).toBe(true);
	});

	it('matches documented counts (3 jurisdictions, 15 categories, 57 plcNodes, 114 journeys)', () => {
		expect(data.jurisdictions).toHaveLength(3);
		expect(data.categories).toHaveLength(15);
		expect(data.plcNodes).toHaveLength(57);
		expect(data.journeys).toHaveLength(114);
	});

	it('uses exactly federal/state/local jurisdiction ids', () => {
		const ids = new Set(data.jurisdictions.map((j) => j.id));
		expect(ids).toEqual(new Set(JURISDICTIONS_ORDER));
	});
});

describe('plcNodes integrity', () => {
	it('every node has a valid phase', () => {
		for (const n of data.plcNodes) {
			expect(PHASES as readonly string[]).toContain(n.phase);
		}
	});

	it('every node has a valid jurisdiction', () => {
		for (const n of data.plcNodes) {
			expect(JURISDICTIONS_ORDER as readonly string[]).toContain(n.jurisdiction);
		}
	});

	it('no duplicate node ids', () => {
		const ids = data.plcNodes.map((n) => n.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('required string fields are non-empty', () => {
		for (const n of data.plcNodes) {
			expect(n.id.length).toBeGreaterThan(0);
			expect(n.name.length).toBeGreaterThan(0);
		}
	});
});

describe('journeys integrity', () => {
	const nodeIds = new Set(data.plcNodes.map((n) => n.id));
	const categoryIds = new Set(data.categories.map((c) => c.id));

	it('no duplicate journey ids', () => {
		const ids = data.journeys.map((j) => j.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('every journey.cat references a known category', () => {
		for (const j of data.journeys) {
			expect(categoryIds.has(j.cat)).toBe(true);
		}
	});

	it('every step id resolves to a real plcNode', () => {
		const orphans: string[] = [];
		for (const j of data.journeys) {
			for (const s of j.steps) {
				if (!nodeIds.has(s)) orphans.push(`${j.id}:${s}`);
			}
		}
		expect(orphans).toEqual([]);
	});

	it('every journey has at least one step', () => {
		for (const j of data.journeys) {
			expect(j.steps.length).toBeGreaterThan(0);
		}
	});

	it('step lists have no duplicates within a single journey', () => {
		for (const j of data.journeys) {
			expect(new Set(j.steps).size).toBe(j.steps.length);
		}
	});
});

describe('journey dependencies integrity', () => {
	it('every dependency from/to is in the journey.steps', () => {
		const problems: string[] = [];
		for (const j of data.journeys) {
			const stepSet = new Set(j.steps);
			for (const d of j.dependencies ?? []) {
				if (!stepSet.has(d.from)) problems.push(`${j.id}: dep.from ${d.from} not in steps`);
				if (!stepSet.has(d.to)) problems.push(`${j.id}: dep.to ${d.to} not in steps`);
			}
		}
		expect(problems).toEqual([]);
	});

	it('every dependency uses an allowed type', () => {
		const allowed = new Set(['hard', 'soft', 'parallel']);
		for (const j of data.journeys) {
			for (const d of j.dependencies ?? []) {
				expect(allowed.has(d.type)).toBe(true);
			}
		}
	});

	it('no self-dependencies (from !== to)', () => {
		for (const j of data.journeys) {
			for (const d of j.dependencies ?? []) {
				expect(d.from).not.toBe(d.to);
			}
		}
	});

	it('non-parallel dependency graph is acyclic (so topoSort terminates)', () => {
		const cyclicJourneys: string[] = [];
		for (const j of data.journeys) {
			const adj: Record<string, string[]> = {};
			for (const s of j.steps) adj[s] = [];
			for (const d of j.dependencies ?? []) {
				if (d.type === 'parallel') continue;
				adj[d.from]?.push(d.to);
			}

			// WHITE=0, GRAY=1, BLACK=2
			const color: Record<string, number> = {};
			for (const s of j.steps) color[s] = 0;
			let hasCycle = false;

			const visit = (node: string) => {
				if (color[node] === 1) {
					hasCycle = true;
					return;
				}
				if (color[node] === 2) return;
				color[node] = 1;
				for (const nb of adj[node] ?? []) visit(nb);
				color[node] = 2;
			};
			for (const s of j.steps) {
				if (color[s] === 0) visit(s);
				if (hasCycle) break;
			}
			if (hasCycle) cyclicJourneys.push(j.id);
		}
		expect(cyclicJourneys).toEqual([]);
	});
});
