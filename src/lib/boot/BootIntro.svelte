<script lang="ts">
	import { onMount } from 'svelte';
	import type { CubeState, Room, RoomMode, Thing } from './engine';
	import { room } from './room.svelte';

	// Panels pop in like a game dialog: from small and tilted, overshooting a touch.
	function pop(_node: Element, { delay = 0, duration = 520 } = {}) {
		return {
			delay,
			duration,
			css: (t: number) => {
				const spring = 1 - Math.pow(1 - t, 3) + Math.sin(t * Math.PI) * 0.12;
				return `opacity: ${Math.min(1, t * 2)}; transform: scale(${0.6 + 0.4 * spring}) rotate(${(1 - t) * -4}deg);`;
			}
		};
	}

	// The room: the site's 3D home screen. A first visit loads it (behind a dark loading screen) and
	// starts there; clicking the Game Boy (or START) boots into the page. Returning visitors land on
	// the page, and the room loads quietly in the background so "Back to the room" is instant.

	// The colour the boot screen fades to; it should match the page underneath.
	let { background }: { background: string } = $props();

	const SEEN_KEY = 'boot-seen';
	const MUTED_KEY = 'boot-muted';
	// Where the visitor is in this tab ('room' or 'page'), so a reload puts them back there.
	const PLACE_KEY = 'room-place';
	// Runs before the page is painted, so the room's loading screen shows straight away (on a first
	// visit, or reloading while in the room) and a returning visit never flashes it.
	const headScript =
		`<script>try{if((localStorage.getItem('${SEEN_KEY}')!=='1'||sessionStorage.getItem('${PLACE_KEY}')==='room')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.dataset.intro='play'}catch(e){}</scr` +
		'ipt>'; // split so this file's own script tag doesn't end here

	type NetworkInformation = { saveData?: boolean; effectiveType?: string };

	let canvas = $state<HTMLCanvasElement>();
	let layer = $state<HTMLDivElement>();
	let phase = $state<'page' | 'loading' | 'room' | 'moving'>('page');
	let progress = $state(0);
	let muted = $state(false);
	let pressed = $state(false);
	let focused = $state<Thing | null>(null);

	// The lantern's presets: warm whites to colours. Brightness runs from off to a little over full.
	const LANTERN_COLORS = [
		{ name: 'Paper white', css: '#ffe2bf' },
		{ name: 'Candle', css: '#ff9d4a' },
		{ name: 'Sakura', css: '#ff7fa6' },
		{ name: 'Matcha', css: '#9be36f' },
		{ name: 'Tide', css: '#5ec8e8' },
		{ name: 'Indigo', css: '#6a7bff' },
		{ name: 'Ember', css: '#ff4a2a' }
	];
	let lanternColor = $state(LANTERN_COLORS[0].css);
	let lanternLevel = $state(1);
	$effect(() => {
		// Read both first, so the effect tracks them even before the room has loaded.
		const color = lanternColor;
		const level = lanternLevel;
		engine?.setLantern(color, level);
	});
	let engine: Room | undefined;

	// The Rubik's cube's state, from the room.
	let cube = $state<CubeState>({ scrambled: false, solved: false, busy: false });

	// Confetti for a solve: scattered pieces in the cube's colours.
	const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
		x: Math.round(Math.sin(i * 2.4) * 190),
		y: -70 - ((i * 37) % 120),
		spin: (i % 2 ? 1 : -1) * (200 + ((i * 53) % 400)),
		delay: (i % 7) * 0.03,
		color: ['#ffffff', '#ffd500', '#009b48', '#0046ad', '#b71234', '#ff5800'][i % 6]
	}));

	function show() {
		document.documentElement.dataset.intro = 'play';
		// No page scrolling (or scrollbar) while the room covers the page.
		document.documentElement.style.overflow = 'hidden';
	}

	function hide() {
		delete document.documentElement.dataset.intro;
		document.documentElement.style.overflow = '';
	}

	async function load(startIn: 'room' | 'site') {
		const { createRoom } = await import('./engine');
		engine = await createRoom({
			canvas: canvas!,
			layer: layer!,
			background,
			muted,
			startIn,
			onProgress: (value) => (progress = value),
			onMode,
			onFocus: (thing) => (focused = thing),
			onCube: (state) => (cube = state)
		});
		engine.setLantern(lanternColor, lanternLevel);
	}

	function onMode(mode: RoomMode) {
		if (mode === 'room' || mode === 'site')
			sessionStorage.setItem(PLACE_KEY, mode === 'room' ? 'room' : 'page');
		if (mode === 'room') phase = 'room';
		else if (mode === 'site') {
			phase = 'page';
			localStorage.setItem(SEEN_KEY, '1');
			hide();
			room.ready = true;
			room.open = openRoom;
		} else phase = 'moving';
	}

	function openRoom() {
		if (!engine || phase !== 'page') return;
		// Start invisible; the reverse animation fades the room in over the page.
		layer!.style.opacity = '0';
		show();
		engine.returnToRoom();
	}

	function start() {
		if (phase !== 'room' || pressed) return;
		// Let the button visibly press before the room starts moving.
		pressed = true;
		setTimeout(() => {
			pressed = false;
			engine?.enterSite();
		}, 160);
	}

	function toggleSound() {
		muted = !muted;
		localStorage.setItem(MUTED_KEY, muted ? '1' : '0');
		engine?.setMuted(muted);
	}

	function keydown(event: KeyboardEvent) {
		if (phase === 'page') return;
		if (phase === 'room' && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();
			start();
		} else if (event.key === 'Escape') {
			if (focused) engine?.unfocus();
			else engine?.skipToSite();
		} else if (event.key === 'm' || event.key === 'M') {
			toggleSound();
		}
	}

	onMount(() => {
		muted = localStorage.getItem(MUTED_KEY) === '1';
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		// A first visit, or a reload while in the room, starts in the room.
		const inRoom = sessionStorage.getItem(PLACE_KEY) === 'room';
		const firstVisit = (localStorage.getItem(SEEN_KEY) !== '1' || inRoom) && !reduced;

		if (firstVisit) {
			show();
			phase = 'loading';
			load('room').catch((error) => {
				console.error('The room failed to load', error);
				hide();
				phase = 'page';
			});
		} else if (!reduced) {
			// Load the room in the background once the page is idle, unless data is precious.
			const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
			const slow = connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '');
			if (!slow) {
				// The room reports where it is itself (on the page, paused) once it has loaded.
				const run = () =>
					load('site').catch((error) => console.error('The room failed to load', error));
				if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 4000 });
				else setTimeout(run, 2000);
			}
		}
		return () => {
			engine?.dispose();
			room.ready = false;
		};
	});
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- a fixed, static script -->
	{@html headScript}
</svelte:head>

<svelte:window onkeydown={keydown} />

<div bind:this={layer} class="room-layer" aria-hidden={phase === 'page'}>
	<canvas bind:this={canvas} class:live={phase !== 'loading'}></canvas>

	{#if phase === 'loading'}
		<p class="loading" aria-live="polite">LOADING {Math.round(progress * 100)}%</p>
	{/if}

	{#if phase === 'room' && !focused}
		<div class="start">
			<button
				class:pressed
				onclick={start}
				aria-label="Start: open the site"
				data-start
				in:pop={{ delay: 450 }}
				out:pop={{ duration: 220 }}
			>
				START
			</button>
		</div>
	{/if}

	{#if focused === 'lantern'}
		<aside class="panel" aria-label="Lantern" in:pop={{ delay: 350 }} out:pop={{ duration: 220 }}>
			<p class="ribbon">LANTERN</p>
			<h2>Pick a light</h2>
			<div class="swatches" role="radiogroup" aria-label="Colour">
				{#each LANTERN_COLORS as color, i (color.css)}
					<button
						role="radio"
						aria-checked={lanternColor === color.css}
						aria-label={color.name}
						title={color.name}
						style:--swatch={color.css}
						style:--i={i}
						onclick={() => (lanternColor = color.css)}
					></button>
				{/each}
				<label class="gem custom" title="Any colour" style:--i={LANTERN_COLORS.length}>
					<input type="color" bind:value={lanternColor} aria-label="Any colour" />
				</label>
			</div>
			<p class="name">
				{LANTERN_COLORS.find((c) => c.css === lanternColor)?.name ?? 'Your colour'}
			</p>
			<label class="slider">
				<span class="end" aria-hidden="true">☾</span>
				<input
					type="range"
					min="0"
					max="1.5"
					step="0.01"
					bind:value={lanternLevel}
					aria-label="Brightness"
					style:--fill="{(lanternLevel / 1.5) * 100}%"
				/>
				<span class="end" aria-hidden="true">☀</span>
			</label>
			<div class="actions">
				<button class="back" onclick={() => engine?.unfocus()}>◀ BACK</button>
				<button
					class="back reset"
					onclick={() => {
						lanternColor = LANTERN_COLORS[0].css;
						lanternLevel = 1;
					}}>↺ RESET</button
				>
			</div>
		</aside>
	{/if}

	{#if focused === 'cube'}
		<aside
			class="panel cube-panel"
			aria-label="Rubik's cube"
			in:pop={{ delay: 350 }}
			out:pop={{ duration: 220 }}
		>
			<p class="ribbon cube-ribbon">CUBE</p>
			{#key cube.solved}
				<h2 class:cheer={cube.solved}>
					{cube.solved ? 'Solved!' : cube.scrambled ? 'Solve it!' : 'Mix it up!'}
				</h2>
			{/key}
			<p class="hint">
				{cube.scrambled
					? 'Drag a face to turn it. Drag around the cube to turn it over.'
					: 'Scramble it, then try to solve it.'}
			</p>
			<div class="actions">
				<button class="back" onclick={() => engine?.unfocus()}>◀ BACK</button>
				<button class="back go" onclick={() => engine?.scrambleCube()} disabled={cube.busy}
					>SCRAMBLE</button
				>
				<button
					class="back reset"
					onclick={() => engine?.solveCube()}
					disabled={cube.busy || !cube.scrambled}>SOLVE</button
				>
			</div>
			{#if cube.solved}
				<div class="confetti" aria-hidden="true">
					{#each CONFETTI as c, i (i)}
						<i
							style:--x="{c.x}px"
							style:--y="{c.y}px"
							style:--spin="{c.spin}deg"
							style:--delay="{c.delay}s"
							style:background={c.color}
						></i>
					{/each}
				</div>
			{/if}
		</aside>
	{/if}

	<div class="corner">
		<button onclick={toggleSound} aria-pressed={!muted}>{muted ? 'SOUND OFF' : 'SOUND ON'}</button>
		{#if phase !== 'page'}
			<button onclick={() => engine?.skipToSite()}>SKIP TO SITE</button>
		{/if}
	</div>
</div>

<style>
	.room-layer {
		display: none;
		position: fixed;
		inset: 0;
		z-index: 50;
		background: #0b0a0e;
		font-family: ui-monospace, monospace;
		color: #f3ece2;
	}

	:global(html[data-intro]) .room-layer {
		display: block;
	}

	canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		transition: opacity 0.9s ease;
	}

	canvas.live {
		opacity: 1;
	}

	.loading {
		position: absolute;
		left: 50%;
		top: 50%;
		translate: -50% -50%;
		font-size: 0.75rem;
		letter-spacing: 0.3em;
		color: rgb(243 236 226 / 0.65);
		animation: blink 1.2s steps(2) infinite;
	}

	.start {
		position: absolute;
		left: 50%;
		bottom: 9vh;
		translate: -50% 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.7rem;
	}

	/* A chunky Game Boy-style rubber pill with START on it, which visibly presses. */
	.start button {
		padding: 0.7rem 2.2rem;
		border-radius: 999px;
		font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
		font-style: italic;
		font-size: 0.95rem;
		letter-spacing: 0.18em;
		color: #e9e3da;
		cursor: pointer;
		position: relative;
		isolation: isolate;
		background: linear-gradient(180deg, #5d5a63, #3a3840 55%, #2b2930);
		box-shadow:
			0 5px 0 #17151b,
			0 8px 18px rgb(0 0 0 / 0.5),
			inset 0 1px 0 rgb(255 255 255 / 0.22);
		transition:
			translate 0.08s,
			box-shadow 0.08s;
	}

	/* A ring of the lantern's colours travels round the button, with a soft glow of the same colours
	   behind it that brightens on hover. */
	@property --angle {
		syntax: '<angle>';
		initial-value: 0deg;
		inherits: false;
	}

	.start button::before {
		content: '';
		position: absolute;
		inset: -3px;
		border-radius: inherit;
		background: conic-gradient(
			from var(--angle),
			#ffe2bf,
			#ff9a5c,
			#ff7fa6,
			#9be36f,
			#5ec8e8,
			#ffe2bf
		);
		animation: orbit 3s linear infinite;
		pointer-events: none;
		padding: 3px;
		mask:
			linear-gradient(#000 0 0) content-box exclude,
			linear-gradient(#000 0 0);
	}

	.start button::before {
		transition: filter 0.2s;
	}

	.start button:hover {
		color: #fff6ea;
		translate: 0 -2px;
		box-shadow:
			0 7px 0 #17151b,
			0 12px 22px rgb(0 0 0 / 0.5),
			inset 0 1px 0 rgb(255 255 255 / 0.28);
	}

	.start button:hover::before {
		filter: brightness(1.2) saturate(1.3);
	}

	@keyframes orbit {
		to {
			--angle: 360deg;
		}
	}

	.start button:active,
	.start button.pressed {
		translate: 0 4px;
		box-shadow:
			0 1px 0 #17151b,
			0 3px 8px rgb(0 0 0 / 0.5),
			inset 0 1px 0 rgb(255 255 255 / 0.15);
	}

	.start button:focus-visible {
		outline: 2px solid #ffb070;
		outline-offset: 5px;
	}

	/* Game-style dialog: a cream card with a thick outline and a hard drop shadow. */
	.panel {
		--ink: #3a2618;
		--cream: #fbf1df;
		position: absolute;
		right: clamp(1rem, 6vw, 5rem);
		top: 50%;
		translate: 0 -50%;
		width: min(19rem, calc(100vw - 2rem));
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.9rem;
		padding: 2rem 1.4rem 1.4rem;
		border: 4px solid var(--ink);
		border-radius: 26px;
		background: radial-gradient(circle at 20% 0%, #fffaf0 0, transparent 55%), var(--cream);
		color: var(--ink);
		box-shadow:
			0 7px 0 var(--ink),
			0 18px 40px rgb(0 0 0 / 0.45);
	}

	/* Bigger on desktop, where the room leaves plenty of space. */
	@media (min-width: 900px) and (min-height: 600px) {
		.panel {
			zoom: 1.3;
		}
	}

	.actions {
		display: flex;
		gap: 0.6rem;
	}

	.reset {
		background: #fbf1df;
		color: var(--ink);
	}

	.ribbon {
		position: absolute;
		top: -1rem;
		padding: 0.3rem 1.1rem;
		border: 3px solid var(--ink);
		border-radius: 999px;
		background: #ff8f5a;
		color: #fff7ec;
		font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
		font-style: italic;
		font-size: 0.75rem;
		letter-spacing: 0.18em;
		box-shadow: 0 3px 0 var(--ink);
		rotate: -3deg;
	}

	.panel h2 {
		font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
		font-style: italic;
		font-size: 1.15rem;
	}

	.swatches {
		display: grid;
		grid-template-columns: repeat(4, 2.6rem);
		gap: 0.7rem;
	}

	/* Glossy gems that pop in one after another, and bounce when hovered or picked. */
	.swatches button,
	.gem {
		position: relative;
		width: 2.6rem;
		height: 2.6rem;
		border: 3px solid var(--ink);
		border-radius: 50%;
		cursor: pointer;
		background:
			radial-gradient(circle at 32% 28%, rgb(255 255 255 / 0.75) 0 18%, transparent 19%),
			var(--swatch);
		box-shadow:
			0 4px 0 var(--ink),
			inset 0 -5px 0 rgb(0 0 0 / 0.18);
		animation: gem-in 0.45s calc(0.5s + var(--i) * 0.05s) both cubic-bezier(0.3, 1.6, 0.5, 1);
		transition:
			translate 0.15s cubic-bezier(0.3, 1.8, 0.5, 1),
			box-shadow 0.15s;
	}

	.swatches button:hover,
	.gem:hover {
		translate: 0 -3px;
		box-shadow:
			0 7px 0 var(--ink),
			inset 0 -5px 0 rgb(0 0 0 / 0.18);
	}

	.swatches button:active {
		translate: 0 3px;
		box-shadow:
			0 1px 0 var(--ink),
			inset 0 -5px 0 rgb(0 0 0 / 0.18);
	}

	.swatches button[aria-checked='true']::after {
		content: '';
		position: absolute;
		inset: -9px;
		border: 3px dashed var(--ink);
		border-radius: 50%;
		animation: spin 6s linear infinite;
	}

	.custom {
		background:
			radial-gradient(circle at 32% 28%, rgb(255 255 255 / 0.75) 0 18%, transparent 19%),
			conic-gradient(#ff5a5a, #ffd25a, #7be36f, #5ec8e8, #7a6bff, #ff7fd0, #ff5a5a);
		overflow: hidden;
	}

	.custom input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}

	.cube-ribbon {
		background: #4f8fe8;
	}

	.panel h2.cheer {
		animation: cheer 0.6s cubic-bezier(0.3, 1.8, 0.5, 1) both;
	}

	.hint {
		font-size: 0.72rem;
		line-height: 1.45;
		text-align: center;
		opacity: 0.8;
	}

	.actions .go {
		background: #ff8f5a;
	}

	.cube-panel .actions {
		gap: 0.45rem;
	}

	.cube-panel {
		width: min(21.5rem, calc(100vw - 2rem));
	}

	.cube-panel .back {
		padding-inline: 0.9rem;
		white-space: nowrap;
	}

	.back:disabled {
		opacity: 0.45;
		cursor: default;
		translate: 0 0;
		box-shadow: 0 4px 0 var(--ink);
	}

	.confetti {
		position: absolute;
		left: 50%;
		top: 0;
		pointer-events: none;
	}

	.confetti i {
		position: absolute;
		width: 0.5rem;
		height: 0.8rem;
		border: 2px solid var(--ink);
		border-radius: 2px;
		opacity: 0;
		animation: confetti 1.3s var(--delay) cubic-bezier(0.2, 0.7, 0.4, 1) both;
	}

	@keyframes confetti {
		0% {
			opacity: 1;
			translate: 0 0;
			rotate: 0deg;
		}
		35% {
			opacity: 1;
			translate: var(--x) var(--y);
		}
		100% {
			opacity: 0;
			translate: calc(var(--x) * 1.3) calc(var(--y) + 220px);
			rotate: var(--spin);
		}
	}

	@keyframes cheer {
		from {
			scale: 0.4;
			rotate: -8deg;
		}
	}

	.name {
		margin-top: -0.2rem;
		font-size: 0.78rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	/* A chunky slider with a moon at the dim end and a sun at the bright end. */
	.slider {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		width: 100%;
	}

	.end {
		font-size: 1.1rem;
		line-height: 1;
	}

	.slider input {
		flex: 1;
		height: 1.1rem;
		appearance: none;
		border: 3px solid var(--ink);
		border-radius: 999px;
		background: linear-gradient(90deg, #ffb070 var(--fill), #e9dcc6 var(--fill));
		box-shadow: inset 0 -3px 0 rgb(0 0 0 / 0.12);
		cursor: pointer;
	}

	.slider input::-webkit-slider-thumb {
		appearance: none;
		width: 1.6rem;
		height: 1.6rem;
		border: 3px solid var(--ink);
		border-radius: 50%;
		background: #fffaf0;
		box-shadow: 0 3px 0 var(--ink);
	}

	.slider input::-moz-range-thumb {
		width: 1.4rem;
		height: 1.4rem;
		border: 3px solid var(--ink);
		border-radius: 50%;
		background: #fffaf0;
		box-shadow: 0 3px 0 var(--ink);
	}

	.back {
		margin-top: 0.3rem;
		padding: 0.5rem 1.3rem;
		border: 3px solid var(--ink);
		border-radius: 999px;
		background: #5d5a63;
		color: #f3ece2;
		font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
		font-style: italic;
		font-size: 0.75rem;
		letter-spacing: 0.15em;
		cursor: pointer;
		box-shadow: 0 4px 0 var(--ink);
		transition:
			translate 0.08s,
			box-shadow 0.08s;
	}

	.back:active {
		translate: 0 3px;
		box-shadow: 0 1px 0 var(--ink);
	}

	@keyframes gem-in {
		from {
			scale: 0;
			opacity: 0;
		}
	}

	@keyframes spin {
		to {
			rotate: 360deg;
		}
	}

	@media (max-width: 640px) {
		.panel {
			top: auto;
			bottom: 4.5rem;
			left: 1rem;
			right: 1rem;
			width: auto;
			translate: 0 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.swatches button,
		.gem,
		.swatches button[aria-checked='true']::after,
		.panel h2.cheer,
		.confetti {
			animation: none;
		}

		.confetti {
			display: none;
		}
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
		color: rgb(243 236 226 / 0.65);
		text-shadow: 0 1px 6px rgb(0 0 0 / 0.6);
	}

	.corner button:hover {
		color: #fff;
	}

	@keyframes blink {
		50% {
			opacity: 0.35;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.loading,
		.start,
		.start button::before {
			animation: none;
		}
	}
</style>
