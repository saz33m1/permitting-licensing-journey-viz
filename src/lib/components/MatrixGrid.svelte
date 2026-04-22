<script lang="ts">
	import { app, JC, PHASES, PHASE_LABELS, JURISDICTIONS_ORDER } from '$lib/stores/app.svelte';
	import { computeMatrix } from '$lib/utils/matrix';
	import { topoSort, buildAdjacency, isEntryPoint } from '$lib/utils/topoSort';
	import { computeTopologicalLevels, minWeeksParallel } from '$lib/utils/topoLevels';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte.js';
	import NodeCard from './NodeCard.svelte';
	import FlowPathOverlay from './FlowPathOverlay.svelte';
	import RealisticHUD from './RealisticHUD.svelte';
	import MobileTimeline, { type StepEvent } from './MobileTimeline.svelte';
	import DependencyLegend from './DependencyLegend.svelte';
	import type { Journey } from '$lib/types';

	let { journey, isMobile }: { journey: Journey; isMobile: IsMobile } = $props();

	let openPhases = $state<Record<string, boolean>>({
		preparation: true,
		application: false,
		inspection: false,
		active: false
	});

	function togglePhase(phase: string) {
		openPhases = { ...openPhases, [phase]: !openPhases[phase] };
	}

	let currentStep = $state<StepEvent | null>(null);

	function handleMobileStep(e: StepEvent | null) {
		currentStep = e;
		if (e && !openPhases[e.phase]) {
			openPhases = { ...openPhases, [e.phase]: true };
		}
	}

	// Sync glow class onto the current mobile-highlighted card, clear others.
	$effect(() => {
		const id = currentStep?.nodeId ?? null;
		document.querySelectorAll('.node-glow').forEach((el) => el.classList.remove('node-glow'));
		if (!id) return;
		requestAnimationFrame(() => {
			const el = document.querySelector(`[data-node-id="${id}"]`);
			if (el) {
				el.classList.add('node-glow');
				el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		});
	});

	const orderedSteps = $derived(topoSort(journey.steps, journey.dependencies, app.nodeMap));
	const matrix = $derived(computeMatrix(journey, app.nodeMap, orderedSteps));

	const stepIndexMap = $derived.by(() => {
		const map: Record<string, number> = {};
		orderedSteps.forEach((id, i) => { map[id] = i; });
		return map;
	});

	const adjacency = $derived(buildAdjacency(journey.steps, journey.dependencies));

	const entrySet = $derived(new Set(
		journey.steps.filter((id) => isEntryPoint(id, journey.dependencies))
	));

	const connectedSet = $derived.by(() => {
		const sel = app.selectedNode;
		if (!sel || !journey.steps.includes(sel)) return null;
		const set = new Set<string>([sel]);
		for (const e of adjacency.incoming[sel] ?? []) set.add(e.from);
		for (const e of adjacency.outgoing[sel] ?? []) set.add(e.to);
		return set;
	});

	const levels = $derived(
		computeTopologicalLevels(journey.steps, journey.dependencies, app.nodeMap)
	);
	const minWeeks = $derived(minWeeksParallel(levels));

	// Compute per-phase step rank for horizontal offset across jurisdiction rows
	const phaseStepRank = $derived.by(() => {
		const rank: Record<string, number> = {};
		const byPhase: Record<string, string[]> = {};
		for (const stepId of orderedSteps) {
			const node = app.nodeMap[stepId];
			if (!node) continue;
			if (!byPhase[node.phase]) byPhase[node.phase] = [];
			byPhase[node.phase].push(stepId);
		}
		for (const phase of Object.keys(byPhase)) {
			byPhase[phase].forEach((id, i) => { rank[id] = i; });
		}
		return rank;
	});

	let gridEl: HTMLDivElement | undefined = $state();

	const jurLabels: Record<string, string> = {
		federal: 'Federal',
		state: 'State',
		local: 'Local'
	};

	let realisticStatus = $state({
		day: 0,
		nodeId: null as string | null,
		nodeName: null as string | null,
		weeksInStep: 0,
		totalWeeksInStep: 0,
		finished: false
	});
	let restartKey = $state(0);

	function handleReplay() {
		realisticStatus = {
			day: 0,
			nodeId: null,
			nodeName: null,
			weeksInStep: 0,
			totalWeeksInStep: 0,
			finished: false
		};
		restartKey++;
	}

	// Reset HUD when journey or depMode changes.
	$effect(() => {
		void journey.id;
		void app.depMode;
		realisticStatus = {
			day: 0,
			nodeId: null,
			nodeName: null,
			weeksInStep: 0,
			totalWeeksInStep: 0,
			finished: false
		};
	});
</script>

<div class="relative">
{#if app.viewMode === 'dependency'}
	<DependencyLegend mode={app.depMode} />
{/if}
{#if isMobile.current}
	<!-- Mobile: phase-accordion -->
	<div class="flex flex-col" style="border: 1px solid var(--ink);">
		{#each PHASES as phase, phaseIdx}
			{@const phaseNodes = orderedSteps
				.map(id => app.nodeMap[id])
				.filter(n => n && n.phase === phase)}
			{@const isOpen = openPhases[phase]}
			<section style="{phaseIdx < PHASES.length - 1 ? 'border-bottom: 1px solid var(--ink);' : ''}">
				<button
					type="button"
					class="w-full flex items-center justify-between p-4 cursor-pointer text-left"
					style="background: var(--surface);"
					onclick={() => togglePhase(phase)}
					aria-expanded={isOpen}
				>
					<div class="flex flex-col">
						<span class="font-mono text-[10px] tracking-[1px] uppercase" style="color: var(--text);">{PHASE_LABELS[phase].number}</span>
						<span class="font-body font-medium text-base mt-1" style="color: var(--ink);">{PHASE_LABELS[phase].label}</span>
					</div>
					<div class="flex items-center gap-3">
						<span class="font-mono text-xs" style="color: var(--text);">
							{phaseNodes.length} {phaseNodes.length === 1 ? 'step' : 'steps'}
						</span>
						<svg
							class="w-4 h-4 transition-transform"
							style="color: var(--ink); transform: rotate({isOpen ? 180 : 0}deg);"
							fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
						>
							<path d="m6 9 6 6 6-6"/>
						</svg>
					</div>
				</button>
				{#if isOpen}
					<div class="p-4 pt-2" style="background: var(--newsprint); border-top: 1px solid var(--muted);">
						{#if phaseNodes.length === 0}
							<p class="font-body text-sm italic py-2" style="color: var(--text);">No steps in this phase.</p>
						{:else}
							<div class="flex flex-col gap-3">
								{#each phaseNodes as node (node.id)}
									{@const dimmed = connectedSet !== null && !connectedSet.has(node.id)}
									{@const entry = entrySet.has(node.id)}
									{@const hardReqs = (adjacency.incoming[node.id] ?? [])
										.filter((e) => e.type === 'hard')
										.map((e) => app.nodeMap[e.from]?.name)
										.filter(Boolean)}
									{@const nodeGotchas = app.activeJourney?.gotchas?.filter((g) => g.step === node.id) ?? []}
									<div
										class="flex items-start gap-2"
										style="transition: opacity 200ms ease; opacity: {dimmed ? 0.28 : 1};"
									>
										<span
											class="shrink-0 mt-1.5 w-2.5 h-2.5 rounded-full"
											style="background: {JC[node.jurisdiction]};"
											title={jurLabels[node.jurisdiction]}
										></span>
										<div class="flex-1 min-w-0 relative">
											{#if entry}
												<span
													class="absolute -top-1 right-0 font-mono text-[9px] tracking-[1px] uppercase px-1.5 py-0.5"
													style="background: var(--accent); color: var(--newsprint); z-index: 2;"
												>Start</span>
											{/if}
											<NodeCard {node} stepIndex={stepIndexMap[node.id]} mobile />
											{#if hardReqs.length > 0}
												<div class="mt-1.5 flex flex-wrap items-center gap-1.5">
													<span class="font-mono text-[9px] uppercase tracking-wider" style="color: var(--text);">Requires</span>
													{#each hardReqs as name}
														<span class="font-mono text-[10px] px-1.5 py-0.5" style="border: 1px solid var(--muted); color: var(--ink);">{name}</span>
													{/each}
												</div>
											{/if}
											{#if nodeGotchas.length > 0}
												<ul class="mt-1.5 flex flex-col gap-1">
													{#each nodeGotchas as gotcha (gotcha.step + gotcha.note)}
														{@const isMajor = gotcha.severity === 'major'}
														<li
															class="font-body text-[11px] leading-snug flex gap-1.5"
															style="color: {isMajor ? 'var(--severity-major)' : 'var(--text)'};"
														>
															<span class="font-mono font-bold shrink-0" aria-hidden="true">{isMajor ? '!' : 'i'}</span>
															<span>{gotcha.note.length > 120 ? gotcha.note.slice(0, 120) + '…' : gotcha.note}</span>
														</li>
													{/each}
												</ul>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</section>
		{/each}
	</div>
	{#if app.viewMode === 'dependency'}
		<MobileTimeline
			steps={orderedSteps}
			dependencies={journey.dependencies}
			nodeMap={app.nodeMap}
			mode={app.depMode}
			{restartKey}
			onStatus={(s) => (realisticStatus = s)}
			onStep={handleMobileStep}
		/>
		{#if app.depMode === 'realistic'}
			<RealisticHUD status={realisticStatus} {minWeeks} onReplay={handleReplay} mobile />
		{/if}
	{/if}
{:else}
	<!-- Desktop: 4x3 matrix -->
	<div bind:this={gridEl} class="grid w-full" style="grid-template-columns: 80px repeat(4, 1fr); border: 1px solid var(--ink);">
		<!-- Top-left corner cell -->
		<div style="border-bottom: 1px solid var(--ink); border-right: 1px solid var(--ink); background: rgba(213,211,206,.15);"></div>

		<!-- Phase column headers -->
		{#each PHASES as phase, i}
			<div
				class="p-4 flex flex-col justify-end"
				style="border-bottom: 1px solid var(--ink); {i < 3 ? 'border-right: 1px solid var(--ink);' : ''} background: var(--surface);"
			>
				<span class="font-mono text-[10px] tracking-[1px] uppercase" style="color: var(--text);">{PHASE_LABELS[phase].number}</span>
				<span class="font-body font-medium text-base mt-1" style="color: var(--ink);">{PHASE_LABELS[phase].label}</span>
			</div>
		{/each}

		<!-- Jurisdiction rows -->
		{#each JURISDICTIONS_ORDER as jur, jurIdx}
			<!-- Row label -->
			<div
				class="flex items-center justify-center p-3"
				style="border-right: 1px solid var(--ink); {jurIdx < 2 ? 'border-bottom: 1px solid var(--ink);' : ''} background: var(--surface); min-height: 180px;"
			>
				<div class="flex items-center gap-2 vertical-text">
					<span class="w-2.5 h-2.5 rounded-full" style="background: {JC[jur]};"></span>
					<span class="font-mono text-[10px] tracking-[1px] uppercase" style="color: var(--ink);">{jurLabels[jur]}</span>
				</div>
			</div>

			<!-- Phase cells for this jurisdiction -->
			{#each PHASES as phase, phaseIdx}
				{@const nodes = matrix[`${jur}-${phase}`] ?? []}
				<div
					class="p-3 relative {nodes.length === 0 ? 'hatch-pattern' : ''}"
					style="{jurIdx < 2 ? 'border-bottom: 1px solid var(--muted);' : ''} {phaseIdx < 3 ? 'border-right: 1px solid var(--muted);' : ''}"
				>
					{#if nodes.length > 0}
						{@const sorted = [...nodes].sort((a, b) => (stepIndexMap[a.id] ?? 0) - (stepIndexMap[b.id] ?? 0))}
						<div class="flex flex-col gap-3">
							{#each sorted as node (node.id)}
								{@const dimmed = connectedSet !== null && !connectedSet.has(node.id)}
								{@const entry = entrySet.has(node.id)}
								{@const hasGotchas = (app.activeJourney?.gotchas?.some((g) => g.step === node.id)) ?? false}
								<div
									class="relative"
									style="margin-left: {(phaseStepRank[node.id] ?? 0) * 20}px; transition: opacity 200ms ease; opacity: {dimmed ? 0.28 : 1};"
								>
									{#if entry}
										<span
											class="absolute -top-2 -left-2 font-mono text-[9px] tracking-[1px] uppercase px-1.5 py-0.5"
											style="background: var(--accent); color: var(--newsprint); z-index: 2;"
										>Start</span>
									{/if}
									<NodeCard {node} stepIndex={stepIndexMap[node.id]} />
									{#if hasGotchas}
										<span
											class="absolute top-1 right-1 pointer-events-none"
											style="width: 6px; height: 6px; background: var(--severity-major); z-index: 2;"
											title="Has gotchas"
											aria-label="Has gotchas"
										></span>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		{/each}
	</div>
	{#if app.viewMode === 'dependency' && gridEl}
		<FlowPathOverlay
			containerEl={gridEl}
			steps={orderedSteps}
			dependencies={journey.dependencies}
			nodeMap={app.nodeMap}
			mode={app.depMode}
			{restartKey}
			onStatus={(s) => (realisticStatus = s)}
		/>
		{#if app.depMode === 'realistic'}
			<RealisticHUD status={realisticStatus} {minWeeks} onReplay={handleReplay} />
		{/if}
	{/if}
{/if}
</div>
