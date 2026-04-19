<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { app } from '$lib/stores/app.svelte';
	import JourneyScreen from '$lib/components/JourneyScreen.svelte';

	const id = $derived($page.params.id);

	// Sync route param to store whenever id changes
	$effect(() => {
		if (id && app.journeys.length > 0) {
			const exists = app.journeys.some(j => j.id === id);
			if (exists) {
				app.selectJourney(id);
			} else {
				goto(`${base}/`, { replaceState: true });
			}
		}
	});

	onMount(() => {
		function onKeydown(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				goto(`${base}/`);
			}
		}
		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});
</script>

<svelte:head>
	<title>{app.activeJourney ? `${app.activeJourney.name} – Permit & License Journey Explorer` : 'Permit & License Journey Explorer'}</title>
</svelte:head>

{#if app.activeJourney}
	<JourneyScreen />
{/if}
