<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import gsap from 'gsap';
	import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
	import { measureNodePositions, buildSvgPath, type NodePosition } from '$lib/utils/pathCalc';

	gsap.registerPlugin(MotionPathPlugin);

	let { containerEl, steps }: { containerEl: HTMLDivElement; steps: string[] } = $props();

	let svgEl: SVGSVGElement | undefined = $state();
	let dotEl: SVGCircleElement | undefined = $state();
	let pathEl: SVGPathElement | undefined = $state();

	let pathD = $state('');
	let positions = $state<NodePosition[]>([]);
	let svgW = $state(0);
	let svgH = $state(0);

	let timeline: gsap.core.Timeline | null = null;
	let resizeObs: ResizeObserver | null = null;
	let activeNodeId: string | null = null;

	function recalculate() {
		if (!containerEl) return;
		positions = measureNodePositions(containerEl, steps);
		pathD = buildSvgPath(positions);
		svgW = containerEl.scrollWidth;
		svgH = containerEl.scrollHeight;
	}

	function startAnimation() {
		killAnimation();
		if (!pathD || !dotEl || !pathEl || positions.length < 2) return;

		const duration = Math.max(3, positions.length * 0.8);

		timeline = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });

		// Fade in
		timeline.fromTo(dotEl, { attr: { opacity: 0 } }, { attr: { opacity: 0.9 }, duration: 0.3 });

		// Move along path
		timeline.to(dotEl, {
			motionPath: {
				path: pathEl,
				align: pathEl,
				alignOrigin: [0.5, 0.5]
			},
			duration,
			ease: 'none',
			onUpdate: function () {
				if (!dotEl || !containerEl) return;
				// Get dot position from its transform
				const matrix = dotEl.getCTM();
				if (!matrix) return;
				const dotX = matrix.e;
				const dotY = matrix.f;

				// Find nearest node
				let nearest: string | null = null;
				let minDist = 35;
				for (const pos of positions) {
					const dist = Math.hypot(pos.cx - dotX, pos.cy - dotY);
					if (dist < minDist) {
						minDist = dist;
						nearest = pos.id;
					}
				}

				if (nearest !== activeNodeId) {
					// Remove glow from previous
					if (activeNodeId) {
						const prev = containerEl.querySelector(`[data-node-id="${activeNodeId}"]`);
						prev?.classList.remove('node-glow');
					}
					// Add glow to current
					if (nearest) {
						const curr = containerEl.querySelector(`[data-node-id="${nearest}"]`);
						curr?.classList.add('node-glow');
					}
					activeNodeId = nearest;
				}
			}
		});

		// Fade out
		timeline.to(dotEl, { attr: { opacity: 0 }, duration: 0.3 });
	}

	function killAnimation() {
		if (timeline) {
			timeline.kill();
			timeline = null;
		}
		// Clean up glow classes
		if (containerEl) {
			containerEl.querySelectorAll('.node-glow').forEach(el => el.classList.remove('node-glow'));
		}
		activeNodeId = null;
	}

	// Recalculate when steps or container change
	$effect(() => {
		// Track dependencies
		void steps;
		void containerEl;
		// Defer to next microtask so NodeCards are rendered
		queueMicrotask(() => {
			recalculate();
		});
	});

	// Start animation when path is ready
	$effect(() => {
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

		<!-- Hidden reference path for GSAP MotionPathPlugin -->
		<path
			bind:this={pathEl}
			d={pathD}
			fill="none"
			stroke="none"
		/>

		<!-- Junction dots at each node position -->
		{#each positions as pos}
			<circle cx={pos.cx} cy={pos.cy} r="3" fill="var(--accent)" opacity="0.35" />
		{/each}

		<!-- Animated dot -->
		<circle
			bind:this={dotEl}
			r="5"
			fill="var(--accent)"
			opacity="0"
			filter="url(#dot-glow)"
		/>
	</svg>
{/if}
