import type { Journey, PlcNode } from '$lib/types';
import { PHASES, JURISDICTIONS_ORDER } from '$lib/stores/app.svelte';

export type MatrixKey = `${string}-${string}`;

export function computeMatrix(
	journey: Journey,
	nodeMap: Record<string, PlcNode>
): Record<MatrixKey, PlcNode[]> {
	const matrix: Record<MatrixKey, PlcNode[]> = {};

	// Initialize all cells
	for (const jur of JURISDICTIONS_ORDER) {
		for (const phase of PHASES) {
			matrix[`${jur}-${phase}`] = [];
		}
	}

	// Place each step into the correct cell
	for (const stepId of journey.steps) {
		const node = nodeMap[stepId];
		if (!node) continue;
		const key: MatrixKey = `${node.jurisdiction}-${node.phase}`;
		if (matrix[key]) {
			matrix[key].push(node);
		}
	}

	return matrix;
}
