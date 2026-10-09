// The clock radio's FM band. Each station is a little piece of music, synthesized live as a
// placeholder until real recordings replace it. The stations are always "on air": they keep time
// whether or not they're tuned in, so tuning away and back finds them mid-song, like a real radio.
// Between stations there's static, and everything plays through a small, boxy speaker.

export type Station = { name: string; freq: number };

export const FM_MIN = 87.5;
export const FM_MAX = 108;

type Program = {
	bpm: number;
	// Schedules whatever plays on one sixteenth-note step.
	step: (play: Play, step: number, time: number, stepLength: number) => void;
};

type Play = ReturnType<typeof players>;

const PROGRAMS: (Station & Program)[] = [
	{
		name: 'Lo-fi Lounge',
		freq: 88.5,
		bpm: 76,
		// Warm seventh chords, a lazy bass, a soft swung beat.
		step(play, step, time, length) {
			const bar = Math.floor(step / 16) % 4;
			const s = step % 16;
			const t = time + (s % 4 === 2 ? length * 0.3 : 0);
			const chord = [
				[53, 57, 60, 64],
				[52, 55, 59, 62],
				[50, 53, 57, 60],
				[48, 52, 55, 59]
			][bar];
			if (s === 0 || s === 7) for (const n of chord) play.keys(t, n, s === 0 ? 1.6 : 0.7, 0.045);
			if (s === 0 || s === 10) play.tone(t, chord[0] - 12, 0.5, 0.16, 'sine');
			if (s === 0 || s === 10) play.kick(t, 0.5);
			if (s === 4 || s === 12) play.snare(t, 0.12);
			if (s % 2 === 0) play.hat(t, s % 4 === 0 ? 0.035 : 0.02);
			const melody = [72, 0, 0, 69, 0, 0, 67, 0, 69, 0, 0, 0, 65, 0, 64, 0];
			if (bar % 2 === 1 && melody[s]) play.keys(t, melody[s], 0.5, 0.05);
		}
	},
	{
		name: 'Chip FM',
		freq: 92.7,
		bpm: 132,
		// Square-wave arpeggios over a bouncing bass, like a handheld's soundtrack.
		step(play, step, time) {
			const bar = Math.floor(step / 16) % 4;
			const s = step % 16;
			const chord = [
				[57, 60, 64],
				[53, 57, 60],
				[48, 52, 55],
				[55, 59, 62]
			][bar];
			const arp = [0, 1, 2, 1, 0, 1, 2, 3][s % 8];
			play.tone(time, arp === 3 ? chord[0] + 12 : chord[arp] + 12, 0.1, 0.035, 'square');
			if (s % 2 === 0) play.tone(time, chord[0] - 12 + (s % 4 ? 12 : 0), 0.12, 0.12, 'triangle');
			const lead = [76, 0, 0, 74, 0, 0, 72, 0, 74, 0, 76, 0, 0, 0, 0, 0];
			if (bar !== 3 && lead[s])
				play.tone(time, lead[s] - (bar === 1 ? 2 : 0), 0.18, 0.03, 'square');
			if (s === 0 || s === 8) play.kick(time, 0.35);
			if (s === 4 || s === 12) play.snare(time, 0.1);
			if (s % 2 === 1) play.hat(time, 0.02);
		}
	},
	{
		name: 'Night Drive',
		freq: 98.1,
		bpm: 96,
		// Synthwave: big filtered pads, a pulsing bass, four on the floor.
		step(play, step, time, length) {
			const bar = Math.floor(step / 16) % 4;
			const s = step % 16;
			const chord = [
				[57, 60, 64],
				[53, 57, 60],
				[48, 52, 55],
				[55, 59, 62]
			][bar];
			if (s === 0) for (const n of chord) play.pad(time, n, length * 16, 0.035);
			if (s % 2 === 0) play.tone(time, chord[0] - 24, length * 1.6, 0.14, 'sawtooth', 380);
			if (s % 4 === 0) play.kick(time, 0.4);
			if (s === 4 || s === 12) play.snare(time, 0.16);
			if (s % 4 === 2) play.hat(time, 0.03);
			const arp = [0, 1, 2, 1][s % 4];
			play.tone(time, chord[arp] + 24, length * 0.8, 0.018, 'triangle');
		}
	},
	{
		name: 'Tide Pool',
		freq: 104.9,
		bpm: 60,
		// Slow, washing pads and the odd chime.
		step(play, step, time, length) {
			const s = step % 32;
			const chord = Math.floor(step / 32) % 2 ? [47, 54, 59, 61, 66] : [50, 57, 62, 64, 69];
			// Overlapping swells every two beats, so it's a continuous wash whenever it's tuned in.
			if (s % 8 === 0) for (const n of chord) play.pad(time, n, length * 8, 0.03, 1.2);
			if (Math.random() < 0.14) {
				const bell = [74, 76, 78, 81, 83, 86, 88][Math.floor(Math.random() * 7)];
				play.bell(time, bell, 0.12);
			}
		}
	}
];

export const STATIONS: Station[] = PROGRAMS.map(({ name, freq }) => ({ name, freq }));

// How clearly a station comes in at a frequency: fully within 0.1 MHz, gone by 0.45.
function reception(freq: number, station: number) {
	const d = Math.abs(freq - station);
	const t = Math.min(1, Math.max(0, (0.45 - d) / 0.35));
	return t * t * (3 - 2 * t);
}

// The station a frequency is tuned to, if it's coming in clearly.
export function stationAt(freq: number) {
	return STATIONS.find((s) => reception(freq, s.freq) > 0.5) ?? null;
}

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

function players(ctx: AudioContext, out: AudioNode, noise: AudioBuffer) {
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

	function noiseHit(
		time: number,
		gain: number,
		type: BiquadFilterType,
		freq: number,
		decay: number
	) {
		const source = ctx.createBufferSource();
		source.buffer = noise;
		const filter = ctx.createBiquadFilter();
		filter.type = type;
		filter.frequency.value = freq;
		const g = ctx.createGain();
		g.gain.setValueAtTime(gain, time);
		g.gain.exponentialRampToValueAtTime(0.0001, time + decay);
		source.connect(filter).connect(g).connect(out);
		source.start(time, Math.random() * 1.5);
		source.stop(time + decay + 0.05);
	}

	return {
		tone(
			time: number,
			note: number,
			length: number,
			gain: number,
			type: OscillatorType,
			cutoff?: number
		) {
			const env = envelope(time, gain, 0.005, length * 0.6, length * 0.6);
			let to: AudioNode = env;
			if (cutoff) {
				const filter = ctx.createBiquadFilter();
				filter.type = 'lowpass';
				filter.frequency.value = cutoff;
				filter.connect(env);
				to = filter;
			}
			osc(type, midi(note), time, time + length * 2, to);
		},
		// An electric piano: a sine with a quieter octave, fading slowly.
		keys(time: number, note: number, length: number, gain: number) {
			const env = envelope(time, gain, 0.01, 0.05, length);
			osc('sine', midi(note), time, time + length * 2, env);
			const shimmer = ctx.createGain();
			shimmer.gain.value = 0.25;
			shimmer.connect(env);
			osc('triangle', midi(note + 12), time, time + length * 2, shimmer);
		},
		pad(time: number, note: number, length: number, gain: number, attack = 0.4) {
			const env = envelope(time, gain, attack, Math.max(0, length - attack), 1.2);
			const filter = ctx.createBiquadFilter();
			filter.type = 'lowpass';
			filter.frequency.value = 1100;
			filter.connect(env);
			for (const detune of [-7, 7])
				osc('sawtooth', midi(note), time, time + length + 2, filter).detune.value = detune;
		},
		bell(time: number, note: number, gain: number) {
			const env = envelope(time, gain, 0.005, 0, 2.2);
			osc('sine', midi(note), time, time + 3, env);
			const overtone = ctx.createGain();
			overtone.gain.value = 0.3;
			overtone.connect(env);
			osc('sine', midi(note) * 2.76, time, time + 1.5, overtone);
		},
		kick(time: number, gain: number) {
			const env = ctx.createGain();
			env.gain.setValueAtTime(gain, time);
			env.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);
			env.connect(out);
			const o = osc('sine', 150, time, time + 0.4, env);
			o.frequency.setValueAtTime(150, time);
			o.frequency.exponentialRampToValueAtTime(45, time + 0.25);
		},
		snare(time: number, gain: number) {
			noiseHit(time, gain, 'bandpass', 1800, 0.18);
		},
		hat(time: number, gain: number) {
			noiseHit(time, gain, 'highpass', 7000, 0.05);
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
	const bus = ctx.createGain();
	bus.connect(low).connect(high).connect(volume).connect(out);

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

	// Every station keeps time from the same moment, as if it had been on air all along.
	const epoch = ctx.currentTime;
	const channels = PROGRAMS.map((program) => {
		const gain = ctx.createGain();
		gain.gain.value = 0;
		gain.connect(bus);
		const stepLength = 60 / program.bpm / 4;
		return { program, gain, play: players(ctx, gain, noise), stepLength, next: 0, level: 0 };
	});

	let on = false;
	let freq = STATIONS[0].freq;
	let level = 0.7;
	let timer: ReturnType<typeof setInterval> | undefined;

	// Schedules a little ahead of time, so the music never stutters.
	function schedule() {
		const until = ctx.currentTime + 0.15;
		for (const c of channels) {
			if (c.level < 0.001) {
				c.next = 0;
				continue;
			}
			if (!c.next) c.next = Math.ceil((ctx.currentTime - epoch) / c.stepLength);
			while (epoch + c.next * c.stepLength < until) {
				c.program.step(c.play, c.next, epoch + c.next * c.stepLength, c.stepLength);
				c.next += 1;
			}
		}
	}

	function update() {
		const now = ctx.currentTime;
		let clearest = 0;
		for (const c of channels) {
			c.level = reception(freq, c.program.freq);
			clearest = Math.max(clearest, c.level);
			c.gain.gain.setTargetAtTime(c.level, now, 0.03);
		}
		hissGain.gain.setTargetAtTime(0.01 + 0.11 * Math.pow(1 - clearest, 1.5), now, 0.03);
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
		set(state: { on: boolean; freq: number; volume: number }) {
			on = state.on;
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
