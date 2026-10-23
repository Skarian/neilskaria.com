// This query selects only the actual boot-screen Canvas2D context.
const requestedMode =
	typeof window !== 'undefined' ? new URLSearchParams(location.search).get('bootCanvas') : null;
if (
	requestedMode !== null &&
	requestedMode !== 'default' &&
	requestedMode !== 'will-read-frequently'
) {
	throw new Error(
		'Unsupported bootCanvas mode: ' + requestedMode + '. Use default or will-read-frequently.'
	);
}
export const bootCanvasMode = requestedMode === 'default' ? 'default' : 'will-read-frequently';
export const bootCanvasOptions =
	bootCanvasMode === 'will-read-frequently' ? { willReadFrequently: true } : undefined;
