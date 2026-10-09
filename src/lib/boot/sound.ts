// Sound for the boot intro: the boot chime, and a click for the cartridge. If the chime can't be
// loaded, a synthesized stand-in plays so the timing still lands.

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
				source.connect(master);
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
