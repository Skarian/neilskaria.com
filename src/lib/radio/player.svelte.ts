// The site's radio: one radio, shared by the clock radio in the room, its panel, and the player in
// the page's footer, so the music carries on from the room into the site and across pages. It's
// always off when a visit starts (sound needs a click anyway); the station, volume and mute are
// remembered.

import { createRadio, FM_MAX, FM_MIN, STATIONS, stationAt } from './radio';

export { FM_MAX, FM_MIN, STATIONS, stationAt };

const RADIO_KEY = 'radio';
const MUTED_KEY = 'boot-muted';

export const radio = $state({
	on: false,
	freq: STATIONS[0].freq,
	volume: 0.7,
	// Everything silenced, from the room's SOUND ON/OFF.
	muted: false
});

let audio: { ctx: AudioContext; synth: ReturnType<typeof createRadio>; duck: GainNode } | null =
	null;
let sweep = 0;
let loaded = false;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Restores the station, volume and mute from last time.
function load() {
	if (loaded || typeof localStorage === 'undefined') return;
	loaded = true;
	try {
		const saved = JSON.parse(localStorage.getItem(RADIO_KEY) ?? 'null');
		if (typeof saved?.freq === 'number') radio.freq = clamp(saved.freq, FM_MIN, FM_MAX);
		if (typeof saved?.volume === 'number') radio.volume = clamp(saved.volume, 0, 1);
		radio.muted = localStorage.getItem(MUTED_KEY) === '1';
	} catch {
		// Nothing saved, or unreadable: the defaults stand.
	}
}

function save() {
	try {
		localStorage.setItem(RADIO_KEY, JSON.stringify({ freq: radio.freq, volume: radio.volume }));
		localStorage.setItem(MUTED_KEY, radio.muted ? '1' : '0');
	} catch {
		// The radio just won't remember.
	}
}

// The audio is only set up once the radio is first switched on (a click, so the browser allows it).
function apply() {
	if (!audio) {
		if (!radio.on) return;
		const ctx = new AudioContext();
		const duck = ctx.createGain();
		duck.connect(ctx.destination);
		audio = { ctx, synth: createRadio(ctx, duck), duck };
	}
	if (radio.on) void audio.ctx.resume();
	audio.synth.set({ on: radio.on, freq: radio.freq, volume: radio.muted ? 0 : radio.volume });
}

export const player = {
	load,
	station: () => stationAt(radio.freq),
	setOn(on: boolean) {
		load();
		radio.on = on;
		apply();
	},
	// Straight to a frequency, as the dial is dragged.
	tune(freq: number) {
		cancelAnimationFrame(sweep);
		radio.freq = clamp(freq, FM_MIN, FM_MAX);
		apply();
		save();
	},
	// Across to a frequency, through whatever's in between.
	sweep(freq: number) {
		cancelAnimationFrame(sweep);
		const from = radio.freq;
		const to = clamp(freq, FM_MIN, FM_MAX);
		const duration = (0.3 + Math.abs(to - from) * 0.05) * 1000;
		const start = performance.now();
		const step = (now: number) => {
			const t = Math.min(1, (now - start) / duration);
			const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
			radio.freq = from + (to - from) * eased;
			apply();
			if (t < 1) sweep = requestAnimationFrame(step);
			else save();
		};
		sweep = requestAnimationFrame(step);
	},
	// The next or previous station along the band, wrapping round.
	skip(direction: 1 | -1) {
		const here = STATIONS.findIndex((s) => s === stationAt(radio.freq));
		const next =
			here >= 0
				? (here + direction + STATIONS.length) % STATIONS.length
				: direction > 0
					? Math.max(
							0,
							STATIONS.findIndex((s) => s.freq > radio.freq)
						)
					: STATIONS.findLastIndex((s) => s.freq < radio.freq);
		player.sweep(STATIONS[next < 0 ? STATIONS.length - 1 : next].freq);
		if (!radio.on) player.setOn(true);
	},
	setVolume(volume: number) {
		radio.volume = clamp(volume, 0, 1);
		apply();
		save();
	},
	setMuted(muted: boolean) {
		radio.muted = muted;
		apply();
		save();
	},
	// Turns the music down a little (under the boot chime), and back up.
	duck(down: boolean) {
		if (!audio) return;
		audio.duck.gain.setTargetAtTime(down ? 0.4 : 1, audio.ctx.currentTime, down ? 0.15 : 0.6);
	}
};
