// The Rubik's cube on the nightstand, as a working puzzle: 26 pieces that turn in layers. The room
// builds it in place of the modelled cube, with the same materials, so it looks the same until it's
// played with.

import { gsap } from 'gsap';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type Axis = 0 | 1 | 2;
// A quarter turn of one layer: `dir` 1 turns it anticlockwise looking down the axis (right-handed).
export type Move = { axis: Axis; layer: -1 | 0 | 1; dir: 1 | -1 };
// The six faces, in the cube's own frame.
export type Face = '+x' | '-x' | '+y' | '-y' | '+z' | '-z';

const QUARTER = Math.PI / 2;
const AXES = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];

export function encodeMove(m: Move) {
	return `${'xyz'[m.axis]}${m.layer + 1}${m.dir > 0 ? '+' : '-'}`;
}

export function decodeMove(text: string): Move | null {
	const match = /^([xyz])([012])([+-])$/.exec(text);
	if (!match) return null;
	return {
		axis: 'xyz'.indexOf(match[1]) as Axis,
		layer: (Number(match[2]) - 1) as Move['layer'],
		dir: match[3] === '+' ? 1 : -1
	};
}

export function createRubiks(options: {
	// The edge length of the whole cube.
	size: number;
	body: THREE.Material;
	stickers: Record<Face, THREE.Material>;
}) {
	const { size, body, stickers } = options;
	// Proportions of the modelled cube (57 mm, with 18.7 mm pieces and 15.6 mm stickers).
	const step = size / 3;
	const piece = size * (18.7 / 57);
	const sticker = size * (15.6 / 57);

	// The root sits where the cube rests; `orbit` is how the player has turned it in their hands.
	const root = new THREE.Group();
	root.name = 'CubePuzzle';
	const orbit = new THREE.Group();
	root.add(orbit);
	// A turning layer's pieces are moved onto the pivot while it turns.
	const pivot = new THREE.Group();
	orbit.add(pivot);

	const bodyGeometry = new RoundedBoxGeometry(piece, piece, piece, 3, size * (1.6 / 57));
	const stickerGeometry = new THREE.ShapeGeometry(roundedSquare(sticker, size * (2.2 / 57)), 4);
	const pieces: THREE.Group[] = [];
	for (let x = -1; x <= 1; x++)
		for (let y = -1; y <= 1; y++)
			for (let z = -1; z <= 1; z++) {
				if (x === 0 && y === 0 && z === 0) continue;
				const group = new THREE.Group();
				group.position.set(x * step, y * step, z * step);
				group.add(new THREE.Mesh(bodyGeometry, body));
				const coord = [x, y, z];
				for (let axis = 0; axis < 3; axis++) {
					if (coord[axis] === 0) continue;
					const normal = AXES[axis].clone().multiplyScalar(coord[axis]);
					const face = `${coord[axis] > 0 ? '+' : '-'}${'xyz'[axis]}` as Face;
					const mesh = new THREE.Mesh(stickerGeometry, stickers[face]);
					mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
					mesh.position.copy(normal).multiplyScalar(piece / 2 + size * 0.0015);
					mesh.userData.face = face;
					mesh.userData.normal = normal;
					group.add(mesh);
				}
				orbit.add(group);
				pieces.push(group);
			}

	// The layer being turned, and how far (in radians).
	let turning: { axis: Axis; layer: number; angle: number } | null = null;

	function layerOf(axis: Axis, layer: number) {
		return pieces.filter((p) => Math.round(p.position.getComponent(axis) / step) === layer);
	}

	function grab(axis: Axis, layer: number) {
		release();
		pivot.rotation.set(0, 0, 0);
		pivot.updateMatrixWorld();
		for (const p of layerOf(axis, layer)) pivot.attach(p);
		turning = { axis, layer, angle: 0 };
	}

	function setAngle(angle: number) {
		if (!turning) return;
		turning.angle = angle;
		pivot.rotation.set(0, 0, 0);
		pivot.rotation[('xyz' as const)[turning.axis] as 'x' | 'y' | 'z'] = angle;
	}

	// Puts the turned pieces back on the cube, snapped exactly to the grid.
	function release() {
		if (!turning) return;
		pivot.updateMatrixWorld();
		for (const p of [...pivot.children]) {
			orbit.attach(p);
			p.position.set(
				Math.round(p.position.x / step) * step,
				Math.round(p.position.y / step) * step,
				Math.round(p.position.z / step) * step
			);
			const m = new THREE.Matrix4().makeRotationFromQuaternion(p.quaternion);
			for (const i of [0, 1, 2, 4, 5, 6, 8, 9, 10]) m.elements[i] = Math.round(m.elements[i]);
			p.quaternion.setFromRotationMatrix(m);
		}
		pivot.rotation.set(0, 0, 0);
		turning = null;
	}

	// Turns a layer at once (restoring a saved cube), or animated.
	function apply(move: Move) {
		grab(move.axis, move.layer);
		setAngle(move.dir * QUARTER);
		release();
	}

	function animate(move: Move, duration: number, ease = 'power2.out') {
		return new Promise<void>((resolve) => {
			if (!turning || turning.axis !== move.axis || turning.layer !== move.layer)
				grab(move.axis, move.layer);
			const t = { angle: turning!.angle };
			gsap.to(t, {
				angle: move.dir * QUARTER,
				duration,
				ease,
				onUpdate: () => setAngle(t.angle),
				onComplete: () => {
					release();
					resolve();
				}
			});
		});
	}

	// Lets go of a layer mid-drag: it settles back, or on to the next quarter.
	function settle(dir: -1 | 0 | 1, duration = 0.18) {
		if (!turning) return Promise.resolve();
		if (dir !== 0)
			return animate(
				{ axis: turning.axis, layer: turning.layer as Move['layer'], dir },
				duration,
				'back.out(2)'
			);
		const t = { angle: turning.angle };
		return new Promise<void>((resolve) =>
			gsap.to(t, {
				angle: 0,
				duration,
				ease: 'power2.out',
				onUpdate: () => setAngle(t.angle),
				onComplete: () => {
					release();
					resolve();
				}
			})
		);
	}

	// Solved when every face shows one colour (whichever way the middle layers have been turned).
	function isSolved() {
		const seen = new Map<string, string>();
		for (const p of pieces)
			for (const mesh of p.children) {
				const face = mesh.userData.face as string | undefined;
				if (!face) continue;
				const n = (mesh.userData.normal as THREE.Vector3).clone().applyQuaternion(p.quaternion);
				const key = `${Math.round(n.x)},${Math.round(n.y)},${Math.round(n.z)}`;
				if ((seen.get(key) ?? face) !== face) return false;
				seen.set(key, face);
			}
		return true;
	}

	function dispose() {
		bodyGeometry.dispose();
		stickerGeometry.dispose();
	}

	return { root, orbit, step, grab, setAngle, settle, apply, animate, isSolved, dispose };
}

export type Rubiks = ReturnType<typeof createRubiks>;

function roundedSquare(side: number, radius: number) {
	const h = side / 2;
	const shape = new THREE.Shape();
	shape.moveTo(-h + radius, -h);
	shape.lineTo(h - radius, -h);
	shape.quadraticCurveTo(h, -h, h, -h + radius);
	shape.lineTo(h, h - radius);
	shape.quadraticCurveTo(h, h, h - radius, h);
	shape.lineTo(-h + radius, h);
	shape.quadraticCurveTo(-h, h, -h, h - radius);
	shape.lineTo(-h, -h + radius);
	shape.quadraticCurveTo(-h, -h, -h + radius, -h);
	return shape;
}

// A random scramble of outer-layer turns, never turning the same axis twice in a row.
export function scrambleMoves(count: number): Move[] {
	const moves: Move[] = [];
	let last = -1;
	while (moves.length < count) {
		const axis = Math.floor(Math.random() * 3) as Axis;
		if (axis === last) continue;
		last = axis;
		moves.push({
			axis,
			layer: Math.random() < 0.5 ? -1 : 1,
			dir: Math.random() < 0.5 ? -1 : 1
		});
	}
	return moves;
}
