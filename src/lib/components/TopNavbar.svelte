<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { app } from '$lib/stores/app.svelte';

	let searchValue = $state('');

	function handleSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && searchValue.trim()) {
			app.filterSearch = searchValue.trim();
			goto(`${base}/`);
		}
	}
</script>

<header class="w-full px-8 flex items-center justify-between py-4 gap-4" style="border-bottom: 1px solid var(--ink);">
	<div class="flex items-center gap-3 shrink-0">
		<button
			class="font-mono text-xs uppercase tracking-[1.5px] flex items-center gap-2 cursor-pointer"
			style="color: var(--text);"
			onclick={() => goto(`${base}/`)}
		>
			<span style="color: var(--accent);">←</span>
			Back
		</button>
	</div>
	<div class="relative flex-1 max-w-sm">
		<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style="color: var(--text);" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
			<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
		</svg>
		<input
			type="text"
			placeholder="Search journeys..."
			class="w-full pl-9 pr-3 py-1.5 font-mono text-xs"
			style="border: 1px solid var(--ink); background: #fff; color: var(--ink); outline: none;"
			bind:value={searchValue}
			onkeydown={handleSearchKeydown}
		/>
	</div>
	<div class="flex items-center shrink-0">
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
