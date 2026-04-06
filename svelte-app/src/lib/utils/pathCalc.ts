export interface NodePosition {
	id: string;
	cx: number;
	cy: number;
}

/**
 * Measure the center positions of node cards within a container.
 * Queries elements by [data-node-id] and returns coordinates relative to the container.
 */
export function measureNodePositions(
	containerEl: HTMLElement,
	stepIds: string[]
): NodePosition[] {
	const containerRect = containerEl.getBoundingClientRect();
	const positions: NodePosition[] = [];

	for (const id of stepIds) {
		const el = containerEl.querySelector(`[data-node-id="${id}"]`);
		if (!el) continue;
		const rect = el.getBoundingClientRect();
		positions.push({
			id,
			cx: rect.left + rect.width / 2 - containerRect.left + containerEl.scrollLeft,
			cy: rect.top + rect.height / 2 - containerRect.top + containerEl.scrollTop
		});
	}

	return positions;
}

/**
 * Build an SVG path string connecting positions with cubic bezier curves.
 * Uses horizontal-biased control points for cross-column connections
 * and vertical-biased with offset for same-column connections.
 */
export function buildSvgPath(positions: NodePosition[]): string {
	if (positions.length < 2) return '';

	let d = `M ${positions[0].cx} ${positions[0].cy}`;

	for (let i = 0; i < positions.length - 1; i++) {
		const p0 = positions[i];
		const p1 = positions[i + 1];
		const dx = p1.cx - p0.cx;
		const dy = p1.cy - p0.cy;

		if (Math.abs(dx) > 20) {
			// Cross-column: horizontal-biased S-curve
			const cpx1 = p0.cx + dx * 0.5;
			const cpy1 = p0.cy;
			const cpx2 = p1.cx - dx * 0.5;
			const cpy2 = p1.cy;
			d += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${p1.cx} ${p1.cy}`;
		} else {
			// Same-column: push curve out horizontally to avoid overlapping cards
			const offset = 50 * (dy > 0 ? 1 : -1);
			const cpx1 = p0.cx + offset;
			const cpy1 = p0.cy + dy * 0.3;
			const cpx2 = p1.cx + offset;
			const cpy2 = p1.cy - dy * 0.3;
			d += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${p1.cx} ${p1.cy}`;
		}
	}

	return d;
}
