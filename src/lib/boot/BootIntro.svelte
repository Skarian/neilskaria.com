<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { IntroEngine } from './engine';
	import posterLandscape from './assets/poster-landscape.webp?url';
	import posterPortrait from './assets/poster-portrait.webp?url';
	import { prefetchIntro } from './prefetch';

	// The intro's start screen. The 3D engine itself is only downloaded when the intro plays: first
	// visits play it, returning visitors go straight to the page (the engine is prefetched in the
	// background), and "Replay intro" (an `intro:replay` event) plays it on demand.

	// The colour the boot screen fades to; it should match the page underneath.
	let { background }: { background: string } = $props();

	const SEEN_KEY = 'boot-seen';
	const MUTED_KEY = 'boot-muted';
	// Runs before the page is painted, so a first visit shows the start screen straight away and a
	// returning visit never flashes it.
	const headScript =
		`<script>try{if(localStorage.getItem('${SEEN_KEY}')!=='1'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.dataset.intro='play'}catch(e){}</scr` +
		'ipt>'; // split so this file's own script tag doesn't end here

	let canvas = $state<HTMLCanvasElement>();
	// Each run gets a fresh canvas: the previous one's WebGL context is destroyed to free the GPU.
	let run = $state(0);
	let layer = $state<HTMLDivElement>();
	let phase = $state<'idle' | 'loading' | 'ready' | 'playing'>('idle');
	let progress = $state(0);
	let muted = $state(false);
	let engine: IntroEngine | undefined;
	let cancelled = false;

	async function begin() {
		if (phase !== 'idle') return;
		document.documentElement.dataset.intro = 'play';
		// No page scrolling (or scrollbar) while the intro covers the page.
		document.documentElement.style.overflow = 'hidden';
		layer!.style.opacity = '1';
		cancelled = false;
		progress = 0;
		phase = 'loading';
		run += 1;
		await tick();
		try {
			const { createIntro } = await import('./engine');
			const created = await createIntro({
				canvas: canvas!,
				layer: layer!,
				background,
				muted,
				onProgress: (value) => (progress = value),
				onDone: done
			});
			if (cancelled) return created.dispose();
			engine = created;
			phase = 'ready';
		} catch (error) {
			console.error('Intro failed to load', error);
			done();
		}
	}

	function start() {
		if (phase !== 'ready' || !engine) return;
		phase = 'playing';
		engine.start();
	}

	function skip() {
		if (engine) engine.skip();
		else {
			cancelled = true;
			done();
		}
	}

	function done() {
		engine = undefined;
		phase = 'idle';
		localStorage.setItem(SEEN_KEY, '1');
		delete document.documentElement.dataset.intro;
		document.documentElement.style.overflow = '';
	}

	function toggleSound() {
		muted = !muted;
		localStorage.setItem(MUTED_KEY, muted ? '1' : '0');
		engine?.setMuted(muted);
	}

	function keydown(event: KeyboardEvent) {
		if (phase === 'idle') return;
		if (phase === 'ready' && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();
			start();
		} else if (event.key === 'Escape') {
			skip();
		} else if (event.key === 'm' || event.key === 'M') {
			toggleSound();
		}
	}

	onMount(() => {
		muted = localStorage.getItem(MUTED_KEY) === '1';
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		// The head script only runs on a full page load, so check again for client-side navigation.
		const firstVisit = localStorage.getItem(SEEN_KEY) !== '1' && !reduced;
		if (document.documentElement.dataset.intro === 'play' || firstVisit) begin();
		else prefetchIntro();

		addEventListener('intro:replay', begin);
		return () => {
			removeEventListener('intro:replay', begin);
			engine?.dispose();
		};
	});
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- a fixed, static script -->
	{@html headScript}
</svelte:head>

<svelte:window onkeydown={keydown} />

<!-- A still of the room shows straight away; the live scene fades in over it once it's loaded. -->
<div
	bind:this={layer}
	class="boot-intro"
	aria-hidden={phase === 'idle'}
	style:--poster-landscape="url({posterLandscape})"
	style:--poster-portrait="url({posterPortrait})"
>
	{#key run}
		<canvas bind:this={canvas} class:live={phase === 'ready' || phase === 'playing'}></canvas>
	{/key}

	{#if phase !== 'playing'}
		<div class="start-screen">
			<button
				class="start"
				disabled={phase !== 'ready'}
				aria-label="Start"
				onclick={start}
				data-start
			></button>
			<span class="label" aria-live="polite">
				{phase === 'ready' ? 'PRESS START' : `LOADING ${Math.round(progress * 100)}%`}
			</span>
		</div>
	{/if}

	<div class="corner">
		<button onclick={toggleSound} aria-pressed={!muted}>{muted ? 'SOUND OFF' : 'SOUND ON'}</button>
		<button onclick={skip}>SKIP INTRO</button>
	</div>
</div>

<style>
	.boot-intro {
		display: none;
		position: fixed;
		inset: 0;
		z-index: 50;
		/* Background images aren't fetched while this is hidden, so return visits never load them. */
		background: #1a1830 var(--poster-landscape) center / cover no-repeat;
		font-family: ui-monospace, monospace;
		color: #eff1f5;
	}

	:global(html[data-intro]) .boot-intro {
		display: block;
	}

	@media (orientation: portrait) {
		.boot-intro {
			background-image: var(--poster-portrait);
		}
	}

	canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		transition: opacity 0.4s ease;
	}

	canvas.live {
		opacity: 1;
	}

	.start-screen {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		gap: 1.1rem;
		padding-bottom: 14vh;
		/* Enough shade behind the button to read against the daylit room. */
		background: radial-gradient(ellipse 50% 32% at 50% 86%, rgb(20 16 40 / 0.5), transparent 70%);
	}

	/* An angled rubber pill, like the START button on a Game Boy. */
	.start {
		width: 72px;
		height: 22px;
		border-radius: 999px;
		transform: rotate(-25deg);
		cursor: pointer;
		background: linear-gradient(180deg, #6b6872, #3a3840 55%, #2b2930);
		box-shadow:
			0 4px 0 #18161c,
			0 6px 12px rgb(0 0 0 / 0.45),
			inset 0 1px 0 rgb(255 255 255 / 0.25);
		transition:
			transform 0.08s,
			box-shadow 0.08s,
			opacity 0.3s;
	}

	.start:not(:disabled) {
		animation: breathe 1.8s ease-in-out infinite;
	}

	.start:active:not(:disabled) {
		transform: rotate(-25deg) translateY(3px);
		box-shadow:
			0 1px 0 #18161c,
			0 2px 6px rgb(0 0 0 / 0.45),
			inset 0 1px 0 rgb(255 255 255 / 0.2);
	}

	.start:disabled {
		cursor: default;
		opacity: 0.45;
	}

	.start:focus-visible {
		outline: 2px solid #f5c2e7;
		outline-offset: 6px;
	}

	.label {
		font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
		font-style: italic;
		font-size: 0.7rem;
		letter-spacing: 0.16em;
		color: rgb(239 241 245 / 0.9);
	}

	.corner {
		position: absolute;
		right: 1.25rem;
		bottom: 1.25rem;
		display: flex;
		gap: 1.25rem;
		font-size: 0.7rem;
		letter-spacing: 0.15em;
	}

	.corner button {
		cursor: pointer;
		color: rgb(205 208 245 / 0.7);
	}

	.corner button:hover {
		color: #eff1f5;
	}

	@keyframes breathe {
		50% {
			box-shadow:
				0 4px 0 #18161c,
				0 6px 12px rgb(0 0 0 / 0.45),
				0 0 18px rgb(245 194 231 / 0.55),
				inset 0 1px 0 rgb(255 255 255 / 0.25);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.start:not(:disabled) {
			animation: none;
		}
	}
</style>
