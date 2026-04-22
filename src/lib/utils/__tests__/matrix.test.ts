import { describe, it, expect } from 'vitest';
import { computeMatrix } from '../matrix';
import { JURISDICTIONS_ORDER, PHASES } from '../../stores/app.svelte';
import type { Journey, PlcNode } from '../../types';

const nodes: Record<string, PlcNode> = {
	fp: { id: 'fp', name: 'Federal prep', jurisdiction: 'federal', phase: 'preparation' },
	sa: { id: 'sa', name: 'State app', jurisdiction: 'state', phase: 'application' },
	li: { id: 'li', name: 'Local inspect', jurisdiction: 'local', phase: 'inspection' },
	sa2: { id: 'sa2', name: 'State app 2', jurisdiction: 'state', phase: 'application' }
};

describe('computeMatrix', () => {
	it('creates a cell for every jurisdiction x phase combination', () => {
		const journey: Journey = { id: 'j1', name: 'x', cat: 'c', steps: [] };
		const matrix = computeMatrix(journey, nodes);
		for (const j of JURISDICTIONS_ORDER) {
			for (const p of PHASES) {
				expect(matrix[`${j}-${p}`]).toEqual([]);
			}
		}
	});

	it('bins each step into its jurisdiction-phase cell', () => {
		const journey: Journey = { id: 'j1', name: 'x', cat: 'c', steps: ['fp', 'sa', 'li'] };
		const matrix = computeMatrix(journey, nodes);
		expect(matrix['federal-preparation'].map((n) => n.id)).toEqual(['fp']);
		expect(matrix['state-application'].map((n) => n.id)).toEqual(['sa']);
		expect(matrix['local-inspection'].map((n) => n.id)).toEqual(['li']);
		expect(matrix['federal-application']).toEqual([]);
	});

	it('supports multiple steps in the same cell, preserving order', () => {
		const journey: Journey = { id: 'j1', name: 'x', cat: 'c', steps: ['sa', 'sa2'] };
		const matrix = computeMatrix(journey, nodes);
		expect(matrix['state-application'].map((n) => n.id)).toEqual(['sa', 'sa2']);
	});

	it('skips step ids missing from the node map', () => {
		const journey: Journey = { id: 'j1', name: 'x', cat: 'c', steps: ['fp', 'ghost'] };
		const matrix = computeMatrix(journey, nodes);
		expect(matrix['federal-preparation'].map((n) => n.id)).toEqual(['fp']);
	});

	it('honors explicit orderedIds over journey.steps', () => {
		const journey: Journey = { id: 'j1', name: 'x', cat: 'c', steps: ['sa', 'sa2'] };
		const matrix = computeMatrix(journey, nodes, ['sa2', 'sa']);
		expect(matrix['state-application'].map((n) => n.id)).toEqual(['sa2', 'sa']);
	});
});
