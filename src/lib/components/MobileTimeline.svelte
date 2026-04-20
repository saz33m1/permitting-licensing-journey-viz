<script lang="ts">
	import { onDestroy } from 'svelte';
	import gsap from 'gsap';
	import {
		buildTimings,
		buildAmbientSchedule,
		buildRealisticSchedule,
		prefersReducedMotion,
		REALISTIC_TRAVEL_S,
		MOBILE_AMBIENT_TRAVEL_S,
		type RealisticStatus
	} from '$lib/utils/timeline';
	import type { PlcNode } from '$lib/types';

	export interface StepEvent {
		index: number;
		nodeId: string;
		phase: string;
	}

	let {
		steps,
		nodeMap,
		mode = 'ambient',
		restartKey = 0,
		onStatus,
		onStep
	}: {
		steps: string[];
		nodeMap: Record<string, PlcNode>;
		mode?: 'ambient' | 'realistic';
		restartKey?: number;
		onStatus?: (s: RealisticStatus) => void;
		onStep?: (e: StepEvent | null) => void;
	} = $props();

	let timeline: gsap.core.Timeline | null = null;

	function buildAmbient() {
		const timings = buildTimings(steps, nodeMap);
		if (timings.length < 1) return;
		const sched = buildAmbientSchedule(timings, () => MOBILE_AMBIENT_TRAVEL_S);
		timeline = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
		for (let i = 0; i < timings.length; i++) {
			const t = timings[i];
			const node = nodeMap[t.id];
			timeline.call(() => {
				onStep?.({ index: i, nodeId: t.id, phase: node?.phase ?? '' });
			});
			timeline.to({}, { duration: sched.dwells[i] });
			// Inter-step transition — glow stays on current card while the
			// animation pauses, matching the wall-clock cadence of desktop's
			// dwell+travel cycle.
			if (i < timings.length - 1 && sched.travels[i] > 0) {
				timeline.to({}, { duration: sched.travels[i] });
			}
		}
		timeline.call(() => onStep?.(null));
	}

	function buildRealistic() {
		const timings = buildTimings(steps, nodeMap);
		if (timings.length < 1) return;
		const sched = buildRealisticSchedule(timings);
		const dayProxy = { day: 0 };
		const emit = (p: Partial<RealisticStatus> = {}) => {
			onStatus?.({
				day: dayProxy.day,
				nodeId: null,
				nodeName: null,
				weeksInStep: 0,
				totalWeeksInStep: 0,
				finished: false,
				...p
			});
		};

		timeline = gsap.timeline({ repeat: 0 });

		for (let i = 0; i < timings.length; i++) {
			const t = timings[i];
			const node = nodeMap[t.id];
			const days = sched.nodeDays[i];
			const startDay = sched.cumDays[i];
			const dwellSec = sched.dwellSeconds[i];
			const totalWeeks = days / 7;

			timeline.call(() => {
				onStep?.({ index: i, nodeId: t.id, phase: node?.phase ?? '' });
				dayProxy.day = startDay;
				emit({
					day: startDay,
					nodeId: t.id,
					nodeName: node?.name ?? t.id,
					weeksInStep: 0,
					totalWeeksInStep: totalWeeks
				});
			});

			timeline.to(dayProxy, {
				day: startDay + days,
				duration: dwellSec,
				ease: 'none',
				onUpdate: () => {
					emit({
						day: dayProxy.day,
						nodeId: t.id,
						nodeName: node?.name ?? t.id,
						weeksInStep: (dayProxy.day - startDay) / 7,
						totalWeeksInStep: totalWeeks
					});
				}
			});

			if (i < timings.length - 1) {
				timeline.to({}, { duration: REALISTIC_TRAVEL_S });
			}
		}

		timeline.call(() => {
			onStep?.(null);
			onStatus?.({
				day: sched.totalDays,
				nodeId: null,
				nodeName: null,
				weeksInStep: 0,
				totalWeeksInStep: 0,
				finished: true
			});
		});
	}

	function start() {
		kill();
		if (prefersReducedMotion()) {
			if (mode === 'realistic') {
				const timings = buildTimings(steps, nodeMap);
				const sched = buildRealisticSchedule(timings);
				onStatus?.({
					day: sched.totalDays,
					nodeId: null,
					nodeName: null,
					weeksInStep: 0,
					totalWeeksInStep: 0,
					finished: true
				});
			}
			return;
		}
		if (mode === 'realistic') buildRealistic();
		else buildAmbient();
	}

	function kill() {
		if (timeline) {
			timeline.kill();
			timeline = null;
		}
	}

	$effect(() => {
		void mode;
		void restartKey;
		void steps;
		void nodeMap;
		start();
	});

	onDestroy(() => {
		kill();
		onStep?.(null);
	});
</script>
