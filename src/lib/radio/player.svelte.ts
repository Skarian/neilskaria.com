// The site's radio: one radio, shared by the clock radio in the room, its panel, and the player in
// the page's footer, so the music carries on from the room into the site and across pages. It's
// always off when a visit starts; the station, volume and mute are remembered, and for someone who's
// listened before, their station is got ready in the background so it starts almost at once.
//
// Most stations are live YouTube streams, played by a hidden player; between stations there's
// static, and one station (Grove) is played right here. Both of those are synthesized locally.

import { createRadio } from './radio';
import { FM_MAX, FM_MIN, STATIONS, STREAMS, stationAt, type Station } from './stations';
import { createStreamPlayer, type StreamStatus } from './youtube';

export { FM_MAX, FM_MIN, STATIONS, STREAMS, stationAt };

const RADIO_KEY = 'radio';
const MUTED_KEY = 'boot-muted';

// What's coming out of the speaker: nothing, static, a stream starting up, music, a stream that's
// gone off air, or a stream the browser won't start until there's another tap.
export type RadioStatus = 'off' | 'static' | 'tuning' | 'playing' | 'offair' | 'blocked';

export const radio = $state({
	on: false,
	freq: STREAMS[0].freq,
	volume: 0.7,
	// Everything silenced, from the room's sound switch.
	muted: false,
	status: 'off' as RadioStatus
});

// Which stream each station is playing right now (by frequency), as the server last said.
const streams: Record<string, string> = Object.fromEntries(
	STREAMS.map((s) => [s.freq.toFixed(1), s.known[0]])
);
let streamsFetched: Promise<void> | undefined;

let local: { ctx: AudioContext; synth: ReturnType<typeof createRadio> } | null = null;
let stream: ReturnType<typeof createStreamPlayer> | null = null;
let streamStatus: StreamStatus = 'idle';
let streamFor: string | null = null;
let settle: ReturnType<typeof setTimeout> | undefined;
let sweep = 0;
let loaded = false;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function fetchStreams() {
	streamsFetched ??= fetch('/api/stations')
		.then((res) => (res.ok ? res.json() : null))
		.then((data: { stations?: Record<string, string> } | null) => {
			for (const [freq, id] of Object.entries(data?.stations ?? {})) streams[freq] = id;
		})
		.catch(() => {
			// The built-in streams stand.
		});
	return streamsFetched;
}

const streamOf = (station: Station | null) =>
	station?.kind === 'stream' ? (streams[station.freq.toFixed(1)] ?? null) : null;

function getStream() {
	stream ??= createStreamPlayer((status, id) => {
		if (id !== null && id !== streamFor) return; // From a stream since tuned away from.
		streamStatus = status;
		updateStatus();
	});
	return stream;
}

function updateStatus() {
	const station = stationAt(radio.freq);
	radio.status = !radio.on
		? 'off'
		: !station
			? 'static'
			: station.kind === 'local'
				? 'playing'
				: streamFor !== streamOf(station)
					? 'tuning'
					: streamStatus === 'playing'
						? 'playing'
						: streamStatus === 'error'
							? 'offair'
							: streamStatus === 'blocked'
								? 'blocked'
								: 'tuning';
}

// Restores the station, volume and mute from last time; for someone who's listened before, gets
// their station ready in the background once the page is idle.
function load() {
	if (loaded || typeof localStorage === 'undefined') return;
	loaded = true;
	let listened = false;
	try {
		const saved = JSON.parse(localStorage.getItem(RADIO_KEY) ?? 'null');
		if (typeof saved?.freq === 'number') radio.freq = clamp(saved.freq, FM_MIN, FM_MAX);
		if (typeof saved?.volume === 'number') radio.volume = clamp(saved.volume, 0, 1);
		listened = saved?.listened === true;
		radio.muted = localStorage.getItem(MUTED_KEY) === '1';
	} catch {
		// Nothing saved, or unreadable: the defaults stand.
	}
	const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
	if (listened && !connection?.saveData) {
		const ready = async () => {
			await fetchStreams();
			const id = streamOf(stationAt(radio.freq));
			if (id && !radio.on) {
				streamFor = id;
				await getStream().cue(id);
			}
		};
		if ('requestIdleCallback' in window) requestIdleCallback(() => void ready(), { timeout: 5000 });
		else setTimeout(() => void ready(), 2500);
	}
}

function save() {
	try {
		localStorage.setItem(
			RADIO_KEY,
			JSON.stringify({ freq: radio.freq, volume: radio.volume, listened: true })
		);
		localStorage.setItem(MUTED_KEY, radio.muted ? '1' : '0');
	} catch {
		// The radio just won't remember.
	}
}

// Static and Grove, made here once the radio is first switched on (a click, so sound is allowed).
function applyLocal() {
	if (!local) {
		if (!radio.on) return;
		const ctx = new AudioContext({ latencyHint: 'playback' });
		local = { ctx, synth: createRadio(ctx, ctx.destination) };
	}
	if (radio.on) void local.ctx.resume();
	local.synth.set({ on: radio.on, freq: radio.freq, volume: radio.muted ? 0 : radio.volume });
}

// The stream follows the dial once it settles on a station (not on every step of a sweep).
function applyStream(now = false) {
	clearTimeout(settle);
	const run = async () => {
		const station = stationAt(radio.freq);
		if (!radio.on || station?.kind !== 'stream') {
			streamFor = null;
			if (stream) await stream.stop();
			updateStatus();
			return;
		}
		await fetchStreams();
		const id = streamOf(station);
		if (!id || !radio.on || stationAt(radio.freq) !== station) return;
		const s = getStream();
		void s.setVolume(radio.muted ? 0 : radio.volume);
		if (id === streamFor && streamStatus === 'playing') return;
		streamFor = id;
		streamStatus = 'loading';
		updateStatus();
		await s.play(id);
	};
	if (now) void run();
	else settle = setTimeout(() => void run(), 250);
}

function apply(now = false) {
	applyLocal();
	applyStream(now);
	updateStatus();
}

// The browser held a stream back until there's a tap: the next tap anywhere starts it.
if (typeof window !== 'undefined')
	addEventListener('pointerdown', () => {
		if (radio.status === 'blocked') applyStream(true);
	});

export const player = {
	load,
	station: () => stationAt(radio.freq),
	// Where to find the stream the radio's on, to credit it.
	link: () => {
		const id = streamOf(stationAt(radio.freq));
		return id ? `https://www.youtube.com/watch?v=${id}` : null;
	},
	setOn(on: boolean) {
		load();
		radio.on = on;
		apply(true);
		save();
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
			if (t < 1) {
				applyLocal();
				updateStatus();
				sweep = requestAnimationFrame(step);
			} else {
				apply(true);
				save();
			}
		};
		sweep = requestAnimationFrame(step);
	},
	// The next or previous preset (the streamed stations), wrapping round.
	skip(direction: 1 | -1) {
		const here = STREAMS.findIndex((s) => s === stationAt(radio.freq));
		const next =
			here >= 0
				? (here + direction + STREAMS.length) % STREAMS.length
				: direction > 0
					? Math.max(
							0,
							STREAMS.findIndex((s) => s.freq > radio.freq)
						)
					: STREAMS.findLastIndex((s) => s.freq < radio.freq);
		player.sweep(STREAMS[next < 0 ? STREAMS.length - 1 : next].freq);
		if (!radio.on) player.setOn(true);
	},
	setVolume(volume: number) {
		radio.volume = clamp(volume, 0, 1);
		applyLocal();
		void stream?.setVolume(radio.muted ? 0 : radio.volume);
		save();
	},
	setMuted(muted: boolean) {
		radio.muted = muted;
		applyLocal();
		void stream?.setVolume(radio.muted ? 0 : radio.volume);
		save();
	}
};
