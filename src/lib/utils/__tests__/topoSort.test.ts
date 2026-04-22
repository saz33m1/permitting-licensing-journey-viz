import { describe, it, expect } from 'vitest';
import { topoSort, buildAdjacency, isEntryPoint } from '../topoSort';
import type { Dependency, PlcNode } from '../../types';

const mkNode = (id: string, estTime: string | null = null): PlcNode => ({
	id,
	name: id,
	jurisdiction: 'federal',
	phase: 'preparation',
	estTime
});

describe('topoSort', () => {
	it('returns a copy of steps when no dependencies are given', () => {
		const steps = ['a', 'b', 'c'];
		const out = topoSort(steps);
		expect(out).toEqual(steps);
		expect(out).not.toBe(steps);
	});

	it('orders hard dependencies (from → to)', () => {
		const steps = ['b', 'a', 'c'];
		const deps: Dependency[] = [
			{ from: 'a', to: 'b', type: 'hard' },
			{ from: 'b', to: 'c', type: 'hard' }
		];
		expect(topoSort(steps, deps)).toEqual(['a', 'b', 'c']);
	});

	it('treats soft deps the same as hard for ordering', () => {
		const steps = ['b', 'a'];
		const deps: Dependency[] = [{ from: 'a', to: 'b', type: 'soft' }];
		expect(topoSort(steps, deps)).toEqual(['a', 'b']);
	});

	it('ignores parallel-type deps (no DAG ordering imposed)', () => {
		const steps = ['a', 'b'];
		const deps: Dependency[] = [{ from: 'b', to: 'a', type: 'parallel' }];
		// With only parallel edges, neither node has a real hard/soft prerequisite,
		// so both are valid entry points. Just assert both appear exactly once.
		const out = topoSort(steps, deps);
		expect(out).toHaveLength(2);
		expect(new Set(out)).toEqual(new Set(['a', 'b']));
	});

	it('within a topological level, shorter estTime comes first', () => {
		const steps = ['long', 'short'];
		const deps: Dependency[] = [{ from: 'long', to: 'short', type: 'parallel' }]; // non-empty, no DAG effect
		const nodeMap = {
			long: mkNode('long', '10 Weeks'),
			short: mkNode('short', '1 Week')
		};
		const out = topoSort(steps, deps, nodeMap);
		// Shorter sorts first within the level; 'long' is also the overall-longest
		// leaf, so longest-leaf-last keeps it at the end — both effects land on the
		// same order here.
		expect(out).toEqual(['short', 'long']);
	});

	it('authoring order breaks ties when weeks tie', () => {
		const steps = ['a', 'b'];
		const nodeMap = {
			a: mkNode('a', '2 Weeks'),
			b: mkNode('b', '2 Weeks')
		};
		expect(topoSort(steps, [], nodeMap)).toEqual(['a', 'b']);
	});

	it('moves the overall-longest node to the end when it is a leaf', () => {
		const steps = ['prep', 'apply', 'inspect', 'ongoing'];
		const deps: Dependency[] = [
			{ from: 'prep', to: 'apply', type: 'hard' },
			{ from: 'apply', to: 'inspect', type: 'hard' }
		];
		const nodeMap = {
			prep: mkNode('prep', '1 Week'),
			apply: mkNode('apply', '2 Weeks'),
			inspect: mkNode('inspect', '1 Week'),
			ongoing: mkNode('ongoing', '52 Weeks') // longest AND a leaf
		};
		const out = topoSort(steps, deps, nodeMap);
		expect(out[out.length - 1]).toBe('ongoing');
	});

	it('does NOT move the longest when it has a non-parallel outgoing edge', () => {
		const steps = ['a', 'b'];
		const deps: Dependency[] = [{ from: 'a', to: 'b', type: 'hard' }];
		const nodeMap = {
			a: mkNode('a', '52 Weeks'),
			b: mkNode('b', '1 Week')
		};
		// a has outgoing → not a leaf → stays first
		expect(topoSort(steps, deps, nodeMap)).toEqual(['a', 'b']);
	});

	it('ignores deps whose endpoints are not in steps', () => {
		const steps = ['a', 'b'];
		const deps: Dependency[] = [{ from: 'ghost', to: 'a', type: 'hard' }];
		// Ghost edge should be filtered — the important property is no crash and
		// all original steps are present.
		const out = topoSort(steps, deps);
		expect(out).toHaveLength(2);
		expect(new Set(out)).toEqual(new Set(['a', 'b']));
	});

	it('falls back to append-orphans when the DAG is broken', () => {
		// Self-cycle — indeg never hits 0 for 'a', so fallback appends it
		const steps = ['a', 'b'];
		const deps: Dependency[] = [{ from: 'a', to: 'a', type: 'hard' }];
		const out = topoSort(steps, deps);
		expect(out).toContain('a');
		expect(out).toContain('b');
		expect(out).toHaveLength(2);
	});
});

describe('buildAdjacency', () => {
	it('builds incoming / outgoing maps keyed by step id', () => {
		const steps = ['a', 'b', 'c'];
		const deps: Dependency[] = [
			{ from: 'a', to: 'b', type: 'hard' },
			{ from: 'b', to: 'c', type: 'soft' }
		];
		const { incoming, outgoing } = buildAdjacency(steps, deps);
		expect(outgoing.a).toHaveLength(1);
		expect(outgoing.a[0].to).toBe('b');
		expect(incoming.b).toHaveLength(1);
		expect(incoming.c[0].from).toBe('b');
		expect(incoming.a).toHaveLength(0);
		expect(outgoing.c).toHaveLength(0);
	});

	it('drops edges referencing ids not in steps', () => {
		const steps = ['a'];
		const deps: Dependency[] = [{ from: 'a', to: 'ghost', type: 'hard' }];
		const { outgoing } = buildAdjacency(steps, deps);
		expect(outgoing.a).toHaveLength(0);
	});

	it('preserves parallel edges in adjacency (unlike topoSort)', () => {
		const steps = ['a', 'b'];
		const deps: Dependency[] = [{ from: 'a', to: 'b', type: 'parallel' }];
		const { outgoing } = buildAdjacency(steps, deps);
		expect(outgoing.a).toHaveLength(1);
	});
});

describe('isEntryPoint', () => {
	it('returns true when there are no dependencies at all', () => {
		expect(isEntryPoint('a')).toBe(true);
		expect(isEntryPoint('a', [])).toBe(true);
	});

	it('returns true when a node has only parallel incoming edges', () => {
		const deps: Dependency[] = [{ from: 'b', to: 'a', type: 'parallel' }];
		expect(isEntryPoint('a', deps)).toBe(true);
	});

	it('returns false when a hard edge targets the node', () => {
		const deps: Dependency[] = [{ from: 'b', to: 'a', type: 'hard' }];
		expect(isEntryPoint('a', deps)).toBe(false);
	});

	it('returns false when a soft edge targets the node', () => {
		const deps: Dependency[] = [{ from: 'b', to: 'a', type: 'soft' }];
		expect(isEntryPoint('a', deps)).toBe(false);
	});
});
