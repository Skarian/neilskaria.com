// The 3D intro: the bedroom, the SP lifting off the table, the boot screen and the dive into it.
// This module (and Three.js with it) is code-split: it's only downloaded when the intro is about to
// play, or prefetched in the background once a returning visitor's page is idle.

import { gsap } from 'gsap';
import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { introAssets, lightmapScales } from './assets';
import { bakedMaterial, loadBakedLighting, type BakedLighting } from './baked-material';
import { BOOT_DURATION, drawBootScreen } from './boot-screen';
import { createBootSound } from './sound';
import { drawWatchLCD } from './watch-lcd';

export type IntroOptions = {
	canvas: HTMLCanvasElement;
	// Faded out at the end, so the page shows through.
	layer: HTMLElement;
	// The colour the boot screen fades to; it should match the page underneath.
	background: string;
	muted: boolean;
	onProgress: (progress: number) => void;
	onDone: () => void;
};

export type IntroEngine = {
	start: () => void;
	skip: () => void;
	setMuted: (muted: boolean) => void;
	dispose: () => void;
};

const OPEN = THREE.MathUtils.degToRad(150);
const PITCH = OPEN - Math.PI / 2;
const FLOAT = new THREE.Vector3(0, 1.45, 0.9);
const CAMERA_NEAR = new THREE.Vector3(0.9, 1.9, 6);

// Landscape screens see the bed and the bedside table; portrait screens centre on the table.
export function startView(aspect: number) {
	return aspect < 1
		? { eye: new THREE.Vector3(0.9, 3.4, 18.5), target: new THREE.Vector3(-0.3, 0.7, 0) }
		: { eye: new THREE.Vector3(4.2, 3.2, 14), target: new THREE.Vector3(-1.8, -0.6, 0) };
}

export async function createIntro(options: IntroOptions): Promise<IntroEngine> {
	const { canvas, layer, background, onProgress, onDone } = options;

	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.setSize(innerWidth, innerHeight, false);
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.1;

	const scene = new THREE.Scene();
	scene.background = new THREE.Color('#1a1830');
	const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.01, 200);
	let view = startView(camera.aspect);
	camera.position.copy(view.eye);
	camera.lookAt(view.target);

	// The room's lighting is baked (daylight). The console is lit by the room itself: reflections
	// and ambient light captured from the baked room, so it sits in the same light.

	const screenCanvas = document.createElement('canvas');
	screenCanvas.width = 960;
	screenCanvas.height = 640;
	const screenCtx = screenCanvas.getContext('2d')!;
	const screenTexture = new THREE.CanvasTexture(screenCanvas);
	screenTexture.colorSpace = THREE.SRGBColorSpace;
	screenTexture.flipY = false;
	const screenMaterial = new THREE.MeshBasicMaterial({ color: '#1d201d', toneMapped: false });

	// Animated values, all driven by the GSAP timeline.
	const s = {
		drift: 0,
		rise: 0,
		spin: 0,
		pitch: 0,
		open: 0,
		cartOut: 0,
		bob: 0,
		dip: 0,
		boot: -1,
		dive: 0
	};

	const lampMix = { value: 0 };
	const nearQuat = new THREE.Quaternion();
	const finalPos = new THREE.Vector3();
	const finalQuat = new THREE.Quaternion();
	let timeline: gsap.core.Timeline | undefined;
	let disposed = false;

	// Load everything before the visitor can press Start, so the animation never stutters.
	const draco = new DRACOLoader().setDecoderPath('/draco/');
	const gltf = await new GLTFLoader()
		.setDRACOLoader(draco)
		.loadAsync(introAssets.model, (event) => {
			if (event.total) onProgress((event.loaded / event.total) * 0.7);
		});
	const lighting: Record<string, BakedLighting> = {};
	for (const group of Object.keys(lightmapScales)) {
		lighting[group] = await loadBakedLighting(
			group,
			lightmapScales,
			introAssets.lightmaps,
			lampMix
		);
	}
	draco.dispose();
	scene.add(gltf.scene);

	const sp = gltf.scene.getObjectByName('SP')!;
	const lid = gltf.scene.getObjectByName('Lid')!;
	const screen = gltf.scene.getObjectByName('Screen') as THREE.Mesh;
	const cart = gltf.scene.getObjectByName('Cartridge')!;
	sp.rotation.order = 'YXZ';
	const rest = sp.position.clone();
	const cartRest = cart.position.clone();
	const yaw = Math.atan2(CAMERA_NEAR.x - FLOAT.x, CAMERA_NEAR.z - FLOAT.z);
	let ledMaterial: THREE.MeshStandardMaterial | undefined;
	const reflective: THREE.MeshStandardMaterial[] = [];

	// The Casio on the table shows the visitor's own time.
	const watchCanvas = document.createElement('canvas');
	watchCanvas.width = 512;
	watchCanvas.height = 242;
	const watchCtx = watchCanvas.getContext('2d')!;
	const watchTexture = new THREE.CanvasTexture(watchCanvas);
	watchTexture.colorSpace = THREE.SRGBColorSpace;
	watchTexture.flipY = false;
	watchTexture.anisotropy = 4;
	const watchMaterial = new THREE.MeshBasicMaterial({ map: watchTexture });
	let watchSecond = -1;

	const baked: Record<string, THREE.Material> = {};
	const glows: Record<string, THREE.Color> = {
		Bulb: new THREE.Color('#ffd9a8').multiplyScalar(4),
		LampShade: new THREE.Color('#ffb070').multiplyScalar(1.1)
	};
	gltf.scene.traverse((object) => {
		if (!(object instanceof THREE.Mesh)) return;
		// glTF splits multi-material objects into child meshes, so the tag can sit on the parent.
		const group = object.userData.lightmap ?? object.parent?.userData.lightmap;
		const name = glows[object.name] ? object.name : object.parent?.name;
		if (group && /glass/i.test(object.material.name)) {
			// Glass can't be baked (light passes through it), so it's drawn as a faint clear layer.
			object.material = new THREE.MeshBasicMaterial({
				color: '#ffffff',
				transparent: true,
				opacity: 0.08,
				depthWrite: false
			});
		} else if (group) {
			const key = `${object.material.uuid}:${group}:${name}`;
			baked[key] ??= bakedMaterial(object.material, lighting[group], glows[name ?? '']);
			object.material = baked[key];
		} else if (object.name === 'Sky') {
			object.material = new THREE.MeshBasicMaterial({
				map: (object.material as THREE.MeshStandardMaterial).map
			});
		} else if (object.material.name === 'ShellRed') {
			// The SP's pearlescent plastic: a little metallic, under a clear coat.
			object.material = new THREE.MeshPhysicalMaterial({
				name: 'ShellRed',
				color: (object.material as THREE.MeshStandardMaterial).color,
				roughness: 0.35,
				metalness: 0.15,
				clearcoat: 0.5,
				clearcoatRoughness: 0.15
			});
		} else if (object.material.name === 'ScreenCover') {
			object.material = new THREE.MeshPhysicalMaterial({
				name: 'ScreenCover',
				color: '#060608',
				roughness: 0.05,
				clearcoat: 1
			});
		} else if (object.name === 'PowerLed') {
			object.material = object.material.clone();
			ledMaterial = object.material;
		} else if (object.material.name === 'Chrome') {
			// Polished steel (the tumbler's base band) is lit by reflections, like the console.
			object.material = new THREE.MeshStandardMaterial({
				color: '#d4d6da',
				metalness: 1,
				roughness: 0.25
			});
			reflective.push(object.material);
		} else if (object.material.name === 'LanternPaper') {
			// The kumiko lantern's washi paper, lit from inside.
			object.material = new THREE.MeshBasicMaterial({
				color: new THREE.Color('#ffa24a').multiplyScalar(1.15)
			});
		} else if (object.name === 'WatchLCD') {
			object.material = watchMaterial;
		}
	});
	screen.material = screenMaterial;
	screen.geometry.computeBoundingBox();

	// A soft contact shadow under the console while it rests on the nightstand.
	const contact = new THREE.Mesh(
		new THREE.PlaneGeometry(1.25, 1.2),
		new THREE.MeshBasicMaterial({ map: softDot('0,0,0'), transparent: true, depthWrite: false })
	);
	contact.rotation.x = -Math.PI / 2;
	contact.position.set(rest.x, rest.y - 0.145, rest.z);
	scene.add(contact);

	// Capture the baked room from where the console floats. This lights the console (reflections
	// and ambient light), so it sits in the same light as the room. Only the visible corner of the
	// room is modelled, so the rest of it (the sunlit walls and ceiling behind the camera) stands in
	// as the background while capturing.
	sp.visible = false;
	const pmrem = new THREE.PMREMGenerator(renderer);
	scene.background = new THREE.Color(0.46, 0.36, 0.3);
	const envMap = pmrem.fromScene(scene, 0.02, 0.05, 100, { position: FLOAT }).texture;
	scene.background = new THREE.Color('#1a1830');
	pmrem.dispose();
	sp.visible = true;
	const lit: THREE.MeshStandardMaterial[] = [...reflective];
	sp.traverse((object) => {
		if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshStandardMaterial) {
			lit.push(object.material);
		}
	});
	for (const material of lit) {
		material.envMap = envMap;
		// Matched by eye to the baked props beside it.
		material.envMapIntensity = 2.6;
	}

	// Dust drifting in the sunlight.
	const moteCount = 140;
	const motePositions = new Float32Array(moteCount * 3);
	for (let i = 0; i < moteCount; i++) {
		motePositions[i * 3] = FLOAT.x + (Math.random() - 0.5) * 5;
		motePositions[i * 3 + 1] = FLOAT.y + (Math.random() - 0.4) * 3.5;
		motePositions[i * 3 + 2] = FLOAT.z + (Math.random() - 0.6) * 3;
	}
	const moteGeometry = new THREE.BufferGeometry();
	moteGeometry.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
	const moteMaterial = new THREE.PointsMaterial({
		color: '#ffe9c8',
		size: 0.035,
		map: softDot('255,255,255'),
		transparent: true,
		opacity: 0,
		depthWrite: false,
		blending: THREE.AdditiveBlending
	});
	const motes = new THREE.Points(moteGeometry, moteMaterial);
	scene.add(motes);

	camera.position.copy(CAMERA_NEAR);
	camera.lookAt(FLOAT);
	nearQuat.copy(camera.quaternion);
	camera.position.copy(view.eye);
	camera.lookAt(view.target);
	computeFinalCamera();

	const sound = await createBootSound(introAssets.chime, options.muted);
	onProgress(0.9);
	await document.fonts.ready;
	await renderer.compileAsync(scene, camera);
	renderer.setAnimationLoop(render);
	addEventListener('resize', resize);
	onProgress(1);

	function softDot(rgb: string) {
		const dot = document.createElement('canvas');
		dot.width = dot.height = 64;
		const ctx = dot.getContext('2d')!;
		const gradient = ctx.createRadialGradient(32, 32, 4, 32, 32, 32);
		gradient.addColorStop(0, `rgba(${rgb},1)`);
		gradient.addColorStop(1, `rgba(${rgb},0)`);
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, 64, 64);
		return new THREE.CanvasTexture(dot);
	}

	function pose(t: number) {
		sp.position.lerpVectors(rest, FLOAT, s.rise);
		sp.position.y += s.bob * 0.05 * Math.sin(t * 2.2) - s.dip * 0.05;
		sp.rotation.set(s.pitch * PITCH, s.spin * (Math.PI * 2 + yaw), 0);
		lid.rotation.x = -s.open * OPEN;
		cart.position.copy(cartRest);
		cart.position.z += s.cartOut * 0.45;
		cart.position.y += s.cartOut * s.bob * 0.04 * Math.sin(t * 2.2 + 1.4);
	}

	// Where the camera must sit for the screen to exactly fill the viewport.
	function computeFinalCamera() {
		const saved = { ...s };
		Object.assign(s, { rise: 1, spin: 1, pitch: 1, open: 1, cartOut: 0, bob: 0, dip: 0 });
		pose(0);
		sp.updateMatrixWorld(true);

		const box = screen.geometry.boundingBox!;
		const center = screen.localToWorld(box.getCenter(new THREE.Vector3()));
		const size = box.getSize(new THREE.Vector3());
		const normalMatrix = new THREE.Matrix3().getNormalMatrix(screen.matrixWorld);
		const normal = new THREE.Vector3(0, -1, 0).applyMatrix3(normalMatrix).normalize();
		const up = new THREE.Vector3(0, 0, 1).applyMatrix3(normalMatrix).normalize();

		const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
		const distance = Math.min(size.z / 2 / tan, size.x / 2 / (tan * camera.aspect)) * 0.97;
		finalPos.copy(center).addScaledVector(normal, distance);
		finalQuat.setFromRotationMatrix(new THREE.Matrix4().lookAt(finalPos, center, up));

		Object.assign(s, saved);
	}

	function powerOn() {
		ledMaterial?.emissive.set('#3dff6a');
		if (ledMaterial) ledMaterial.emissiveIntensity = 2;
		screenMaterial.color.set('#ffffff');
		screenMaterial.map = screenTexture;
		screenMaterial.needsUpdate = true;
	}

	function render(time: number) {
		const t = time / 1000;
		pose(t);

		contact.material.opacity = 0.75 * (1 - Math.min(1, s.rise * 1.6));
		moteMaterial.opacity = s.rise * 0.8 * (1 - s.dive);
		motes.rotation.y = t * 0.03;
		motes.position.y = Math.sin(t * 0.4) * 0.08;

		if (s.dive > 0) {
			camera.position.lerpVectors(CAMERA_NEAR, finalPos, s.dive);
			camera.quaternion.slerpQuaternions(nearQuat, finalQuat, s.dive);
		} else {
			camera.position.lerpVectors(view.eye, CAMERA_NEAR, s.drift);
			camera.lookAt(new THREE.Vector3().lerpVectors(view.target, FLOAT, s.drift));
		}

		const now = new Date();
		if (now.getSeconds() !== watchSecond) {
			watchSecond = now.getSeconds();
			drawWatchLCD(watchCtx, now);
			watchTexture.needsUpdate = true;
		}

		if (s.boot >= 0) {
			drawBootScreen(screenCtx, s.boot, background);
			screenTexture.needsUpdate = true;
		}
		renderer.render(scene, camera);
	}

	function resize() {
		renderer.setSize(innerWidth, innerHeight, false);
		camera.aspect = innerWidth / innerHeight;
		camera.updateProjectionMatrix();
		view = startView(camera.aspect);
		computeFinalCamera();
	}

	function timelineFor() {
		const tl = gsap.timeline({ paused: true, onComplete: finish });
		tl.to(s, { drift: 1, duration: 2.8, ease: 'power1.inOut' }, 0)
			.to(s, { rise: 1, duration: 1.3, ease: 'back.out(1.6)' }, 0.3)
			.to(s, { spin: 1, duration: 1.5, ease: 'power2.inOut' }, 0.3)
			.to(s, { open: 1, duration: 0.9, ease: 'back.out(1.4)' }, 0.5)
			.to(s, { pitch: 1, duration: 1.0, ease: 'power2.inOut' }, 0.7)
			.to(s, { cartOut: 1, duration: 0.5, ease: 'back.out(2)' }, 0.9)
			.to(s, { bob: 1, duration: 0.6 }, 1.4)
			.to(s, { cartOut: 0, duration: 0.35, ease: 'power3.in' }, 2.4)
			.call(() => sound.click(), [], 2.75)
			.to(s, { dip: 1, duration: 0.08, yoyo: true, repeat: 1 }, 2.75)
			.call(powerOn, [], 2.8)
			.fromTo(s, { boot: 0 }, { boot: BOOT_DURATION, duration: BOOT_DURATION, ease: 'none' }, 2.8)
			.call(() => sound.chime(), [], 2.8)
			.to(s, { bob: 0, duration: 1.4 }, 3.3)
			// A slow push while the logo plays, then one glide into the screen that slows to a stop
			// as the screen fills, so there's no jolt when the page takes over.
			.to(s, { dive: 0.25, duration: BOOT_DURATION - 0.9, ease: 'sine.inOut' }, 2.8)
			.to(s, { dive: 1, duration: 1.1, ease: 'power2.inOut' }, 2.8 + BOOT_DURATION - 0.9)
			// Once the screen fills the view, the whole layer fades (not just the canvas), so nothing
			// dark shows between the screen and the page.
			.to(layer, { opacity: 0, duration: 0.35 }, 2.8 + BOOT_DURATION + 0.1);
		return tl;
	}

	function finish() {
		timeline?.kill();
		dispose();
		onDone();
	}

	// Frees the GPU as soon as the page takes over; nothing 3D runs while the HTML is showing.
	function dispose() {
		if (disposed) return;
		disposed = true;
		removeEventListener('resize', resize);
		renderer.setAnimationLoop(null);
		scene.traverse((object) => {
			if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
				object.geometry.dispose();
				for (const material of [object.material].flat()) {
					for (const value of Object.values(material))
						if (value instanceof THREE.Texture) value.dispose();
					material.dispose();
				}
			}
		});
		envMap.dispose();
		screenTexture.dispose();
		watchTexture.dispose();
		renderer.dispose();
		renderer.forceContextLoss();
		setTimeout(() => sound.close(), 4000);
	}

	return {
		start: async () => {
			await sound.resume();
			timeline = timelineFor();
			// Lets screenshot scripts seek to exact moments during development.
			if (import.meta.env.DEV) Object.assign(window, { __boot: { s, timeline, scene } });
			timeline.play();
		},
		skip: finish,
		setMuted: (muted) => sound.setMuted(muted),
		dispose
	};
}
