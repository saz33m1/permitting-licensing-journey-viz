<script lang="ts">
	import { app, JC, PHASES, PHASE_LABELS, JURISDICTIONS_ORDER } from '$lib/stores/app.svelte';
	import { computeMatrix } from '$lib/utils/matrix';
	import NodeCard from './NodeCard.svelte';
	import FlowPathOverlay from './FlowPathOverlay.svelte';
	import type { Journey } from '$lib/types';

	let { journey }: { journey: Journey } = $props();

	const matrix = $derived(computeMatrix(journey, app.nodeMap));

	const stepIndexMap = $derived.by(() => {
		const map: Record<string, number> = {};
		journey.steps.forEach((id, i) => { map[id] = i; });
		return map;
	});

	let gridEl: HTMLDivElement | undefined = $state();

	const jurLabels: Record<string, string> = {
		federal: 'Federal',
		state: 'State',
		local: 'Local'
	};
</script>

<div class="relative">
<div bind:this={gridEl} class="grid w-full" style="grid-template-columns: 80px repeat(4, 1fr); border: 1px solid var(--ink);">
	<!-- Top-left corner cell -->
	<div style="border-bottom: 1px solid var(--ink); border-right: 1px solid var(--ink); background: rgba(213,211,206,.15);"></div>

	<!-- Phase column headers -->
	{#each PHASES as phase, i}
		<div
			class="p-4 flex flex-col justify-end"
			style="border-bottom: 1px solid var(--ink); {i < 3 ? 'border-right: 1px solid var(--ink);' : ''} background: var(--surface);"
		>
			<span class="font-mono text-[10px] tracking-[1px] uppercase" style="color: var(--text);">{PHASE_LABELS[phase].number}</span>
			<span class="font-body font-medium text-base mt-1" style="color: var(--ink);">{PHASE_LABELS[phase].label}</span>
		</div>
	{/each}

	<!-- Jurisdiction rows -->
	{#each JURISDICTIONS_ORDER as jur, jurIdx}
		<!-- Row label -->
		<div
			class="flex items-center justify-center p-3"
			style="border-right: 1px solid var(--ink); {jurIdx < 2 ? 'border-bottom: 1px solid var(--ink);' : ''} background: var(--surface); min-height: 180px;"
		>
			<div class="flex items-center gap-2 vertical-text">
				<span class="w-2.5 h-2.5 rounded-full" style="background: {JC[jur]};"></span>
				<span class="font-mono text-[10px] tracking-[1px] uppercase" style="color: var(--ink);">{jurLabels[jur]}</span>
			</div>
		</div>

		<!-- Phase cells for this jurisdiction -->
		{#each PHASES as phase, phaseIdx}
			{@const nodes = matrix[`${jur}-${phase}`] ?? []}
			<div
				class="p-3 relative {nodes.length === 0 ? 'hatch-pattern' : ''}"
				style="{jurIdx < 2 ? 'border-bottom: 1px solid var(--muted);' : ''} {phaseIdx < 3 ? 'border-right: 1px solid var(--muted);' : ''}"
			>
				{#if nodes.length > 0}
					<div class="flex flex-col gap-3">
						{#each nodes as node (node.id)}
							<NodeCard {node} stepIndex={stepIndexMap[node.id]} />
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	{/each}
</div>
{#if app.viewMode === 'dependency' && gridEl}
	<FlowPathOverlay containerEl={gridEl} steps={journey.steps} />
{/if}
</div>
