// The tree's recipe, shared by the worker and its sliced fallback. Only maths lives here;
// the room wraps the finished arrays in geometry once they arrive.

import { Vector3 } from 'three/src/math/Vector3.js';
import { Matrix3 } from 'three/src/math/Matrix3.js';
import { Matrix4 } from 'three/src/math/Matrix4.js';
import { Color } from 'three/src/math/Color.js';
import * as MathUtils from 'three/src/math/MathUtils.js';
import { CatmullRomCurve3 } from 'three/src/extras/curves/CatmullRomCurve3.js';
import { QuadraticBezierCurve3 } from 'three/src/extras/curves/QuadraticBezierCurve3.js';

const PADS: { centre: [number, number, number]; size: [number, number, number]; shoots: number }[] =
	[
		{ centre: [19, 0, 214], size: [78, 55, 38], shoots: 320 }, // the crown
		{ centre: [-72, 6, 185], size: [47, 40, 28], shoots: 150 }, // left
		{ centre: [62, -4, 134], size: [70, 48, 34], shoots: 280 }, // the big pad cascading right
		{ centre: [110, 4, 160], size: [34, 30, 20], shoots: 80 }, // its upper-right shoulder
		{ centre: [10, 46, 200], size: [36, 26, 20], shoots: 80 } // back, for depth
	];

// Juniper greens (linear), as the old needles had, and the paler green of new growth.
const GREENS = [
	new Color(0.042, 0.13, 0.06),
	new Color(0.075, 0.21, 0.09),
	new Color(0.13, 0.3, 0.15),
	new Color(0.07, 0.2, 0.15)
];
const NEW_GROWTH = new Color(0.2, 0.4, 0.12);

export type BonsaiInput = { roots: number[][]; seed: number; fromModel: number[] };

type GeneratedShoot = { hub: Vector3; nodes: Vector3[]; neat: number; triangles: number[] };

export type BonsaiBuffers = {
	position: Float32Array;
	normal: Int8Array;
	color: Float32Array;
	shootId: Uint16Array;
	node: Uint8Array;
	anchor: Float32Array;
	twigPosition: Float32Array;
	twigNormal: Float32Array;
	lengths: Float32Array;
	pace: Float32Array;
	// Doubles keep the picking points exactly as they were before packing.
	hubs: Float64Array;
	nodes: Float64Array;
	neat: Uint16Array;
	offsets: Uint32Array;
	triangles: Uint32Array;
};

export function* generateBonsai(input: BonsaiInput): Generator<void, BonsaiBuffers> {
	const random = mulberry32(input.seed);
	const rand = (a = 0, b = 1) => a + (b - a) * random();
	const WIDTH = 64;
	const fromModel = new Matrix4().fromArray(input.fromModel);
	const normalFromModel = new Matrix3().getNormalMatrix(fromModel);
	const local = (v: Vector3) => v.clone().applyMatrix4(fromModel);

	// Twigs: tapered tubes, fixed (only the shoots on them can be cut).
	const twig = { position: [] as number[], normal: [] as number[] };
	function tube(points: Vector3[], r0: number, r1: number) {
		const curve = new CatmullRomCurve3(points);
		const steps = 8;
		const sides = 6;
		const frames = curve.computeFrenetFrames(steps, false);
		const rings: { p: Vector3; n: Vector3 }[][] = [];
		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			const centre = curve.getPointAt(t);
			const r = MathUtils.lerp(r0, r1, t);
			const ring = [];
			for (let k = 0; k < sides; k++) {
				const a = (k / sides) * Math.PI * 2;
				const n = frames.normals[i]
					.clone()
					.multiplyScalar(Math.cos(a))
					.addScaledVector(frames.binormals[i], Math.sin(a));
				ring.push({ p: centre.clone().addScaledVector(n, r), n });
			}
			rings.push(ring);
		}
		for (let i = 0; i < steps; i++)
			for (let k = 0; k < sides; k++) {
				const a = rings[i][k];
				const b = rings[i][(k + 1) % sides];
				const c = rings[i + 1][(k + 1) % sides];
				const d = rings[i + 1][k];
				for (const v of [a, b, c, a, c, d]) {
					const p = v.p.clone().applyMatrix4(fromModel);
					const n = v.n.clone().applyMatrix3(normalFromModel).normalize();
					twig.position.push(p.x, p.y, p.z);
					twig.normal.push(n.x, n.y, n.z);
				}
			}
	}

	// The shoots' foliage, built node by node so a node's triangles sit together.
	const leaf = {
		position: [] as number[],
		normal: [] as number[],
		color: [] as number[],
		shoot: [] as number[],
		node: [] as number[],
		anchor: [] as number[]
	};
	const shoots: GeneratedShoot[] = [];
	const triangleCount = () => leaf.position.length / 9;

	const up = new Vector3(0, 0, 1);
	for (const [p, pad] of PADS.entries()) {
		const c = new Vector3(...pad.centre);
		const r = new Vector3(...pad.size);
		// A twig from the nearest branch up into the pad (which also joins up any pad left floating),
		// then forking to a few hubs inside it.
		const base = c.clone().add(new Vector3(0, 0, -r.z * 0.35));
		const from = new Vector3(...(input.roots[p] as [number, number, number]));
		const span = from.distanceTo(base);
		tube(
			[
				from,
				from
					.clone()
					.lerp(base, 0.5)
					.add(new Vector3(0, 0, span * 0.15)),
				base
			],
			2.6,
			1.5
		);
		yield;
		const hubs: Vector3[] = [];
		const hubCount = MathUtils.clamp(Math.round(pad.shoots / 22), 3, 8);
		for (let h = 0; h < hubCount; h++) {
			const hub = base
				.clone()
				.add(new Vector3(rand(-1, 1) * r.x * 0.5, rand(-1, 1) * r.y * 0.5, rand(-0.2, 0.35) * r.z));
			tube(
				[
					base,
					base
						.clone()
						.lerp(hub, 0.5)
						.add(new Vector3(0, 0, 2)),
					hub
				],
				1.5,
				0.7
			);
			hubs.push(hub);
			yield;
		}

		for (let i = 0; i < pad.shoots; i++) {
			// Each shoot reaches from a hub to a point on the pad's outline: mostly the top and sides.
			const theta = rand(0, Math.PI * 2);
			const phi = Math.acos(MathUtils.clamp(1 - 1.8 * Math.pow(random(), 1.4), -1, 1));
			const n = new Vector3(
				Math.sin(phi) * Math.cos(theta),
				Math.sin(phi) * Math.sin(theta),
				Math.cos(phi)
			);
			const tip = c.clone().add(n.clone().multiply(r).multiplyScalar(rand(0.92, 1.03)));
			const hub = hubs.reduce((a, b) =>
				b.distanceToSquared(tip) < a.distanceToSquared(tip) ? b : a
			);
			const span = hub.distanceTo(tip);
			const curve = new QuadraticBezierCurve3(
				hub,
				hub
					.clone()
					.lerp(tip, 0.5)
					.addScaledVector(up, span * 0.15),
				tip
			);
			const neat = Math.max(2, Math.round(span / 5.5));
			const nodes: Vector3[] = [];
			for (let k = 1; k <= neat; k++) nodes.push(curve.getPointAt(k / neat));
			// Past its neat length it keeps going: leggy new growth, curling outwards and up.
			let heading = curve.getTangentAt(1).add(n.clone().multiplyScalar(0.6)).normalize();
			const extra = 5 + Math.floor(rand(0, 3));
			for (let k = 0; k < extra; k++) {
				heading = heading
					.clone()
					.add(new Vector3(rand(-0.25, 0.25), rand(-0.25, 0.25), rand(-0.05, 0.3)))
					.normalize();
				nodes.push(nodes[nodes.length - 1].clone().addScaledVector(heading, 6.5));
			}

			const shootId = shoots.length;
			const green = GREENS[weighted(random(), [2, 4, 3, 2])];
			const triangles: number[] = [];
			const along = new Vector3();
			for (let k = 0; k < nodes.length; k++) {
				triangles.push(triangleCount());
				const p = nodes[k];
				const prev = k === 0 ? hub : nodes[k - 1];
				along.subVectors(p, prev).normalize();
				const grown = k >= neat;
				// Shading: darker deep inside the pad and underneath it.
				const e = p.clone().sub(c).divide(r);
				const depth = Math.min(1, e.length());
				let shade = grown ? 1 : 0.35 + 0.65 * MathUtils.smoothstep(depth, 0.2, 1);
				if (!grown && p.z < c.z) shade *= 0.75;
				const colour = (
					grown ? green.clone().lerp(NEW_GROWTH, Math.min(1, (k - neat + 1) / 3)) : green
				)
					.clone()
					.multiplyScalar(shade);
				// The foliage is lit as if round: its normal points out from the pad's centre.
				const out = e.lengthSq() > 1e-6 ? e.clone().divide(r).normalize() : up.clone();
				const normal = out.lerp(up, 0.3).normalize();
				const add = (v: Vector3) => {
					const q = v.clone().applyMatrix4(fromModel);
					const nn = normal.clone().applyMatrix3(normalFromModel).normalize();
					const a = prev.clone().applyMatrix4(fromModel);
					leaf.position.push(q.x, q.y, q.z);
					leaf.normal.push(nn.x, nn.y, nn.z);
					leaf.color.push(colour.r, colour.g, colour.b);
					leaf.shoot.push(shootId);
					leaf.node.push(k);
					leaf.anchor.push(a.x, a.y, a.z);
				};
				// The stem from the last node to this one.
				const side = along.clone().cross(up).normalize().multiplyScalar(0.35);
				if (side.lengthSq() < 1e-6) side.set(0.35, 0, 0);
				for (const v of [
					prev.clone().add(side),
					prev.clone().sub(side),
					p.clone().sub(side),
					prev.clone().add(side),
					p.clone().sub(side),
					p.clone().add(side)
				])
					add(v);
				// Its needles: a spray fanning forward and outward.
				// A dense little cluster, fuller inside the pad; new growth is sparser.
				const sprays = grown ? 6 : 11;
				for (let j = 0; j < sprays; j++) {
					const d = along
						.clone()
						.multiplyScalar(0.45)
						.addScaledVector(out, 0.45)
						.add(new Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(0.9))
						.normalize();
					const length = rand(4.5, 7.5);
					const root = p.clone().addScaledVector(along, rand(-4, 0.5));
					let perp = d.clone().cross(out);
					perp = perp.lengthSq() > 1e-6 ? perp.normalize() : side.clone().normalize();
					add(root.clone().addScaledVector(perp, 0.7));
					add(root.clone().addScaledVector(perp, -0.7));
					add(root.clone().addScaledVector(d, length));
				}
			}
			triangles.push(triangleCount());
			shoots.push({
				hub: local(hub),
				nodes: nodes.map(local),
				neat,
				triangles
			});
			yield;
		}
	}

	// How far each shoot reaches, in nodes: one texel each, read by the foliage's shader.
	const count = shoots.length;
	const rows = Math.ceil(count / WIDTH);
	const lengths = new Float32Array(WIDTH * rows);
	for (let s = 0; s < count; s++) lengths[s] = shoots[s].neat;
	// Uneven growth: each shoot its own pace, the top of the tree fastest.
	const pace = new Float32Array(count);
	let lowest = Infinity;
	let highest = -Infinity;
	for (const s of shoots) {
		lowest = Math.min(lowest, s.hub.y);
		highest = Math.max(highest, s.hub.y);
	}
	for (let s = 0; s < count; s++) {
		const height = (shoots[s].hub.y - lowest) / (highest - lowest || 1);
		pace[s] = 0.5 + 0.6 * random() + 0.5 * height;
	}

	const hubs = new Float64Array(count * 3);
	const neat = new Uint16Array(count);
	const offsets = new Uint32Array(count + 1);
	const nodes: number[] = [];
	const triangles: number[] = [];
	for (let s = 0; s < count; s++) {
		const shoot = shoots[s];
		hubs.set(shoot.hub.toArray(), s * 3);
		neat[s] = shoot.neat;
		offsets[s] = nodes.length / 3;
		for (const node of shoot.nodes) nodes.push(node.x, node.y, node.z);
		triangles.push(...shoot.triangles);
		yield;
	}
	offsets[count] = nodes.length / 3;
	return {
		position: yield* pack(leaf.position, new Float32Array(leaf.position.length)),
		normal: yield* pack(leaf.normal, new Int8Array(leaf.normal.length), 127),
		color: yield* pack(leaf.color, new Float32Array(leaf.color.length)),
		shootId: yield* pack(leaf.shoot, new Uint16Array(leaf.shoot.length)),
		node: yield* pack(leaf.node, new Uint8Array(leaf.node.length)),
		anchor: yield* pack(leaf.anchor, new Float32Array(leaf.anchor.length)),
		twigPosition: yield* pack(twig.position, new Float32Array(twig.position.length)),
		twigNormal: yield* pack(twig.normal, new Float32Array(twig.normal.length)),
		lengths,
		pace,
		hubs,
		nodes: yield* pack(nodes, new Float64Array(nodes.length)),
		neat,
		offsets,
		triangles: yield* pack(triangles, new Uint32Array(triangles.length))
	};
}

// Conversion is chunked too: the fallback must never convert all the needles in one task.
function* pack<
	T extends Float32Array | Float64Array | Int8Array | Uint8Array | Uint16Array | Uint32Array
>(source: number[], target: T, normalScale?: number): Generator<void, T> {
	for (let start = 0; start < source.length; start += 8192) {
		const end = Math.min(start + 8192, source.length);
		for (let i = start; i < end; i++)
			target[i] = normalScale ? Math.round(source[i] * normalScale) : source[i];
		yield;
	}
	return target;
}

function weighted(x: number, weights: number[]) {
	const total = weights.reduce((a, b) => a + b, 0);
	let at = x * total;
	for (let i = 0; i < weights.length; i++) {
		at -= weights[i];
		if (at < 0) return i;
	}
	return weights.length - 1;
}

function mulberry32(seed: number) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
