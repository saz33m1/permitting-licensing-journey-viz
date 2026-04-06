<script lang="ts">
	import HomeScreen from '$lib/components/HomeScreen.svelte';
	import { app } from '$lib/stores/app.svelte';

	// Clear journey state when landing on home
	app.goHome();
</script>

<HomeScreen />
