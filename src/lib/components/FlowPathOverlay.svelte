<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import gsap from 'gsap';
	import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
	import {
		measureNodePositions,
		buildSvgPath,
		buildSegmentPaths,
		buildEdgePath,
		positionsToMap,
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
	import { topoSort, buildAdjacency, isEntryPoint } from '$lib/utils/topoSort';
	import type { PlcNode, Dependency } from '$lib/types';

	gsap.registerPlugin(MotionPathPlugin);

	let {
		containerEl,
		steps,
		dependencies,
		nodeMap,
		mode = 'ambient',
		restartKey = 0,
		onStatus
	}: {
		containerEl: HTMLDivElement;
		steps: string[];
		dependencies?: Dependency[];
		nodeMap: Record<string, PlcNode>;
		mode?: 'ambient' | 'realistic';
		restartKey?: number;
		onStatus?: (s: RealisticStatus) => void;
	} = $props();

	interface EdgeGeom {
		key: string;
		from: string;
		to: string;
		type: 'hard' | 'soft' | 'parallel';
		d: string;
		length: number;
	}

	let svgEl: SVGSVGElement | undefined = $state();
	let dotEl: SVGCircleElement | undefined = $state();

	let orderedSteps = $state<string[]>([]);
	let positions = $state<NodePosition[]>([]);
	let posMap = $state<Record<string, NodePosition>>({});
	let edges = $state<EdgeGeom[]>([]);
	let segmentDs = $state<string[]>([]); // dot-hop paths between consecutive ordered nodes
	let entryIds = $state<string[]>([]);
	let fallbackPathD = $state('');
	let svgW = $state(0);
	let svgH = $state(0);

	const edgePathEls: (SVGPathElement | undefined)[] = $state([]);
	const segmentEls: (SVGPathElement | undefined)[] = $state([]);

	const RIPPLE_POOL_SIZE = 4;
	const rippleEls: (SVGCircleElement | undefined)[] = $state(
		Array(RIPPLE_POOL_SIZE).fill(undefined)
	);
	let rippleIdx = 0;

	let timeline: gsap.core.Timeline | null = null;
	let resizeObs: ResizeObserver | null = null;
	let activeNodeId: string | null = null;

	const hasDeps = $derived((dependencies?.length ?? 0) > 0);

	function recalculate() {
		if (!containerEl) return;
		orderedSteps = topoSort(steps, dependencies);
		positions = measureNodePositions(containerEl, orderedSteps, nodeMap);
		posMap = positionsToMap(positions);

		// Build edges from dependency data (only between nodes we have positions for).
		const eg: EdgeGeom[] = [];
		if (dependencies) {
			for (const e of dependencies) {
				const a = posMap[e.from];
				const b = posMap[e.to];
				if (!a || !b) continue;
				const d = buildEdgePath(a, b);
				eg.push({
					key: `${e.from}->${e.to}`,
					from: e.from,
					to: e.to,
					type: e.type,
					d,
					length: 0
				});
			}
		}
		edges = eg;

		// Segments between consecutive ordered nodes (for dot travel).
		segmentDs = buildSegmentPaths(positions);

		// Entry-point nodes: no incoming hard/soft edge.
		entryIds = orderedSteps.filter((id) => isEntryPoint(id, dependencies));

		fallbackPathD = hasDeps ? '' : buildSvgPath(positions);

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

	function resetEdgeVisibility() {
		if (!hasDeps) return;
		edges.forEach((_, i) => {
			const el = edgePathEls[i];
			if (!el) return;
			const len = el.getTotalLength?.() ?? 0;
			edges[i].length = len;
			el.style.strokeDasharray = `${len} ${len}`;
			el.style.strokeDashoffset = `${len}`;
			el.style.opacity = '0';
		});
	}

	function drawInEdge(i: number, duration: number) {
		const el = edgePathEls[i];
		if (!el) return;
		const len = edges[i].length || el.getTotalLength?.() || 0;
		gsap.set(el, { opacity: strokeOpacityFor(edges[i].type) });
		gsap.to(el, {
			strokeDashoffset: 0,
			duration,
			ease: 'power1.out',
			overwrite: 'auto'
		});
	}

	function strokeOpacityFor(type: EdgeGeom['type']): number {
		if (type === 'hard') return 1;
		if (type === 'soft') return 0.6;
		return 0.5;
	}

	function showAllEdgesStatic() {
		if (!hasDeps) return;
		edges.forEach((e, i) => {
			const el = edgePathEls[i];
			if (!el) return;
			el.style.strokeDasharray = '';
			el.style.strokeDashoffset = '';
			el.style.opacity = String(strokeOpacityFor(e.type));
		});
	}

	function startAnimation() {
		killAnimation();
		if (!dotEl || positions.length < 2) {
			if (hasDeps) showAllEdgesStatic();
			return;
		}
		if (prefersReducedMotion()) {
			showAllEdgesStatic();
			if (mode === 'realistic') {
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

		resetEdgeVisibility();

		if (mode === 'realistic') {
			buildRealisticTimeline();
		} else {
			buildAmbientTimeline();
		}
	}

	function edgesIntoIndices(toId: string): number[] {
		const out: number[] = [];
		for (let i = 0; i < edges.length; i++) if (edges[i].to === toId) out.push(i);
		return out;
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

		timeline = gsap.timeline({
			repeat: -1,
			repeatDelay: 0.5,
			onRepeat: () => {
				if (hasDeps) resetEdgeVisibility();
			}
		});

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
				if (hasDeps) {
					for (const idx of edgesIntoIndices(p.id)) {
						drawInEdge(idx, Math.min(1.2, Math.max(0.25, dwellSec * 0.6)));
					}
				}
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

	function buildRealisticTimeline() {
		if (!dotEl) return;
		const n = positions.length;

		const nodeDays = positions.map((p) => Math.max(1, (p.weeks ?? 1) * 7));
		const cumDays: number[] = [];
		let running = 0;
		for (let i = 0; i < n; i++) {
			cumDays.push(running);
			running += nodeDays[i];
		}
		const totalDays = running;

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

			timeline.call(() => {
				setGlow(p.id);
				fireRipple(p);
				dayProxy.day = startDay;
				if (hasDeps) {
					for (const idx of edgesIntoIndices(p.id)) {
						drawInEdge(idx, Math.min(2, dwellSec * 0.5));
					}
				}
				emit({
					day: startDay,
					nodeId: p.id,
					nodeName: node?.name ?? p.id,
					weeksInStep: 0,
					totalWeeksInStep: totalWeeks
				});
			});

			const pulseDur = Math.min(dwellSec, 0.35);
			timeline.to(dotEl, {
				attr: { r: 5 + w * 4 },
				duration: pulseDur / 2,
				ease: 'power2.out'
			});
			timeline.to(dotEl, { attr: { r: 5 }, duration: pulseDur / 2, ease: 'power2.in' }, '<');

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

	$effect(() => {
		void steps;
		void dependencies;
		void containerEl;
		void nodeMap;
		queueMicrotask(() => {
			recalculate();
		});
	});

	$effect(() => {
		void mode;
		void restartKey;
		void edges;
		if ((hasDeps || fallbackPathD) && dotEl) {
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

{#if positions.length >= 2}
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
			<marker
				id="arrow-hard"
				viewBox="0 0 10 10"
				refX="9"
				refY="5"
				markerWidth="6"
				markerHeight="6"
				orient="auto-start-reverse"
			>
				<path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink)" />
			</marker>
			<marker
				id="arrow-soft"
				viewBox="0 0 10 10"
				refX="9"
				refY="5"
				markerWidth="5"
				markerHeight="5"
				orient="auto-start-reverse"
			>
				<path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text)" opacity="0.7" />
			</marker>
			<marker
				id="arrow-parallel"
				viewBox="0 0 10 10"
				refX="9"
				refY="5"
				markerWidth="4"
				markerHeight="4"
				orient="auto-start-reverse"
			>
				<path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)" opacity="0.6" />
			</marker>
		</defs>

		{#if hasDeps}
			<!-- Per-edge dependency paths -->
			{#each edges as edge, i (edge.key)}
				<path
					bind:this={edgePathEls[i]}
					d={edge.d}
					fill="none"
					stroke={edge.type === 'hard'
						? 'var(--ink)'
						: edge.type === 'soft'
							? 'var(--text)'
							: 'var(--muted)'}
					stroke-width={edge.type === 'hard' ? 1.5 : 1}
					stroke-dasharray={edge.type === 'soft' ? '4 3' : edge.type === 'parallel' ? '1 3' : ''}
					opacity={strokeOpacityFor(edge.type)}
					marker-end="url(#arrow-{edge.type})"
				/>
			{/each}
		{:else if fallbackPathD}
			<path
				d={fallbackPathD}
				fill="none"
				stroke="var(--accent)"
				stroke-width="1.5"
				stroke-dasharray="6 4"
				opacity="0.25"
			/>
		{/if}

		<!-- Entry-point rings -->
		{#each entryIds as id}
			{@const p = posMap[id]}
			{#if p}
				<circle
					cx={p.cx}
					cy={p.cy}
					r="18"
					fill="none"
					stroke="var(--accent)"
					stroke-width="1"
					opacity="0.35"
				/>
			{/if}
		{/each}

		<!-- Hidden per-segment dot-hop paths -->
		{#each segmentDs as segD, i}
			<path bind:this={segmentEls[i]} d={segD} fill="none" stroke="none" />
		{/each}

		<!-- Junction dots at each node position -->
		{#each positions as pos}
			<circle cx={pos.cx} cy={pos.cy} r="3" fill="var(--accent)" opacity="0.35" />
		{/each}

		<!-- Ripple pool -->
		{#each rippleEls as _, i}
			<circle
				bind:this={rippleEls[i]}
				cx="0"
				cy="0"
				r="0"
				fill="none"
				stroke="var(--accent)"
				stroke-width="1.5"
				opacity="0"
			/>
		{/each}

		<!-- Animated dot -->
		<circle bind:this={dotEl} r="5" fill="var(--accent)" opacity="0" filter="url(#dot-glow)" />
	</svg>
{/if}
