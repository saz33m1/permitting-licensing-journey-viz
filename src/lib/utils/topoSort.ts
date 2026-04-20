import type { Dependency } from '$lib/types';

export function topoSort(steps: string[], dependencies?: Dependency[]): string[] {
	if (!dependencies || dependencies.length === 0) return steps.slice();

	const stepSet = new Set(steps);
	const inputIndex: Record<string, number> = {};
	steps.forEach((id, i) => (inputIndex[id] = i));

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

	const ready = steps.filter((id) => indeg[id] === 0).sort((a, b) => inputIndex[a] - inputIndex[b]);
	const out: string[] = [];
	while (ready.length) {
		const id = ready.shift()!;
		out.push(id);
		for (const next of adj[id]) {
			indeg[next] -= 1;
			if (indeg[next] === 0) {
				let i = 0;
				while (i < ready.length && inputIndex[ready[i]] < inputIndex[next]) i++;
				ready.splice(i, 0, next);
			}
		}
	}

	if (out.length !== steps.length) {
		for (const id of steps) if (!out.includes(id)) out.push(id);
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
