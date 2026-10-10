// After the build (on Vercel): a brotli-compressed copy of the room's model next to it, served as the
// model itself, compressed. Vercel compresses some kinds of file on its own, but not .glb, and the
// model is the biggest thing the room downloads. fetches.ts asks for this copy first, and falls back to
// the plain file if anything about it is off.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { brotliCompressSync, constants } from 'node:zlib';

const OUTPUT = '.vercel/output';
const ASSETS = `${OUTPUT}/static/_app/immutable/assets`;

if (!existsSync(`${OUTPUT}/config.json`)) {
	console.log('precompress: no Vercel output, nothing to do');
	process.exit(0);
}
const config = JSON.parse(readFileSync(`${OUTPUT}/config.json`, 'utf8'));
for (const file of readdirSync(ASSETS).filter((f) => /^bedroom\.[\w-]+\.glb$/.test(f))) {
	const glb = readFileSync(`${ASSETS}/${file}`);
	const br = brotliCompressSync(glb, {
		params: {
			[constants.BROTLI_PARAM_QUALITY]: 11,
			[constants.BROTLI_PARAM_SIZE_HINT]: glb.length
		}
	});
	writeFileSync(`${ASSETS}/${file}.br`, br);
	const path = `_app/immutable/assets/${file}.br`;
	config.routes.unshift({
		src: `^/${path.replace(/[.]/g, '\\.')}$`,
		headers: {
			'Content-Encoding': 'br',
			'Content-Type': 'model/gltf-binary',
			'Cache-Control': 'public, max-age=31536000, immutable'
		},
		continue: true
	});
	config.overrides = { ...config.overrides, [path]: { contentType: 'model/gltf-binary' } };
	console.log(`precompress: ${file} ${glb.length} -> ${br.length} bytes`);
}
writeFileSync(`${OUTPUT}/config.json`, JSON.stringify(config, null, '\t'));
