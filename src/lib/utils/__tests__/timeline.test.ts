import { describe, it, expect } from 'vitest';
import {
	buildTimings,
	computeDwell,
	feeWeight,
	buildAmbientSchedule,
	buildRealisticSchedule,
	buildLevelScheduleFromTimings,
	LOOP_MIN_S,
	LOOP_MAX_S,
	type StepTiming
} from '../timeline';
import type { PlcNode } from '../../types';

const mkNode = (id: string, over: Partial<PlcNode> = {}): PlcNode => ({
	id,
	name: id,
	jurisdiction: 'federal',
	phase: 'preparation',
	...over
});

describe('buildTimings', () => {
	it('produces one timing per step, in order', () => {
		const nodeMap = {
			a: mkNode('a', { estTime: '2 Weeks', fee: '$100', blocking: true, required: true }),
			b: mkNode('b', { estTime: null, fee: 'Free', blocking: false, required: false })
		};
		const t = buildTimings(['a', 'b'], nodeMap);
		expect(t).toHaveLength(2);
		expect(t[0]).toEqual({ id: 'a', weeks: 2, feeUsd: 100, blocking: true, required: true });
		expect(t[1]).toEqual({ id: 'b', weeks: null, feeUsd: 0, blocking: false, required: false });
	});

	it('skips step ids missing from nodeMap', () => {
		const nodeMap = { a: mkNode('a') };
		expect(buildTimings(['a', 'ghost'], nodeMap)).toHaveLength(1);
	});

	it('defaults required to true and blocking to false when unset', () => {
		const nodeMap = { a: mkNode('a') };
		const t = buildTimings(['a'], nodeMap)[0];
		expect(t.required).toBe(true);
		expect(t.blocking).toBe(false);
	});
});

describe('computeDwell', () => {
	const t = (over: Partial<StepTiming> = {}): StepTiming => ({
		id: 'x',
		weeks: null,
		feeUsd: null,
		blocking: false,
		required: true,
		...over
	});

	it('gives longer dwell to longer estTime', () => {
		expect(computeDwell(t({ weeks: 52 }))).toBeGreaterThan(computeDwell(t({ weeks: 1 })));
	});

	it('adds blocking bonus', () => {
		expect(computeDwell(t({ weeks: 1, blocking: true }))).toBeGreaterThan(
			computeDwell(t({ weeks: 1, blocking: false }))
		);
	});

	it('dampens non-required steps', () => {
		expect(computeDwell(t({ weeks: 1, required: false }))).toBeLessThan(
			computeDwell(t({ weeks: 1, required: true }))
		);
	});

	it('always returns positive dwell', () => {
		expect(computeDwell(t())).toBeGreaterThan(0);
	});
});

describe('feeWeight', () => {
	it('returns a default weight when fee is null', () => {
		expect(feeWeight({ id: 'x', weeks: null, feeUsd: null, blocking: false, required: true })).toBe(
			0.15
		);
	});

	it('grows with fee but caps at 0.8', () => {
		const small = feeWeight({ id: 'x', weeks: null, feeUsd: 10, blocking: false, required: true });
		const huge = feeWeight({
			id: 'x',
			weeks: null,
			feeUsd: 1_000_000,
			blocking: false,
			required: true
		});
		expect(huge).toBeGreaterThan(small);
		expect(huge).toBeLessThanOrEqual(0.8);
	});
});

describe('buildAmbientSchedule', () => {
	const t = (weeks: number): StepTiming => ({
		id: 'x',
		weeks,
		feeUsd: 0,
		blocking: false,
		required: true
	});

	it('normalizes total to the LOOP_MIN/MAX range', () => {
		const timings = [t(1), t(2), t(3)];
		const sched = buildAmbientSchedule(timings, () => 1);
		expect(sched.totalSeconds).toBeGreaterThanOrEqual(LOOP_MIN_S);
		expect(sched.totalSeconds).toBeLessThanOrEqual(LOOP_MAX_S);
	});

	it('produces one dwell per step and one travel per gap', () => {
		const timings = [t(1), t(2), t(3)];
		const sched = buildAmbientSchedule(timings, () => 1);
		expect(sched.dwells).toHaveLength(3);
		expect(sched.travels).toHaveLength(2);
	});

	it('handles zero total gracefully (scale = 1)', () => {
		const sched = buildAmbientSchedule([], () => 0);
		expect(sched.dwells).toEqual([]);
		expect(sched.travels).toEqual([]);
		expect(sched.scale).toBe(1);
	});
});

describe('buildRealisticSchedule', () => {
	const t = (weeks: number | null): StepTiming => ({
		id: 'x',
		weeks,
		feeUsd: 0,
		blocking: false,
		required: true
	});

	it('converts weeks to days (x7) with a floor of 1 day per step', () => {
		const sched = buildRealisticSchedule([t(2), t(null), t(1)]);
		expect(sched.nodeDays).toEqual([14, 7, 7]);
	});

	it('produces cumulative start-of-step days', () => {
		const sched = buildRealisticSchedule([t(1), t(1), t(1)]);
		expect(sched.cumDays).toEqual([0, 7, 14]);
		expect(sched.totalDays).toBe(21);
	});
});

describe('buildLevelScheduleFromTimings', () => {
	it('picks the max weeks within each level', () => {
		const levels = [{ stepIds: ['a', 'b'] }, { stepIds: ['c'] }];
		const timings: StepTiming[] = [
			{ id: 'a', weeks: 2, feeUsd: 0, blocking: false, required: true },
			{ id: 'b', weeks: 5, feeUsd: 0, blocking: false, required: true },
			{ id: 'c', weeks: 3, feeUsd: 0, blocking: false, required: true }
		];
		const sched = buildLevelScheduleFromTimings(levels, timings);
		expect(sched.levelDays).toEqual([35, 21]); // 5*7, 3*7
		expect(sched.totalDays).toBe(56);
	});
});
