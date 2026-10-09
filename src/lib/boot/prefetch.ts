import { allAssetUrls } from './assets';
import posterLandscape from './assets/poster-landscape.webp?url';
import posterPortrait from './assets/poster-portrait.webp?url';

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

// Once a returning visitor's page is idle, quietly fetch the intro (its code and its assets) into the
// browser cache, so "Replay intro" starts almost immediately. Skipped on data saver and slow links.
export function prefetchIntro() {
	const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
	if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '')) return;
	// Someone who asked for less motion is unlikely to replay the intro.
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	const run = () => {
		void import('./engine');
		// The start screen's poster is a CSS background, which is cached apart from CORS requests.
		const poster = matchMedia('(orientation: portrait)').matches ? posterPortrait : posterLandscape;
		new Image().src = poster;
		const urls = [...allAssetUrls, '/draco/draco_wasm_wrapper.js', '/draco/draco_decoder.wasm'];
		for (const url of urls) {
			// Images are requested the way Three.js loads them (a CORS <img>), since the browser
			// caches that separately from a plain fetch.
			if (/\.(webp|png|jpe?g)$/.test(url)) {
				const image = new Image();
				image.crossOrigin = 'anonymous';
				image.src = url;
			} else fetch(url, { priority: 'low' } as RequestInit).catch(() => {});
		}
	};
	if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 5000 });
	else setTimeout(run, 2000);
}
