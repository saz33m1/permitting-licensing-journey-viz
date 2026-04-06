<script lang="ts">
	import { goto } from '$app/navigation';
	import { app } from '$lib/stores/app.svelte';
</script>

<header class="w-full px-8 flex items-center justify-between py-4" style="border-bottom: 1px solid var(--ink);">
	<div class="flex items-center gap-3">
		<button
			class="font-mono text-xs uppercase tracking-[1.5px] flex items-center gap-2 cursor-pointer"
			style="color: var(--text);"
			onclick={() => goto('/')}
		>
			<span style="color: var(--accent);">←</span>
			Back
		</button>
		<span style="color: var(--muted);">|</span>
		<h2 class="font-display text-lg font-medium" style="color: var(--ink);">Permit & License Journey Explorer</h2>
	</div>
	<div class="flex items-center">
		<div class="flex h-8 items-center" style="border: 1px solid var(--ink);">
			<label
				class="flex cursor-pointer h-full items-center justify-center px-4 font-mono text-xs font-medium transition-colors"
				style="background: {app.viewMode === 'standard' ? 'var(--ink)' : 'transparent'}; color: {app.viewMode === 'standard' ? 'var(--surface)' : 'var(--ink)'};"
			>
				<span>Standard View</span>
				<input class="invisible w-0" type="radio" name="view-toggle" value="standard" checked={app.viewMode === 'standard'} onchange={() => app.viewMode = 'standard'}>
			</label>
			<label
				class="flex cursor-pointer h-full items-center justify-center px-4 font-mono text-xs font-medium transition-colors"
				style="background: {app.viewMode === 'dependency' ? 'var(--ink)' : 'transparent'}; color: {app.viewMode === 'dependency' ? 'var(--surface)' : 'var(--ink)'};"
			>
				<span>Dependency View</span>
				<input class="invisible w-0" type="radio" name="view-toggle" value="dependency" checked={app.viewMode === 'dependency'} onchange={() => app.viewMode = 'dependency'}>
			</label>
		</div>
	</div>
</header>
