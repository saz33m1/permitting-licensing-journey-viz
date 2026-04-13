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

<div class="flex-1 overflow-hidden flex flex-col md:flex-row" style="background: var(--newsprint);">
	<!-- Left Column: Context + Filters -->
	<div class="w-full md:w-2/5 h-auto md:h-screen p-8 md:p-12 lg:p-16 flex flex-col shrink-0 overflow-y-auto" style="border-right: 1px solid var(--muted);">
		<div class="space-y-8 max-w-md">
			<h1 class="font-display text-4xl lg:text-5xl leading-[1.1] tracking-tight" style="color: var(--ink);">
				Permit & License Journey Explorer
			</h1>
			<p class="font-body text-base leading-relaxed" style="color: var(--text);">
				Starting a business, becoming licensed in a profession or building an addition to your home. Each one requires permits and licenses from multiple levels of government. These journeys map out what that process actually looks like for the people going through it. The steps are illustrative, but the complexity they represent is not.
			</p>
			<div class="space-y-2">
				<a href="/methodology" class="font-mono text-xs uppercase tracking-[1.5px] underline hover:no-underline block" style="color: var(--text);">
					How we mapped these journeys &rarr;
				</a>
				<p class="font-mono text-xs leading-relaxed" style="color: var(--text);">
					Part of <a href="https://github.com/saz33m1" target="_blank" rel="noopener noreferrer" class="font-bold no-underline hover:underline" style="color: var(--ink);">Catalyst</a> &mdash; an open-source Permitting &amp; Licensing platform for state and local governments.
				</p>
			</div>

			<!-- Filter Panel -->
			<div class="space-y-5 pt-2">
				<!-- Search -->
				<div class="relative">
					<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style="color: var(--text);" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
					</svg>
					<input
						type="text"
						placeholder="Search journeys..."
						class="w-full pl-10 pr-3 py-2.5 font-mono text-xs"
						style="border: 1px solid var(--ink); background: #fff; color: var(--ink); outline: none;"
						bind:value={app.filterSearch}
					/>
				</div>

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
				<span class="ml-1 opacity-40">|</span>
				<span class="ml-1 uppercase tracking-[1.5px]">Select a journey to begin tracing</span>
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
