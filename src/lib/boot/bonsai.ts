// The bonsai as something to look after: its foliage is ~7,000 little tufts of needles, and each tuft
// has a length, from a trimmed stub to shaggy overgrowth. Trimming shortens the tufts under the
// scissors a little at a time; the tree grows back slowly while the visitor is away, unevenly and
// fastest at the top, like the real thing. Lengths live in a small texture the needles' shader reads,
// so changing them costs next to nothing.

import * as THREE from 'three';
import { tuftLengths } from './baked-material';

// Shortest a tuft can be trimmed to, its neat length, and the most it overgrows.
export const STUB = 0.3;
export const NEAT = 1;
export const SHAGGY = 1.6;
// Growth per day, on average (so about a week from neat to shaggy).
const GROWTH_PER_DAY = 0.08;
const KEY = 'bonsai';
const WIDTH = 128;

export function createBonsai(needles: THREE.Mesh[]) {
	// Each needle is one triangle; a tuft is the six needles sharing a lightmap cell. The tip of each
	// needle (the corner opposite its short base) moves along the needle as the tuft grows and shrinks.
	const keys = new Map<string, number>();
	const perMesh: { mesh: THREE.Mesh; tuftOf: Uint32Array }[] = [];
	for (const mesh of needles) {
		const geometry = mesh.geometry;
		const uv1 = geometry.attributes.uv1;
		const triangles = geometry.attributes.position.count / 3;
		const tuftOf = new Uint32Array(triangles);
		for (let t = 0; t < triangles; t++) {
			let u = 0;
			let v = 0;
			for (let k = 0; k < 3; k++) {
				u += uv1.getX(t * 3 + k);
				v += uv1.getY(t * 3 + k);
			}
			const key = `${Math.round((u / 3) * 65536)},${Math.round((v / 3) * 65536)}`;
			if (!keys.has(key)) keys.set(key, keys.size);
			tuftOf[t] = keys.get(key)!;
		}
		perMesh.push({ mesh, tuftOf });
	}
	// Tufts are numbered in a fixed order (by lightmap cell), so saved lengths match up next time.
	const order = [...keys.keys()].sort();
	const renumber = new Uint32Array(order.length);
	order.forEach((key, i) => (renumber[keys.get(key)!] = i));
	const count = order.length;

	// Where each tuft is (world space, for the scissors and falling clippings), and how fast it grows.
	const centres = new Float32Array(count * 3);
	const tally = new Uint16Array(count);
	const a = new THREE.Vector3();
	const b = new THREE.Vector3();
	const c = new THREE.Vector3();
	const root = new THREE.Vector3();
	for (const { mesh, tuftOf } of perMesh) {
		mesh.updateMatrixWorld(true);
		const geometry = mesh.geometry;
		const position = geometry.attributes.position;
		const roots = new Float32Array(position.count * 3);
		const axes = new Float32Array(position.count * 3);
		const ids = new Float32Array(position.count);
		const tips = new Float32Array(position.count);
		for (let t = 0; t < tuftOf.length; t++) {
			const id = renumber[tuftOf[t]];
			tuftOf[t] = id;
			a.fromBufferAttribute(position, t * 3);
			b.fromBufferAttribute(position, t * 3 + 1);
			c.fromBufferAttribute(position, t * 3 + 2);
			// The tip is the corner opposite the shortest edge.
			const ab = a.distanceToSquared(b);
			const bc = b.distanceToSquared(c);
			const ca = c.distanceToSquared(a);
			const tip = ab <= bc && ab <= ca ? 2 : bc <= ca ? 0 : 1;
			const [p, q] = [a, b, c].filter((_, k) => k !== tip);
			root.addVectors(p, q).multiplyScalar(0.5);
			const tipAt = [a, b, c][tip];
			for (let k = 0; k < 3; k++) {
				const i = t * 3 + k;
				roots.set([root.x, root.y, root.z], i * 3);
				axes.set([tipAt.x - root.x, tipAt.y - root.y, tipAt.z - root.z], i * 3);
				ids[i] = id;
				tips[i] = k === tip ? 1 : 0;
			}
			root.applyMatrix4(mesh.matrixWorld);
			centres[id * 3] += root.x;
			centres[id * 3 + 1] += root.y;
			centres[id * 3 + 2] += root.z;
			tally[id] += 1;
		}
		geometry.setAttribute('needleRoot', new THREE.BufferAttribute(roots, 3));
		geometry.setAttribute('needleAxis', new THREE.BufferAttribute(axes, 3));
		geometry.setAttribute('tuftId', new THREE.BufferAttribute(ids, 1));
		geometry.setAttribute('needleTip', new THREE.BufferAttribute(tips, 1));
	}
	let lowest = Infinity;
	let highest = -Infinity;
	for (let id = 0; id < count; id++) {
		for (let k = 0; k < 3; k++) centres[id * 3 + k] /= Math.max(1, tally[id]);
		lowest = Math.min(lowest, centres[id * 3 + 1]);
		highest = Math.max(highest, centres[id * 3 + 1]);
	}
	// Uneven growth: each tuft its own pace, and the top of the tree fastest.
	const pace = new Float32Array(count);
	for (let id = 0; id < count; id++) {
		const height = (centres[id * 3 + 1] - lowest) / (highest - lowest || 1);
		const noise = Math.abs(Math.sin(id * 12.9898) * 43758.5453) % 1;
		pace[id] = 0.45 + 0.7 * noise + 0.6 * height;
	}

	const rows = Math.ceil(count / WIDTH);
	const lengths = new Float32Array(WIDTH * rows).fill(NEAT);
	const texture = new THREE.DataTexture(lengths, WIDTH, rows, THREE.RedFormat, THREE.FloatType);
	texture.needsUpdate = true;
	tuftLengths.value = texture;

	function grow(days: number) {
		for (let id = 0; id < count; id++)
			lengths[id] = Math.min(SHAGGY, lengths[id] + days * GROWTH_PER_DAY * pace[id]);
		texture.needsUpdate = true;
	}

	// Trims tufts (each with how strongly, 0-1) for a moment: they shorten quickly while they're
	// overgrown and more slowly once they're neat. Returns each tuft trimmed and by how much.
	const cuts: [number, number][] = [];
	function trim(tufts: [number, number][], dt: number) {
		cuts.length = 0;
		for (const [id, strength] of tufts) {
			if (lengths[id] <= STUB) continue;
			const rate = lengths[id] > NEAT ? 5 : 1.6;
			const cut = Math.min(lengths[id] - STUB, rate * strength * dt);
			lengths[id] -= cut;
			cuts.push([id, cut]);
		}
		if (cuts.length) texture.needsUpdate = true;
		return cuts;
	}

	// The average length: how neat or shaggy the tree looks overall.
	function shagginess() {
		let sum = 0;
		for (let id = 0; id < count; id++) sum += lengths[id];
		return sum / count;
	}

	function setAll(fn: (id: number, length: number) => number) {
		for (let id = 0; id < count; id++) lengths[id] = fn(id, lengths[id]);
		texture.needsUpdate = true;
	}

	// Saved as one byte per tuft (hundredths of its neat length), with when it was saved, so the
	// growth since then can be added on the next visit.
	function save() {
		try {
			const bytes = new Uint8Array(count);
			for (let id = 0; id < count; id++) bytes[id] = Math.round(lengths[id] * 100);
			let text = '';
			for (const byte of bytes) text += String.fromCharCode(byte);
			localStorage.setItem(KEY, JSON.stringify({ count, at: Date.now(), lengths: btoa(text) }));
		} catch {
			// The tree just won't be remembered.
		}
	}

	function load() {
		try {
			const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
			if (saved?.count !== count) return;
			const text = atob(saved.lengths);
			for (let id = 0; id < count; id++)
				lengths[id] = Math.min(SHAGGY, Math.max(STUB, text.charCodeAt(id) / 100));
			texture.needsUpdate = true;
			grow(Math.max(0, (Date.now() - saved.at) / 86_400_000));
		} catch {
			// Nothing saved, or unreadable: the tree starts neat.
		}
	}

	return {
		count,
		centres,
		lengths,
		load,
		save,
		grow,
		trim,
		setAll,
		shagginess,
		dispose: () => texture.dispose()
	};
}

export type Bonsai = ReturnType<typeof createBonsai>;
