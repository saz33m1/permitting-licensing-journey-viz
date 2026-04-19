<script lang="ts">
	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>Methodology – Permit & License Journey Explorer</title>
</svelte:head>

<!-- HERO -->
<section class="w-full px-6 md:px-16 py-20 md:py-32" style="background: var(--ink); color: var(--newsprint);">
	<div class="max-w-[1200px] mx-auto">
		<a href="{base}/" class="font-mono text-xs uppercase tracking-[2px] inline-block mb-16 opacity-60 hover:opacity-100 transition-opacity" style="color: var(--newsprint);">
			&larr; Back to Explorer
		</a>
		<h1 class="font-display text-5xl md:text-7xl leading-[1.05] tracking-tight mb-6">
			How I Mapped<br>the User Journeys
		</h1>
		<p class="font-body text-lg md:text-xl leading-relaxed max-w-[600px] opacity-70 mb-16">
			Behind each journey is someone trying to start a business, build a home, or earn a living. These journey maps reflect the complexity and intertwined paths real humans have to navigate.
		</p>
		<div class="grid grid-cols-3 gap-8 md:gap-16 max-w-[700px]">
			<div>
				<span class="font-mono text-5xl md:text-6xl font-bold block leading-none">114</span>
				<span class="font-mono text-[10px] uppercase tracking-[2px] mt-2 block opacity-50">Journeys</span>
			</div>
			<div>
				<span class="font-mono text-5xl md:text-6xl font-bold block leading-none">61</span>
				<span class="font-mono text-[10px] uppercase tracking-[2px] mt-2 block opacity-50">PLC Types</span>
			</div>
			<div>
				<span class="font-mono text-5xl md:text-6xl font-bold block leading-none">3</span>
				<span class="font-mono text-[10px] uppercase tracking-[2px] mt-2 block opacity-50">Levels of Govt</span>
			</div>
		</div>
	</div>
</section>

<!-- DEPENDENCY CHAIN -->
<section class="w-full px-6 md:px-16 py-16 md:py-24" style="background: var(--newsprint);">
	<div class="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
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

<!-- SOURCES -->
<section class="w-full px-6 md:px-16 py-16 md:py-24" style="background: var(--surface); border-top: 1px solid var(--muted); border-bottom: 1px solid var(--muted);">
	<div class="max-w-[1200px] mx-auto">
		<span class="font-mono text-[10px] uppercase tracking-[2px] block mb-4" style="color: var(--text);">Research</span>
		<h2 class="font-display text-3xl md:text-4xl leading-[1.1] tracking-tight mb-12" style="color: var(--ink);">
			Sources
		</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each [
				{ name: 'SBA.gov', desc: 'Federal business formation guide and 10-step startup sequence' },
				{ name: 'New Jersey Business Navigator', desc: 'Open-source NAICS-based business formation framework' },
				{ name: 'Maryland PLC Data Catalog', desc: '1,100+ permit, license, and compliance types with operational metadata' },
				{ name: 'DOL License Finder', desc: 'Federal database of licensing requirements across all states' },
				{ name: 'NCSL Database', desc: '48 occupations across all states for occupational licensing' },
				{ name: 'Municipal Codes', desc: 'Common local permitting patterns for construction, land use, events' }
			] as source}
				<div class="p-4" style="border: 1px solid var(--muted);">
					<span class="font-mono text-xs font-bold block mb-1" style="color: var(--ink);">{source.name}</span>
					<span class="font-body text-sm" style="color: var(--text);">{source.desc}</span>
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
