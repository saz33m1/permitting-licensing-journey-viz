<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import gsap from 'gsap';
	import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
	import {
		measureNodePositions,
		buildSvgPath,
		buildSegmentPaths,
		type NodePosition
	} from '$lib/utils/pathCalc';
	import {
		computeDwell,
		feeWeight,
		LOOP_MIN_S,
		LOOP_MAX_S,
		TRAVEL_PX_PER_SEC,
		SEC_PER_DAY,
		REALISTIC_TRAVEL_S,
		prefersReducedMotion,
		type RealisticStatus
	} from '$lib/utils/timeline';
	import type { PlcNode } from '$lib/types';

	gsap.registerPlugin(MotionPathPlugin);

	let {
		containerEl,
		steps,
		nodeMap,
		mode = 'ambient',
		restartKey = 0,
		onStatus
	}: {
		containerEl: HTMLDivElement;
		steps: string[];
		nodeMap: Record<string, PlcNode>;
		mode?: 'ambient' | 'realistic';
		restartKey?: number;
		onStatus?: (s: RealisticStatus) => void;
	} = $props();

	let svgEl: SVGSVGElement | undefined = $state();
	let dotEl: SVGCircleElement | undefined = $state();
	let pathEl: SVGPathElement | undefined = $state();
	const segmentEls: (SVGPathElement | undefined)[] = $state([]);

	let pathD = $state('');
	let segmentDs = $state<string[]>([]);
	let positions = $state<NodePosition[]>([]);
	let svgW = $state(0);
	let svgH = $state(0);

	const RIPPLE_POOL_SIZE = 4;
	const rippleEls: (SVGCircleElement | undefined)[] = $state(Array(RIPPLE_POOL_SIZE).fill(undefined));
	let rippleIdx = 0;

	let timeline: gsap.core.Timeline | null = null;
	let resizeObs: ResizeObserver | null = null;
	let activeNodeId: string | null = null;

	function recalculate() {
		if (!containerEl) return;
		positions = measureNodePositions(containerEl, steps, nodeMap);
		pathD = buildSvgPath(positions);
		segmentDs = buildSegmentPaths(positions);
		svgW = containerEl.scrollWidth;
		svgH = containerEl.scrollHeight;
	}

	function computeTravel(a: NodePosition, b: NodePosition): number {
		const dist = Math.hypot(b.cx - a.cx, b.cy - a.cy);
		return Math.max(0.15, dist / TRAVEL_PX_PER_SEC);
	}

	function setGlow(id: string | null) {
		if (!containerEl) return;
		if (activeNodeId && activeNodeId !== id) {
			containerEl
				.querySelector(`[data-node-id="${activeNodeId}"]`)
				?.classList.remove('node-glow');
		}
		if (id) {
			containerEl.querySelector(`[data-node-id="${id}"]`)?.classList.add('node-glow');
		}
		activeNodeId = id;
	}

	function fireRipple(p: NodePosition) {
		const el = rippleEls[rippleIdx % RIPPLE_POOL_SIZE];
		rippleIdx++;
		if (!el) return;
		const w = feeWeight(p);
		const endR = 14 + w * 26;
		const color = p.blocking ? 'var(--ink)' : 'var(--accent)';
		gsap.set(el, {
			attr: { cx: p.cx, cy: p.cy, r: 4, opacity: 0.55, stroke: color, fill: 'none' }
		});
		gsap.to(el, {
			attr: { r: endR, opacity: 0 },
			duration: 0.7 + w * 0.5,
			ease: 'power2.out'
		});
	}

	function snapDotToFirstNode() {
		const firstSeg = segmentEls[0];
		if (!firstSeg || !dotEl) return;
		gsap.set(dotEl, {
			motionPath: {
				path: firstSeg,
				align: firstSeg,
				alignOrigin: [0.5, 0.5],
				start: 0,
				end: 0
			}
		});
	}

	function startAnimation() {
		killAnimation();
		if (!pathD || !dotEl || !pathEl || positions.length < 2) return;
		if (prefersReducedMotion()) {
			if (mode === 'realistic') {
				// Emit a finished status so HUD shows the total day count.
				const totalDays = positions.reduce((acc, p) => acc + (p.weeks ?? 1) * 7, 0);
				onStatus?.({
					day: totalDays,
					nodeId: null,
					nodeName: null,
					weeksInStep: 0,
					totalWeeksInStep: 0,
					finished: true
				});
			}
			return;
		}

		if (mode === 'realistic') {
			buildRealisticTimeline();
		} else {
			buildAmbientTimeline();
		}
	}

	function buildAmbientTimeline() {
		if (!dotEl) return;
		const n = positions.length;

		const dwells = positions.map(computeDwell);
		const travels: number[] = [];
		for (let i = 0; i < n - 1; i++) {
			travels.push(computeTravel(positions[i], positions[i + 1]));
		}
		const rawTotal = dwells.reduce((a, b) => a + b, 0) + travels.reduce((a, b) => a + b, 0);
		const target = Math.min(LOOP_MAX_S, Math.max(LOOP_MIN_S, rawTotal));
		const scale = rawTotal > 0 ? target / rawTotal : 1;

		timeline = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });

		const firstSeg = segmentEls[0];
		timeline.set(dotEl, { attr: { opacity: 0 } });
		if (firstSeg) {
			timeline.to(dotEl, {
				motionPath: {
					path: firstSeg,
					align: firstSeg,
					alignOrigin: [0.5, 0.5],
					start: 0,
					end: 0
				},
				duration: 0
			});
		}
		timeline.to(dotEl, { attr: { opacity: 0.9 }, duration: 0.3 });

		for (let i = 0; i < n; i++) {
			const p = positions[i];
			const w = feeWeight(p);
			const dwellSec = Math.max(0.1, dwells[i] * scale);

			timeline.call(() => {
				setGlow(p.id);
				fireRipple(p);
			});

			const pulseDur = Math.min(dwellSec, 0.35);
			timeline.to(dotEl, {
				attr: { r: 5 + w * 4 },
				duration: pulseDur / 2,
				ease: 'power2.out'
			});
			timeline.to(dotEl, {
				attr: { r: 5 },
				duration: pulseDur / 2,
				ease: 'power2.in'
			});

			const remaining = dwellSec - pulseDur;
			if (remaining > 0.01) {
				timeline.to({}, { duration: remaining });
			}

			if (i < n - 1) {
				const next = positions[i + 1];
				const segEl = segmentEls[i];
				const travelSec = Math.max(0.1, travels[i] * scale);
				timeline.call(() => setGlow(null));
				if (segEl) {
					timeline.to(dotEl, {
						motionPath: {
							path: segEl,
							align: segEl,
							alignOrigin: [0.5, 0.5],
							start: 0,
							end: 1
						},
						duration: travelSec,
						ease: next.blocking ? 'power2.out' : 'none'
					});
				}
			}
		}

		timeline.call(() => setGlow(null));
		timeline.to(dotEl, { attr: { opacity: 0 }, duration: 0.3 });
	}

	// Realistic mode: 1 year = 1 minute, plays once, emits a status object for HUD.
	function buildRealisticTimeline() {
		if (!dotEl) return;
		const n = positions.length;

		// Precompute per-node days and cumulative day at arrival.
		const nodeDays = positions.map((p) => Math.max(1, (p.weeks ?? 1) * 7));
		const cumDays: number[] = [];
		let running = 0;
		for (let i = 0; i < n; i++) {
			cumDays.push(running);
			running += nodeDays[i];
		}
		const totalDays = running;

		// Plain proxy object driven by GSAP for the day counter.
		const dayProxy = { day: 0 };

		const emit = (partial: Partial<RealisticStatus>) => {
			onStatus?.({
				day: dayProxy.day,
				nodeId: null,
				nodeName: null,
				weeksInStep: 0,
				totalWeeksInStep: 0,
				finished: false,
				...partial
			});
		};

		timeline = gsap.timeline({ repeat: 0 });

		const firstSeg = segmentEls[0];
		timeline.set(dotEl, { attr: { opacity: 0 } });
		if (firstSeg) {
			timeline.to(dotEl, {
				motionPath: {
					path: firstSeg,
					align: firstSeg,
					alignOrigin: [0.5, 0.5],
					start: 0,
					end: 0
				},
				duration: 0
			});
		}
		timeline.to(dotEl, { attr: { opacity: 0.9 }, duration: 0.3 });

		for (let i = 0; i < n; i++) {
			const p = positions[i];
			const node = nodeMap[p.id];
			const w = feeWeight(p);
			const days = nodeDays[i];
			const dwellSec = Math.max(3, days * SEC_PER_DAY);
			const startDay = cumDays[i];
			const totalWeeks = days / 7;

			// Arrival: glow, ripple, emit initial node status.
			timeline.call(() => {
				setGlow(p.id);
				fireRipple(p);
				dayProxy.day = startDay;
				emit({
					day: startDay,
					nodeId: p.id,
					nodeName: node?.name ?? p.id,
					weeksInStep: 0,
					totalWeeksInStep: totalWeeks
				});
			});

			// Arrival pulse.
			const pulseDur = Math.min(dwellSec, 0.35);
			timeline.to(dotEl, {
				attr: { r: 5 + w * 4 },
				duration: pulseDur / 2,
				ease: 'power2.out'
			});
			timeline.to(
				dotEl,
				{ attr: { r: 5 }, duration: pulseDur / 2, ease: 'power2.in' },
				'<'
			);

			// Day-counter tween driving the HUD. Animates dayProxy.day from
			// startDay → startDay+days over dwellSec, linearly.
			timeline.to(
				dayProxy,
				{
					day: startDay + days,
					duration: dwellSec,
					ease: 'none',
					onUpdate: () => {
						emit({
							day: dayProxy.day,
							nodeId: p.id,
							nodeName: node?.name ?? p.id,
							weeksInStep: (dayProxy.day - startDay) / 7,
							totalWeeksInStep: totalWeeks
						});
					}
				},
				'<'
			);

			// Travel to next node: fixed short transition, counter frozen.
			if (i < n - 1) {
				const segEl = segmentEls[i];
				timeline.call(() => setGlow(null));
				if (segEl) {
					timeline.to(dotEl, {
						motionPath: {
							path: segEl,
							align: segEl,
							alignOrigin: [0.5, 0.5],
							start: 0,
							end: 1
						},
						duration: REALISTIC_TRAVEL_S,
						ease: 'none'
					});
				}
			}
		}

		timeline.call(() => {
			setGlow(null);
			onStatus?.({
				day: totalDays,
				nodeId: null,
				nodeName: null,
				weeksInStep: 0,
				totalWeeksInStep: 0,
				finished: true
			});
		});
	}

	function killAnimation() {
		if (timeline) {
			timeline.kill();
			timeline = null;
		}
		if (containerEl) {
			containerEl.querySelectorAll('.node-glow').forEach((el) => el.classList.remove('node-glow'));
		}
		activeNodeId = null;
	}

	// Recalculate when steps or container change
	$effect(() => {
		void steps;
		void containerEl;
		void nodeMap;
		queueMicrotask(() => {
			recalculate();
		});
	});

	// Start animation when path is ready. Also re-runs when mode or restartKey change.
	$effect(() => {
		void mode;
		void restartKey;
		if (pathD && dotEl && pathEl) {
			startAnimation();
		}
	});

	onMount(() => {
		if (containerEl) {
			resizeObs = new ResizeObserver(() => {
				recalculate();
				startAnimation();
			});
			resizeObs.observe(containerEl);
		}
	});

	onDestroy(() => {
		killAnimation();
		if (resizeObs) {
			resizeObs.disconnect();
			resizeObs = null;
		}
	});
</script>

{#if pathD && positions.length >= 2}
	<svg
		bind:this={svgEl}
		class="absolute inset-0 pointer-events-none"
		style="z-index: 10;"
		width={svgW}
		height={svgH}
	>
		<defs>
			<filter id="dot-glow" x="-100%" y="-100%" width="300%" height="300%">
				<feGaussianBlur stdDeviation="3" result="blur" />
				<feMerge>
					<feMergeNode in="blur" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>
		</defs>

		<!-- Static dashed path showing the full route -->
		<path
			d={pathD}
			fill="none"
			stroke="var(--accent)"
			stroke-width="1.5"
			stroke-dasharray="6 4"
			opacity="0.25"
		/>

		<!-- Hidden reference path for GSAP MotionPathPlugin (full concatenated) -->
		<path bind:this={pathEl} d={pathD} fill="none" stroke="none" />

		<!-- Hidden per-segment paths — one per node-to-node hop, driven
		     individually so motion is constant-speed and lands exactly on
		     each node regardless of bezier arc-length variation. -->
		{#each segmentDs as segD, i}
			<path bind:this={segmentEls[i]} d={segD} fill="none" stroke="none" />
		{/each}

		<!-- Junction dots at each node position -->
		{#each positions as pos}
			<circle cx={pos.cx} cy={pos.cy} r="3" fill="var(--accent)" opacity="0.35" />
		{/each}

		<!-- Ripple pool for arrival pulses -->
		{#each rippleEls as _, i}
			<circle bind:this={rippleEls[i]} cx="0" cy="0" r="0" fill="none" stroke="var(--accent)" stroke-width="1.5" opacity="0" />
		{/each}

		<!-- Animated dot -->
		<circle bind:this={dotEl} r="5" fill="var(--accent)" opacity="0" filter="url(#dot-glow)" />
	</svg>
{/if}
