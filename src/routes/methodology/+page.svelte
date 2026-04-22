<script lang="ts">
	import { base } from '$app/paths';
	// Vite's default JSON plugin doesn't pre-transform files outside src/, so
	// import as raw text and parse. Keeps reference-data/MANIFEST.json as the
	// canonical source of truth without duplicating it into the app.
	import manifestRaw from '../../../reference-data/MANIFEST.json?raw';
	import releasesData from '$lib/data/releases.json';
	import type { Release } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const manifest = JSON.parse(manifestRaw) as {
		datasets: Array<{ name: string; description: string; url: string }>;
	};

	const releases = (releasesData as { releases: Release[] }).releases;

	const dateFmt = new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'UTC'
	});
	const formatReleaseDate = (iso: string) => dateFmt.format(new Date(iso + 'T00:00:00Z'));

	type SourceCard = { name: string; desc: string; url: string | null };

	const sourceCards: SourceCard[] = [
		...manifest.datasets.map((d) => ({ name: d.name, desc: d.description, url: d.url })),
		{
			name: 'Municipal Codes',
			desc: 'Common local permitting patterns for construction, land use, events',
			url: null
		}
	];

	const fmt = new Intl.NumberFormat('en-US');

	const heroCounters = $derived([
		{ value: data.stats.journeys, label: 'Journeys' },
		{ value: data.stats.nodes, label: 'PLC Types' },
		{ value: data.stats.edges.total, label: 'Dependency Edges' },
		{ value: data.stats.gotchas.total, label: 'Annotated Gotchas' },
		{ value: data.stats.references, label: 'Source Citations' }
	]);
</script>

<svelte:head>
	<title>Methodology – Permit & License Journey Explorer</title>
</svelte:head>

<!-- HERO -->
<section class="w-full px-6 md:px-16 py-20 md:py-32 relative overflow-hidden" style="background: var(--ink); color: var(--newsprint);">
	<div class="max-w-[1200px] mx-auto grid md:grid-cols-[1.25fr_1fr] gap-12 md:gap-16 items-start relative">
		<div class="relative z-10">
			<a href="{base}/" class="font-mono text-xs uppercase tracking-[2px] inline-block mb-12 md:mb-16 opacity-60 hover:opacity-100 transition-opacity" style="color: var(--newsprint);">
				&larr; Back to Explorer
			</a>
			<h1 class="font-display text-5xl md:text-7xl leading-[1.05] tracking-tight mb-6">
				How I Mapped<br>the User Journeys
			</h1>
			<p class="font-body text-lg md:text-xl leading-relaxed max-w-[600px] opacity-70 mb-4">
				Behind each journey is someone trying to start a business, build a home, or earn a living. These journey maps reflect the complexity and intertwined paths real humans have to navigate.
			</p>
			<p class="font-mono text-[10px] uppercase tracking-[2px] opacity-50 mb-12 md:mb-16">
				PLC &mdash; Permitting, Licensing &amp; Certification
			</p>
		</div>
		<!-- Abstract dataset schematic -->
		<div class="hidden md:block relative" aria-hidden="true" style="min-height: 280px;">
			<svg viewBox="0 0 360 280" class="w-full h-auto" style="opacity: 0.55;">
				<defs>
					<marker id="arrow-hero" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="4" markerHeight="4" orient="auto">
						<path d="M0,1 L7,4 L0,7" fill="none" stroke="var(--newsprint)" stroke-width="1" />
					</marker>
				</defs>
				<!-- Hard edges (solid) -->
				<path d="M 50,50 C 100,60 120,90 160,100" stroke="var(--newsprint)" stroke-width="1" fill="none" marker-end="url(#arrow-hero)" />
				<path d="M 50,120 C 100,110 130,110 160,100" stroke="var(--newsprint)" stroke-width="1" fill="none" marker-end="url(#arrow-hero)" />
				<path d="M 160,100 C 200,110 230,130 260,150" stroke="var(--newsprint)" stroke-width="1" fill="none" marker-end="url(#arrow-hero)" />
				<path d="M 160,100 C 210,95 245,90 290,80" stroke="var(--newsprint)" stroke-width="1" fill="none" marker-end="url(#arrow-hero)" />
				<path d="M 260,150 C 290,160 310,195 320,220" stroke="var(--newsprint)" stroke-width="1" fill="none" marker-end="url(#arrow-hero)" />
				<path d="M 50,200 C 100,200 130,180 160,180" stroke="var(--newsprint)" stroke-width="1" fill="none" marker-end="url(#arrow-hero)" />
				<path d="M 160,180 C 200,185 230,200 260,220" stroke="var(--newsprint)" stroke-width="1" fill="none" marker-end="url(#arrow-hero)" />
				<path d="M 50,50 C 80,80 80,160 110,240" stroke="var(--newsprint)" stroke-width="1" fill="none" marker-end="url(#arrow-hero)" />
				<path d="M 110,240 C 160,245 210,240 260,220" stroke="var(--newsprint)" stroke-width="1" fill="none" marker-end="url(#arrow-hero)" />
				<!-- Soft edges (dashed) -->
				<path d="M 50,120 C 100,150 130,180 160,180" stroke="var(--newsprint)" stroke-width="1" fill="none" stroke-dasharray="4 3" stroke-opacity="0.65" marker-end="url(#arrow-hero)" />
				<path d="M 160,100 C 190,130 220,160 260,150" stroke="var(--newsprint)" stroke-width="1" fill="none" stroke-dasharray="4 3" stroke-opacity="0.65" />
				<path d="M 290,80 C 310,120 315,160 320,220" stroke="var(--newsprint)" stroke-width="1" fill="none" stroke-dasharray="4 3" stroke-opacity="0.65" marker-end="url(#arrow-hero)" />
				<!-- Parallel edges (dotted) -->
				<path d="M 50,50 C 50,80 50,95 50,120" stroke="var(--newsprint)" stroke-width="1" fill="none" stroke-dasharray="1 3" stroke-opacity="0.45" />
				<path d="M 50,120 C 50,160 50,180 50,200" stroke="var(--newsprint)" stroke-width="1" fill="none" stroke-dasharray="1 3" stroke-opacity="0.45" />
				<path d="M 260,150 C 275,180 280,200 260,220" stroke="var(--newsprint)" stroke-width="1" fill="none" stroke-dasharray="1 3" stroke-opacity="0.45" />
				<!-- Nodes: federal (slate blue), state (sage), local (terracotta) -->
				<circle cx="50" cy="50" r="5" fill="var(--federal)" />
				<circle cx="50" cy="120" r="4" fill="var(--federal)" />
				<circle cx="50" cy="200" r="3" fill="var(--federal)" />
				<circle cx="160" cy="100" r="6" fill="var(--state)" />
				<circle cx="160" cy="180" r="4" fill="var(--state)" />
				<circle cx="220" cy="50" r="3" fill="var(--state)" />
				<circle cx="290" cy="80" r="4" fill="var(--state)" />
				<circle cx="260" cy="150" r="5" fill="var(--local)" />
				<circle cx="260" cy="220" r="5" fill="var(--local)" />
				<circle cx="110" cy="240" r="3" fill="var(--local)" />
				<circle cx="320" cy="220" r="6" fill="var(--local)" />
				<circle cx="200" cy="240" r="3" fill="var(--local)" />
			</svg>
		</div>
	</div>
	<div class="max-w-[1200px] mx-auto relative z-10">
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-10 pt-8 md:pt-12 border-t" style="border-color: rgba(244,243,240,0.15);">
			{#each heroCounters as counter}
				<div>
					<span class="font-mono text-4xl md:text-5xl font-bold block leading-none">{fmt.format(counter.value)}</span>
					<span class="font-mono text-[10px] uppercase tracking-[2px] mt-2 block opacity-50">{counter.label}</span>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- DEPENDENCY ORDERING -->
<section class="w-full px-6 md:px-16 py-16 md:py-24" style="background: var(--newsprint);">
	<div class="max-w-[1200px] mx-auto">
		<div class="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
			<!-- Visual: step sequence -->
			<div class="flex flex-col items-start gap-0">
				{#each [
					{ label: 'Entity Formation', color: 'var(--state)', sub: 'Business Registration, EIN' },
					{ label: 'Licenses & Permits', color: 'var(--federal)', sub: 'Professional, Industry, Federal' },
					{ label: 'Zoning & Land Use', color: 'var(--local)', sub: 'Zoning Approval, Special Use' },
					{ label: 'Build & Inspect', color: 'var(--local)', sub: 'Building Permit, Fire, Health' },
					{ label: 'Open for Business', color: 'var(--accent)', sub: 'Business License, Signage' }
				] as step, i}
					<div class="flex items-center gap-4">
						<div class="w-10 h-10 flex items-center justify-center font-mono text-sm font-bold shrink-0" style="background: {step.color}; color: var(--newsprint);">
							{i + 1}
						</div>
						<div>
							<span class="font-body text-sm font-semibold" style="color: var(--ink);">{step.label}</span>
							<span class="font-mono text-[10px] block mt-0.5" style="color: var(--text);">{step.sub}</span>
						</div>
					</div>
					{#if i < 4}
						<div class="w-10 flex justify-center">
							<div class="w-px h-6" style="background: var(--muted);"></div>
						</div>
					{/if}
				{/each}
			</div>
			<!-- Text -->
			<div>
				<span class="font-mono text-[10px] uppercase tracking-[2px] block mb-4" style="color: var(--text);">Ordering Principle</span>
				<h2 class="font-display text-3xl md:text-4xl leading-[1.1] tracking-tight mb-6" style="color: var(--ink);">
					Dependency, not jurisdiction
				</h2>
				<p class="font-body text-base leading-relaxed mb-4" style="color: var(--text);">
					Steps are ordered by when they happen in practice. You form your business entity before you apply for a liquor license. You get zoning approval before you pull a building permit. You pass your fire inspection before you receive a certificate of occupancy.
				</p>
				<p class="font-body text-base leading-relaxed" style="color: var(--text);">
					Steps are sequenced by dependency. Each one unlocks the next, regardless of which level of government issued it.
				</p>
			</div>
		</div>

		<!-- Edge-type taxonomy -->
		<div class="mt-16 md:mt-20 pt-8" style="border-top: 1px solid var(--muted);">
			<span class="font-mono text-[10px] uppercase tracking-[2px] block mb-4" style="color: var(--text);">Edge Types</span>
			<h3 class="font-display text-2xl md:text-3xl leading-tight tracking-tight mb-8" style="color: var(--ink);">
				Three kinds of dependency
			</h3>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-0" style="border: 1px solid var(--ink);">
				{#each [
					{ name: 'Hard', count: data.stats.edges.hard, desc: 'Technically blocks the next step. You cannot legally or physically proceed without it.', stroke: 'var(--ink)', dash: '0', opacity: 1 },
					{ name: 'Soft', count: data.stats.edges.soft, desc: 'Conventionally sequential but not required. Skipping adds risk, not a wall.', stroke: 'var(--text)', dash: '6 4', opacity: 1 },
					{ name: 'Parallel', count: data.stats.edges.parallel, desc: 'Can run concurrently with another step. Order does not matter.', stroke: 'var(--muted)', dash: '2 3', opacity: 1 }
				] as edge, i}
					<div class="p-6 flex flex-col gap-3" style="background: var(--surface); {i < 2 ? 'border-right: 1px solid var(--muted);' : ''}">
						<div class="flex items-baseline justify-between">
							<span class="font-display text-xl font-semibold" style="color: var(--ink);">{edge.name}</span>
							<span class="font-mono text-2xl font-bold" style="color: var(--ink);">{fmt.format(edge.count)}</span>
						</div>
						<svg width="100%" height="14" viewBox="0 0 140 14" aria-hidden="true">
							<path d="M 2 7 L 138 7" stroke={edge.stroke} stroke-width="1.5" fill="none" stroke-dasharray={edge.dash} />
						</svg>
						<p class="font-body text-sm leading-relaxed" style="color: var(--text);">{edge.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- FOUR PHASES -->
<section class="w-full px-6 md:px-16 py-16 md:py-24" style="background: var(--surface); border-top: 1px solid var(--muted); border-bottom: 1px solid var(--muted);">
	<div class="max-w-[1200px] mx-auto">
		<span class="font-mono text-[10px] uppercase tracking-[2px] block mb-4" style="color: var(--text);">Journey Structure</span>
		<h2 class="font-display text-3xl md:text-4xl leading-[1.1] tracking-tight mb-12" style="color: var(--ink);">
			Four phases of every journey
		</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0" style="border: 1px solid var(--ink);">
			{#each [
				{ num: '01', name: 'Preparation', desc: 'Entity formation, tax registration, insurance', examples: ['Business Registration', 'EIN Registration', 'State Tax Registration'] },
				{ num: '02', name: 'Application', desc: 'Formal permits and professional credentials', examples: ['Health Dept License', 'Liquor License', 'Contractor License'] },
				{ num: '03', name: 'Inspection', desc: 'Physical compliance and site approvals', examples: ['Zoning Approval', 'Building Permit', 'Fire Inspection'] },
				{ num: '04', name: 'Active', desc: 'Operational licenses and ongoing obligations', examples: ['Business License', 'Signage Permit', 'Entertainment License'] }
			] as phase, i}
				<div class="p-6 flex flex-col" style="{i < 3 ? 'border-right: 1px solid var(--muted);' : ''} border-bottom: 1px solid var(--muted);">
					<span class="font-mono text-4xl font-bold block mb-1" style="color: var(--muted);">{phase.num}</span>
					<span class="font-display text-xl font-semibold block mb-2" style="color: var(--ink);">{phase.name}</span>
					<p class="font-body text-sm leading-relaxed mb-5" style="color: var(--text);">{phase.desc}</p>
					<div class="flex flex-col gap-2 mt-auto">
						{#each phase.examples as ex}
							<div class="px-3 py-2 font-mono text-[11px]" style="border: 1px solid var(--muted); color: var(--ink);">
								{ex}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- RECURRING OBLIGATIONS -->
<section class="w-full px-6 md:px-16 py-16 md:py-24" style="background: var(--newsprint);">
	<div class="max-w-[1200px] mx-auto">
		<div class="mb-10" style="border-left: 4px solid var(--accent); padding-left: 2rem;">
			<span class="font-mono text-[10px] uppercase tracking-[2px] block mb-4" style="color: var(--accent);">Ongoing</span>
			<h2 class="font-display text-3xl md:text-4xl leading-[1.1] tracking-tight mb-6" style="color: var(--ink);">
				Not every step is one-and-done
			</h2>
			<p class="font-body text-base leading-relaxed max-w-[720px]" style="color: var(--text);">
				Many permits and licenses must be renewed on a regular cycle. These steps are marked with a renewal indicator in the matrix. They appear at the point in the journey where they are first established, but they continue for as long as the business or license is active.
			</p>
		</div>
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
			{#each [
				{ term: 'Annual', examples: 'Business License, Fire Inspection' },
				{ term: 'Every 2 Years', examples: 'Liquor License, Professional License' },
				{ term: 'Every 5 Years', examples: 'EPA Permit, Mining Permit' },
				{ term: 'Biennial', examples: 'FDA Registration, DOT Authority' }
			] as item}
				<div class="px-4 py-3" style="border: 1px solid var(--ink);">
					<div class="flex items-center gap-2 mb-1">
						<span class="font-body text-base font-semibold" style="color: var(--ink);">&#8635; {item.term}</span>
					</div>
					<span class="font-mono text-[10px]" style="color: var(--text);">{item.examples}</span>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- GOTCHAS -->
<section class="w-full px-6 md:px-16 py-16 md:py-24" style="background: var(--surface); border-top: 1px solid var(--muted); border-bottom: 1px solid var(--muted);">
	<div class="max-w-[1200px] mx-auto">
		<span class="font-mono text-[10px] uppercase tracking-[2px] block mb-4" style="color: var(--text);">Annotations</span>
		<h2 class="font-display text-3xl md:text-4xl leading-[1.1] tracking-tight mb-6" style="color: var(--ink);">
			Where journeys get stuck
		</h2>
		<p class="font-body text-base leading-relaxed max-w-[720px] mb-10" style="color: var(--text);">
			Each journey includes two to four annotated gotchas — concrete friction points where applicants commonly stall, get rejected, or hit unexpected requirements. Every gotcha is tied to a specific step and backed by a source.
		</p>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-0 mb-12" style="border: 1px solid var(--ink);">
			{#each [
				{ value: data.stats.gotchas.total, label: 'Total Gotchas', color: 'var(--ink)' },
				{ value: data.stats.gotchas.major, label: 'Major · multi-week delays', color: 'var(--severity-major)' },
				{ value: data.stats.gotchas.minor, label: 'Minor · hassle, rarely blocks', color: 'var(--text)' }
			] as stat, i}
				<div class="p-6" style="{i < 2 ? 'border-right: 1px solid var(--muted);' : ''}">
					<span class="font-mono text-4xl md:text-5xl font-bold block leading-none" style="color: {stat.color};">{fmt.format(stat.value)}</span>
					<span class="font-mono text-[10px] uppercase tracking-[2px] mt-3 block" style="color: var(--text);">{stat.label}</span>
				</div>
			{/each}
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			{#each data.sampleGotchas as sample (sample.journey + sample.nodeName)}
				<div class="p-5" style="background: var(--newsprint); border-left: 4px solid var(--severity-major);">
					<span class="font-mono text-[10px] font-bold uppercase tracking-[0.1em]" style="color: var(--severity-major);">Major</span>
					<p class="font-mono text-[11px] uppercase tracking-wider mt-3" style="color: var(--text);">
						{sample.journey} &rarr; {sample.nodeName}
					</p>
					<p class="font-body text-sm leading-relaxed mt-2" style="color: var(--ink);">{sample.note}</p>
					{#if sample.source?.url}
						<a
							href={sample.source.url}
							target="_blank"
							rel="noopener noreferrer"
							class="font-mono text-[10px] uppercase tracking-[0.05em] mt-3 inline-flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
							style="color: var(--text);"
						>
							<span>Source: {sample.source.title}</span>
							<svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
								<path d="M4 1H1v10h10V8M7 1h4v4M11 1L5 7" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</a>
					{/if}
				</div>
			{/each}
		</div>

		<p class="font-body text-sm italic mt-8 max-w-[720px]" style="color: var(--text);">
			Major gotchas commonly cost weeks. Minor gotchas are hassle, not blockers. Tap any step in a journey to see its gotchas in context.
		</p>
	</div>
</section>

<!-- CITATIONS -->
<section class="w-full px-6 md:px-16 py-16 md:py-24" style="background: var(--newsprint);">
	<div class="max-w-[1200px] mx-auto">
		<span class="font-mono text-[10px] uppercase tracking-[2px] block mb-4" style="color: var(--text);">Citations</span>
		<h2 class="font-display text-3xl md:text-4xl leading-[1.1] tracking-tight mb-6" style="color: var(--ink);">
			Every step traces back to an authority
		</h2>
		<p class="font-body text-base leading-relaxed max-w-[720px] mb-10" style="color: var(--text);">
			Citations exist at three layers — every PLC type has one, every gotcha has its own, and every journey carries three to six broad references grouped by type.
		</p>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-0 mb-12" style="border: 1px solid var(--ink); background: var(--surface);">
			{#each [
				{ count: data.stats.nodes, label: 'Node Sources', desc: 'One authoritative reference per PLC type (IRS for EIN, FDA for food registration, ICC for building permits). Visible on every step of every journey.' },
				{ count: data.stats.gotchas.total, label: 'Gotcha Sources', desc: 'Each friction point cites the regulation, statute, or guide that documents it.' },
				{ count: data.stats.references, label: 'Journey References', desc: 'Three to six per journey, grouped as regulatory / guide / dataset, surfaced in the Sources panel beneath each matrix.' }
			] as layer, i}
				<div class="p-6 flex flex-col gap-3" style="{i < 2 ? 'border-right: 1px solid var(--muted);' : ''}">
					<div class="flex items-baseline gap-3">
						<span class="font-mono text-3xl md:text-4xl font-bold leading-none" style="color: var(--ink);">{fmt.format(layer.count)}</span>
						<span class="font-display text-base font-semibold" style="color: var(--ink);">{layer.label}</span>
					</div>
					<p class="font-body text-sm leading-relaxed" style="color: var(--text);">{layer.desc}</p>
				</div>
			{/each}
		</div>

		<div>
			<span class="font-mono text-[10px] uppercase tracking-[2px] block mb-4" style="color: var(--text);">Most-cited domains</span>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0" style="border: 1px solid var(--muted); background: var(--surface);">
				{#each data.topDomains as { host, count }, i (host)}
					{@const colIdx = i % 3}
					<a
						href="https://{host}"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-baseline justify-between gap-3 px-4 py-3 hover:bg-[var(--newsprint)] transition-colors"
						style="{colIdx < 2 ? 'border-right: 1px solid var(--muted);' : ''} border-bottom: 1px solid var(--muted);"
					>
						<span class="font-mono text-sm truncate" style="color: var(--ink);">{host}</span>
						<span class="font-mono text-xs font-bold shrink-0" style="color: var(--text);">{count}</span>
					</a>
				{/each}
			</div>
		</div>

		<p class="font-body text-sm italic mt-6 max-w-[720px]" style="color: var(--text);">
			Full citations surface in context inside each journey — tap a step to see its source, or expand the Sources panel below the matrix for journey-level references.
		</p>
	</div>
</section>

<!-- SOURCES -->
<section class="w-full px-6 md:px-16 py-16 md:py-24" style="background: var(--surface); border-top: 1px solid var(--muted); border-bottom: 1px solid var(--muted);">
	<div class="max-w-[1200px] mx-auto">
		<span class="font-mono text-[10px] uppercase tracking-[2px] block mb-4" style="color: var(--text);">Research</span>
		<h2 class="font-display text-3xl md:text-4xl leading-[1.1] tracking-tight mb-12" style="color: var(--ink);">
			Sources
		</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each sourceCards as source (source.name)}
				<div class="p-4" style="border: 1px solid var(--muted);">
					{#if source.url}
						<a
							href={source.url}
							target="_blank"
							rel="noopener noreferrer"
							class="font-mono text-xs font-bold mb-1 inline-flex items-center gap-1.5 underline decoration-1 underline-offset-2 hover:opacity-70 transition-opacity"
							style="color: var(--ink);"
						>
							<span>{source.name}</span>
							<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
								<path d="M4 1H1v10h10V8M7 1h4v4M11 1L5 7" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</a>
					{:else}
						<span class="font-mono text-xs font-bold block mb-1" style="color: var(--ink);">{source.name}</span>
					{/if}
					<span class="font-body text-sm block mt-1" style="color: var(--text);">{source.desc}</span>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- WHAT THIS IS / IS NOT -->
<section class="w-full px-6 md:px-16 py-16 md:py-24" style="background: var(--newsprint);">
	<div class="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-0" style="border: 1px solid var(--ink);">
		<!-- IS -->
		<div class="p-8 md:p-12" style="border-right: 1px solid var(--muted);">
			<span class="font-mono text-[10px] uppercase tracking-[2px] block mb-6" style="color: var(--state);">What this is</span>
			<ul class="space-y-4">
				{#each [
					'A representative model of how PLC requirements distribute across jurisdiction levels',
					'Ordered by real-world dependency chains, not bureaucratic hierarchy',
					'Annotated with real-world friction points, each backed by a source citation',
					'Every step sourced to a government, industry, or standards body reference',
					'An abstraction useful for stakeholder presentations and system design',
					'Directionally accurate for any US jurisdiction'
				] as item}
					<li class="flex gap-3">
						<span class="font-mono text-sm font-bold shrink-0 mt-0.5" style="color: var(--state);">+</span>
						<span class="font-body text-sm leading-relaxed" style="color: var(--text);">{item}</span>
					</li>
				{/each}
			</ul>
		</div>
		<!-- IS NOT -->
		<div class="p-8 md:p-12">
			<span class="font-mono text-[10px] uppercase tracking-[2px] block mb-6" style="color: var(--accent);">What this is not</span>
			<ul class="space-y-4">
				{#each [
					'A legal compliance guide for any specific jurisdiction',
					'Exhaustive — real jurisdictions have many additional niche permits',
					'Validated against a specific state or city\'s actual requirements',
					'A substitute for consulting your local permitting office'
				] as item}
					<li class="flex gap-3">
						<span class="font-mono text-sm font-bold shrink-0 mt-0.5" style="color: var(--accent);">&ndash;</span>
						<span class="font-body text-sm leading-relaxed" style="color: var(--text);">{item}</span>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</section>

<!-- WHAT'S NEW -->
<section id="whats-new" class="w-full px-6 md:px-16 py-16 md:py-24" style="background: var(--surface); border-top: 1px solid var(--muted); border-bottom: 1px solid var(--muted);">
	<div class="max-w-[1200px] mx-auto">
		<span class="font-mono text-[10px] uppercase tracking-[2px] block mb-4" style="color: var(--text);">Release history</span>
		<h2 class="font-display text-3xl md:text-4xl leading-[1.1] tracking-tight mb-12" style="color: var(--ink);">
			What's new
		</h2>
		<div class="flex flex-col gap-4">
			{#each releases as release (release.version)}
				<article class="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6 md:gap-10 p-6 md:p-8" style="border: 1px solid var(--muted); background: var(--newsprint);">
					<div class="flex md:flex-col gap-3 md:gap-1 items-baseline md:items-start">
						<span class="font-mono text-2xl md:text-3xl font-bold leading-none" style="color: var(--ink);">v{release.version}</span>
						<span class="font-mono text-[10px] uppercase tracking-[2px]" style="color: var(--text);">{formatReleaseDate(release.date)}</span>
					</div>
					<div>
						<h3 class="font-display text-xl md:text-2xl font-semibold mb-3" style="color: var(--ink);">{release.title}</h3>
						<p class="font-body text-base leading-relaxed mb-5" style="color: var(--text);">{release.lead}</p>
						<ul class="space-y-3">
							{#each release.changes as change (change.title)}
								<li class="flex gap-3">
									<span class="font-mono text-sm font-bold shrink-0 mt-0.5" style="color: var(--state);">+</span>
									<span class="font-body text-sm leading-relaxed" style="color: var(--text);">
										<strong style="color: var(--ink);">{change.title}</strong>
										{change.body}
									</span>
								</li>
							{/each}
						</ul>
					</div>
				</article>
			{/each}
		</div>
	</div>
</section>
