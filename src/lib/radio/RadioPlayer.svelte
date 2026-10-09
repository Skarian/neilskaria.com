<script lang="ts">
	import { onMount } from 'svelte';
	import { player, radio } from './player.svelte';

	// The site's radio, in the page's footer: the same radio as the clock radio in the room, so the
	// music carries on from one to the other. Off until it's switched on.

	const station = $derived(player.station());

	function power() {
		// Switching it on means wanting to hear it, even if the room's sound was turned off.
		if (!radio.on && radio.muted) player.setMuted(false);
		player.setOn(!radio.on);
	}

	onMount(() => player.load());
</script>

<div class="radio" role="group" aria-label="Radio">
	<button class="power" class:on={radio.on} aria-pressed={radio.on} onclick={power}>
		<span class="led"></span>{radio.on ? 'ON' : 'OFF'}
	</button>
	<button class="skip" onclick={() => player.skip(-1)} aria-label="Previous station">
		<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3 2 8l6 5zM15 3 9 8l6 5z" /></svg>
	</button>
	<p class="readout" class:on={radio.on} aria-live="polite">
		<span class="freq">{radio.freq.toFixed(1)}</span>
		<span class="name">{radio.on ? (station?.name ?? 'Static…') : 'Radio off'}</span>
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

	.led {
		width: 0.5rem;
		height: 0.5rem;
		border: 1.5px solid #4c4f69;
		border-radius: 50%;
		background: #ccd0da;
	}

	.power.on .led {
		background: #40d867;
		box-shadow: 0 0 5px #40d867;
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

	.freq {
		font-weight: 700;
		font-variant-numeric: tabular-nums;
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
		.readout {
			min-width: 0;
			flex: 1;
		}

		input {
			display: none;
		}
	}
</style>
