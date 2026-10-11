// The bonsai as something to look after. The trunk, branches and pot come from the room's model; the
// foliage is grown here: twigs reaching from the branches into each pad, and on them juniper shoots,
// each a chain of little nodes of needles running from a twig out to its tip. A shoot's state is
// how far out it reaches (in nodes): cutting sets that to where the cut crossed it, and it grows
// back out from there, past its neat length if it's left. The whole tree sits on a turntable and is
// lit live (rather than baked), so it can be turned all the way round.

import * as THREE from 'three';
import roots from './assets/bonsai-roots.json';
import type { BonsaiBuffers, BonsaiInput } from './bonsai-generator';

const KEY = 'bonsai-shoots';
// The model's units: props.py works in millimetres, at 0.01 units each (before the tree's own scale).
const MM = 0.01;
const WIDTH = 64;
// Regrowth, in nodes a day: back to neat after a couple of days, then slower, outwards.
const REGROW = 3;
const OVERGROW = 0.9;

export type Shoot = {
	// Where it starts (on a twig) and its nodes, in the turntable's space.
	hub: THREE.Vector3;
	nodes: THREE.Vector3[];
	neat: number;
	// The first triangle of each node in the foliage geometry (and one past the last).
	triangles: number[];
};

// The clock for the foliage's gentle sway (set each frame by the room).
export const swayTime = { value: 0 };

// Growing the foliage takes a phone a second or more, so it's done in a worker (bonsai.worker.ts),
// while the room's pictures are still downloading. This sets the tree on its turntable and starts it.
export function growBonsai(root: THREE.Object3D, worker: Worker) {
	const wood = root.getObjectByName('BonsaiWood') as THREE.Mesh;
	const pot = root.getObjectByName('BonsaiPot') as THREE.Mesh;
	root.updateMatrixWorld(true);

	// The turntable: everything but the slate it stands on turns about the pot's centre.
	const potBox = new THREE.Box3().setFromObject(pot);
	const turntable = new THREE.Group();
	turntable.name = 'BonsaiTurntable';
	turntable.position.set(
		(potBox.min.x + potBox.max.x) / 2,
		potBox.min.y,
		(potBox.min.z + potBox.max.z) / 2
	);
	root.add(turntable);
	turntable.updateMatrixWorld();
	const onTurntable = new Set<THREE.Object3D>();
	root.traverse((o) => {
		if (o === turntable || !/^Bonsai/.test(o.name) || /Slate/.test(o.name)) return;
		let top = o;
		while (top.parent && top.parent !== root) top = top.parent;
		if (top !== turntable) onTurntable.add(top);
	});
	for (const o of onTurntable) turntable.attach(o);
	turntable.updateMatrixWorld(true);

	// From the model's millimetres (Blender axes) into the turntable's space.
	const fromModel = new THREE.Matrix4()
		.copy(turntable.matrixWorld)
		.invert()
		.multiply(wood.matrixWorld)
		.multiply(new THREE.Matrix4().set(MM, 0, 0, 0, 0, 0, MM, 0, 0, -MM, 0, 0, 0, 0, 0, 1));
	const input: BonsaiInput = { roots: roots.roots, seed: 11, fromModel: fromModel.toArray() };
	const grown = new Promise<BonsaiBuffers>((resolve) => {
		worker.onmessage = (event: MessageEvent<BonsaiBuffers>) => resolve(event.data);
		// (Should the worker fail, the tree is grown here instead, holding the page up as it once did.)
		worker.onerror = (event) => {
			event.preventDefault();
			void import('./bonsai-generator').then(({ generateBonsai }) =>
				resolve(generateBonsai(input))
			);
		};
		worker.postMessage(input);
	});
	return { turntable, grown };
}

// Makes the tree from what the worker grew, a few milliseconds at a time (`breathe` lets the page
// get on with anything else in between).
export async function createBonsai(
	{ turntable, grown }: ReturnType<typeof growBonsai>,
	breathe: () => Promise<unknown>
) {
	const data = await grown;
	await breathe();
	// Each shoot's points, for picking and cutting.
	const shoots: Shoot[] = [];
	let since = performance.now();
	for (let s = 0; s < data.neat.length; s++) {
		if (performance.now() - since > 4) {
			await breathe();
			since = performance.now();
		}
		const start = data.offsets[s];
		const end = data.offsets[s + 1];
		const nodes: THREE.Vector3[] = [];
		for (let n = start; n < end; n++) nodes.push(new THREE.Vector3().fromArray(data.nodes, n * 3));
		shoots.push({
			hub: new THREE.Vector3().fromArray(data.hubs, s * 3),
			nodes,
			neat: data.neat[s],
			triangles: Array.from(data.triangles.subarray(start + s, end + s + 1))
		});
	}
	await breathe();

	// Lit live, so they can turn: the same colours and textures, now under the room's light.
	const materials: THREE.MeshStandardMaterial[] = [];
	turntable.traverse((o) => {
		if (!(o instanceof THREE.Mesh)) return;
		const baked = o.material as THREE.MeshBasicMaterial;
		const material = new THREE.MeshStandardMaterial({
			map: baked.map,
			color: baked.color,
			roughness: 0.85,
			side: baked.side
		});
		o.material = material;
		materials.push(material);
	});

	// How far each shoot reaches, in nodes: one texel each, read by the foliage's shader. And each
	// shoot's own pace of growth.
	const { lengths, pace } = data;
	const count = shoots.length;
	const rows = Math.ceil(count / WIDTH);
	const texture = new THREE.DataTexture(lengths, WIDTH, rows, THREE.RedFormat, THREE.FloatType);
	texture.needsUpdate = true;
	const lengthsUniform = { value: texture };

	const foliageGeometry = new THREE.BufferGeometry();
	foliageGeometry.setAttribute('position', new THREE.BufferAttribute(data.position, 3));
	foliageGeometry.setAttribute('normal', new THREE.BufferAttribute(data.normal, 3, true));
	foliageGeometry.setAttribute('color', new THREE.BufferAttribute(data.color, 3));
	foliageGeometry.setAttribute('shootId', new THREE.BufferAttribute(data.shootId, 1));
	foliageGeometry.setAttribute('node', new THREE.BufferAttribute(data.node, 1));
	foliageGeometry.setAttribute('anchor', new THREE.BufferAttribute(data.anchor, 3));
	setBounds(foliageGeometry, data.foliageBounds);
	// Any material drawing the foliage shows only as much of each shoot as has grown, and sways.
	function growing<M extends THREE.Material>(material: M) {
		material.onBeforeCompile = (shader) => {
			shader.uniforms.shootLengths = lengthsUniform;
			shader.uniforms.swayTime = swayTime;
			shader.vertexShader = shader.vertexShader
				.replace(
					'#include <common>',
					`#include <common>
					uniform sampler2D shootLengths;
					uniform float swayTime;
					attribute float shootId;
					attribute float node;
					attribute vec3 anchor;`
				)
				.replace(
					'#include <begin_vertex>',
					`#include <begin_vertex>
					// A node shows once its shoot reaches it, growing out from the node before it.
					int id = int( shootId + 0.5 );
					int width = textureSize( shootLengths, 0 ).x;
					float reach = texelFetch( shootLengths, ivec2( id % width, id / width ), 0 ).r;
					transformed = anchor + ( transformed - anchor ) * clamp( reach - node, 0.0, 1.0 );
					// A very gentle sway, more towards the top.
					float high = smoothstep( 0.9, 1.6, position.y );
					transformed.x += high * sin( swayTime * 0.9 + position.x * 25.0 ) * 0.004;
					transformed.z += high * cos( swayTime * 0.7 + position.z * 21.0 ) * 0.003;`
				);
		};
		material.customProgramCacheKey = () => 'bonsai-shoots';
		return material;
	}
	const foliageMaterial = growing(
		new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8 })
	);
	const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
	foliage.name = 'BonsaiShoots';
	foliage.frustumCulled = false;
	turntable.add(foliage);

	// The foliage again, for the room's hover outline: drawn only into the outline's mask (on its own
	// layer), and as the tree looks now rather than as all the room it has to grow.
	function outlineShoots(material: THREE.Material) {
		const mesh = new THREE.Mesh(foliageGeometry, growing(material));
		mesh.name = 'BonsaiShootsOutline';
		mesh.frustumCulled = false;
		mesh.layers.disableAll();
		turntable.add(mesh);
		return mesh;
	}

	const twigGeometry = new THREE.BufferGeometry();
	twigGeometry.setAttribute('position', new THREE.BufferAttribute(data.twigPosition, 3));
	twigGeometry.setAttribute('normal', new THREE.BufferAttribute(data.twigNormal, 3));
	setBounds(twigGeometry, data.twigBounds);
	const twigMaterial = new THREE.MeshStandardMaterial({ color: '#4a3324', roughness: 0.9 });
	const twigs = new THREE.Mesh(twigGeometry, twigMaterial);
	twigs.name = 'BonsaiTwigs';
	turntable.add(twigs);
	materials.push(foliageMaterial, twigMaterial);

	// Cut clumps of foliage fall as copies of the nodes they were, lit the same way.
	const clumpMaterial = new THREE.MeshStandardMaterial({
		vertexColors: true,
		side: THREE.DoubleSide,
		roughness: 0.8
	});
	materials.push(clumpMaterial);

	// The nodes from `from` up to the shoot's current reach, as a mesh in world space.
	function clump(s: number, from: number) {
		const shoot = shoots[s];
		const to = Math.min(shoot.nodes.length, Math.ceil(lengths[s]));
		if (to <= from) return null;
		const t0 = shoot.triangles[from];
		const t1 = shoot.triangles[to];
		const geometry = new THREE.BufferGeometry();
		for (const name of ['position', 'normal', 'color']) {
			const source = foliageGeometry.attributes[name] as THREE.BufferAttribute;
			geometry.setAttribute(
				name,
				new THREE.BufferAttribute(source.array.slice(t0 * 9, t1 * 9), 3, source.normalized)
			);
		}
		turntable.updateMatrixWorld();
		geometry.applyMatrix4(turntable.matrixWorld);
		geometry.computeBoundingBox();
		const centre = geometry.boundingBox!.getCenter(new THREE.Vector3());
		geometry.translate(-centre.x, -centre.y, -centre.z);
		const mesh = new THREE.Mesh(geometry, clumpMaterial);
		mesh.position.copy(centre);
		return mesh;
	}

	function grow(days: number) {
		for (let s = 0; s < count; s++) {
			const shoot = shoots[s];
			let reach = lengths[s];
			let left = days * pace[s];
			// Quickly back to neat, then slowly beyond.
			if (reach < shoot.neat) {
				const back = Math.min(left, (shoot.neat - reach) / REGROW);
				reach += back * REGROW;
				left -= back;
			}
			reach += left * OVERGROW;
			lengths[s] = Math.min(shoot.nodes.length, reach);
		}
		texture.needsUpdate = true;
	}

	function setReach(s: number, reach: number) {
		lengths[s] = THREE.MathUtils.clamp(reach, 0, shoots[s].nodes.length);
		texture.needsUpdate = true;
	}

	function setAll(fn: (s: number, reach: number, shoot: Shoot) => number) {
		for (let s = 0; s < count; s++) setReach(s, fn(s, lengths[s], shoots[s]));
	}

	// How grown the tree is overall: 0 bare, 1 neat, up to ~1.7 overgrown.
	function shagginess() {
		let sum = 0;
		for (let s = 0; s < count; s++) sum += lengths[s] / shoots[s].neat;
		return sum / count;
	}

	function save() {
		try {
			let text = '';
			for (let s = 0; s < count; s++) text += String.fromCharCode(Math.round(lengths[s] * 10));
			localStorage.setItem(KEY, JSON.stringify({ count, at: Date.now(), lengths: btoa(text) }));
		} catch {
			// The tree just won't be remembered.
		}
	}

	function load() {
		try {
			const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
			if (saved?.count !== count || !Number.isFinite(saved.at)) return;
			const text = atob(saved.lengths);
			if (text.length !== count) return;
			// Only a whole, sensible tree is taken; anything else leaves the neat one.
			const reaches = new Float32Array(count);
			for (let s = 0; s < count; s++) {
				reaches[s] = text.charCodeAt(s) / 10;
				if (reaches[s] > shoots[s].nodes.length + 0.05) return;
			}
			lengths.set(reaches);
			texture.needsUpdate = true;
			grow(Math.max(0, (Date.now() - saved.at) / 86_400_000));
		} catch {
			// Nothing saved, or unreadable: the tree starts neat.
		}
	}

	return {
		turntable,
		shoots,
		lengths,
		count,
		materials,
		outlineShoots,
		clump,
		grow,
		setReach,
		setAll,
		shagginess,
		save,
		load,
		dispose() {
			texture.dispose();
			foliageGeometry.dispose();
			twigGeometry.dispose();
		}
	};
}

// The bounds three.js would otherwise work out on the first frame, by going through every vertex
// (worked out in the worker instead: a box, then a sphere around its centre).
function setBounds(geometry: THREE.BufferGeometry, bounds: Float64Array) {
	geometry.boundingBox = new THREE.Box3(
		new THREE.Vector3().fromArray(bounds, 0),
		new THREE.Vector3().fromArray(bounds, 3)
	);
	geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3().fromArray(bounds, 6), bounds[9]);
}

export type Bonsai = Awaited<ReturnType<typeof createBonsai>>;
