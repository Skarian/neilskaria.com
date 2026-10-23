// The clock radio's red LED display, showing the visitor's own time: hours and minutes in
// seven-segment digits, a blinking colon, and an AM or PM dot. Unlit segments glow faintly.

const BACK = '#120202';
const LIT = '#ff2a12';
const GHOST = '#2a0705';

const SEGMENTS: Record<string, string> = {
	'0': 'abcdef',
	'1': 'bc',
	'2': 'abged',
	'3': 'abgcd',
	'4': 'fgbc',
	'5': 'afgcd',
	'6': 'afgedc',
	'7': 'abc',
	'8': 'abcdefg',
	'9': 'abcdfg',
	' ': ''
};

const hour12 =
	new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hour12 ?? true;

export function drawClockLED(ctx: CanvasRenderingContext2D, now: Date) {
	const { width: w, height: h } = ctx.canvas;
	ctx.fillStyle = BACK;
	ctx.fillRect(0, 0, w, h);

	const hours = hour12 ? now.getHours() % 12 || 12 : now.getHours();
	const hh = String(hours).padStart(2, ' ');
	const mm = String(now.getMinutes()).padStart(2, '0');
	const size = { w: w * 0.15, h: h * 0.7, t: h * 0.1 };
	const top = h * 0.15;

	ctx.save();
	// The LEDs bloom a little.
	ctx.shadowColor = LIT;
	ctx.shadowBlur = h * 0.08;
	digit(ctx, w * 0.12, top, size, hh[0]);
	digit(ctx, w * 0.31, top, size, hh[1]);
	if (now.getMilliseconds() < 500) {
		ctx.fillStyle = LIT;
		for (const y of [0.33, 0.67])
			ctx.fillRect(w * 0.5, top + size.h * y - size.t / 2, size.t, size.t);
	}
	digit(ctx, w * 0.58, top, size, mm[0]);
	digit(ctx, w * 0.77, top, size, mm[1]);

	// AM and PM are printed beside the display; a dot lights next to the right one.
	if (hour12) {
		ctx.fillStyle = LIT;
		const pm = now.getHours() >= 12;
		ctx.beginPath();
		ctx.arc(w * 0.04, pm ? h * 0.78 : h * 0.22, h * 0.06, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.restore();
}

// While the radio is being tuned, the display shows the frequency instead, like " 98.1".
export function drawFrequencyLED(ctx: CanvasRenderingContext2D, freq: number) {
	const { width: w, height: h } = ctx.canvas;
	ctx.fillStyle = BACK;
	ctx.fillRect(0, 0, w, h);
	const text = (Math.round(freq * 10) / 10).toFixed(1).padStart(5, ' ');
	const size = { w: w * 0.15, h: h * 0.7, t: h * 0.1 };
	const top = h * 0.15;
	ctx.save();
	ctx.shadowColor = LIT;
	ctx.shadowBlur = h * 0.08;
	digit(ctx, w * 0.1, top, size, text[0]);
	digit(ctx, w * 0.29, top, size, text[1]);
	digit(ctx, w * 0.48, top, size, text[2]);
	ctx.fillStyle = LIT;
	ctx.fillRect(w * 0.665, top + size.h - size.t / 2, size.t, size.t);
	digit(ctx, w * 0.74, top, size, text[4]);
	ctx.restore();
}

function digit(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	size: { w: number; h: number; t: number },
	char: string
) {
	const lit = SEGMENTS[char] ?? '';
	const { w, h, t } = size;
	const blur = ctx.shadowBlur;
	const gap = t * 0.25;
	const bars: Record<string, [number, number, number, number]> = {
		a: [gap, 0, w - gap, 0],
		g: [gap, h / 2, w - gap, h / 2],
		d: [gap, h, w - gap, h],
		f: [0, gap, 0, h / 2 - gap],
		b: [w, gap, w, h / 2 - gap],
		e: [0, h / 2 + gap, 0, h - gap],
		c: [w, h / 2 + gap, w, h - gap]
	};
	ctx.save();
	ctx.translate(x, y);
	ctx.transform(1, 0, -0.08, 1, h * 0.08, 0);
	for (const [name, [x0, y0, x1, y1]] of Object.entries(bars)) {
		const half = t / 2;
		ctx.beginPath();
		if (y0 === y1) {
			ctx.moveTo(x0, y0);
			ctx.lineTo(x0 + half, y0 - half);
			ctx.lineTo(x1 - half, y1 - half);
			ctx.lineTo(x1, y1);
			ctx.lineTo(x1 - half, y1 + half);
			ctx.lineTo(x0 + half, y0 + half);
		} else {
			ctx.moveTo(x0, y0);
			ctx.lineTo(x0 + half, y0 + half);
			ctx.lineTo(x1 + half, y1 - half);
			ctx.lineTo(x1, y1);
			ctx.lineTo(x1 - half, y1 - half);
			ctx.lineTo(x0 - half, y0 + half);
		}
		ctx.closePath();
		const on = lit.includes(name);
		ctx.fillStyle = on ? LIT : GHOST;
		ctx.shadowBlur = on ? blur : 0;
		ctx.fill();
	}
	ctx.restore();
}
