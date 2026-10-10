// The room's assets, imported as URLs so the build gives them content-hashed names and serves them
// with permanent cache headers.

import model from './assets/bedroom.glb?url';
import chime from './assets/gba-boot.mp3?url';
import scales from './assets/lightmaps.json';

const lightmapFiles = import.meta.glob('./assets/*-{day,lamp}.webp', {
	query: '?url',
	import: 'default',
	eager: true
}) as Record<string, string>;

// Lightmap URLs keyed by "<group>-<state>", e.g. "props-day".
export const lightmaps = Object.fromEntries(
	Object.entries(lightmapFiles).map(([path, url]) => [
		path.split('/').pop()!.replace('.webp', ''),
		url
	])
);

export const lightmapScales: Record<string, Record<string, number>> = scales;

export const introAssets = { model, chime, lightmaps };
