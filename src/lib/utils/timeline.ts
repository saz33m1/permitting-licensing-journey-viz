import type { PlcNode } from '$lib/types';
import { parseEstTimeWeeks, parseFeeUsd } from './pathCalc';

export interface StepTiming {
	id: string;
	weeks: number | null;
	feeUsd: number | null;
	blocking: boolean;
	required: boolean;
}

export interface RealisticStatus {
	day: number;
	nodeId: string | null;
	nodeName: string | null;
	weeksInStep: number;
	totalWeeksInStep: number;
	finished: boolean;
}

export const LOOP_MIN_S = 10;
export const LOOP_MAX_S = 40;
export const TRAVEL_PX_PER_SEC = 280;
export const SEC_PER_DAY = 60 / 365;
export const REALISTIC_TRAVEL_S = 0.5;
// Synthetic inter-step transition time on mobile (no spatial distance).
// Tuned to roughly match the average desktop segment travel so both form
// factors complete a loop in similar wall-clock time.
export const MOBILE_AMBIENT_TRAVEL_S = 0.7;

export function buildTimings(
	stepIds: string[],
	nodeMap: Record<string, PlcNode>
): StepTiming[] {
	const out: StepTiming[] = [];
	for (const id of stepIds) {
		const node = nodeMap[id];
		if (!node) continue;
		out.push({
			id,
			weeks: parseEstTimeWeeks(node.estTime ?? null),
			feeUsd: parseFeeUsd(node.fee ?? null),
			blocking: node.blocking ?? false,
			required: node.required ?? true
		});
	}
	return out;
}

export function computeDwell(t: StepTiming): number {
	const base = 0.3;
	const timeFactor = t.weeks != null ? Math.log10(t.weeks + 1) * 1.4 : 0.25;
	const blockingBonus = t.blocking ? 1.2 : 0;
	const requiredDamp = t.required ? 1 : 0.45;
	return (base + timeFactor + blockingBonus) * requiredDamp;
}

export function feeWeight(t: StepTiming): number {
	if (t.feeUsd == null) return 0.15;
	return Math.min(0.8, Math.log10(t.feeUsd + 1) / 5);
}

export interface AmbientSchedule {
	dwells: number[];
	travels: number[];
	totalSeconds: number;
	scale: number;
}

export function buildAmbientSchedule(
	timings: StepTiming[],
	travelRawFn?: (i: number) => number
): AmbientSchedule {
	const rawDwells = timings.map(computeDwell);
	const rawTravels: number[] = [];
	for (let i = 0; i < timings.length - 1; i++) {
		rawTravels.push(travelRawFn ? travelRawFn(i) : 0);
	}
	const rawTotal =
		rawDwells.reduce((a, b) => a + b, 0) + rawTravels.reduce((a, b) => a + b, 0);
	const target = Math.min(LOOP_MAX_S, Math.max(LOOP_MIN_S, rawTotal));
	const scale = rawTotal > 0 ? target / rawTotal : 1;
	return {
		dwells: rawDwells.map((d) => Math.max(0.1, d * scale)),
		travels: rawTravels.map((t) => Math.max(0.1, t * scale)),
		totalSeconds: target,
		scale
	};
}

export interface RealisticSchedule {
	nodeDays: number[];
	cumDays: number[];
	dwellSeconds: number[];
	totalDays: number;
}

export function buildRealisticSchedule(timings: StepTiming[]): RealisticSchedule {
	const nodeDays = timings.map((t) => Math.max(1, (t.weeks ?? 1) * 7));
	const cumDays: number[] = [];
	let running = 0;
	for (let i = 0; i < timings.length; i++) {
		cumDays.push(running);
		running += nodeDays[i];
	}
	const dwellSeconds = nodeDays.map((d) => Math.max(3, d * SEC_PER_DAY));
	return { nodeDays, cumDays, dwellSeconds, totalDays: running };
}

export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
