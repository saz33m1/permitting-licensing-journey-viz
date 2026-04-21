<script lang="ts">
	import type { Reference } from '$lib/types';

	let { references }: { references: Reference[] } = $props();
	let isOpen = $state(false);

	type RefGroup = 'regulatory' | 'guide' | 'dataset';
	const groupOrder: RefGroup[] = ['regulatory', 'guide', 'dataset'];
	const typeLabels: Record<RefGroup, string> = {
		regulatory: 'Regulatory',
		guide: 'Industry Guides',
		dataset: 'Datasets'
	};

	const grouped = $derived.by(() => {
		const groups: Record<RefGroup, Reference[]> = { regulatory: [], guide: [], dataset: [] };
		for (const ref of references) {
			if (ref.type in groups) groups[ref.type].push(ref);
		}
		return groups;
	});
</script>

{#if references.length > 0}
	<section class="mt-8 pt-5" style="border-top: 1px solid var(--muted);">
		<button
			type="button"
			onclick={() => (isOpen = !isOpen)}
			class="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em]"
			style="background: none; border: none; padding: 0; color: var(--text); cursor: pointer;"
			aria-expanded={isOpen}
		>
			<span
				class="inline-block transition-transform"
				style="transform: rotate({isOpen ? 90 : 0}deg); font-size: 0.7em;"
				aria-hidden="true"
			>▶</span>
			Sources ({references.length})
		</button>

		{#if isOpen}
			<div class="mt-4 flex flex-col gap-5">
				{#each groupOrder as type (type)}
					{#if grouped[type].length > 0}
						<div>
							<h5 class="font-mono text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style="color: var(--text);">
								{typeLabels[type]}
							</h5>
							<ul class="flex flex-col">
								{#each grouped[type] as ref (ref.url)}
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
