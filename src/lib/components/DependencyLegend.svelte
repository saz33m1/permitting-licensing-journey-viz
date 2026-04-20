<script lang="ts">
	import { app } from '$lib/stores/app.svelte';
	import { base } from '$app/paths';

	let { mode = 'ambient' }: { mode?: 'ambient' | 'realistic' } = $props();

	function toggle() {
		app.legendOpen = !app.legendOpen;
	}
</script>

{#if app.legendOpen}
	<aside
		class="absolute flex flex-col gap-2 p-3 w-[300px] max-w-[calc(100%-16px)]"
		style="top: 8px; left: 8px; z-index: 25; background: var(--surface); border: 1px solid var(--ink); box-shadow: 0 2px 6px rgba(0,0,0,.08);"
		aria-label="Dependency view legend"
	>
		<div class="flex items-center justify-between gap-3">
			<span
				class="font-mono text-[10px] tracking-[1.5px] uppercase"
				style="color: var(--text);">How to read this view</span
			>
			<button
				type="button"
				onclick={toggle}
				aria-label="Hide legend"
				class="w-5 h-5 flex items-center justify-center cursor-pointer"
				style="color: var(--ink);"
			>
				<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
					<path d="M1 1 L9 9 M9 1 L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
				</svg>
			</button>
		</div>

		<svg width="0" height="0" style="position: absolute;" aria-hidden="true">
			<defs>
				<marker
					id="legend-arrow-hard"
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
					id="legend-arrow-soft"
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
					id="legend-arrow-parallel"
					viewBox="0 0 10 10"
					refX="9"
					refY="5"
					markerWidth="6"
					markerHeight="6"
					orient="auto-start-reverse"
				>
					<path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink)" />
				</marker>
			</defs>
		</svg>

		<ul class="flex flex-col gap-1.5">
			<li class="flex items-center gap-3">
				<svg width="38" height="10" viewBox="0 0 38 10" class="shrink-0" aria-hidden="true">
					<path
						d="M 1 5 L 30 5"
						fill="none"
						stroke="var(--ink)"
						stroke-width="1.5"
						marker-end="url(#legend-arrow-hard)"
					/>
				</svg>
				<span class="font-mono text-[10px] uppercase tracking-wider w-[70px] shrink-0" style="color: var(--ink);">Hard</span>
				<span class="font-body text-xs leading-snug" style="color: var(--text);">Legally required prerequisite</span>
			</li>
			<li class="flex items-center gap-3">
				<svg width="38" height="10" viewBox="0 0 38 10" class="shrink-0" aria-hidden="true">
					<path
						d="M 1 5 L 30 5"
						fill="none"
						stroke="var(--ink)"
						stroke-width="1.5"
						stroke-dasharray="5 3"
						marker-end="url(#legend-arrow-soft)"
					/>
				</svg>
				<span class="font-mono text-[10px] uppercase tracking-wider w-[70px] shrink-0" style="color: var(--ink);">Soft</span>
				<span class="font-body text-xs leading-snug" style="color: var(--text);">Recommended, not legally gated</span>
			</li>
			<li class="flex items-center gap-3">
				<svg width="38" height="10" viewBox="0 0 38 10" class="shrink-0" aria-hidden="true">
					<path
						d="M 1 5 L 30 5"
						fill="none"
						stroke="var(--ink)"
						stroke-width="2"
						stroke-dasharray="0.1 4"
						stroke-linecap="round"
						marker-end="url(#legend-arrow-parallel)"
					/>
				</svg>
				<span class="font-mono text-[10px] uppercase tracking-wider w-[70px] shrink-0" style="color: var(--ink);">Parallel</span>
				<span class="font-body text-xs leading-snug" style="color: var(--text);">Can happen at the same time</span>
			</li>
			<li class="flex items-center gap-3">
				<span
					class="font-mono text-[9px] tracking-[1px] uppercase px-1.5 py-0.5 shrink-0"
					style="background: var(--accent); color: var(--newsprint); width: 38px; text-align: center;"
				>Start</span>
				<span class="font-mono text-[10px] uppercase tracking-wider w-[70px] shrink-0" style="color: var(--ink);">Entry</span>
				<span class="font-body text-xs leading-snug" style="color: var(--text);">No prerequisites — start here</span>
			</li>
			{#if mode === 'realistic'}
				<li class="flex items-start gap-3 pt-2 mt-1" style="border-top: 1px solid var(--muted);">
					<span class="shrink-0 inline-block" style="width: 38px;"></span>
					<span class="font-mono text-[10px] uppercase tracking-wider w-[70px] shrink-0 pt-[1px]" style="color: var(--ink);">Min. parallel</span>
					<span class="font-body text-xs leading-snug" style="color: var(--text);">Shortest calendar time if same-level steps run at once</span>
				</li>
			{/if}
		</ul>

		<a
			href="{base}/methodology"
			class="font-mono text-[10px] tracking-[1px] uppercase mt-1 self-start transition-colors"
			style="color: var(--text); text-decoration: underline; text-underline-offset: 3px;"
		>Learn more</a>
	</aside>
{:else}
	<button
		type="button"
		onclick={toggle}
		class="absolute flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] tracking-[1.5px] uppercase cursor-pointer"
		style="top: 8px; left: 8px; z-index: 25; background: var(--surface); border: 1px solid var(--ink); color: var(--ink); box-shadow: 0 2px 6px rgba(0,0,0,.08);"
		aria-label="Show legend"
	>
		<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
			<circle cx="5" cy="5" r="4" stroke="currentColor" stroke-width="1" fill="none" />
			<path d="M5 3.5 V 5 M5 6.5 V 6.6" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
		</svg>
		<span>Legend</span>
	</button>
{/if}
