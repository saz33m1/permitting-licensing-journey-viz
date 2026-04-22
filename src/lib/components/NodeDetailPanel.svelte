<script lang="ts">
	import { app, JC } from '$lib/stores/app.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte.js';
	import { isEntryPoint } from '$lib/utils/topoSort';
	import type { PlcNode, Dependency, Reference } from '$lib/types';

	const isMobile = new IsMobile();

	let { node, stepIndex, totalSteps }: { node: PlcNode; stepIndex?: number; totalSteps?: number } = $props();

	const jurLabel = $derived(node.jurisdiction.charAt(0).toUpperCase() + node.jurisdiction.slice(1));
	const jurColor = $derived(JC[node.jurisdiction] ?? '#666');

	const deps = $derived(app.activeJourney?.dependencies ?? []);

	interface EdgeRef { nodeId: string; name: string; type: Dependency['type'] }

	const requires = $derived.by<EdgeRef[]>(() => {
		const out: EdgeRef[] = [];
		for (const e of deps) {
			if (e.to !== node.id) continue;
			const n = app.nodeMap[e.from];
			if (!n) continue;
			out.push({ nodeId: e.from, name: n.name, type: e.type });
		}
		return out;
	});

	const unblocks = $derived.by<EdgeRef[]>(() => {
		const out: EdgeRef[] = [];
		for (const e of deps) {
			if (e.from !== node.id) continue;
			const n = app.nodeMap[e.to];
			if (!n) continue;
			out.push({ nodeId: e.to, name: n.name, type: e.type });
		}
		return out;
	});

	const isEntry = $derived(deps.length > 0 && isEntryPoint(node.id, deps));

	const gotchasForNode = $derived(
		app.activeJourney?.gotchas?.filter((g) => g.step === node.id) ?? []
	);

	type RefGroup = 'regulatory' | 'guide' | 'dataset';
	const refGroupOrder: RefGroup[] = ['regulatory', 'guide', 'dataset'];
	const refGroupLabels: Record<RefGroup, string> = {
		regulatory: 'Regulatory',
		guide: 'Industry Guides',
		dataset: 'Datasets'
	};

	const journeyRefs = $derived(app.activeJourney?.references ?? []);
	const groupedRefs = $derived.by(() => {
		const groups: Record<RefGroup, Reference[]> = { regulatory: [], guide: [], dataset: [] };
		for (const ref of journeyRefs) {
			if (ref.type in groups) groups[ref.type].push(ref);
		}
		return groups;
	});
	const sourcesCount = $derived((node.source?.url ? 1 : 0) + journeyRefs.length);

	let sourcesOpen = $state(false);

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
	class="fixed z-[100] overflow-y-auto flex flex-col {isMobile.current ? 'bottom-0 left-0 right-0 w-full max-h-[85vh] panel-enter-mobile' : 'top-0 right-0 h-full w-[480px] panel-enter'}"
	style="background: var(--surface); {isMobile.current ? 'border-top: 2px solid var(--ink); box-shadow: 0 -10px 30px rgba(0,0,0,0.1);' : 'border-left: 2px solid var(--ink); box-shadow: -10px 0 30px rgba(0,0,0,0.1);'}"
>
	{#if isMobile.current}
		<!-- Grabber -->
		<div class="flex justify-center pt-2 pb-1 shrink-0" style="background: var(--surface);">
			<div class="w-9 h-1" style="background: var(--muted);"></div>
		</div>
	{/if}
	<!-- Sticky Header -->
	<div class="p-6 md:p-8 flex flex-col gap-4 md:gap-6 sticky top-0 z-10" style="background: var(--surface); border-bottom: 1px solid var(--muted);">
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
			<h3 class="font-body text-2xl md:text-3xl font-bold leading-tight" style="color: var(--ink);">{node.name}</h3>
			{#if node.agency}
				<p class="font-mono text-xs mt-3 tracking-wide uppercase" style="color: var(--text);">{node.agency}</p>
			{/if}
		</div>
	</div>

	<!-- Body -->
	<div class="p-6 md:p-8 space-y-6 md:space-y-10 flex-1">
		<!-- Description -->
		{#if node.description}
			<section>
				<h4 class="font-mono text-[11px] font-bold uppercase tracking-[0.2em] mb-4" style="color: var(--text);">Description</h4>
				<div class="p-6" style="background: var(--newsprint); border-left: 4px solid var(--ink);">
					<p class="font-body text-sm leading-relaxed italic" style="color: var(--text);">{node.description}</p>
				</div>
			</section>
		{/if}

		<!-- Gotchas -->
		{#if gotchasForNode.length > 0}
			<section>
				<h4 class="font-mono text-[11px] font-bold uppercase tracking-[0.2em] mb-4" style="color: var(--text);">Common Gotchas</h4>
				<div class="flex flex-col gap-3">
					{#each gotchasForNode as gotcha (gotcha.step + gotcha.note)}
						{@const sev = gotcha.severity === 'major' ? 'var(--severity-major)' : 'var(--severity-minor)'}
						<div class="p-4" style="background: var(--newsprint); border-left: 4px solid {sev};">
							<span
								class="font-mono text-[10px] font-bold uppercase tracking-[0.1em]"
								style="color: {gotcha.severity === 'major' ? 'var(--severity-major)' : 'var(--text)'};"
							>{gotcha.severity}</span>
							<p class="font-body text-sm leading-relaxed mt-1.5" style="color: var(--text);">{gotcha.note}</p>
							{#if gotcha.source?.url}
								<a
									href={gotcha.source.url}
									target="_blank"
									rel="noopener noreferrer"
									class="font-mono text-[10px] uppercase tracking-[0.05em] mt-2 inline-flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
									style="color: var(--text);"
								>
									<span>Source: {gotcha.source.title}</span>
									<svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
										<path d="M4 1H1v10h10V8M7 1h4v4M11 1L5 7" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</a>
							{/if}
						</div>
					{/each}
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
							{isEntry ? 'Start here — no prerequisites' : stepIndex === totalSteps - 1 ? 'Final step in journey' : 'Mid-journey step'}
						</p>
					</div>
				</div>
			</section>
		{/if}

		<!-- Dependencies -->
		{#if requires.length > 0 || unblocks.length > 0}
			<section>
				<h4 class="font-mono text-[11px] font-bold uppercase tracking-[0.2em] mb-4" style="color: var(--text);">Dependencies</h4>
				<div class="grid grid-cols-1 gap-4">
					{#if requires.length > 0}
						<div class="p-4" style="border: 1px solid var(--muted);">
							<p class="font-mono text-[10px] uppercase mb-3" style="color: var(--text);">Requires</p>
							<ul class="flex flex-col gap-2">
								{#each requires as r (r.nodeId)}
									<li class="flex items-center gap-2 font-body text-sm" style="color: var(--ink);">
										<span
											class="shrink-0 inline-block w-4 h-[1.5px]"
											style="background: {r.type === 'hard' ? 'var(--ink)' : r.type === 'soft' ? 'var(--text)' : 'var(--muted)'};"
										></span>
										<span>{r.name}</span>
										<span class="font-mono text-[10px] uppercase ml-auto" style="color: var(--text);">{r.type}</span>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
					{#if unblocks.length > 0}
						<div class="p-4" style="border: 1px solid var(--muted);">
							<p class="font-mono text-[10px] uppercase mb-3" style="color: var(--text);">Unblocks</p>
							<ul class="flex flex-col gap-2">
								{#each unblocks as u (u.nodeId)}
									<li class="flex items-center gap-2 font-body text-sm" style="color: var(--ink);">
										<span
											class="shrink-0 inline-block w-4 h-[1.5px]"
											style="background: {u.type === 'hard' ? 'var(--ink)' : u.type === 'soft' ? 'var(--text)' : 'var(--muted)'};"
										></span>
										<span>{u.name}</span>
										<span class="font-mono text-[10px] uppercase ml-auto" style="color: var(--text);">{u.type}</span>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			</section>
		{/if}

		<!-- Sources -->
		{#if sourcesCount > 0}
			<section class="pt-4" style="border-top: 1px solid var(--muted);">
				<button
					type="button"
					onclick={() => (sourcesOpen = !sourcesOpen)}
					class="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em]"
					style="background: none; border: none; padding: 0; color: var(--text); cursor: pointer;"
					aria-expanded={sourcesOpen}
				>
					<span
						class="inline-block transition-transform"
						style="transform: rotate({sourcesOpen ? 90 : 0}deg); font-size: 0.7em;"
						aria-hidden="true"
					>▶</span>
					Sources ({sourcesCount})
				</button>

				{#if sourcesOpen}
					<div class="mt-4 flex flex-col gap-5">
						{#if node.source?.url}
							<div>
								<h5 class="font-mono text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style="color: var(--text);">
									For this step
								</h5>
								<div class="py-1.5" style="border-bottom: 1px solid var(--muted);">
									<a
										href={node.source.url}
										target="_blank"
										rel="noopener noreferrer"
										class="font-body text-sm underline decoration-1 underline-offset-2 hover:opacity-70 transition-opacity"
										style="color: var(--ink);"
									>
										{node.source.title}
									</a>
								</div>
							</div>
						{/if}

						{#each refGroupOrder as type (type)}
							{#if groupedRefs[type].length > 0}
								<div>
									<h5 class="font-mono text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style="color: var(--text);">
										{refGroupLabels[type]}
									</h5>
									<ul class="flex flex-col">
										{#each groupedRefs[type] as ref (ref.url)}
											<li
												class="flex justify-between items-baseline gap-3 py-1.5"
												style="border-bottom: 1px solid var(--muted);"
											>
												<a
													href={ref.url}
													target="_blank"
													rel="noopener noreferrer"
													class="font-body text-sm underline decoration-1 underline-offset-2 hover:opacity-70 transition-opacity"
													style="color: var(--ink);"
												>
													{ref.title}
												</a>
												<span
													class="font-mono text-[10px] uppercase tracking-wider shrink-0"
													style="color: var(--text);"
												>{ref.accessed}</span>
											</li>
										{/each}
									</ul>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	</div>
</aside>

<style>
	.panel-enter {
		animation: slideIn 0.3s ease-out;
	}

	.panel-enter-mobile {
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
</style>
