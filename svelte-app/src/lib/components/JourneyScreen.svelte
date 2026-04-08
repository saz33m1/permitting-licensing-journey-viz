<script lang="ts">
	import { app } from '$lib/stores/app.svelte';
	import TopNavbar from './TopNavbar.svelte';
	import MatrixGrid from './MatrixGrid.svelte';
	import NodeDetailPanel from './NodeDetailPanel.svelte';

	const journey = $derived(app.activeJourney);
	const catLabel = $derived(journey ? (app.catName[journey.cat] ?? journey.cat) : '');

	const selectedNodeObj = $derived(app.selectedNode ? app.nodeMap[app.selectedNode] : null);
	const selectedStepIndex = $derived(
		app.selectedNode && journey ? journey.steps.indexOf(app.selectedNode) : -1
	);
</script>

{#if journey}
	<div class="min-h-screen flex flex-col" style="background: var(--newsprint);">
		<TopNavbar />

		<!-- Journey Header -->
		<div class="px-8 py-6" style="border-bottom: 1px solid var(--muted);">
			<h1 class="font-display text-3xl lg:text-4xl font-bold leading-tight" style="color: var(--ink);">
				{journey.name}
			</h1>
			<p class="font-mono text-xs mt-2 tracking-[1.5px] uppercase" style="color: var(--text);">
				Illustrative steps, sequence, and timelines
			</p>
		</div>

		<!-- Matrix -->
		<main class="flex-1 p-8 pt-0 overflow-x-auto" style="min-width: 900px;">
			<div class="mt-6">
				<MatrixGrid {journey} />
			</div>
		</main>

		<!-- Node Detail Panel -->
		{#if selectedNodeObj}
			<NodeDetailPanel
				node={selectedNodeObj}
				stepIndex={selectedStepIndex >= 0 ? selectedStepIndex : undefined}
				totalSteps={journey.steps.length}
			/>
		{/if}
	</div>
{/if}
