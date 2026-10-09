// Sound for the room: the boot chime, a click for the cartridge, and the cube's clacks. If the chime can't be loaded, a synthesized stand-in plays so the timing still lands.

export async function createBootSound(chimeUrl: string, muted = false) {
	const ctx = new AudioContext();
	// Everything plays through one master gain, so muting works instantly, even mid-chime.
	const master = ctx.createGain();
	master.gain.value = muted ? 0 : 1;
	master.connect(ctx.destination);
	let chime: AudioBuffer | null = null;
	try {
		const res = await fetch(chimeUrl);
		if (res.ok) chime = await ctx.decodeAudioData(await res.arrayBuffer());
	} catch {
		chime = null;
	}

	return {
		hasChime: chime !== null,
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
