// Redraws the visible page onto a canvas (its background, outlined boxes and text, at their on-screen
// positions), so the Game Boy's screen can show the page as the camera dives in or pulls out.
// Anything inside [data-snapshot-skip] (the room's own overlay) is left out.

const SKIP = '[data-snapshot-skip]';
// The engine's framing margin when the screen fills the view (see computeFinalCamera).
export const FIT = 0.97;

export function snapshotPage(ctx: CanvasRenderingContext2D, root: Element, background: string) {
	const { width: w, height: h } = ctx.canvas;
	// At the hand-over the camera fits the whole screen into the view with a small margin (`FIT`), so
	// the screen shows the middle of the page at this scale; matching it keeps the two aligned.
	const scale = Math.max(w / innerWidth, h / innerHeight) / FIT;
	const ox = (w - innerWidth * scale) / 2;
	const oy = (h - innerHeight * scale) / 2;
	ctx.fillStyle = background;
	ctx.fillRect(0, 0, w, h);

	ctx.save();
	ctx.translate(ox, oy);
	ctx.scale(scale, scale);

	// Boxes with a visible background or border.
	for (const el of root.querySelectorAll<HTMLElement>('*')) {
		const style = getComputedStyle(el);
		const rect = el.getBoundingClientRect();
		if (
			!onScreen(rect) ||
			el.closest(SKIP) ||
			style.visibility === 'hidden' ||
			style.opacity === '0'
		)
			continue;
		const radius = parseFloat(style.borderTopLeftRadius) || 0;
		const fill = style.backgroundColor;
		if (fill && !/rgba\(0, 0, 0, 0\)|transparent/.test(fill)) {
			ctx.fillStyle = fill;
			roundRect(ctx, rect, radius);
			ctx.fill();
		}
		const border = parseFloat(style.borderTopWidth);
		if (border > 0 && style.borderTopStyle !== 'none') {
			ctx.strokeStyle = style.borderTopColor;
			ctx.lineWidth = border;
			ctx.setLineDash(style.borderTopStyle === 'dashed' ? [border * 3, border * 2] : []);
			roundRect(ctx, inset(rect, border / 2), Math.max(0, radius - border / 2));
			ctx.stroke();
		}
	}
	ctx.setLineDash([]);

	// Text, line by line, in its own font and colour.
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	const range = document.createRange();
	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		const text = node.textContent?.trim();
		const parent = node.parentElement;
		if (!text || !parent || parent.closest(SKIP)) continue;
		const style = getComputedStyle(parent);
		if (style.visibility === 'hidden' || style.opacity === '0') continue;
		ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
		ctx.fillStyle = style.color;
		ctx.textBaseline = 'middle';
		range.selectNodeContents(node);
		// Each line box of the text is drawn separately, so wrapped text stays where it was.
		const words = node.textContent!.split(/(\s+)/);
		let offset = 0;
		let line = '';
		let lineRect: DOMRect | null = null;
		const flush = () => {
			if (line.trim() && lineRect && onScreen(lineRect)) {
				ctx.fillText(line.trim(), lineRect.left, lineRect.top + lineRect.height / 2);
			}
		};
		for (const word of words) {
			if (word) {
				range.setStart(node, offset);
				range.setEnd(node, offset + word.length);
				const rect = range.getClientRects()[0];
				if (rect && lineRect && Math.abs(rect.top - lineRect.top) > rect.height / 2) {
					flush();
					line = '';
					lineRect = null;
				}
				if (rect && !lineRect && word.trim()) lineRect = rect;
				line += word;
			}
			offset += word.length;
		}
		flush();
	}
	ctx.restore();
}

function onScreen(rect: DOMRect) {
	return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight;
}

function inset(rect: DOMRect, by: number) {
	return new DOMRect(rect.left + by, rect.top + by, rect.width - by * 2, rect.height - by * 2);
}

function roundRect(ctx: CanvasRenderingContext2D, rect: DOMRect, radius: number) {
	ctx.beginPath();
	ctx.roundRect(
		rect.left,
		rect.top,
		rect.width,
		rect.height,
		Math.min(radius, rect.height / 2, rect.width / 2)
	);
}
