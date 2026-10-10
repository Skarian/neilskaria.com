// Sound for the room: the boot chime, a click for the cartridge, and the cube's clacks. If the chime can't be loaded, a synthesized stand-in plays so the timing still lands.

export async function createBootSound(chimeFile: Promise<ArrayBuffer>, muted = false) {
	const ctx = new AudioContext();
	// Everything plays through one master gain, so muting works instantly, even mid-chime.
	const master = ctx.createGain();
	master.gain.value = muted ? 0 : 1;
	master.connect(ctx.destination);
	let chime: AudioBuffer | null = null;
	try {
		chime = await ctx.decodeAudioData(await chimeFile);
	} catch {
		chime = null;
	}

	// A short burst of filtered noise, fading fast: the body of clicks, clacks and thunks.
	function burst(
		at: number,
		{ len = 0.05, type = 'bandpass' as BiquadFilterType, freq = 1000, q = 1, gain = 0.5, decay = 4 }
	) {
		const source = ctx.createBufferSource();
		source.buffer = noiseBuffer(ctx, len);
		const data = source.buffer.getChannelData(0);
		for (let i = 0; i < data.length; i++) data[i] *= Math.pow(1 - i / data.length, decay);
		const filter = ctx.createBiquadFilter();
		filter.type = type;
		filter.frequency.value = freq;
		filter.Q.value = q;
		const g = ctx.createGain();
		g.gain.value = gain;
		source.connect(filter).connect(g).connect(master);
		source.start(at);
	}

	// A short falling tone: the weight under a thunk.
	function tone(
		at: number,
		{ from = 200, to = 100, len = 0.1, gain = 0.4, type = 'sine' as OscillatorType }
	) {
		const osc = ctx.createOscillator();
		osc.type = type;
		osc.frequency.setValueAtTime(from, at);
		osc.frequency.exponentialRampToValueAtTime(to, at + len);
		const g = ctx.createGain();
		g.gain.setValueAtTime(gain, at);
		g.gain.exponentialRampToValueAtTime(0.0001, at + len);
		osc.connect(g).connect(master);
		osc.start(at);
		osc.stop(at + len + 0.02);
	}

	// Wood knocked on wood.
	function tok(at: number, strength: number) {
		burst(at, { len: 0.06, freq: 950, q: 2.2, gain: 0.7 * strength, decay: 6 });
		tone(at, { from: 260, to: 150, len: 0.09, gain: 0.35 * strength });
	}

	return {
		resume: () => ctx.resume(),
		setMuted(value: boolean) {
			master.gain.setTargetAtTime(value ? 0 : 1, ctx.currentTime, 0.02);
		},
		chime() {
			if (chime) {
				const source = ctx.createBufferSource();
				source.buffer = chime;
				// The recording is mastered loud; this sits it nicely alongside everything else.
				const gain = ctx.createGain();
				gain.gain.value = 0.5;
				source.connect(gain).connect(master);
				source.start();
				return;
			}
			bell(ctx, master, 1046.5, 0, 0.9);
			bell(ctx, master, 2093, 0.12, 1.1);
		},
		click() {
			const length = Math.floor(ctx.sampleRate * 0.03);
			const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
			const data = buffer.getChannelData(0);
			for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 4;
			const source = ctx.createBufferSource();
			const gain = ctx.createGain();
			gain.gain.value = 0.5;
			source.buffer = buffer;
			source.connect(gain).connect(master);
			source.start();
		},
		// The clack of a cube layer snapping round: a short burst of noise, filtered to sound plasticky.
		tick(volume = 0.8) {
			const length = Math.floor(ctx.sampleRate * 0.05);
			const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
			const data = buffer.getChannelData(0);
			for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 6;
			const source = ctx.createBufferSource();
			const filter = ctx.createBiquadFilter();
			filter.type = 'bandpass';
			filter.frequency.value = 1800 + Math.random() * 600;
			filter.Q.value = 1.4;
			const gain = ctx.createGain();
			gain.gain.value = volume;
			source.buffer = buffer;
			source.connect(filter).connect(gain).connect(master);
			source.start();
		},
		// A snip of the bonsai scissors: two quick metallic clicks.
		snip() {
			for (const [delay, freq] of [
				[0, 5200],
				[0.035, 3900]
			]) {
				const at = ctx.currentTime + delay;
				const length = Math.floor(ctx.sampleRate * 0.025);
				const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
				const data = buffer.getChannelData(0);
				for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 5;
				const source = ctx.createBufferSource();
				const filter = ctx.createBiquadFilter();
				filter.type = 'bandpass';
				filter.frequency.value = freq;
				filter.Q.value = 3;
				const gain = ctx.createGain();
				gain.gain.value = 0.9;
				source.buffer = buffer;
				source.connect(filter).connect(gain).connect(master);
				source.start(at);
			}
		},
		// The cube set down on the wood: a "tok", then two smaller ones as it bounces.
		cubeLand() {
			const t = ctx.currentTime + 0.01;
			tok(t, 1);
			tok(t + 0.19, 0.35);
			tok(t + 0.3, 0.12);
		},
		// The cube turned over in the hand: a faint whoosh, louder (and a touch shorter) the faster.
		whoosh(speed: number) {
			const t = ctx.currentTime + 0.01;
			const len = 0.5 - 0.15 * speed;
			const source = ctx.createBufferSource();
			source.buffer = noiseBuffer(ctx, len);
			const filter = ctx.createBiquadFilter();
			filter.type = 'bandpass';
			filter.Q.value = 0.9;
			filter.frequency.setValueAtTime(350, t);
			filter.frequency.exponentialRampToValueAtTime(900 + 900 * speed, t + len * 0.45);
			filter.frequency.exponentialRampToValueAtTime(500, t + len);
			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.0001, t);
			gain.gain.exponentialRampToValueAtTime(0.25 * speed, t + len * 0.4);
			gain.gain.exponentialRampToValueAtTime(0.0001, t + len);
			source.connect(filter).connect(gain).connect(master);
			source.start(t);
		},
		// One notch of the bonsai's turntable going round.
		ratchet(strength = 1) {
			const t = ctx.currentTime + 0.005;
			burst(t, {
				len: 0.012,
				type: 'highpass',
				freq: 2600,
				q: 0.7,
				gain: 0.35 * strength,
				decay: 3
			});
			tone(t, { from: 2300, to: 1900, len: 0.012, gain: 0.06 * strength, type: 'triangle' });
		},
		// The console landing back on the table: a soft plastic thunk, and its little bounce.
		consoleLand() {
			const t = ctx.currentTime + 0.01;
			tone(t, { from: 150, to: 70, len: 0.14, gain: 0.5 });
			burst(t, { len: 0.07, type: 'lowpass', freq: 1300, q: 0.8, gain: 0.55, decay: 5 });
			burst(t + 0.005, { len: 0.02, freq: 2400, q: 3, gain: 0.12, decay: 4 });
			tone(t + 0.21, { from: 130, to: 80, len: 0.08, gain: 0.18 });
			burst(t + 0.21, { len: 0.04, type: 'lowpass', freq: 1200, gain: 0.18, decay: 5 });
		},
		// A slash through the bonsai: a quick swish, sweeping down, with the clack of the blades.
		slash(strength = 1) {
			const length = Math.floor(ctx.sampleRate * 0.14);
			const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
			const data = buffer.getChannelData(0);
			for (let i = 0; i < length; i++)
				data[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / length) ** 2;
			const source = ctx.createBufferSource();
			const filter = ctx.createBiquadFilter();
			filter.type = 'bandpass';
			filter.Q.value = 1.2;
			const now = ctx.currentTime;
			filter.frequency.setValueAtTime(4200, now);
			filter.frequency.exponentialRampToValueAtTime(1400, now + 0.14);
			const gain = ctx.createGain();
			gain.gain.value = 0.35 * strength;
			source.buffer = buffer;
			source.connect(filter).connect(gain).connect(master);
			source.start();
		},
		// Water from a watering can: a soft rush of filtered noise.
		pour() {
			const length = Math.floor(ctx.sampleRate * 1.5);
			const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
			const data = buffer.getChannelData(0);
			for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
			const source = ctx.createBufferSource();
			const filter = ctx.createBiquadFilter();
			filter.type = 'bandpass';
			filter.frequency.value = 1400;
			filter.Q.value = 0.8;
			const gain = ctx.createGain();
			const now = ctx.currentTime;
			gain.gain.setValueAtTime(0, now);
			gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
			gain.gain.setValueAtTime(0.12, now + 1.1);
			gain.gain.linearRampToValueAtTime(0, now + 1.5);
			source.buffer = buffer;
			source.connect(filter).connect(gain).connect(master);
			source.start();
		},
		// A little rising arpeggio for solving the cube.
		fanfare() {
			[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(ctx, master, f, i * 0.09, 0.8));
		},
		close: () => ctx.close()
	};
}

function noiseBuffer(ctx: AudioContext, seconds: number) {
	const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
	return buffer;
}

function bell(
	ctx: AudioContext,
	out: AudioNode,
	frequency: number,
	delay: number,
	duration: number
) {
	const start = ctx.currentTime + delay;
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.type = 'sine';
	osc.frequency.value = frequency;
	gain.gain.setValueAtTime(0, start);
	gain.gain.linearRampToValueAtTime(0.25, start + 0.01);
	gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
	osc.connect(gain).connect(out);
	osc.start(start);
	osc.stop(start + duration);
}
