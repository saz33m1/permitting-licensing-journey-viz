import { describe, it, expect } from 'vitest';
import {
	parseEstTimeWeeks,
	parseFeeUsd,
	buildEdgePath,
	buildSegmentPaths,
	buildSvgPath,
	positionsToMap,
	type NodePosition
} from '../pathCalc';

describe('parseEstTimeWeeks', () => {
	it('returns null for null/undefined/empty input', () => {
		expect(parseEstTimeWeeks(null)).toBeNull();
		expect(parseEstTimeWeeks(undefined)).toBeNull();
		expect(parseEstTimeWeeks('')).toBeNull();
	});

	it('returns null for unparseable strings (e.g. "Ongoing")', () => {
		expect(parseEstTimeWeeks('Ongoing')).toBeNull();
		expect(parseEstTimeWeeks('varies')).toBeNull();
	});

	it('takes the high-end of a range', () => {
		expect(parseEstTimeWeeks('1-2 Weeks')).toBe(2);
		expect(parseEstTimeWeeks('4-8 Weeks')).toBe(8);
		expect(parseEstTimeWeeks('12-52 Weeks')).toBe(52);
	});

	it('defaults to weeks when no unit is present', () => {
		expect(parseEstTimeWeeks('3')).toBe(3);
	});

	it('converts years to weeks (x52)', () => {
		expect(parseEstTimeWeeks('1 Year')).toBe(52);
		expect(parseEstTimeWeeks('1-2 Years')).toBe(104);
	});

	it('converts months to weeks (x4.33)', () => {
		expect(parseEstTimeWeeks('2 Months')).toBeCloseTo(8.66, 2);
	});

	it('converts days to weeks (/7)', () => {
		expect(parseEstTimeWeeks('7 Days')).toBe(1);
		expect(parseEstTimeWeeks('14 Days')).toBe(2);
	});
});

describe('parseFeeUsd', () => {
	it('returns null for null/undefined/empty', () => {
		expect(parseFeeUsd(null)).toBeNull();
		expect(parseFeeUsd(undefined)).toBeNull();
	});

	it('returns 0 for free/none/no fee', () => {
		expect(parseFeeUsd('Free')).toBe(0);
		expect(parseFeeUsd('None')).toBe(0);
		expect(parseFeeUsd('No fee')).toBe(0);
	});

	it('parses single values', () => {
		expect(parseFeeUsd('$25')).toBe(25);
		expect(parseFeeUsd('$1,000')).toBe(1000);
	});

	it('takes the high-end of a range', () => {
		expect(parseFeeUsd('$1,000-$4,500')).toBe(4500);
		expect(parseFeeUsd('$50-$100')).toBe(100);
	});

	it('returns null for strings with no numbers', () => {
		expect(parseFeeUsd('Varies')).toBeNull();
	});
});

describe('buildEdgePath', () => {
	const mk = (id: string, cx: number, cy: number): NodePosition => ({
		id,
		cx,
		cy,
		weeks: 1,
		feeUsd: 0,
		blocking: false,
		required: true
	});

	it('produces a cubic bezier M...C... string for cross-column edges', () => {
		const a = mk('a', 0, 0);
		const b = mk('b', 200, 100);
		const d = buildEdgePath(a, b);
		expect(d).toMatch(/^M 0 0 C .+/);
		expect(d).toContain('200 100');
	});

	it('uses horizontal-biased curve when |dx| > 20', () => {
		const a = mk('a', 0, 0);
		const b = mk('b', 100, 0);
		const d = buildEdgePath(a, b);
		// Midpoint control uses horizontal offset dx*0.5 = 50
		expect(d).toContain('C 50 0');
	});

	it('uses offset curve for same-column (|dx| <= 20)', () => {
		const a = mk('a', 0, 0);
		const b = mk('b', 0, 100);
		const d = buildEdgePath(a, b);
		// offset = 50 * (dy > 0 ? 1 : -1) = 50; first CP x is 0 + 50 = 50
		expect(d).toMatch(/C 50 /);
	});
});

describe('buildSegmentPaths / buildSvgPath', () => {
	const mk = (id: string, cx: number, cy: number): NodePosition => ({
		id,
		cx,
		cy,
		weeks: 0,
		feeUsd: 0,
		blocking: false,
		required: true
	});

	it('returns one segment for each pair of consecutive positions', () => {
		const pos = [mk('a', 0, 0), mk('b', 100, 0), mk('c', 200, 0)];
		expect(buildSegmentPaths(pos)).toHaveLength(2);
	});

	it('returns empty string for <2 positions in buildSvgPath', () => {
		expect(buildSvgPath([])).toBe('');
		expect(buildSvgPath([mk('a', 0, 0)])).toBe('');
	});

	it('concatenates segments into one path in buildSvgPath', () => {
		const pos = [mk('a', 0, 0), mk('b', 100, 0), mk('c', 200, 0)];
		const d = buildSvgPath(pos);
		expect(d.startsWith('M 0 0')).toBe(true);
		// Should contain two C commands
		expect(d.match(/\sC\s/g)).toHaveLength(2);
	});
});

describe('positionsToMap', () => {
	it('indexes positions by id', () => {
		const a: NodePosition = { id: 'a', cx: 1, cy: 2, weeks: null, feeUsd: null, blocking: false, required: true };
		const b: NodePosition = { id: 'b', cx: 3, cy: 4, weeks: null, feeUsd: null, blocking: false, required: true };
		const map = positionsToMap([a, b]);
		expect(map.a).toBe(a);
		expect(map.b).toBe(b);
	});
});
