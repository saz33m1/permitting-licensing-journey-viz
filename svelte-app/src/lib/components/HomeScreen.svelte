<script lang="ts">
	import { app, JC } from '$lib/stores/app.svelte';
	import JourneyRow from './JourneyRow.svelte';

	function toggleJurisdiction(jur: string) {
		if (app.filterJurisdictions.includes(jur)) {
			app.filterJurisdictions = app.filterJurisdictions.filter(j => j !== jur);
		} else {
			app.filterJurisdictions = [...app.filterJurisdictions, jur];
		}
	}

	function toggleCategory(cat: string) {
		if (app.filterCategories.includes(cat)) {
			app.filterCategories = app.filterCategories.filter(c => c !== cat);
		} else {
			app.filterCategories = [...app.filterCategories, cat];
		}
	}

	function clearFilters() {
		app.filterJurisdictions = [];
		app.filterCategories = [];
		app.filterSearch = '';
	}

	const filtered = $derived(app.filteredJourneys);
	const hasFilters = $derived(app.filterJurisdictions.length > 0 || app.filterCategories.length > 0 || app.filterSearch.length > 0);
</script>

<div class="h-screen overflow-hidden flex flex-col md:flex-row" style="background: var(--newsprint);">
	<!-- Left Column: Context + Filters -->
	<div class="w-full md:w-2/5 h-auto md:h-screen p-8 md:p-12 lg:p-16 flex flex-col justify-between shrink-0" style="border-right: 1px solid var(--muted);">
		<div class="space-y-8 max-w-md">
			<h1 class="font-display text-4xl lg:text-5xl leading-[1.1] tracking-tight" style="color: var(--ink);">
				Constituent Journey Visualizer
			</h1>
			<p class="font-body text-base leading-relaxed" style="color: var(--text);">
				An interactive, editorial-grade dashboard mapping the labyrinthine processes of government permitting and licensing. It reveals the hidden interdependencies between federal, state, and local requirements, turning bureaucratic friction into a clear, navigable chronological grid.
			</p>

			<!-- Filter Panel -->
			<div class="space-y-5 pt-2">
				<!-- By Jurisdiction -->
				<div>
					<h3 class="font-mono text-[10px] uppercase tracking-[2px] mb-3" style="color: var(--text);">By Jurisdiction</h3>
					<div class="flex flex-wrap gap-2">
						{#each [['federal', 'Federal'], ['state', 'State'], ['local', 'Local']] as [id, label]}
							<button
								class="px-3 py-1.5 font-mono text-[11px] tracking-wide transition-colors"
								style="border: 1px solid {app.filterJurisdictions.includes(id) ? 'var(--ink)' : 'var(--muted)'}; background: {app.filterJurisdictions.includes(id) ? 'var(--ink)' : 'transparent'}; color: {app.filterJurisdictions.includes(id) ? 'var(--surface)' : 'var(--text)'};"
								onclick={() => toggleJurisdiction(id)}
							>
								{label}
							</button>
						{/each}
					</div>
				</div>

				<!-- By Category -->
				<div>
					<h3 class="font-mono text-[10px] uppercase tracking-[2px] mb-3" style="color: var(--text);">By Category</h3>
					<div class="flex flex-wrap gap-1.5">
						{#each app.categories as cat}
							<button
								class="px-2.5 py-1 font-mono text-[10px] tracking-wide transition-colors"
								style="border: 1px solid {app.filterCategories.includes(cat.id) ? 'var(--ink)' : 'var(--muted)'}; background: {app.filterCategories.includes(cat.id) ? 'var(--ink)' : 'transparent'}; color: {app.filterCategories.includes(cat.id) ? 'var(--surface)' : 'var(--text)'};"
								onclick={() => toggleCategory(cat.id)}
							>
								{cat.name}
							</button>
						{/each}
					</div>
				</div>

				<!-- Search -->
				<div class="relative">
					<input
						type="text"
						placeholder="Search journeys..."
						class="w-full px-3 py-2 font-mono text-xs"
						style="border: 1px solid var(--muted); background: transparent; color: var(--ink); outline: none;"
						bind:value={app.filterSearch}
					/>
				</div>

				{#if hasFilters}
					<button
						class="font-mono text-[10px] uppercase tracking-[1.5px] underline cursor-pointer"
						style="color: var(--accent);"
						onclick={clearFilters}
					>
						Clear all filters
					</button>
				{/if}
			</div>
		</div>

		<div class="hidden md:block mt-8">
			<p class="font-mono text-xs uppercase tracking-[2px]" style="color: var(--text);">
				Select a journey to begin tracing
			</p>
		</div>
	</div>

	<!-- Right Column: Journey List -->
	<div class="w-full md:w-3/5 h-full relative flex flex-col" style="background: var(--newsprint);">
		<!-- Sticky Header -->
		<div class="sticky top-0 z-10 w-full px-8 py-4 flex justify-between items-center" style="background: rgba(244,243,240,.95); backdrop-filter: blur(8px); border-bottom: 1px solid var(--muted);">
			<div class="font-mono text-xs tracking-wider" style="color: var(--text);">
				{#if hasFilters}
					<span class="font-medium" style="color: var(--accent);">{filtered.length}</span>
					<span> of </span>
				{/if}
				<span class="font-medium" style="color: var(--ink);">{app.journeys.length}</span>
				<span class="uppercase tracking-[1.5px] ml-1">Journeys</span>
			</div>
		</div>

		<!-- Scrolling List -->
		<div class="flex-1 overflow-y-auto hide-scrollbar pb-24">
			{#each filtered as journey (journey.id)}
				<JourneyRow {journey} />
			{/each}
			{#if filtered.length === 0}
				<div class="px-8 py-16 text-center">
					<p class="font-mono text-sm" style="color: var(--text);">No journeys match the current filters.</p>
				</div>
			{/if}
		</div>
	</div>
</div>
