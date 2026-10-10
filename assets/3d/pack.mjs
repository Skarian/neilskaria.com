// Packs the room for the web: `npm run pack-room`.
//
// Reads what Blender exported (assets/3d/export/: bedroom.glb, the <group>-day/-lamp lightmaps and the
// portrait) and writes the files the site loads into src/lib/boot/assets/. Everything here was
// checked side by side against the export: the textures and lighting are smaller, not different.
//
//  - bedroom.glb: colour textures to 512px WebP (the bonsai's wood 1024px), shapes re-compressed with
//    Draco once (positions at 14 bits), the cloth and a few soft shapes simplified, texture
//    coordinates dropped where nothing is textured. The bonsai's twigs are pinned to the trunk by
//    bonsai-roots.json; this checks the trunk they're pinned to is still where it was.
//  - lightmaps: lossy WebP at high quality (they're smooth, so it doesn't show), the wall's at
//    1024px and the faint lamp layers of the room and the bed at 512px.
//  - portrait: lossless WebP, pixel for pixel the same.
//  - env: the reflections the live objects (the console, the cube, the bonsai) see, captured from the
//    room as it renders (`npm run capture-env`, with the dev server running) and stored as WebP. It's
//    what the room used to work out on every load; capture it again whenever the room's look changes.

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import * as fn from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const draco3d = require('draco3dgltf');

const FROM = new URL('./export/', import.meta.url);
const TO = new URL('../../src/lib/boot/assets/', import.meta.url);
const path = (dir, name) => fileURLToPath(new URL(name, dir));

// How much of each soft shape to keep (by triangles).
const SIMPLIFY = {
	'Duvet.001': 0.25,
	'low.001': 0.3,
	BonsaiSoil: 0.3,
	BonsaiMoss: 0.4,
	'Curtain0.001': 0.5,
	'Curtain1.001': 0.5,
	'SheetFold.001': 0.5,
	'ClockWheel.021': 0.5,
	'Nightstand.001': 0.5,
	'BonsaiPot.001': 0.5,
	'Pillow0.001': 0.6,
	'Pillow1.001': 0.6,
	'Cushion.001': 0.6
};
// Untextured but drawn with texture coordinates by the room (their pictures are set in code).
const KEEP_UVS = new Set(['Screen', 'ClockDisplay', 'PortraitPicture', 'Sky']);

// Each lightmap's size (px) and WebP quality; `keep` leaves an already-lossy WebP as it is.
const LIGHTMAPS = {
	'room-day': { quality: 95 },
	'room-lamp': { size: 512, quality: 95 },
	'props-day': { keep: true, quality: 92 },
	'props-lamp': { quality: 95 },
	'bed-day': { keep: true, quality: 92 },
	'bed-lamp': { size: 512, quality: 95 },
	'wall-day': { size: 1024, quality: 95 },
	'wall-lamp': { size: 1024, quality: 95 },
	'plant-day': { keep: true, quality: 92 },
	'plant-lamp': { keep: true, quality: 92 }
};

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;
const report = [];

async function packModel() {
	const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
		'draco3d.decoder': await draco3d.createDecoderModule(),
		'draco3d.encoder': await draco3d.createEncoderModule()
	});
	await MeshoptSimplifier.ready;
	const source = path(FROM, 'bedroom.glb');
	const doc = await io.read(source);
	const root = doc.getRoot();
	const wood = root.listNodes().find((n) => n.getName() === 'BonsaiWood')?.getMesh();

	await doc.transform(fn.prune({ keepLeaves: true, keepAttributes: true }));
	// Merge duplicate vertices, except on the trunk (the twigs' roots were taken from it as it is).
	for (const mesh of root.listMeshes())
		if (mesh !== wood) for (const prim of mesh.listPrimitives()) fn.weldPrimitive(prim);
	for (const mesh of root.listMeshes()) {
		const ratio = SIMPLIFY[mesh.getName()];
		if (!ratio) continue;
		for (const prim of mesh.listPrimitives()) {
			// (The plant's leaves are cut-out cards: simplifying them would chop their outline.)
			if (mesh.getName() === 'low.001' && prim.getMaterial()?.getName()?.includes('leaves'))
				continue;
			fn.simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio, error: 0.0005 });
		}
	}
	for (const node of root.listNodes()) {
		const mesh = node.getMesh();
		if (!mesh || KEEP_UVS.has(node.getName())) continue;
		for (const prim of mesh.listPrimitives()) {
			const m = prim.getMaterial();
			const textured = m && (m.getBaseColorTexture() || m.getEmissiveTexture());
			if (!textured && prim.getAttribute('TEXCOORD_0')) prim.setAttribute('TEXCOORD_0', null);
		}
	}
	// The plant's leaf texture has no transparency (the leaves are already cut to shape).
	for (const material of root.listMaterials())
		if (material.getAlphaMode() === 'MASK' && /leaves/i.test(material.getName()))
			material.setAlphaMode('OPAQUE');
	// Colour textures by the material using them: the bonsai's wood is seen close up.
	const closeUp = new Set();
	for (const material of root.listMaterials())
		if (/bonsai|wood/i.test(material.getName()) && material.getBaseColorTexture())
			closeUp.add(material.getBaseColorTexture());
	for (const texture of root.listTextures()) {
		// (The sky's little gradient stays a lossless PNG.)
		if (texture.getMimeType() === 'image/png' && texture.getImage().byteLength < 65536) continue;
		const size = closeUp.has(texture) ? 1024 : 512;
		const image = await sharp(texture.getImage())
			.resize(size, size, { fit: 'inside', withoutEnlargement: true })
			.webp({ quality: 85 })
			.toBuffer();
		texture.setImage(image).setMimeType('image/webp');
	}
	await doc.transform(fn.prune({ keepLeaves: true, keepAttributes: true }));
	for (const ext of root.listExtensionsUsed())
		if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
	await doc.transform(
		fn.draco({
			quantizePosition: 14,
			quantizeNormal: 10,
			quantizeTexcoord: 12,
			encodeSpeed: 1,
			decodeSpeed: 5
		})
	);
	const out = path(TO, 'bedroom.glb');
	await io.write(out, doc);

	// The twigs' roots must still sit on the trunk.
	const roots = JSON.parse(readFileSync(path(TO, 'bonsai-roots.json'), 'utf8')).roots;
	const packed = await io.read(out);
	const trunk = packed
		.getRoot()
		.listNodes()
		.find((n) => n.getName() === 'BonsaiWood')
		.getMesh()
		.listPrimitives()[0]
		.getAttribute('POSITION')
		.getArray();
	for (const [i, [x, y, z]] of roots.entries()) {
		let nearest = Infinity;
		// (The trunk's own space is the model's, in hundredths of a millimetre, y up.)
		for (let k = 0; k < trunk.length; k += 3) {
			const d = Math.hypot(trunk[k] / 0.01 - x, -trunk[k + 2] / 0.01 - y, trunk[k + 1] / 0.01 - z);
			if (d < nearest) nearest = d;
		}
		if (nearest > 0.05)
			throw new Error(
				`Twig root ${i} is ${nearest.toFixed(3)} mm off the trunk: has the trunk changed? ` +
					`Update bonsai-roots.json (and bump its version) on purpose if so.`
			);
	}
	report.push(`bedroom.glb ${kb(readFileSync(source).length)} -> ${kb(readFileSync(out).length)}`);
}

async function packLightmaps() {
	// A new bake's scales come with it.
	if (existsSync(path(FROM, 'lightmaps.json')))
		copyFileSync(path(FROM, 'lightmaps.json'), path(TO, 'lightmaps.json'));
	for (const [name, { size, quality, keep }] of Object.entries(LIGHTMAPS)) {
		const png = path(FROM, `${name}.png`);
		const webp = path(FROM, `${name}.webp`);
		const source = existsSync(png) ? png : webp;
		const out = path(TO, `${name}.webp`);
		if (keep && source === webp) copyFileSync(source, out);
		else {
			let image = sharp(readFileSync(source));
			if (size) image = image.resize(size, size, { kernel: 'lanczos3' });
			writeFileSync(out, await image.webp({ quality, smartSubsample: true, effort: 6 }).toBuffer());
		}
		report.push(`${name}.webp ${kb(readFileSync(source).length)} -> ${kb(readFileSync(out).length)}`);
	}
}

async function packEnvironment() {
	const source = path(FROM, 'env.png');
	if (!existsSync(source)) return report.push('env.png not captured yet: run `npm run capture-env`');
	const out = path(TO, 'env.webp');
	writeFileSync(out, await sharp(readFileSync(source)).webp({ quality: 95, smartSubsample: true, effort: 6 }).toBuffer());
	report.push(`env ${kb(readFileSync(source).length)} -> ${kb(readFileSync(out).length)}`);
}

async function packPortrait() {
	const source = path(FROM, 'portrait.png');
	const out = path(TO, 'portrait.webp');
	const image = await sharp(readFileSync(source))
		.webp({ lossless: true, exact: true, effort: 6 })
		.toBuffer();
	// Pixel art: it must come back exactly.
	const a = await sharp(readFileSync(source)).ensureAlpha().raw().toBuffer();
	const b = await sharp(image).ensureAlpha().raw().toBuffer();
	if (!a.equals(b)) throw new Error('The portrait changed in packing.');
	writeFileSync(out, image);
	report.push(`portrait ${kb(readFileSync(source).length)} -> ${kb(image.length)}`);
}

await packModel();
await packLightmaps();
await packPortrait();
await packEnvironment();
console.log(report.join('\n'));
