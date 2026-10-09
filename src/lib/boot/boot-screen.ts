// Draws the boot screen for a given time, so the 3D screen texture can be scrubbed by GSAP.
// A replica of the GBA boot, measured frame by frame from a native capture (240 x 160), with our
// name in place of the logo and our domain in place of the line underneath:
//   0.00  the bottom line fades in, magenta
//   0.35  letters fly in one at a time, huge and rainbow-coloured, shrinking into a word near the top
//   1.10  the word drops to the centre and settles into blue
//   1.90  a magenta wave sweeps through the letters; then a glint runs across the bottom line
//   2.78  the "ding" (in the sound)
//   3.50  everything fades out
// The sound file is timed the same way: 0.35 s of silence, the shimmer, then the ding at 2.78 s.

export const BOOT_DURATION = 4.0;

const WORDMARK = 'NEIL SKARIA';
const LINE = 'neilskaria.com';
const PAPER = '#f8faf8';
const BLUE = [7, 0, 229];
const MAGENTA = [224, 16, 224];

// Final layout, as fractions of the screen (from the reference frames). Our words are longer than
// the originals, so they're sized by height and allowed to run wider, up to a limit.
const WORD_SIZE = 0.25;
const WORD_MAX_WIDTH = 0.88;
const WORD_CENTRE_Y = 0.39;
const LINE_SIZE = 0.11;
const LINE_MAX_WIDTH = 0.6;
const LINE_CENTRE_Y = 0.74;

export function drawBootScreen(ctx: CanvasRenderingContext2D, t: number, endColor: string) {
	const { width: w, height: h } = ctx.canvas;
	ctx.fillStyle = PAPER;
	ctx.fillRect(0, 0, w, h);
	ctx.textBaseline = 'middle';
	ctx.textAlign = 'left';

	drawLine(ctx, t, w, h);
	drawWordmark(ctx, t, w, h);

	const fade = clamp((t - 3.5) / 0.45);
	if (fade > 0) {
		ctx.globalAlpha = fade;
		ctx.fillStyle = endColor;
		ctx.fillRect(0, 0, w, h);
		ctx.globalAlpha = 1;
	}
}

function drawWordmark(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
	// Fit the word to its final width, then lay out each letter's slot.
	let size = h * WORD_SIZE;
	ctx.font = wordFont(size);
	size *= Math.min(1, (w * WORD_MAX_WIDTH) / ctx.measureText(WORDMARK).width);
	ctx.font = wordFont(size);
	const letters = [...WORDMARK];
	const total = ctx.measureText(WORDMARK).width;
	const slots: number[] = [];
	let x = -total / 2;
	for (const letter of letters) {
		const lw = ctx.measureText(letter).width;
		slots.push(x + lw / 2);
		x += lw;
	}

	// The assembled word first sits high and a little larger, then drops into place.
	const drop = easeInOut(clamp((t - 1.1) / 0.5));
	const wordX = lerp(w * 0.44, w * 0.5, drop);
	const wordY = lerp(h * 0.2, h * WORD_CENTRE_Y, drop);
	const wordScale = lerp(1.15, 1, drop);

	const visible = letters.filter((l) => l !== ' ').length;
	let order = 0;
	for (const [i, letter] of letters.entries()) {
		if (letter === ' ') continue;
		const seed = order++;
		const arrive = 0.35 + (seed / visible) * 0.7;
		const p = clamp((t - arrive) / 0.42);
		if (p <= 0) continue;
		const ease = easeOut(p);

		// Each letter starts huge, somewhere around the screen, and shrinks into its slot.
		const angle = seed * 2.4 + 0.6;
		const startX = w * 0.5 + Math.cos(angle) * w * 0.35;
		const startY = h * 0.45 + Math.sin(angle) * h * 0.35;
		const slotX = wordX + slots[i] * wordScale;
		const lx = lerp(startX, slotX, ease);
		const ly = lerp(startY, wordY, ease);
		const scale = lerp(4.2, 1, ease) * wordScale;

		ctx.save();
		ctx.globalAlpha = clamp(p * 6);
		ctx.translate(lx, ly);
		ctx.scale(scale, scale);
		ctx.fillStyle = letterColour(t, seed, slotX / w);
		ctx.fillText(letter, -ctx.measureText(letter).width / 2, 0);
		ctx.restore();
	}
}

function drawLine(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
	const appear = clamp(t / 0.25);
	if (appear <= 0) return;
	let size = h * LINE_SIZE;
	ctx.font = lineFont(size);
	size *= Math.min(1, (w * LINE_MAX_WIDTH) / ctx.measureText(LINE).width);
	ctx.font = lineFont(size);
	const lw = ctx.measureText(LINE).width;
	const x = (w - lw) / 2;
	const y = h * LINE_CENTRE_Y;
	ctx.globalAlpha = appear;
	ctx.fillStyle = rgb(MAGENTA);
	ctx.fillText(LINE, x, y);
	ctx.globalAlpha = 1;

	// A glint runs across the line just before the ding, briefly washing the letters out.
	const glint = clamp((t - 2.4) / 0.45);
	if (glint > 0 && glint < 1) {
		const gx = lerp(x - lw * 0.1, x + lw * 1.1, glint);
		const band = ctx.createLinearGradient(gx - lw * 0.08, 0, gx + lw * 0.08, 0);
		band.addColorStop(0, 'rgba(248,250,248,0)');
		band.addColorStop(0.5, 'rgba(248,250,248,1)');
		band.addColorStop(1, 'rgba(248,250,248,0)');
		ctx.fillStyle = band;
		ctx.fillRect(x - lw * 0.1, y - size, lw * 1.2, size * 2);
	}
}

// Rainbow while flying in, blue once settled, with a magenta wave sweeping left to right.
function letterColour(t: number, seed: number, xFraction: number) {
	const hue = (seed * 67 + t * 520) % 360;
	const flying = hslToRgb(hue, 1, 0.5);
	const settle = clamp((t - 1.25) / 0.35);
	let colour = mix(flying, BLUE, settle);
	const wave = clamp((t - 1.85) / 0.9);
	if (wave > 0 && wave < 1) {
		const centre = lerp(-0.3, 1.3, wave);
		const strength = Math.exp(-(((xFraction - centre) / 0.3) ** 2));
		colour = mix(colour, MAGENTA, strength);
	}
	return rgb(colour);
}

function wordFont(size: number) {
	return `italic 900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
}

function lineFont(size: number) {
	return `900 ${size}px "Arial Rounded MT Bold", "Helvetica Neue", Arial, sans-serif`;
}

function hslToRgb(hue: number, s: number, l: number) {
	const k = (n: number) => (n + hue / 30) % 12;
	const a = s * Math.min(l, 1 - l);
	const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
	return [f(0) * 255, f(8) * 255, f(4) * 255];
}

function mix(a: number[], b: number[], k: number) {
	return a.map((v, i) => lerp(v, b[i], k));
}

function rgb([r, g, b]: number[]) {
	return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function lerp(a: number, b: number, k: number) {
	return a + (b - a) * k;
}

function clamp(v: number) {
	return Math.min(1, Math.max(0, v));
}

function easeOut(p: number) {
	return 1 - (1 - p) ** 3;
}

function easeInOut(p: number) {
	return p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
}
