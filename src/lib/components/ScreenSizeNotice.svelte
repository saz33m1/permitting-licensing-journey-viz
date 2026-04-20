<script lang="ts">
	import { onMount } from 'svelte';

	const STORAGE_KEY = 'pljourneys.larger-screen-notice-dismissed';

	let dismissed = $state(false);
	let initialized = $state(false);

	onMount(() => {
		try {
			dismissed = localStorage.getItem(STORAGE_KEY) === '1';
		} catch {
			dismissed = false;
		}
		initialized = true;
	});

	function dismiss() {
		dismissed = true;
		try {
			localStorage.setItem(STORAGE_KEY, '1');
		} catch {
			// best-effort; if storage blocked, banner reappears next load
		}
	}
</script>

{#if initialized && !dismissed}
	<div
		class="md:hidden flex items-start gap-3 px-4 py-2"
		style="background: var(--newsprint); border-bottom: 1px solid var(--muted);"
	>
		<p class="font-body text-xs flex-1 pt-0.5" style="color: var(--text);">
			For a richer, animated view of this journey, try a larger screen.
		</p>
		<button
			class="shrink-0 w-6 h-6 flex items-center justify-center cursor-pointer"
			onclick={dismiss}
			aria-label="Dismiss this notice"
		>
			<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="color: var(--text);">
				<path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
			</svg>
		</button>
	</div>
{/if}
