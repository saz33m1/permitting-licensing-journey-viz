import { describe, it, expect } from 'vitest';
import { computeTopologicalLevels, minWeeksParallel } from '../topoLevels';
import type { Dependency, PlcNode } from '../../types';

const mk = (id: string, estTime: string | null = null): PlcNode => ({
	id,
	name: id,
	jurisdiction: 'federal',
	phase: 'preparation',
	estTime
});

describe('computeTopologicalLevels', () => {
	it('puts all nodes at level 0 when there are no deps', () => {
		const steps = ['a', 'b', 'c'];
		const nodeMap = { a: mk('a'), b: mk('b'), c: mk('c') };
		const levels = computeTopologicalLevels(steps, undefined, nodeMap);
		expect(levels).toHaveLength(1);
		expect(levels[0].level).toBe(0);
		expect(levels[0].stepIds).toEqual(['a', 'b', 'c']);
	});

	it('assigns levels by longest path from a source', () => {
		const steps = ['a', 'b', 'c'];
		const deps: Dependency[] = [
			{ from: 'a', to: 'b', type: 'hard' },
			{ from: 'b', to: 'c', type: 'hard' }
		];
		const nodeMap = { a: mk('a'), b: mk('b'), c: mk('c') };
		const levels = computeTopologicalLevels(steps, deps, nodeMap);
		expect(levels.map((l) => l.stepIds)).toEqual([['a'], ['b'], ['c']]);
	});

	it('groups independent chains onto the same level', () => {
		const steps = ['a', 'b', 'c', 'd'];
		const deps: Dependency[] = [
			{ from: 'a', to: 'b', type: 'hard' },
			{ from: 'c', to: 'd', type: 'hard' }
		];
		const nodeMap = { a: mk('a'), b: mk('b'), c: mk('c'), d: mk('d') };
		const levels = computeTopologicalLevels(steps, deps, nodeMap);
		expect(levels).toHaveLength(2);
		expect(new Set(levels[0].stepIds)).toEqual(new Set(['a', 'c']));
		expect(new Set(levels[1].stepIds)).toEqual(new Set(['b', 'd']));
	});

	it('computes maxWeeks as the max estTime of nodes in the level', () => {
		const steps = ['a', 'b'];
		const nodeMap = {
			a: mk('a', '2 Weeks'),
			b: mk('b', '10 Weeks')
		};
		const levels = computeTopologicalLevels(steps, undefined, nodeMap);
		expect(levels[0].maxWeeks).toBe(10);
	});

	it('sorts intra-level by estTime (shorter first) then authoring order', () => {
		const steps = ['long', 'short', 'tie1', 'tie2'];
		const nodeMap = {
			long: mk('long', '20 Weeks'),
			short: mk('short', '1 Week'),
			tie1: mk('tie1', '5 Weeks'),
			tie2: mk('tie2', '5 Weeks')
		};
		const levels = computeTopologicalLevels(steps, undefined, nodeMap);
		expect(levels[0].stepIds).toEqual(['short', 'tie1', 'tie2', 'long']);
	});

	it('ignores parallel-type deps for level assignment', () => {
		const steps = ['a', 'b'];
		const deps: Dependency[] = [{ from: 'a', to: 'b', type: 'parallel' }];
		const nodeMap = { a: mk('a'), b: mk('b') };
		const levels = computeTopologicalLevels(steps, deps, nodeMap);
		expect(levels).toHaveLength(1);
		expect(new Set(levels[0].stepIds)).toEqual(new Set(['a', 'b']));
	});
});

describe('minWeeksParallel', () => {
	it('sums maxWeeks across levels', () => {
		const levels = [
			{ level: 0, stepIds: [], nodes: [], maxWeeks: 3 },
			{ level: 1, stepIds: [], nodes: [], maxWeeks: 5 },
			{ level: 2, stepIds: [], nodes: [], maxWeeks: 2 }
		];
		expect(minWeeksParallel(levels)).toBe(10);
	});

	it('returns 0 for empty levels', () => {
		expect(minWeeksParallel([])).toBe(0);
	});

	it('is strictly <= sequential sum when any level has parallel steps', () => {
		const steps = ['a', 'b', 'c', 'd'];
		const deps: Dependency[] = [
			{ from: 'a', to: 'c', type: 'hard' },
			{ from: 'b', to: 'd', type: 'hard' }
		];
		const nodeMap = {
			a: mk('a', '2 Weeks'),
			b: mk('b', '5 Weeks'),
			c: mk('c', '3 Weeks'),
			d: mk('d', '1 Week')
		};
		const levels = computeTopologicalLevels(steps, deps, nodeMap);
		// Sequential sum: 2+5+3+1 = 11. Parallel: max(2,5) + max(3,1) = 8.
		expect(minWeeksParallel(levels)).toBe(8);
	});
});
