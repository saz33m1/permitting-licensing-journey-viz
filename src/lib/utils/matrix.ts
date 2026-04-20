import type { Journey, PlcNode } from '$lib/types';
import { PHASES, JURISDICTIONS_ORDER } from '$lib/stores/app.svelte';
import { topoSort } from './topoSort';

export type MatrixKey = `${string}-${string}`;

export function computeMatrix(
	journey: Journey,
	nodeMap: Record<string, PlcNode>,
	orderedIds?: string[]
): Record<MatrixKey, PlcNode[]> {
	const matrix: Record<MatrixKey, PlcNode[]> = {};
	for (const jur of JURISDICTIONS_ORDER) {
		for (const phase of PHASES) {
			matrix[`${jur}-${phase}`] = [];
		}
	}

	const ids = orderedIds ?? topoSort(journey.steps, journey.dependencies);
	for (const stepId of ids) {
		const node = nodeMap[stepId];
		if (!node) continue;
		const key: MatrixKey = `${node.jurisdiction}-${node.phase}`;
		if (matrix[key]) matrix[key].push(node);
	}

	return matrix;
}
