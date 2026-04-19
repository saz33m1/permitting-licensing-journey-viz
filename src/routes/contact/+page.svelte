<script lang="ts">
	import { base } from '$app/paths';

	const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzdrqvl';

	let name = $state('');
	let email = $state('');
	let message = $state('');
	let status = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
	let errorMessage = $state('');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		status = 'submitting';
		errorMessage = '';

		try {
			const response = await fetch(FORMSPREE_ENDPOINT, {
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name, email, message })
			});

			if (response.ok) {
				status = 'success';
				name = '';
				email = '';
				message = '';
				return;
			}

			const data = await response.json().catch(() => ({}));
			errorMessage = data?.errors?.[0]?.message ?? 'Something went wrong. Please try again.';
			status = 'error';
		} catch (err) {
			errorMessage = 'Network error. Please check your connection and try again.';
			status = 'error';
		}
	}
</script>

<svelte:head>
	<title>Get involved – Permit & License Journey Explorer</title>
</svelte:head>

<!-- HERO -->
<section class="w-full px-6 md:px-16 py-20 md:py-32" style="background: var(--ink); color: var(--newsprint);">
	<div class="max-w-[1200px] mx-auto">
		<a href="{base}/" class="font-mono text-xs uppercase tracking-[2px] inline-block mb-16 opacity-60 hover:opacity-100 transition-opacity" style="color: var(--newsprint);">
			&larr; Back to Explorer
		</a>
		<h1 class="font-display text-5xl md:text-7xl leading-[1.05] tracking-tight mb-6">
			Get involved
		</h1>
		<p class="font-body text-lg md:text-xl leading-relaxed max-w-[640px] opacity-70">
			I'm building open-source tools to make permitting and licensing less painful for state and local governments. If you're a government technologist, civic hacker, or someone who's lived through the chaos and wants to fix it, I want to hear from you.
		</p>
	</div>
</section>

<!-- FORM -->
<section class="w-full px-6 md:px-16 py-16 md:py-24" style="background: var(--newsprint);">
	<div class="max-w-[640px] mx-auto">
		{#if status === 'success'}
			<div data-testid="success-message">
				<span class="font-mono text-[10px] uppercase tracking-[2px] block mb-4" style="color: var(--state);">Message sent</span>
				<h2 class="font-display text-3xl md:text-4xl leading-[1.1] tracking-tight mb-6" style="color: var(--ink);">
					Thanks, talk soon.
				</h2>
				<p class="font-body text-base leading-relaxed mb-8" style="color: var(--text);">
					Your note landed in my inbox. I read everything personally and try to reply within a few days.
				</p>
				<button
					type="button"
					class="font-mono text-xs uppercase tracking-[1.5px] underline hover:no-underline"
					style="color: var(--text);"
					onclick={() => { status = 'idle'; }}
				>
					Send another message &rarr;
				</button>
			</div>
		{:else}
			<form onsubmit={handleSubmit} class="space-y-6">
				<div>
					<label for="name" class="font-mono text-[10px] uppercase tracking-[2px] block mb-2" style="color: var(--text);">
						Name
					</label>
					<input
						id="name"
						name="name"
						type="text"
						required
						bind:value={name}
						disabled={status === 'submitting'}
						class="w-full px-3 py-2.5 font-body text-base"
						style="border: 1px solid var(--ink); background: #fff; color: var(--ink); outline: none;"
					/>
				</div>

				<div>
					<label for="email" class="font-mono text-[10px] uppercase tracking-[2px] block mb-2" style="color: var(--text);">
						Email
					</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						bind:value={email}
						disabled={status === 'submitting'}
						class="w-full px-3 py-2.5 font-body text-base"
						style="border: 1px solid var(--ink); background: #fff; color: var(--ink); outline: none;"
					/>
				</div>

				<div>
					<label for="message" class="font-mono text-[10px] uppercase tracking-[2px] block mb-2" style="color: var(--text);">
						Message
					</label>
					<textarea
						id="message"
						name="message"
						required
						rows="6"
						bind:value={message}
						disabled={status === 'submitting'}
						class="w-full px-3 py-2.5 font-body text-base resize-y"
						style="border: 1px solid var(--ink); background: #fff; color: var(--ink); outline: none;"
					></textarea>
				</div>

				{#if status === 'error'}
					<div class="px-4 py-3 font-mono text-xs" style="border: 1px solid var(--accent); background: #fff; color: var(--accent);">
						{errorMessage}
					</div>
				{/if}

				<div class="flex flex-wrap items-center gap-6 pt-2">
					<button
						type="submit"
						disabled={status === 'submitting'}
						class="px-6 py-3 font-mono text-xs uppercase tracking-[1.5px] transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
						style="background: var(--ink); color: var(--newsprint); border: none;"
					>
						{status === 'submitting' ? 'Sending...' : 'Send message →'}
					</button>
					<a
						href="https://github.com/saz33m1"
						target="_blank"
						rel="noopener noreferrer"
						class="font-mono text-xs uppercase tracking-[1.5px] underline hover:no-underline"
						style="color: var(--text);"
					>
						Or find me on GitHub →
					</a>
				</div>
			</form>
		{/if}
	</div>
</section>
