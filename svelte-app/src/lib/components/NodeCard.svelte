<script lang="ts">
	import { JC } from '$lib/stores/app.svelte';
	import type { PlcNode } from '$lib/types';

	let { node }: { node: PlcNode } = $props();

	const jurLabel = $derived(node.jurisdiction.charAt(0).toUpperCase() + node.jurisdiction.slice(1));
	const jurColor = $derived(JC[node.jurisdiction] ?? '#666');
</script>

<div
	class="node-card w-[180px] p-3 cursor-pointer transition-all"
	style="border: 1px solid var(--ink); background: var(--newsprint);"
>
	<div class="font-mono text-[10px] uppercase flex items-center gap-1 mb-2" style="color: {jurColor};">
		<span class="w-1.5 h-1.5 rounded-full" style="background: {jurColor};"></span>
		{jurLabel}
	</div>
	<div class="font-body text-sm font-medium leading-tight mb-3" style="color: var(--ink);">
		{node.name}
	</div>
	{#if node.estTime}
		<div class="font-mono text-xs flex items-center justify-between pt-2" style="color: var(--text); border-top: 1px solid var(--muted);">
			<span>Est. Time</span>
			<span class="font-medium" style="color: var(--ink);">{node.estTime}</span>
		</div>
	{/if}
	{#if node.blocking}
		<div class="font-mono text-xs flex items-center justify-between pt-2" style="color: var(--text); border-top: 1px solid var(--muted);">
			<span>Status</span>
			<span class="font-medium" style="color: var(--accent);">Blocking</span>
		</div>
	{/if}
</div>

<style>
	.node-card:hover {
		border-width: 2px !important;
		background: var(--surface) !important;
	}
</style>
