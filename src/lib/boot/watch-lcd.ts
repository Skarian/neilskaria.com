// The Casio's LCD, showing the visitor's own time: weekday and date along the top, hours and
// minutes in big seven-segment digits, seconds small. Unlit segments show faintly, as on a real LCD.

const PAPER = '#ccd2b8';
const INK = '#1a1e19';
const GHOST = '#bec4aa';

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
	new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hour12 ?? false;

export function drawWatchLCD(ctx: CanvasRenderingContext2D, now: Date) {
	const { width: w, height: h } = ctx.canvas;
	ctx.fillStyle = PAPER;
	ctx.fillRect(0, 0, w, h);

	const hours = hour12 ? now.getHours() % 12 || 12 : now.getHours();
	const hh = String(hours).padStart(2, ' ');
	const mm = String(now.getMinutes()).padStart(2, '0');
	const ss = String(now.getSeconds()).padStart(2, '0');
	const day = now.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2).toUpperCase();

	// Big hours and minutes, with a colon; seconds smaller, bottom-aligned.
	const big = { w: w * 0.11, h: h * 0.48, t: h * 0.055 };
	const top = h * 0.4;
	digit(ctx, w * 0.15, top, big, hh[0]);
	digit(ctx, w * 0.29, top, big, hh[1]);
	ctx.fillStyle = INK;
	for (const y of [top + big.h * 0.3, top + big.h * 0.72]) {
		ctx.fillRect(w * 0.425, y, big.t, big.t);
	}
	digit(ctx, w * 0.47, top, big, mm[0]);
	digit(ctx, w * 0.61, top, big, mm[1]);
	const small = { w: w * 0.065, h: h * 0.28, t: h * 0.04 };
	const smallTop = top + big.h - small.h;
	digit(ctx, w * 0.77, smallTop, small, ss[0]);
	digit(ctx, w * 0.855, smallTop, small, ss[1]);

	// Top row: weekday, the 12/24-hour indicator and the date.
	ctx.fillStyle = INK;
	ctx.textBaseline = 'middle';
	ctx.font = `bold ${h * 0.2}px Arial, sans-serif`;
	ctx.fillText(day, w * 0.33, h * 0.2);
	ctx.font = `bold ${h * 0.1}px Arial, sans-serif`;
	ctx.fillText(hour12 ? (now.getHours() < 12 ? 'AM' : 'PM') : '24H', w * 0.04, h * 0.3);
	const date = String(now.getDate()).padStart(2, ' ');
	const tiny = { w: w * 0.055, h: h * 0.22, t: h * 0.035 };
	digit(ctx, w * 0.8, h * 0.09, tiny, date[0]);
	digit(ctx, w * 0.875, h * 0.09, tiny, date[1]);
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
	const gap = t * 0.18;
	// Each segment as a bar with pointed ends: [x0, y0, x1, y1].
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
	// The F-91W's digits lean slightly forward.
	ctx.transform(1, 0, -0.1, 1, h * 0.1, 0);
	for (const [name, [x0, y0, x1, y1]] of Object.entries(bars)) {
		const horizontal = y0 === y1;
		const half = t / 2;
		ctx.beginPath();
		if (horizontal) {
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
		ctx.fillStyle = lit.includes(name) ? INK : GHOST;
		ctx.fill();
	}
	ctx.restore();
}
