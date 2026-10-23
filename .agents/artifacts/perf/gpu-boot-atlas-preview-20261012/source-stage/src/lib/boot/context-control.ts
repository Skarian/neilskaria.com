// Selects the fixed GPU atlas or the original Canvas2D context.
const selected =
	typeof window !== 'undefined' ? new URLSearchParams(location.search).get('bootCanvas') : null;
export const bootCanvasMode =
	selected === 'gpu-atlas' || selected === 'will-read-frequently' ? selected : 'default';
export const bootCanvasOptions =
	bootCanvasMode === 'will-read-frequently' ? { willReadFrequently: true } : undefined;
