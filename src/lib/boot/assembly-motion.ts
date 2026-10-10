// A first-view motion trial, using the complete room. One scene unit is 10 cm.
import type * as THREE from 'three';

const DROP_HEIGHT = 0.7;
const DROP_MS = 420;
const SETTLE_MS = 200;
const CUBE_DELAY_MS = 250;
const SP_TILT = { x: -3.2, z: 2.1 };
const CUBE_TILT = { x: 2.8, z: -3 };
const SETTLE_TILT = 3;
const SHADOW_AT_HEIGHT = 0.12;
const SHADOW_SPREAD = 0.35;

type Contact = THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;

export function createAssemblyMotion(sp: THREE.Object3D, cube: THREE.Object3D, contact: Contact) {
	const query = new URLSearchParams(location.search);
	if (!query.has('land') || matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

	const withCube = query.get('land') === '2';
	const cubeX = cube.rotation.x;
	const cubeZ = cube.rotation.z;
	const shadowScale = contact.scale.clone();
	const radians = Math.PI / 180;
	let started: number | null = null;
	let active = true;

	function place(object: THREE.Object3D, elapsed: number, tilt: typeof SP_TILT) {
		const fall = Math.max(0, Math.min(1, elapsed / DROP_MS));
		const height = 1 - fall * fall;
		const level = 1 - fall;
		const settle = Math.max(0, Math.min(1, (elapsed - DROP_MS) / SETTLE_MS));
		// One small roll on contact, then a much smaller correction. The object never lifts again.
		const roll = Math.sin(settle * Math.PI * 2) * (1 - settle) ** 2 * SETTLE_TILT;
		object.position.y += height * DROP_HEIGHT;
		object.rotation.x += tilt.x * radians * level;
		object.rotation.z += (tilt.z * level + roll) * radians;
		return height;
	}

	function apply(elapsed: number) {
		const height = place(sp, elapsed, SP_TILT);
		if (withCube) {
			cube.rotation.x = cubeX;
			cube.rotation.z = cubeZ;
			place(cube, elapsed - CUBE_DELAY_MS, CUBE_TILT);
		}
		// The same soft dot spreads and pales while the console is lifted. At rest it is unchanged.
		contact.scale.copy(shadowScale).multiplyScalar(1 + height * SHADOW_SPREAD);
		contact.material.opacity *= SHADOW_AT_HEIGHT + (1 - SHADOW_AT_HEIGHT) * (1 - height) ** 1.4;
	}

	function finish() {
		active = false;
		cube.rotation.x = cubeX;
		cube.rotation.z = cubeZ;
		contact.scale.copy(shadowScale);
	}

	return {
		get active() {
			return active;
		},
		// Draw the lifted pose behind the loader before it disappears, without starting the clock.
		prepare: () => apply(0),
		update(time: number) {
			if (!active) return;
			started ??= time;
			const elapsed = time - started;
			if (elapsed >= DROP_MS + SETTLE_MS + (withCube ? CUBE_DELAY_MS : 0)) {
				finish();
				return;
			}
			apply(elapsed);
		},
		finish
	};
}
