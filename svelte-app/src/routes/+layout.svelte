<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { app } from '$lib/stores/app.svelte';

	let { children } = $props();

	onMount(() => {
		fetch('/data/journeys.json')
			.then(r => { if (!r.ok) throw new Error('Failed to load'); return r.json(); })
			.then(data => app.loadData(data))
			.catch(() => console.error('Failed to load journeys.json'));

		function onKeydown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				const input = document.querySelector<HTMLInputElement>('input[placeholder="Search journeys..."]');
				input?.focus();
			}
		}
		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});
</script>

<svelte:head>
	<title>Permit & License Journey Explorer</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600;6..72,700&display=swap" rel="stylesheet">
</svelte:head>

{@render children()}
