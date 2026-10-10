<script lang="ts">
	import { onMount } from 'svelte';
	import { player, radio } from './player.svelte';

	// The site's radio, in the page's footer: the same radio as the clock radio in the room, so the
	// music carries on from one to the other. Off until it's switched on.

	const station = $derived(player.station());
	// The station's name while on one (blinking while it comes in), or what the radio's doing.
	const label = $derived(
		{
			off: 'Radio off',
			static: 'Static…',
			tuning: station?.name ?? 'Tuning…',
			playing: station?.name ?? '',
			offair: 'Off air',
			blocked: 'Tap to listen'
		}[radio.status]
	);
	const link = $derived(radio.status === 'playing' ? player.link() : null);

	function power() {
		// Switching it on means wanting to hear it, even if the room's sound was turned off.
		if (!radio.on && radio.muted) player.setMuted(false);
		player.setOn(!radio.on);
	}

	onMount(() => player.load());
</script>

<div class="radio" role="group" aria-label="Radio">
	<button class="power" role="switch" aria-checked={radio.on} onclick={power}>
		POWER <span class="toggle" aria-hidden="true"><span></span></span>
	</button>
	<button class="skip" onclick={() => player.skip(-1)} aria-label="Previous station">
		<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3 2 8l6 5zM15 3 9 8l6 5z" /></svg>
	</button>
	<p class="readout" class:on={radio.on} data-status={radio.status} aria-live="polite">
		<span class="freq">{radio.freq.toFixed(1)}</span>
		<span class="name">{label}</span>
		{#if link}
			<a href={link} target="_blank" rel="noreferrer" aria-label="Open the stream">↗</a>
		{/if}
	</p>
	<button class="skip" onclick={() => player.skip(1)} aria-label="Next station">
		<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3l6 5-6 5zM1 3l6 5-6 5z" /></svg>
	</button>
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
</div>

<style>
	.radio {
		display: flex;
		align-items: center;
		/* Never wider than the page: the readout gives way (and truncates the name) instead. */
		min-width: 0;
		max-width: 100%;
		gap: 0.5rem;
		font-family: ui-monospace, monospace;
		font-size: 0.7rem;
		letter-spacing: 0.1em;
		color: #4c4f69;
	}

	button {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		height: 1.9rem;
		padding: 0 0.6rem;
		border: 2px solid #4c4f69;
		border-radius: 6px;
		background: #fff;
		cursor: pointer;
		box-shadow: 0 2px 0 #4c4f69;
		transition:
			translate 0.08s,
			box-shadow 0.08s;
	}

	button:active {
		translate: 0 2px;
		box-shadow: 0 0 0 #4c4f69;
	}

	.skip svg {
		width: 0.75rem;
		height: 0.75rem;
		fill: currentColor;
	}

	/* The power switch: green with the knob to the right when on. */
	.toggle {
		position: relative;
		width: 1.8rem;
		height: 1rem;
		border: 2px solid #4c4f69;
		border-radius: 999px;
		background: #bcc0cc;
		transition: background 0.2s;
	}

	.toggle span {
		position: absolute;
		top: 50%;
		left: 0.1rem;
		width: 0.6rem;
		height: 0.6rem;
		translate: 0 -50%;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 0 0 1.5px #4c4f69;
		transition: left 0.25s cubic-bezier(0.3, 1.6, 0.5, 1);
	}

	.power[aria-checked='true'] .toggle {
		background: #40d867;
	}

	.power[aria-checked='true'] .toggle span {
		left: calc(100% - 0.6rem - 0.1rem);
	}

	/* A little LED readout, like the clock radio's display. */
	.readout {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		min-width: 12.5rem;
		height: 1.9rem;
		padding: 0 0.7rem;
		border-radius: 6px;
		background: #1a0605;
		color: #6a2018;
		line-height: 1.9rem;
		white-space: nowrap;
		overflow: hidden;
		transition:
			color 0.2s,
			text-shadow 0.2s;
	}

	.readout.on {
		color: #ff3b2a;
		text-shadow: 0 0 6px rgb(255 59 42 / 0.6);
	}

	.readout[data-status='tuning'] .name,
	.readout[data-status='blocked'] .name {
		animation: blink 1s steps(2) infinite;
	}

	.readout[data-status='offair'] .name,
	.readout[data-status='static'] .name {
		color: #a8402f;
		text-shadow: none;
	}

	@keyframes blink {
		50% {
			opacity: 0.35;
		}
	}

	.freq {
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.readout a {
		color: inherit;
		text-decoration: none;
		opacity: 0.7;
	}

	.readout a:hover {
		opacity: 1;
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	input {
		width: 5rem;
		height: 0.6rem;
		appearance: none;
		border: 2px solid #4c4f69;
		border-radius: 999px;
		background: linear-gradient(90deg, #ea76cb var(--fill), #e6e9ef var(--fill));
		cursor: pointer;
	}

	input::-webkit-slider-thumb {
		appearance: none;
		width: 0.9rem;
		height: 0.9rem;
		border: 2px solid #4c4f69;
		border-radius: 50%;
		background: #fff;
	}

	input::-moz-range-thumb {
		width: 0.7rem;
		height: 0.7rem;
		border: 2px solid #4c4f69;
		border-radius: 50%;
		background: #fff;
	}

	@media (max-width: 520px) {
		.radio {
			width: 100%;
		}

		.readout {
			min-width: 0;
			width: 0;
			flex: 1;
		}

		input {
			display: none;
		}
	}
</style>
