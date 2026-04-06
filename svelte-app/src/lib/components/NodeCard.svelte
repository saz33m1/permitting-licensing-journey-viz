<script lang="ts">
	import { app, JC } from '$lib/stores/app.svelte';
	import type { PlcNode } from '$lib/types';

	let { node, stepIndex }: { node: PlcNode; stepIndex?: number } = $props();

	function handleClick() {
		app.selectedNode = app.selectedNode === node.id ? null : node.id;
	}

	const isSelected = $derived(app.selectedNode === node.id);

	const jurLabel = $derived(node.jurisdiction.charAt(0).toUpperCase() + node.jurisdiction.slice(1));
	const jurColor = $derived(JC[node.jurisdiction] ?? '#666');

	const badge = $derived(stepIndex != null ? String(stepIndex + 1) : null);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="node-card w-[180px] p-3 cursor-pointer transition-all relative"
	style="border: {isSelected ? '2px' : '1px'} solid var(--ink); background: {isSelected ? 'var(--surface)' : 'var(--newsprint)'};"
	data-node-id={node.id}
	onclick={handleClick}
>
	{#if badge}
		<span
			class="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center font-mono text-sm leading-none"
			style="background: var(--ink); color: var(--newsprint);"
		>{badge}</span>
	{/if}
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
