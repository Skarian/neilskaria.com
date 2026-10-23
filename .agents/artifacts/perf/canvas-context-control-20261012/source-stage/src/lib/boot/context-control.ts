// This query selects only the actual boot-screen Canvas2D context.
export const bootCanvasMode =
	typeof window !== 'undefined' &&
	new URLSearchParams(location.search).get('bootCanvas') === 'will-read-frequently'
		? 'will-read-frequently'
		: 'default';
export const bootCanvasOptions =
	bootCanvasMode === 'will-read-frequently' ? { willReadFrequently: true } : undefined;
