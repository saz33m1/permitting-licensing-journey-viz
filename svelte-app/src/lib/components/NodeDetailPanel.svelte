<script lang="ts">
	import { app, JC } from '$lib/stores/app.svelte';
	import type { PlcNode } from '$lib/types';

	let { node, stepIndex, totalSteps }: { node: PlcNode; stepIndex?: number; totalSteps?: number } = $props();

	const jurLabel = $derived(node.jurisdiction.charAt(0).toUpperCase() + node.jurisdiction.slice(1));
	const jurColor = $derived(JC[node.jurisdiction] ?? '#666');

	function close() {
		app.selectedNode = null;
	}
</script>

<!-- Overlay -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed inset-0 z-[99]" style="background: rgba(28,27,26,0.4); backdrop-filter: blur(1px);" onclick={close}></div>

<!-- Panel -->
<aside
	class="fixed top-0 right-0 h-full w-[480px] z-[100] overflow-y-auto flex flex-col panel-enter"
	style="background: var(--surface); border-left: 2px solid var(--ink); box-shadow: -10px 0 30px rgba(0,0,0,0.1);"
>
	<!-- Sticky Header -->
	<div class="p-8 flex flex-col gap-6 sticky top-0 z-10" style="background: var(--surface); border-bottom: 1px solid var(--muted);">
		<div class="flex justify-between items-start">
			<div class="flex flex-wrap gap-2">
				<span
					class="px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider"
					style="border: 1px solid {jurColor}; color: {jurColor};"
				>{jurLabel} Jurisdiction</span>
				{#if node.required !== false}
					<span
						class="px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider"
						style="border: 1px solid var(--ink); color: var(--ink);"
					>Required</span>
				{:else}
					<span
						class="px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider"
						style="border: 1px solid var(--muted); color: var(--text);"
					>Optional</span>
				{/if}
			</div>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="w-10 h-10 flex items-center justify-center cursor-pointer transition-colors"
				style="border: 1px solid var(--ink);"
				onclick={close}
			>
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="color: var(--ink);">
					<path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
				</svg>
			</div>
		</div>
		<div>
			<h3 class="font-body text-3xl font-bold leading-tight" style="color: var(--ink);">{node.name}</h3>
			{#if node.agency}
				<p class="font-mono text-xs mt-3 tracking-wide uppercase" style="color: var(--text);">{node.agency}</p>
			{/if}
		</div>
	</div>

	<!-- Body -->
	<div class="p-8 space-y-10 flex-1">
		<!-- Description -->
		{#if node.description}
			<section>
				<h4 class="font-mono text-[11px] font-bold uppercase tracking-[0.2em] mb-4" style="color: var(--text);">Description</h4>
				<div class="p-6" style="background: var(--newsprint); border-left: 4px solid var(--ink);">
					<p class="font-body text-sm leading-relaxed italic" style="color: var(--text);">{node.description}</p>
				</div>
			</section>
		{/if}

		<!-- Key Metadata -->
		<section>
			<h4 class="font-mono text-[11px] font-bold uppercase tracking-[0.2em] mb-4" style="color: var(--text);">Key Metadata</h4>
			<div class="grid grid-cols-2" style="border: 1px solid var(--muted);">
				{#if node.fee}
					<div class="p-4" style="border-bottom: 1px solid var(--muted); border-right: 1px solid var(--muted);">
						<p class="font-mono text-[10px] uppercase mb-1" style="color: var(--text);">Application Fee</p>
						<p class="font-body font-bold text-lg" style="color: var(--ink);">{node.fee}</p>
					</div>
				{:else}
					<div class="p-4" style="border-bottom: 1px solid var(--muted); border-right: 1px solid var(--muted);">
						<p class="font-mono text-[10px] uppercase mb-1" style="color: var(--text);">Application Fee</p>
						<p class="font-body text-sm" style="color: var(--muted);">—</p>
					</div>
				{/if}

				<div class="p-4" style="border-bottom: 1px solid var(--muted);">
					<p class="font-mono text-[10px] uppercase mb-1" style="color: var(--text);">Process Time</p>
					<p class="font-body font-bold text-lg" style="color: var(--ink);">{node.estTime ?? '—'}</p>
				</div>

				<div class="p-4" style="border-right: 1px solid var(--muted);">
					<p class="font-mono text-[10px] uppercase mb-1" style="color: var(--text);">Renewal Term</p>
					<p class="font-body font-bold text-lg" style="color: var(--ink);">{node.renewalTerm ?? 'One-time'}</p>
				</div>

				<div class="p-4">
					<p class="font-mono text-[10px] uppercase mb-1" style="color: var(--text);">Impact Level</p>
					{#if node.blocking}
						<p class="font-body font-bold text-lg uppercase" style="color: var(--accent);">Critical Path</p>
					{:else}
						<p class="font-body font-bold text-lg" style="color: var(--ink);">Standard</p>
					{/if}
				</div>
			</div>
		</section>

		<!-- Step Position -->
		{#if stepIndex != null && totalSteps}
			<section>
				<h4 class="font-mono text-[11px] font-bold uppercase tracking-[0.2em] mb-4" style="color: var(--text);">Journey Position</h4>
				<div class="flex items-center gap-4">
					<span
						class="w-10 h-10 rounded-full flex items-center justify-center font-mono text-base font-bold"
						style="background: var(--ink); color: var(--newsprint);"
					>{stepIndex + 1}</span>
					<div>
						<p class="font-body text-sm font-medium" style="color: var(--ink);">Step {stepIndex + 1} of {totalSteps}</p>
						<p class="font-mono text-xs mt-0.5" style="color: var(--text);">
							{stepIndex === 0 ? 'First step in journey' : stepIndex === totalSteps - 1 ? 'Final step in journey' : 'Mid-journey step'}
						</p>
					</div>
				</div>
			</section>
		{/if}
	</div>
</aside>

<style>
	.panel-enter {
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}
</style>
