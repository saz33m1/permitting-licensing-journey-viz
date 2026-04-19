<script lang="ts">
	export interface RealisticStatus {
		day: number;
		nodeId: string | null;
		nodeName: string | null;
		weeksInStep: number;
		totalWeeksInStep: number;
		finished: boolean;
	}

	let {
		status,
		onReplay
	}: {
		status: RealisticStatus;
		onReplay: () => void;
	} = $props();

	const dayDisplay = $derived(Math.max(0, Math.floor(status.day)));
	const weekCurrent = $derived(
		status.totalWeeksInStep > 0
			? Math.min(
					Math.max(1, Math.ceil(status.weeksInStep)),
					Math.max(1, Math.ceil(status.totalWeeksInStep))
				)
			: 0
	);
	const weekTotal = $derived(Math.max(0, Math.ceil(status.totalWeeksInStep)));
</script>

<div
	class="absolute flex flex-col gap-1 px-4 py-3 pointer-events-auto"
	style="top: 8px; right: 8px; z-index: 20; background: var(--surface); border: 1px solid var(--ink); min-width: 220px; box-shadow: 0 2px 6px rgba(0,0,0,.08);"
>
	{#if status.finished}
		<span
			class="font-mono text-[10px] tracking-[1.5px] uppercase"
			style="color: var(--text);">Complete</span
		>
		<span class="font-display text-xl font-bold leading-none" style="color: var(--ink);">
			{dayDisplay} days
		</span>
		<button
			onclick={onReplay}
			class="mt-2 self-start px-3 py-1 font-mono text-[11px] tracking-[1px] uppercase cursor-pointer transition-colors"
			style="background: var(--ink); color: var(--surface); border: none;"
		>
			Replay →
		</button>
	{:else}
		<span
			class="font-mono text-[10px] tracking-[1.5px] uppercase"
			style="color: var(--text);">Day</span
		>
		<span class="font-display text-2xl font-bold leading-none" style="color: var(--ink);">
			{dayDisplay}
		</span>
		{#if status.nodeName}
			<span
				class="font-mono text-[10px] tracking-[1px] uppercase mt-1 leading-tight"
				style="color: var(--ink);"
			>
				{status.nodeName}
			</span>
			{#if weekTotal > 0}
				<span class="font-mono text-[10px] tracking-[1px]" style="color: var(--text);">
					Week {weekCurrent} of {weekTotal}
				</span>
			{/if}
		{/if}
	{/if}
</div>
