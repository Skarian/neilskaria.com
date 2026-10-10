// The radio's local sound: the static between stations, and Grove, the one station played right
// here (at the far end of the dial, needing no internet). Grove is an original little waltz in the
// spirit of a fairy-tale adventure: an ocarina-like melody over harp arpeggios and a soft pad. The
// streamed stations play through the hidden YouTube player instead (see youtube.ts).

import { GROVE, reception, STATIONS } from './stations';

type Play = ReturnType<typeof players>;

// Grove, in 3/4: twelve sixteenth-note steps to a bar, sixteen bars round. It's mixed to sit about as
// loud as the streams (which YouTube evens out to a standard loudness); static sits well under both.
const GROVE_BPM = 84;
// Each bar's melody, a note (MIDI) or 0 per beat; a note followed by 0s is held.
const MELODY = [
	[74, 78, 81],
	[79, 0, 76],
	[78, 76, 74],
	[71, 0, 0],
	[74, 78, 83],
	[81, 0, 79],
	[78, 79, 76],
	[74, 0, 0],
	[81, 79, 78],
	[76, 0, 78],
	[79, 78, 76],
	[73, 0, 0],
	[74, 76, 78],
	[83, 0, 81],
	[79, 76, 73],
	[74, 0, 0]
];
// Each bar's chord: root, third, fifth.
const CHORDS = [
	[50, 54, 57],
	[55, 59, 62],
	[50, 54, 57],
	[47, 50, 54],
	[50, 54, 57],
	[57, 61, 64],
	[55, 59, 62],
	[50, 54, 57],
	[54, 57, 61],
	[47, 50, 54],
	[55, 59, 62],
	[57, 61, 64],
	[50, 54, 57],
	[55, 59, 62],
	[57, 61, 64],
	[50, 54, 57]
];

function grove(play: Play, step: number, time: number, length: number) {
	const bar = Math.floor(step / 12) % MELODY.length;
	const s = step % 12;
	const chord = CHORDS[bar];
	if (s % 4 === 0) {
		const beat = s / 4;
		const note = MELODY[bar][beat];
		if (note) {
			let held = 1;
			while (beat + held < 3 && MELODY[bar][beat + held] === 0) held++;
			play.ocarina(time, note, length * 4 * held, 0.18);
		}
	}
	// The harp: the root on the downbeat, then the chord rolled upwards.
	if (s === 0) play.harp(time, chord[0] - 12, 0.16);
	if (s === 4 || s === 8)
		for (const [k, n] of chord.entries()) play.harp(time + k * 0.04, n + 12, 0.07);
	if (s === 0 && bar % 2 === 0) for (const n of chord) play.pad(time, n, length * 24, 0.024, 1.2);
}

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

function players(ctx: AudioContext, out: AudioNode) {
	function envelope(time: number, peak: number, attack: number, length: number, release: number) {
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0, time);
		gain.gain.linearRampToValueAtTime(peak, time + attack);
		gain.gain.setTargetAtTime(0, time + attack + length, release / 4);
		gain.connect(out);
		return gain;
	}

	function osc(type: OscillatorType, freq: number, time: number, stop: number, to: AudioNode) {
		const o = ctx.createOscillator();
		o.type = type;
		o.frequency.value = freq;
		o.connect(to);
		o.start(time);
		o.stop(stop);
		return o;
	}

	return {
		// A soft synth pad under the tune.
		pad(time: number, note: number, length: number, gain: number, attack = 0.4) {
			const env = envelope(time, gain, attack, Math.max(0, length - attack), 1.2);
			const filter = ctx.createBiquadFilter();
			filter.type = 'lowpass';
			filter.frequency.value = 1100;
			filter.connect(env);
			for (const detune of [-7, 7])
				osc('sawtooth', midi(note), time, time + length + 2, filter).detune.value = detune;
		},
		// An ocarina: a pure, breathy tone that swells in, with a gentle vibrato once it's held.
		ocarina(time: number, note: number, length: number, gain: number) {
			const env = envelope(time, gain, 0.07, Math.max(0, length - 0.15), 0.35);
			const o = osc('sine', midi(note), time, time + length + 1, env);
			const vibrato = ctx.createOscillator();
			const depth = ctx.createGain();
			vibrato.frequency.value = 5.2;
			depth.gain.setValueAtTime(0, time);
			depth.gain.linearRampToValueAtTime(midi(note) * 0.006, time + Math.min(0.5, length));
			vibrato.connect(depth).connect(o.frequency);
			vibrato.start(time);
			vibrato.stop(time + length + 1);
			const breath = ctx.createGain();
			breath.gain.value = 0.12;
			breath.connect(env);
			osc('triangle', midi(note) * 2, time, time + length + 1, breath);
		},
		// A plucked harp string.
		harp(time: number, note: number, gain: number) {
			const env = envelope(time, gain, 0.004, 0, 1.6);
			osc('triangle', midi(note), time, time + 2.5, env);
			const ring = ctx.createGain();
			ring.gain.setValueAtTime(0.35, time);
			ring.gain.setTargetAtTime(0, time, 0.08);
			ring.connect(env);
			osc('sine', midi(note) * 2, time, time + 1, ring);
		}
	};
}

export function createRadio(ctx: AudioContext, out: AudioNode) {
	const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
	const data = noise.getChannelData(0);
	for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

	// A small speaker: no deep bass and no sparkle.
	const volume = ctx.createGain();
	volume.gain.value = 0;
	const low = ctx.createBiquadFilter();
	low.type = 'highpass';
	low.frequency.value = 130;
	const high = ctx.createBiquadFilter();
	high.type = 'lowpass';
	high.frequency.value = 4800;
	// A gentle limiter last, so loud moments can't clip into crackle.
	const limiter = ctx.createDynamicsCompressor();
	limiter.threshold.value = -6;
	limiter.knee.value = 6;
	limiter.ratio.value = 8;
	limiter.attack.value = 0.003;
	limiter.release.value = 0.2;
	const bus = ctx.createGain();
	bus.connect(low).connect(high).connect(volume).connect(limiter).connect(out);

	// Static between stations.
	const hiss = ctx.createBufferSource();
	hiss.buffer = noise;
	hiss.loop = true;
	const hissFilter = ctx.createBiquadFilter();
	hissFilter.type = 'bandpass';
	hissFilter.frequency.value = 2400;
	hissFilter.Q.value = 0.6;
	const hissGain = ctx.createGain();
	hissGain.gain.value = 0;
	hiss.connect(hissFilter).connect(hissGain).connect(bus);
	hiss.start();

	// Grove keeps time from the same moment, as if it had been on air all along.
	const epoch = ctx.currentTime;
	const groveGain = ctx.createGain();
	groveGain.gain.value = 0;
	groveGain.connect(bus);
	const channels = [
		{
			program: { freq: GROVE.freq, step: grove },
			gain: groveGain,
			play: players(ctx, groveGain),
			stepLength: 60 / GROVE_BPM / 4,
			next: 0,
			level: 0
		}
	];

	let on = false;
	let freq = STATIONS[0].freq;
	let level = 0.7;
	let waiting = false;
	let timer: ReturnType<typeof setInterval> | undefined;

	// Schedules a little ahead of time, so the music never stutters.
	function schedule() {
		// Far enough ahead that a busy moment (the room rendering on a phone) doesn't leave a gap;
		// background tabs only get their timers run about once a second, so further still there.
		const until = ctx.currentTime + (document.hidden ? 1.3 : 0.35);
		for (const c of channels) {
			if (c.level < 0.001) {
				c.next = 0;
				continue;
			}
			if (!c.next) c.next = Math.ceil((ctx.currentTime - epoch) / c.stepLength);
			while (epoch + c.next * c.stepLength < until) {
				const time = epoch + c.next * c.stepLength;
				// A note that's already late is skipped: started late it would pop.
				if (time > ctx.currentTime + 0.01) c.program.step(c.play, c.next, time, c.stepLength);
				c.next += 1;
			}
		}
	}

	function update() {
		const now = ctx.currentTime;
		for (const c of channels) {
			c.level = reception(freq, c.program.freq);
			c.gain.gain.setTargetAtTime(c.level, now, 0.03);
		}
		// Static, fading out as any station (streamed or local) comes in.
		const clearest = Math.max(...STATIONS.map((station) => reception(freq, station.freq)));
		// (And softly while a stream's still coming in, or sitting out an ad.)
		const hiss = 0.75 * Math.max(0.01 + 0.11 * Math.pow(1 - clearest, 1.5), waiting ? 0.05 : 0);
		hissGain.gain.setTargetAtTime(hiss, now, 0.08);
		volume.gain.setTargetAtTime(on ? level : 0, now, on ? 0.08 : 0.05);
		if (on && !timer) {
			schedule();
			timer = setInterval(schedule, 40);
		} else if (!on && timer) {
			clearInterval(timer);
			timer = undefined;
		}
	}

	return {
		set(state: { on: boolean; freq: number; volume: number; waiting?: boolean }) {
			on = state.on;
			waiting = state.waiting ?? false;
			freq = state.freq;
			level = state.volume;
			update();
		},
		dispose() {
			clearInterval(timer);
			hiss.stop();
		}
	};
}
