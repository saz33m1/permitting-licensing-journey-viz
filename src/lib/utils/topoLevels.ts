import type { Dependency, PlcNode } from '$lib/types';
import { parseEstTimeWeeks } from './pathCalc';

export interface TopoLevel {
	level: number;
	stepIds: string[];
	nodes: PlcNode[];
	maxWeeks: number;
}

export function computeTopologicalLevels(
	steps: string[],
	dependencies: Dependency[] | undefined,
	nodeMap: Record<string, PlcNode>
): TopoLevel[] {
	const stepSet = new Set(steps);
	const inputIndex: Record<string, number> = {};
	steps.forEach((id, i) => (inputIndex[id] = i));

	const indeg: Record<string, number> = {};
	const adj: Record<string, string[]> = {};
	for (const id of steps) {
		indeg[id] = 0;
		adj[id] = [];
	}
	for (const e of dependencies ?? []) {
		if (e.type === 'parallel') continue;
		if (!stepSet.has(e.from) || !stepSet.has(e.to)) continue;
		adj[e.from].push(e.to);
		indeg[e.to] += 1;
	}

	const level: Record<string, number> = {};
	let frontier = steps.filter((id) => indeg[id] === 0);
	for (const id of frontier) level[id] = 0;

	let current = 0;
	while (frontier.length) {
		const next: string[] = [];
		for (const id of frontier) {
			for (const nb of adj[id]) {
				indeg[nb] -= 1;
				if (indeg[nb] === 0) {
					level[nb] = current + 1;
					next.push(nb);
				}
			}
		}
		current += 1;
		frontier = next;
	}

	for (const id of steps) if (level[id] === undefined) level[id] = 0;

	const byLevel = new Map<number, string[]>();
	for (const id of steps) {
		const lvl = level[id];
		if (!byLevel.has(lvl)) byLevel.set(lvl, []);
		byLevel.get(lvl)!.push(id);
	}

	const weeksFor = (id: string) =>
		parseEstTimeWeeks(nodeMap[id]?.estTime ?? null) ?? 0;

	const levels: TopoLevel[] = [];
	for (const [lvl, ids] of [...byLevel.entries()].sort((a, b) => a[0] - b[0])) {
		ids.sort((a, b) => weeksFor(a) - weeksFor(b) || inputIndex[a] - inputIndex[b]);
		const nodes = ids.map((id) => nodeMap[id]).filter(Boolean);
		const maxWeeks = Math.max(0, ...nodes.map((n) => weeksFor(n.id)));
		levels.push({ level: lvl, stepIds: ids, nodes, maxWeeks });
	}
	return levels;
}

export function minWeeksParallel(levels: TopoLevel[]): number {
	return levels.reduce((s, l) => s + l.maxWeeks, 0);
}
