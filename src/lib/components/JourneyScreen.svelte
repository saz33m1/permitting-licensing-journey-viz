<script lang="ts">
	import { goto } from '$app/navigation';
	import { app } from '$lib/stores/app.svelte';
	import MatrixGrid from './MatrixGrid.svelte';
	import NodeDetailPanel from './NodeDetailPanel.svelte';

	const journey = $derived(app.activeJourney);
	const catLabel = $derived(journey ? (app.catName[journey.cat] ?? journey.cat) : '');

	const selectedNodeObj = $derived(app.selectedNode ? app.nodeMap[app.selectedNode] : null);
	const selectedStepIndex = $derived(
		app.selectedNode && journey ? journey.steps.indexOf(app.selectedNode) : -1
	);

	let searchValue = $state('');
	let showDropdown = $state(false);
	let highlightIndex = $state(-1);
	let blurTimeout: ReturnType<typeof setTimeout>;

	const matches = $derived(() => {
		const q = searchValue.trim().toLowerCase();
		if (!q) return [];
		return app.journeys
			.filter(j => j.id !== journey?.id && j.name.toLowerCase().includes(q))
			.slice(0, 8);
	});

	function navigateTo(id: string) {
		searchValue = '';
		showDropdown = false;
		highlightIndex = -1;
		goto('/journey/' + id);
	}

	function handleSearchKeydown(e: KeyboardEvent) {
		const list = matches();
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			highlightIndex = Math.min(highlightIndex + 1, list.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			highlightIndex = Math.max(highlightIndex - 1, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (highlightIndex >= 0 && highlightIndex < list.length) {
				navigateTo(list[highlightIndex].id);
			} else if (list.length > 0) {
				navigateTo(list[0].id);
			}
		} else if (e.key === 'Escape') {
			showDropdown = false;
			highlightIndex = -1;
		}
	}

	function handleSearchInput() {
		showDropdown = searchValue.trim().length > 0;
		highlightIndex = -1;
	}

	function handleSearchFocus() {
		clearTimeout(blurTimeout);
		if (searchValue.trim()) showDropdown = true;
	}

	function handleSearchBlur() {
		blurTimeout = setTimeout(() => { showDropdown = false; }, 150);
	}
</script>

{#if journey}
	<div class="min-h-screen flex flex-col" style="background: var(--newsprint);">
		<!-- Journey Header -->
		<div class="px-8 py-4 flex items-start justify-between gap-6" style="border-bottom: 1px solid var(--muted);">
			<div class="shrink-0">
				<a href="/" class="font-mono text-xs tracking-[1.5px] uppercase no-underline hover:underline" style="color: var(--text);">
						Permit & License Journey Explorer
					</a>
				<h1 class="font-display text-3xl lg:text-4xl font-bold leading-tight mt-1" style="color: var(--ink);">
					{journey.name}
				</h1>
			</div>
			<div class="flex items-center gap-4 shrink-0 pt-1">
				<!-- Search Autocomplete -->
				<div class="relative">
					<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style="color: var(--text);" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
					</svg>
					<input
						type="text"
						placeholder="Search journeys..."
						class="w-56 pl-9 pr-3 py-1.5 font-mono text-xs"
						style="border: 1px solid var(--ink); background: #fff; color: var(--ink); outline: none;"
						bind:value={searchValue}
						onkeydown={handleSearchKeydown}
						oninput={handleSearchInput}
						onfocus={handleSearchFocus}
						onblur={handleSearchBlur}
						autocomplete="off"
					/>
					{#if showDropdown && matches().length > 0}
						<ul class="absolute top-full left-0 w-72 mt-1 py-1 z-50 max-h-64 overflow-y-auto"
							style="background: var(--surface); border: 1px solid var(--ink); box-shadow: 0 4px 12px rgba(0,0,0,.12);">
							{#each matches() as match, i}
								<li>
									<button
										class="w-full text-left px-3 py-2 font-mono text-xs cursor-pointer transition-colors"
										style="background: {i === highlightIndex ? 'var(--ink)' : 'transparent'}; color: {i === highlightIndex ? 'var(--surface)' : 'var(--ink)'};"
										onmousedown={() => navigateTo(match.id)}
										onmouseenter={() => highlightIndex = i}
									>
										{match.name}
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
				<!-- View Toggle -->
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
