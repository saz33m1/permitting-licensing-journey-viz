import type { Dependency, PlcNode } from '$lib/types';
import { parseEstTimeWeeks } from './pathCalc';

export function topoSort(
	steps: string[],
	dependencies?: Dependency[],
	nodeMap?: Record<string, PlcNode>
): string[] {
	if (!dependencies || dependencies.length === 0) return steps.slice();

	const stepSet = new Set(steps);
	const inputIndex: Record<string, number> = {};
	steps.forEach((id, i) => (inputIndex[id] = i));

	const weeks: Record<string, number> = {};
	for (const id of steps) {
		const w = parseEstTimeWeeks(nodeMap?.[id]?.estTime ?? null);
		weeks[id] = w ?? 0;
	}

	const indeg: Record<string, number> = {};
	const adj: Record<string, string[]> = {};
	for (const id of steps) {
		indeg[id] = 0;
		adj[id] = [];
	}
	for (const e of dependencies) {
		if (e.type === 'parallel') continue;
		if (!stepSet.has(e.from) || !stepSet.has(e.to)) continue;
		adj[e.from].push(e.to);
		indeg[e.to] += 1;
	}

	const sortLevel = (ids: string[]) =>
		ids.sort((a, b) => weeks[a] - weeks[b] || inputIndex[a] - inputIndex[b]);

	const out: string[] = [];
	let frontier = sortLevel(steps.filter((id) => indeg[id] === 0));
	while (frontier.length) {
		for (const id of frontier) out.push(id);
		const next: string[] = [];
		for (const id of frontier) {
			for (const nb of adj[id]) {
				indeg[nb] -= 1;
				if (indeg[nb] === 0) next.push(nb);
			}
		}
		frontier = sortLevel(next);
	}

	// Fallback for any orphans left over (shouldn't happen on pre-validated data)
	if (out.length !== steps.length) {
		for (const id of steps) if (!out.includes(id)) out.push(id);
	}

	// Longest-leaf-last post-pass: if the overall-longest node is a leaf
	// (no non-parallel outgoing edge), move it to the very end.
	if (out.length > 1) {
		let longest = out[0];
		for (const id of out) if (weeks[id] > weeks[longest]) longest = id;
		const isLeaf = adj[longest].length === 0;
		if (isLeaf && out[out.length - 1] !== longest) {
			const idx = out.indexOf(longest);
			if (idx !== -1) {
				out.splice(idx, 1);
				out.push(longest);
			}
		}
	}

	return out;
}

export function buildAdjacency(
	steps: string[],
	dependencies?: Dependency[]
): {
	incoming: Record<string, Dependency[]>;
	outgoing: Record<string, Dependency[]>;
} {
	const incoming: Record<string, Dependency[]> = {};
	const outgoing: Record<string, Dependency[]> = {};
	for (const id of steps) {
		incoming[id] = [];
		outgoing[id] = [];
	}
	if (!dependencies) return { incoming, outgoing };
	const stepSet = new Set(steps);
	for (const e of dependencies) {
		if (!stepSet.has(e.from) || !stepSet.has(e.to)) continue;
		outgoing[e.from].push(e);
		incoming[e.to].push(e);
	}
	return { incoming, outgoing };
}

export function isEntryPoint(id: string, dependencies?: Dependency[]): boolean {
	if (!dependencies) return true;
	return !dependencies.some((e) => e.to === id && e.type !== 'parallel');
}
