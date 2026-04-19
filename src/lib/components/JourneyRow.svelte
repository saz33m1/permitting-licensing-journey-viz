<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { app, JC } from '$lib/stores/app.svelte';
	import type { Journey } from '$lib/types';

	let { journey }: { journey: Journey } = $props();

	function getJurisdictions(steps: string[]): string[] {
		const jurs = new Set<string>();
		for (const s of steps) {
			const node = app.nodeMap[s];
			if (node) jurs.add(node.jurisdiction);
		}
		return Array.from(jurs);
	}

	const jurs = $derived(getJurisdictions(journey.steps));
	const catLabel = $derived(app.catName[journey.cat] ?? journey.cat);
</script>

<button
	class="journey-row group block w-full px-8 py-5 flex items-center justify-between border-b cursor-pointer text-left"
	style="border-color: var(--muted);"
	onclick={() => goto(`${base}/journey/${journey.id}`)}
>
	<div class="flex flex-col gap-1">
		<h2 class="font-body text-lg font-medium" style="color: var(--ink);">{journey.name}</h2>
		<span class="font-mono text-[10px] uppercase tracking-[1.5px]" style="color: var(--text);">{catLabel}</span>
	</div>
	<div class="flex items-center gap-4">
		<div class="flex items-center gap-1.5">
			{#each jurs as jur}
				<span class="w-2 h-2 rounded-full" style="background: {JC[jur]};"></span>
			{/each}
		</div>
		<span class="font-mono text-xs tabular-nums" style="color: var(--text);">{journey.steps.length} steps</span>
		<span class="arrow-icon font-mono text-sm" style="color: var(--accent);">→</span>
	</div>
</button>

<style>
	.journey-row { transition: background-color 0.2s ease; }
	.journey-row:hover { background-color: var(--surface); }
	.arrow-icon { opacity: 0; transform: translateX(-8px); transition: all 0.25s ease; }
	.journey-row:hover .arrow-icon { opacity: 1; transform: translateX(0); }
</style>
