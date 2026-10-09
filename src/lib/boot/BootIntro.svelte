<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { FM_MAX, FM_MIN, player, radio, STATIONS } from '#lib/radio/player.svelte.js';
	import type { BonsaiState, CubeState, Room, RoomMode, Thing } from './engine';
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
	// The lantern's colour and brightness, so it's as it was left.
	const LANTERN_KEY = 'lantern';
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
	// Saving only starts once the saved lantern has been read, so the defaults never overwrite it.
	let lanternLoaded = false;
	$effect(() => {
		// Read both first, so the effect tracks them even before the room has loaded.
		const color = lanternColor;
		const level = lanternLevel;
		engine?.setLantern(color, level);
		if (lanternLoaded) localStorage.setItem(LANTERN_KEY, JSON.stringify({ color, level }));
	});
	let engine: Room | undefined;
	// Muting is site-wide: the room's sounds and the radio together.
	$effect(() => {
		const muted = radio.muted;
		engine?.setMuted(muted);
	});
	// The clock radio shows whatever the site's radio is doing.
	$effect(() => {
		const state = { on: radio.on, freq: radio.freq };
		engine?.setRadio(state);
	});

	// On phones the open panel sits at the bottom: the room frames the object in the space above it,
	// so it's told how much that is whenever the panel opens or changes size.
	$effect(() => {
		if (!focused) return;
		let observer: ResizeObserver | undefined;
		const report = () => {
			const panel = layer?.querySelector<HTMLElement>('.panel');
			if (!panel) return;
			const box = panel.getBoundingClientRect();
			if (innerWidth <= 640 || innerWidth <= innerHeight)
				engine?.setFree('above', box.top / innerHeight);
			else engine?.setFree('left', box.left / innerWidth);
		};
		void tick().then(() => {
			const panel = layer?.querySelector<HTMLElement>('.panel');
			if (!panel) return;
			report();
			observer = new ResizeObserver(report);
			observer.observe(panel);
		});
		addEventListener('resize', report);
		return () => {
			observer?.disconnect();
			removeEventListener('resize', report);
		};
	});

	// The Rubik's cube's state, from the room.
	let cube = $state<CubeState>({ scrambled: false, solved: false, busy: false });

	// Where a frequency sits along the panel's dial, as a percentage.
	const dialAt = (freq: number) => ((freq - FM_MIN) / (FM_MAX - FM_MIN)) * 100;
	const station = $derived(player.station());

	// The bonsai's state, from the room: how far its shoots reach on average, from bare (0) through
	// neat (1) to wild (about 1.7).
	let bonsai = $state<BonsaiState>({ shagginess: 1 });
	const GROWTH_MAX = 1.7;
	// The turn wheel: dragged sideways, it turns the tree; its ridges roll with it.
	let wheel: { x: number; by: number } | null = null;
	let wheelRoll = $state(0);
	function wheelDown(event: PointerEvent) {
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		wheel = { x: event.clientX, by: 0 };
	}
	function wheelMove(event: PointerEvent) {
		if (!wheel) return;
		const dx = event.clientX - wheel.x;
		wheel.x = event.clientX;
		wheel.by = dx * 0.012;
		wheelRoll += dx;
		engine?.turnBonsai(wheel.by);
	}
	function wheelUp() {
		if (wheel) engine?.releaseBonsai(wheel.by);
		wheel = null;
	}
	const treeLooks = $derived(
		bonsai.shagginess > 1.35
			? 'Needs a trim'
			: bonsai.shagginess > 1.1
				? 'Getting shaggy'
				: bonsai.shagginess > 0.85
					? 'Looking neat'
					: bonsai.shagginess > 0.2
						? 'Freshly trimmed'
						: 'Bare branches'
	);

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
			muted: radio.muted,
			startIn,
			onProgress: (value) => (progress = value),
			onMode,
			onFocus: (thing) => {
				// Picking up the clock radio switches it on (still inside the click, so sound can play);
				// putting it down while it's only playing static switches it off.
				if (thing === 'clock' && !radio.on) {
					// Left between stations last time: find the nearest one, rather than start on static.
					if (!player.station())
						player.sweep(
							STATIONS.reduce((a, b) =>
								Math.abs(b.freq - radio.freq) < Math.abs(a.freq - radio.freq) ? b : a
							).freq
						);
					player.setOn(true);
				}
				if (focused === 'clock' && thing !== 'clock' && radio.on && !player.station())
					player.setOn(false);
				focused = thing;
			},
			onCube: (state) => (cube = state),
			onBonsai: (state) => (bonsai = state),
			// The music dips a little under the boot chime.
			onChime: (playing) => player.duck(playing)
		});
		engine.setLantern(lanternColor, lanternLevel);
		engine.setRadio({ on: radio.on, freq: radio.freq });
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
		player.setMuted(!radio.muted);
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
		player.load();
		try {
			const saved = JSON.parse(localStorage.getItem(LANTERN_KEY) ?? 'null');
			if (typeof saved?.color === 'string') lanternColor = saved.color;
			if (typeof saved?.level === 'number') lanternLevel = Math.min(1.5, Math.max(0, saved.level));
		} catch {
			// Nothing saved: Paper white, full brightness.
		}
		lanternLoaded = true;
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

	{#if focused === 'clock'}
		<aside
			class="panel radio-panel"
			aria-label="Clock radio"
			in:pop={{ delay: 350 }}
			out:pop={{ duration: 220 }}
		>
			<p class="ribbon radio-ribbon">RADIO</p>
			<h2>{radio.on ? (station?.name ?? 'Static…') : 'Radio off'}</h2>
			<div class="dial" style:--at="{dialAt(radio.freq)}%">
				<div class="scale" aria-hidden="true">
					{#each [88, 92, 96, 100, 104, 108] as mhz (mhz)}
						<span style:left="{dialAt(mhz)}%">{mhz}</span>
					{/each}
					{#each STATIONS as s (s.freq)}
						<i style:left="{dialAt(s.freq)}%"></i>
					{/each}
				</div>
				<input
					type="range"
					min={FM_MIN}
					max={FM_MAX}
					step="0.1"
					value={radio.freq}
					oninput={(event) => player.tune(Number(event.currentTarget.value))}
					aria-label="Tuning"
					aria-valuetext="{radio.freq.toFixed(1)} FM"
				/>
			</div>
			<p class="freq" class:on={radio.on}>{radio.freq.toFixed(1)} <small>FM</small></p>
			<div class="presets" role="group" aria-label="Stations">
				{#each STATIONS as s, i (s.freq)}
					<button
						aria-label={s.name}
						title={s.name}
						aria-pressed={station === s}
						style:--i={i}
						onclick={() => {
							player.sweep(s.freq);
							if (!radio.on) player.setOn(true);
						}}>{i + 1}</button
					>
				{/each}
			</div>
			<label class="slider">
				<svg class="end icon" viewBox="0 0 24 24" aria-hidden="true"
					><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" /></svg
				>
				<input
					type="range"
					min="0"
					max="1"
					step="0.01"
					value={radio.volume}
					oninput={(event) => player.setVolume(Number(event.currentTarget.value))}
					aria-label="Volume"
					style:--fill="{radio.volume * 100}%"
				/>
				<svg class="end icon" viewBox="0 0 24 24" aria-hidden="true"
					><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" /><path
						d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/></svg
				>
			</label>
			<div class="actions">
				<button class="back" onclick={() => engine?.unfocus()}>◀ BACK</button>
				<button
					class="power"
					role="switch"
					aria-checked={radio.on}
					onclick={() => player.setOn(!radio.on)}
				>
					POWER <span class="toggle" aria-hidden="true"><span></span></span>
				</button>
			</div>
		</aside>
	{/if}

	{#if focused === 'bonsai'}
		<aside
			class="panel bonsai-panel"
			aria-label="Bonsai"
			in:pop={{ delay: 350 }}
			out:pop={{ duration: 220 }}
		>
			<p class="ribbon bonsai-ribbon">BONSAI</p>
			<h2>{treeLooks}</h2>
			<!-- How the tree's growing: trimmed on the left, neat in the middle, shaggy on the right. -->
			<div
				class="growth"
				role="meter"
				aria-label="Growth"
				aria-valuemin={0}
				aria-valuemax={GROWTH_MAX}
				aria-valuenow={bonsai.shagginess}
				aria-valuetext={treeLooks}
				style:--at="{Math.min(1, bonsai.shagginess / GROWTH_MAX) * 100}%"
			>
				<span class="fill" aria-hidden="true"></span>
				<span class="neat" aria-hidden="true"></span>
			</div>
			<p class="ends" aria-hidden="true">
				<span>BARE</span><span>NEAT</span><span>WILD</span>
			</p>
			<p class="hint">Slash to cut, tap to snip. Roll the wheel to turn the tree.</p>
			<div
				class="wheel"
				role="slider"
				tabindex="0"
				aria-label="Turn the tree"
				aria-valuenow={0}
				style:--roll="{wheelRoll}px"
				onpointerdown={wheelDown}
				onpointermove={wheelMove}
				onpointerup={wheelUp}
				onpointercancel={wheelUp}
				onkeydown={(event) => {
					if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
						event.preventDefault();
						const by = event.key === 'ArrowLeft' ? -0.3 : 0.3;
						wheelRoll += by * 80;
						engine?.turnBonsai(by);
					}
				}}
			>
				<span aria-hidden="true">◀ TURN ▶</span>
			</div>
			<div class="actions">
				<button class="back" onclick={() => engine?.unfocus()}>◀ BACK</button>
				<button class="back go water" onclick={() => engine?.waterBonsai()}>WATER</button>
				<button class="back reset" onclick={() => engine?.resetBonsai()}>↺ RESET</button>
			</div>
		</aside>
	{/if}

	<div class="corner">
		<button
			class="pill"
			role="switch"
			aria-checked={!radio.muted}
			aria-label="Sound"
			onclick={toggleSound}
		>
			<svg class="note" viewBox="0 0 24 24" aria-hidden="true"
				><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle
					cx="17"
					cy="16"
					r="3"
				/></svg
			>
			<span class="toggle" aria-hidden="true"><span></span></span>
		</button>
		{#if phase !== 'page'}
			<button class="pill" onclick={() => engine?.skipToSite()}
				>SKIP <span aria-hidden="true">▸</span></button
			>
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

	/* While the room's up, the page behind it is the room's colour too, so a phone's browser bar
	   sliding away never uncovers a strip of white. */
	:global(html[data-intro]),
	:global(html[data-intro] body) {
		background: #0b0a0e;
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
	@media (min-width: 1200px) and (min-height: 700px) {
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

	.radio-ribbon {
		background: #e2574c;
	}

	/* The tuning dial, like the clock radio's own: a dark strip with a printed scale, little marks
	   where the stations are, and a red pointer to drag. */
	.dial {
		position: relative;
		width: 100%;
		height: 3rem;
		border: 3px solid var(--ink);
		border-radius: 12px;
		background: linear-gradient(180deg, #2a2320, #1a1513);
		box-shadow: inset 0 3px 6px rgb(0 0 0 / 0.5);
	}

	.scale {
		position: absolute;
		inset: 0 0.9rem;
		pointer-events: none;
	}

	.scale span {
		position: absolute;
		top: 0.35rem;
		translate: -50% 0;
		font-size: 0.6rem;
		letter-spacing: 0.05em;
		color: #e9dcc6;
	}

	.scale span::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 1rem;
		width: 1px;
		height: 0.45rem;
		background: #e9dcc6;
	}

	.scale i {
		position: absolute;
		bottom: 0.35rem;
		width: 0.4rem;
		height: 0.4rem;
		translate: -50% 0;
		border-radius: 50%;
		background: #ffb070;
	}

	.dial input {
		position: absolute;
		inset: 0 calc(0.9rem - 0.7rem);
		width: calc(100% - 2 * (0.9rem - 0.7rem));
		height: 100%;
		appearance: none;
		background: none;
		cursor: ew-resize;
	}

	/* The pointer: a thin red line the full height of the dial, with a wide invisible grip. */
	.dial input::-webkit-slider-thumb {
		appearance: none;
		width: 1.4rem;
		height: 2.9rem;
		background: linear-gradient(
			90deg,
			transparent calc(50% - 1.5px),
			#ff3b2a 0 calc(50% + 1.5px),
			transparent 0
		);
		filter: drop-shadow(0 0 3px rgb(255 60 40 / 0.8));
	}

	.dial input::-moz-range-thumb {
		width: 1.4rem;
		height: 2.9rem;
		border: 0;
		border-radius: 0;
		background: linear-gradient(
			90deg,
			transparent calc(50% - 1.5px),
			#ff3b2a 0 calc(50% + 1.5px),
			transparent 0
		);
	}

	.freq {
		margin-top: -0.2rem;
		padding: 0.2rem 0.8rem;
		border-radius: 8px;
		background: #1a0605;
		font-family: ui-monospace, monospace;
		font-size: 1rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: #5a1a14;
		transition:
			color 0.2s,
			text-shadow 0.2s;
	}

	.freq.on {
		color: #ff3b2a;
		text-shadow: 0 0 8px rgb(255 59 42 / 0.7);
	}

	.freq small {
		font-size: 0.65rem;
	}

	/* Preset buttons, chunky like a car radio's. */
	.presets {
		display: flex;
		gap: 0.6rem;
	}

	.presets button {
		width: 2.6rem;
		height: 2.3rem;
		border: 3px solid var(--ink);
		border-radius: 10px;
		background: #fffaf0;
		color: var(--ink);
		font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
		font-size: 0.95rem;
		cursor: pointer;
		box-shadow: 0 4px 0 var(--ink);
		animation: gem-in 0.45s calc(0.5s + var(--i) * 0.05s) both cubic-bezier(0.3, 1.6, 0.5, 1);
		transition:
			translate 0.08s,
			box-shadow 0.08s,
			background 0.15s;
	}

	.presets button:hover {
		translate: 0 -2px;
		box-shadow: 0 6px 0 var(--ink);
	}

	.presets button:active,
	.presets button[aria-pressed='true'] {
		translate: 0 3px;
		box-shadow: 0 1px 0 var(--ink);
	}

	.presets button[aria-pressed='true'] {
		background: #ffb070;
	}

	/* The power switch: a label and a sliding toggle, green with the knob to the right when on. */
	.power {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-top: 0.3rem;
		padding: 0.4rem 0.7rem 0.4rem 1.1rem;
		border: 3px solid var(--ink);
		border-radius: 999px;
		background: #fffaf0;
		color: var(--ink);
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

	.power:active {
		translate: 0 3px;
		box-shadow: 0 1px 0 var(--ink);
	}

	.toggle {
		position: relative;
		width: 2.6rem;
		height: 1.4rem;
		border: 3px solid var(--ink);
		border-radius: 999px;
		background: #8a8590;
		box-shadow: inset 0 2px 0 rgb(0 0 0 / 0.2);
		transition: background 0.2s;
	}

	.toggle span {
		position: absolute;
		top: 50%;
		left: 0.12rem;
		width: 0.95rem;
		height: 0.95rem;
		translate: 0 -50%;
		border: 2px solid var(--ink);
		border-radius: 50%;
		background: #fffaf0;
		transition: left 0.25s cubic-bezier(0.3, 1.6, 0.5, 1);
	}

	.power[aria-checked='true'] .toggle {
		background: #4fd66e;
	}

	.power[aria-checked='true'] .toggle span {
		left: calc(100% - 0.95rem - 0.12rem);
	}

	.icon {
		width: 1.2rem;
		height: 1.2rem;
		flex: none;
	}

	.bonsai-ribbon {
		background: #5f9e4f;
	}

	.actions .water {
		background: #5ec8e8;
	}

	/* The growth meter: a track from trimmed to shaggy, a mark at neat, and a pointer for the tree. */
	.growth {
		position: relative;
		width: 100%;
		height: 1.1rem;
		border: 3px solid var(--ink);
		border-radius: 999px;
		background: #e9dcc6;
		overflow: hidden;
		box-shadow: inset 0 -3px 0 rgb(0 0 0 / 0.12);
	}

	.growth .neat {
		position: absolute;
		left: calc(1 / 1.7 * 100%);
		top: 0;
		bottom: 0;
		width: 3px;
		z-index: 1;
		translate: -50% 0;
		border-radius: 2px;
		background: var(--ink);
	}

	/* How grown the tree is, as a level filling the gauge: pale new growth, through neat, to wild. */
	.growth .fill {
		position: absolute;
		inset: 0 auto 0 0;
		width: var(--at);
		background: linear-gradient(90deg, #cfe3a8, #7fbf63 50%, #3f6f2c);
		transition: width 0.25s ease-out;
	}

	/* A ridged thumbwheel, like the clock radio's tuning wheel: its ridges roll as it's dragged. */
	.wheel {
		position: relative;
		width: 100%;
		height: 2.6rem;
		display: grid;
		place-items: center;
		border: 3px solid var(--ink);
		border-radius: 14px;
		background:
			linear-gradient(
				90deg,
				rgb(0 0 0 / 0.45),
				transparent 22%,
				transparent 78%,
				rgb(0 0 0 / 0.45)
			),
			repeating-linear-gradient(90deg, #6b5a4c 0 6px, #3f342c 6px 9px) var(--roll) 0 / auto;
		box-shadow:
			0 4px 0 var(--ink),
			inset 0 2px 0 rgb(255 255 255 / 0.15);
		cursor: ew-resize;
		touch-action: none;
		user-select: none;
	}

	.wheel span {
		padding: 0.15rem 0.6rem;
		border-radius: 999px;
		background: rgb(251 241 223 / 0.92);
		font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
		font-style: italic;
		font-size: 0.65rem;
		letter-spacing: 0.15em;
		pointer-events: none;
	}

	.wheel:focus-visible {
		outline: 2px solid #ff8f5a;
		outline-offset: 3px;
	}

	.ends {
		display: flex;
		justify-content: space-between;
		width: 100%;
		margin-top: -0.5rem;
		font-size: 0.6rem;
		letter-spacing: 0.12em;
		opacity: 0.7;
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

	.cube-panel .actions,
	.bonsai-panel .actions {
		gap: 0.45rem;
	}

	.cube-panel,
	.bonsai-panel {
		width: min(21.5rem, calc(100vw - 2rem));
	}

	.cube-panel .back,
	.bonsai-panel .back {
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
		white-space: nowrap;
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

	/* On phones (and any upright screen, like a tablet held portrait) the panel docks at the bottom,
	   compact, with the corner buttons moved up out of its way. */
	@media (max-width: 640px), (max-aspect-ratio: 1/1) {
		.panel {
			top: auto;
			bottom: 0.75rem;
			left: 0.75rem;
			right: 0.75rem;
			width: auto;
			max-width: 26rem;
			margin-inline: auto;
			translate: 0 0;
			zoom: 1;
			gap: 0.65rem;
			padding: 1.5rem 1rem 1rem;
		}

		.panel h2 {
			font-size: 1.05rem;
		}

		.hint {
			font-size: 0.68rem;
			line-height: 1.35;
		}

		.wheel {
			height: 2.2rem;
		}

		/* The buttons share the width, so they never spill out, whatever the text size. */
		.panel .actions {
			width: 100%;
		}

		.panel .actions > button {
			flex: 1 1 0;
			min-width: 0;
			padding-inline: 0.3rem;
			justify-content: center;
			font-size: min(0.75rem, 3vw);
			letter-spacing: 0.08em;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.swatches button,
		.gem,
		.swatches button[aria-checked='true']::after,
		.panel h2.cheer,
		.presets button,
		.confetti {
			animation: none;
		}

		.confetti {
			display: none;
		}
	}

	/* Top right: a sound switch (a music note and a toggle, like the radio's power) and SKIP. */
	.corner {
		position: absolute;
		top: 1rem;
		right: 1rem;
		display: flex;
		gap: 0.6rem;
	}

	.pill {
		--ink: #3a2618;
		display: flex;
		align-items: center;
		gap: 0.45rem;
		height: 2.2rem;
		padding: 0 0.85rem;
		border: 3px solid var(--ink);
		border-radius: 999px;
		background: #fffaf0;
		color: var(--ink);
		font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
		font-style: italic;
		font-size: 0.72rem;
		letter-spacing: 0.15em;
		cursor: pointer;
		box-shadow: 0 3px 0 var(--ink);
		transition:
			translate 0.08s,
			box-shadow 0.08s;
	}

	.pill:active {
		translate: 0 2px;
		box-shadow: 0 1px 0 var(--ink);
	}

	.note {
		width: 1.05rem;
		height: 1.05rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2.4;
		stroke-linejoin: round;
	}

	.note circle {
		fill: currentColor;
	}

	.pill .toggle {
		width: 2rem;
		height: 1.15rem;
		border-width: 2.5px;
	}

	.pill .toggle span {
		width: 0.7rem;
		height: 0.7rem;
	}

	.pill[aria-checked='true'] .toggle {
		background: #4fd66e;
	}

	.pill[aria-checked='true'] .toggle span {
		left: calc(100% - 0.7rem - 0.12rem);
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
