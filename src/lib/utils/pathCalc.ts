import type { PlcNode } from '$lib/types';

export interface NodePosition {
	id: string;
	cx: number;
	cy: number;
	weeks: number | null;
	feeUsd: number | null;
	blocking: boolean;
	required: boolean;
}

const NUM_RE = /\d+(?:\.\d+)?/g;

/**
 * Parse an estTime string like "1-2 Weeks", "4-8 Weeks", "12-52 Weeks" into
 * the high-end of the range in weeks (worst-case, the "this could really
 * drag" duration). Returns null for null/"Ongoing"/unparseable input.
 */
export function parseEstTimeWeeks(raw: string | null | undefined): number | null {
	if (!raw) return null;
	const s = raw.toLowerCase();
	const nums = s.match(NUM_RE)?.map(Number) ?? [];
	if (nums.length === 0) return null;
	const high = nums[nums.length - 1];
	if (s.includes('year')) return high * 52;
	if (s.includes('month')) return high * 4.33;
	if (s.includes('day')) return high / 7;
	// Default unit: weeks
	return high;
}

/**
 * Parse a fee string like "$1,000-$4,500", "Free", "$25" into the high-end of
 * the range in USD. Returns 0 for "Free"/"None"; null for null/unparseable.
 */
export function parseFeeUsd(raw: string | null | undefined): number | null {
	if (!raw) return null;
	const s = raw.toLowerCase();
	if (s.includes('free') || s.includes('none') || s.includes('no fee')) return 0;
	const stripped = s.replace(/[$,]/g, '');
	const nums = stripped.match(NUM_RE)?.map(Number) ?? [];
	if (nums.length === 0) return null;
	return nums[nums.length - 1];
}

/**
 * Measure the center positions of node cards within a container.
 * Queries elements by [data-node-id] and returns coordinates relative to the
 * container, along with pacing metadata derived from the PlcNode.
 */
export function measureNodePositions(
	containerEl: HTMLElement,
	stepIds: string[],
	nodeMap: Record<string, PlcNode> = {}
): NodePosition[] {
	const containerRect = containerEl.getBoundingClientRect();
	const positions: NodePosition[] = [];

	for (const id of stepIds) {
		const el = containerEl.querySelector(`[data-node-id="${id}"]`);
		if (!el) continue;
		const rect = el.getBoundingClientRect();
		const node = nodeMap[id];
		positions.push({
			id,
			cx: rect.left + rect.width / 2 - containerRect.left + containerEl.scrollLeft,
			cy: rect.top + rect.height / 2 - containerRect.top + containerEl.scrollTop,
			weeks: parseEstTimeWeeks(node?.estTime ?? null),
			feeUsd: parseFeeUsd(node?.fee ?? null),
			blocking: node?.blocking ?? false,
			required: node?.required ?? true
		});
	}

	return positions;
}

function segmentD(p0: NodePosition, p1: NodePosition): string {
	const dx = p1.cx - p0.cx;
	const dy = p1.cy - p0.cy;
	if (Math.abs(dx) > 20) {
		const cpx1 = p0.cx + dx * 0.5;
		const cpy1 = p0.cy;
		const cpx2 = p1.cx - dx * 0.5;
		const cpy2 = p1.cy;
		return `M ${p0.cx} ${p0.cy} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${p1.cx} ${p1.cy}`;
	}
	const offset = 50 * (dy > 0 ? 1 : -1);
	const cpx1 = p0.cx + offset;
	const cpy1 = p0.cy + dy * 0.3;
	const cpx2 = p1.cx + offset;
	const cpy2 = p1.cy - dy * 0.3;
	return `M ${p0.cx} ${p0.cy} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${p1.cx} ${p1.cy}`;
}

/**
 * Build the concatenated SVG path string for all nodes (used for the static
 * dashed overlay).
 */
export function buildSvgPath(positions: NodePosition[]): string {
	if (positions.length < 2) return '';
	let d = `M ${positions[0].cx} ${positions[0].cy}`;
	for (let i = 0; i < positions.length - 1; i++) {
		const seg = segmentD(positions[i], positions[i + 1]);
		// Strip the leading M command — reuse the previous endpoint
		d += seg.slice(seg.indexOf(' C'));
	}
	return d;
}

/**
 * Build per-segment path strings. Each entry is a standalone cubic bezier
 * (`M p0 C ... p1`) suitable for driving a GSAP motionPath tween with
 * start:0, end:1 — giving exact node-to-node alignment regardless of
 * segment arc-length variation.
 */
export function buildSegmentPaths(positions: NodePosition[]): string[] {
	const out: string[] = [];
	for (let i = 0; i < positions.length - 1; i++) {
		out.push(segmentD(positions[i], positions[i + 1]));
	}
	return out;
}

export function buildEdgePath(a: NodePosition, b: NodePosition): string {
	return segmentD(a, b);
}

export function positionsToMap(positions: NodePosition[]): Record<string, NodePosition> {
	const out: Record<string, NodePosition> = {};
	for (const p of positions) out[p.id] = p;
	return out;
}
