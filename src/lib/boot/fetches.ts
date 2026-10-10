// The room's files, downloaded as soon as the page knows it wants the room: before the room's own code
// has arrived, rather than one after another once it has. The model and its decoder go first; the
// pictures (lighting, the portrait) and the chime follow it, so the room's shapes can be built while
// they're still coming in. Each file is downloaded once and handed over as it is.

import { introAssets } from './assets';

// The Draco decoder (served as is, from public/draco/).
const DECODER = { js: '/draco/draco_wasm_wrapper.js', wasm: '/draco/draco_decoder.wasm' };

export type RoomFiles = ReturnType<typeof download>;

let files: RoomFiles | undefined;

export function fetchRoom() {
	files ??= download();
	return files;
}

function download() {
	const get = async (url: string) => {
		const response = await fetch(url);
		if (!response.ok) throw new Error(`${url}: ${response.status}`);
		return response;
	};
	// The model, counting its bytes as they come (it's most of the wait).
	let loaded = 0;
	let total = 0;
	const model = get(introAssets.model).then(async (response) => {
		// (A compressed download's length is its compressed size, so this is only a guide.)
		total = Number(response.headers.get('content-length')) || 0;
		if (!response.body || !total) return response.arrayBuffer();
		const chunks: Uint8Array[] = [];
		const reader = response.body.getReader();
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(value);
			loaded += value.length;
		}
		return new Blob(chunks as BlobPart[]).arrayBuffer();
	});
	const decoder = {
		js: get(DECODER.js).then((r) => r.text()),
		wasm: get(DECODER.wasm).then((r) => r.arrayBuffer())
	};
	// Everything else waits for the model, so it gets the connection to itself first.
	const after = model.then(
		() => undefined,
		() => undefined
	);
	const blob = (url: string) => after.then(() => get(url)).then((r) => r.blob());
	const result = {
		model,
		decoder,
		lightmaps: Object.fromEntries(
			Object.entries(introAssets.lightmaps).map(([name, url]) => [name, blob(url)])
		),
		portrait: blob(introAssets.portrait),
		env: blob(introAssets.env),
		chime: after.then(() => get(introAssets.chime)).then((r) => r.arrayBuffer()),
		// How much of the model has arrived (0-1).
		progress: () => (total ? Math.min(1, loaded / total) : 0)
	};
	// Whoever uses a file reports its failure; none goes unhandled meanwhile.
	for (const promise of [
		model,
		decoder.js,
		decoder.wasm,
		result.portrait,
		result.env,
		result.chime
	])
		promise.catch(() => {});
	for (const promise of Object.values(result.lightmaps)) promise.catch(() => {});
	return result;
}
