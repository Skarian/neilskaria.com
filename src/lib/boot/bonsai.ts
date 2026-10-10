// The bonsai as something to look after. The trunk, branches and pot come from the room's model; the
// foliage is grown here: twigs reaching from the branches into each pad, and on them juniper shoots,
// each a chain of little nodes of needles running from a twig out to its tip. A shoot's state is
// how far out it reaches (in nodes): cutting sets that to where the cut crossed it, and it grows
// back out from there, past its neat length if it's left. The whole tree sits on a turntable and is
// lit live (rather than baked), so it can be turned all the way round.

import * as THREE from 'three';
import roots from './assets/bonsai-roots.json';

const KEY = 'bonsai-shoots';
// The model's units: props.py works in millimetres, at 0.01 units each (before the tree's own scale).
const MM = 0.01;
const WIDTH = 64;
// Regrowth, in nodes a day: back to neat after a couple of days, then slower, outwards.
const REGROW = 3;
const OVERGROW = 0.9;

// The foliage pads, as in props.py: centre and half-sizes in millimetres (x right, y back, z up), and
// how many shoots fill each.
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
	new THREE.Color(0.042, 0.13, 0.06),
	new THREE.Color(0.075, 0.21, 0.09),
	new THREE.Color(0.13, 0.3, 0.15),
	new THREE.Color(0.07, 0.2, 0.15)
];
const NEW_GROWTH = new THREE.Color(0.2, 0.4, 0.12);

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

export function createBonsai(root: THREE.Object3D) {
	const random = mulberry32(11);
	const rand = (a = 0, b = 1) => a + (b - a) * random();

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

	// From the model's millimetres (Blender axes) into the turntable's space.
	const fromModel = new THREE.Matrix4()
		.copy(turntable.matrixWorld)
		.invert()
		.multiply(wood.matrixWorld)
		.multiply(new THREE.Matrix4().set(MM, 0, 0, 0, 0, 0, MM, 0, 0, -MM, 0, 0, 0, 0, 0, 1));
	const normalFromModel = new THREE.Matrix3().getNormalMatrix(fromModel);
	const local = (v: THREE.Vector3) => v.clone().applyMatrix4(fromModel);

	// Twigs: tapered tubes, fixed (only the shoots on them can be cut).
	const twig = { position: [] as number[], normal: [] as number[] };
	function tube(points: THREE.Vector3[], r0: number, r1: number) {
		const curve = new THREE.CatmullRomCurve3(points);
		const steps = 8;
		const sides = 6;
		const frames = curve.computeFrenetFrames(steps, false);
		const rings: { p: THREE.Vector3; n: THREE.Vector3 }[][] = [];
		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			const centre = curve.getPointAt(t);
			const r = THREE.MathUtils.lerp(r0, r1, t);
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
	const shoots: Shoot[] = [];
	const triangleCount = () => leaf.position.length / 9;

	const up = new THREE.Vector3(0, 0, 1);
	for (const [p, pad] of PADS.entries()) {
		const c = new THREE.Vector3(...pad.centre);
		const r = new THREE.Vector3(...pad.size);
		// A twig from the nearest branch up into the pad (which also joins up any pad left floating),
		// then forking to a few hubs inside it.
		const base = c.clone().add(new THREE.Vector3(0, 0, -r.z * 0.35));
		const from = new THREE.Vector3(...(roots.roots[p] as [number, number, number]));
		const span = from.distanceTo(base);
		tube(
			[
				from,
				from
					.clone()
					.lerp(base, 0.5)
					.add(new THREE.Vector3(0, 0, span * 0.15)),
				base
			],
			2.6,
			1.5
		);
		const hubs: THREE.Vector3[] = [];
		const hubCount = THREE.MathUtils.clamp(Math.round(pad.shoots / 22), 3, 8);
		for (let h = 0; h < hubCount; h++) {
			const hub = base
				.clone()
				.add(
					new THREE.Vector3(
						rand(-1, 1) * r.x * 0.5,
						rand(-1, 1) * r.y * 0.5,
						rand(-0.2, 0.35) * r.z
					)
				);
			tube(
				[
					base,
					base
						.clone()
						.lerp(hub, 0.5)
						.add(new THREE.Vector3(0, 0, 2)),
					hub
				],
				1.5,
				0.7
			);
			hubs.push(hub);
		}

		for (let i = 0; i < pad.shoots; i++) {
			// Each shoot reaches from a hub to a point on the pad's outline: mostly the top and sides.
			const theta = rand(0, Math.PI * 2);
			const phi = Math.acos(THREE.MathUtils.clamp(1 - 1.8 * Math.pow(random(), 1.4), -1, 1));
			const n = new THREE.Vector3(
				Math.sin(phi) * Math.cos(theta),
				Math.sin(phi) * Math.sin(theta),
				Math.cos(phi)
			);
			const tip = c.clone().add(n.clone().multiply(r).multiplyScalar(rand(0.92, 1.03)));
			const hub = hubs.reduce((a, b) =>
				b.distanceToSquared(tip) < a.distanceToSquared(tip) ? b : a
			);
			const span = hub.distanceTo(tip);
			const curve = new THREE.QuadraticBezierCurve3(
				hub,
				hub
					.clone()
					.lerp(tip, 0.5)
					.addScaledVector(up, span * 0.15),
				tip
			);
			const neat = Math.max(2, Math.round(span / 5.5));
			const nodes: THREE.Vector3[] = [];
			for (let k = 1; k <= neat; k++) nodes.push(curve.getPointAt(k / neat));
			// Past its neat length it keeps going: leggy new growth, curling outwards and up.
			let heading = curve.getTangentAt(1).add(n.clone().multiplyScalar(0.6)).normalize();
			const extra = 5 + Math.floor(rand(0, 3));
			for (let k = 0; k < extra; k++) {
				heading = heading
					.clone()
					.add(new THREE.Vector3(rand(-0.25, 0.25), rand(-0.25, 0.25), rand(-0.05, 0.3)))
					.normalize();
				nodes.push(nodes[nodes.length - 1].clone().addScaledVector(heading, 6.5));
			}

			const shootId = shoots.length;
			const green = GREENS[weighted(random(), [2, 4, 3, 2])];
			const triangles: number[] = [];
			const along = new THREE.Vector3();
			for (let k = 0; k < nodes.length; k++) {
				triangles.push(triangleCount());
				const p = nodes[k];
				const prev = k === 0 ? hub : nodes[k - 1];
				along.subVectors(p, prev).normalize();
				const grown = k >= neat;
				// Shading: darker deep inside the pad and underneath it.
				const e = p.clone().sub(c).divide(r);
				const depth = Math.min(1, e.length());
				let shade = grown ? 1 : 0.35 + 0.65 * THREE.MathUtils.smoothstep(depth, 0.2, 1);
				if (!grown && p.z < c.z) shade *= 0.75;
				const colour = (
					grown ? green.clone().lerp(NEW_GROWTH, Math.min(1, (k - neat + 1) / 3)) : green
				)
					.clone()
					.multiplyScalar(shade);
				// The foliage is lit as if round: its normal points out from the pad's centre.
				const out = e.lengthSq() > 1e-6 ? e.clone().divide(r).normalize() : up.clone();
				const normal = out.lerp(up, 0.3).normalize();
				const add = (v: THREE.Vector3) => {
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
						.add(new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(0.9))
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
		}
	}

	// How far each shoot reaches, in nodes: one texel each, read by the foliage's shader.
	const count = shoots.length;
	const rows = Math.ceil(count / WIDTH);
	const lengths = new Float32Array(WIDTH * rows);
	for (let s = 0; s < count; s++) lengths[s] = shoots[s].neat;
	const texture = new THREE.DataTexture(lengths, WIDTH, rows, THREE.RedFormat, THREE.FloatType);
	texture.needsUpdate = true;
	const lengthsUniform = { value: texture };
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

	const foliageGeometry = new THREE.BufferGeometry();
	foliageGeometry.setAttribute('position', new THREE.Float32BufferAttribute(leaf.position, 3));
	// (Kept compact on the GPU: normals in a byte each, ids as small whole numbers; a third of a
	// degree off at most for the normals, the ids exact.)
	foliageGeometry.setAttribute(
		'normal',
		new THREE.BufferAttribute(
			Int8Array.from(leaf.normal, (v) => Math.round(v * 127)),
			3,
			true
		)
	);
	foliageGeometry.setAttribute('color', new THREE.Float32BufferAttribute(leaf.color, 3));
	foliageGeometry.setAttribute(
		'shootId',
		new THREE.BufferAttribute(Uint16Array.from(leaf.shoot), 1)
	);
	foliageGeometry.setAttribute('node', new THREE.BufferAttribute(Uint8Array.from(leaf.node), 1));
	foliageGeometry.setAttribute('anchor', new THREE.Float32BufferAttribute(leaf.anchor, 3));
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
	twigGeometry.setAttribute('position', new THREE.Float32BufferAttribute(twig.position, 3));
	twigGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(twig.normal, 3));
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

export type Bonsai = ReturnType<typeof createBonsai>;

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
