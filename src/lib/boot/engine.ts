// The room: the bedside table in 3D, the home screen of the site. Click the Game Boy Advance SP and it
// lifts off the table, boots, and the camera dives into its screen to hand over to the page; going
// back plays the same thing in reverse. While the page is showing, nothing renders.
// This module (and Three.js with it) is code-split and only downloaded when the room is needed.

import { gsap } from 'gsap';
import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { introAssets, lightmapScales } from './assets';
import { bakedMaterial, loadBakedLighting, swayTime, type BakedLighting } from './baked-material';
import { BOOT_DURATION, drawBootScreen } from './boot-screen';
import { drawClockLED } from './clock-led';
import { createBootSound } from './sound';

export type RoomMode = 'room' | 'booting' | 'site' | 'returning';
export type Hover = { label: string; x: number; y: number } | null;
export type Thing = 'sp' | 'cube' | 'clock' | 'lantern' | 'bonsai';

export type RoomOptions = {
	canvas: HTMLCanvasElement;
	// Faded out at the end of the boot, so the page shows through.
	layer: HTMLElement;
	// The colour the boot screen fades to; it should match the page underneath.
	background: string;
	muted: boolean;
	// Start in the room, or already on the page (preloaded in the background, paused).
	startIn: 'room' | 'site';
	onProgress: (progress: number) => void;
	onMode: (mode: RoomMode) => void;
	onHover: (hover: Hover) => void;
	// An object's mini-game has opened (or closed, with null).
	onFocus: (thing: Thing | null) => void;
};

export type Room = {
	enterSite: () => void;
	skipToSite: () => void;
	returnToRoom: () => void;
	unfocus: () => void;
	// The lantern: a colour (any CSS colour) and a brightness from 0 to 1.5.
	setLantern: (color: string, level: number) => void;
	setMuted: (muted: boolean) => void;
	dispose: () => void;
};

const LABELS: Record<Thing, string> = {
	sp: 'Game Boy Advance SP · open the site',
	cube: "Rubik's cube · coming soon",
	clock: 'Clock radio · coming soon',
	lantern: 'Kumiko lantern · change the light',
	bonsai: 'Bonsai · coming soon'
};

const OPEN = THREE.MathUtils.degToRad(150);
const PITCH = OPEN - Math.PI / 2;
const FLOAT = new THREE.Vector3(0, 1.45, 0.9);
const CAMERA_NEAR = new THREE.Vector3(0.9, 1.9, 6);
const LANTERN_PAPER = new THREE.Color('#ffa24a').multiplyScalar(1.15);
// The colour the lantern's bulb was baked with (linear), so other colours can be expressed relative to it.
const LANTERN_BAKED = new THREE.Color(1.0, 0.62, 0.3);

// Both look down at the tabletop from close by; phones use a wider lens to fit all of it in.
export function startView(aspect: number) {
	if (import.meta.env.DEV) {
		// Lets a test script try camera framings live.
		const o = (window as unknown as { __view?: Record<string, number[]> }).__view;
		const v = o && (aspect < 1 ? o.portrait : o.landscape);
		if (v)
			return {
				eye: new THREE.Vector3(v[0], v[1], v[2]),
				target: new THREE.Vector3(v[3], v[4], v[5]),
				fov: v[6]
			};
	}
	return aspect < 1
		? { eye: new THREE.Vector3(0, 5.0, 6.8), target: new THREE.Vector3(0, 0.2, -0.2), fov: 70 }
		: { eye: new THREE.Vector3(0.7, 2.9, 6.4), target: new THREE.Vector3(0, 0.65, -0.2), fov: 38 };
}

export async function createRoom(options: RoomOptions): Promise<Room> {
	const { canvas, layer, background, onProgress, onMode, onHover, onFocus } = options;

	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.setSize(innerWidth, innerHeight, false);
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.1;

	const scene = new THREE.Scene();
	scene.background = new THREE.Color('#120f0c');
	// The closest the camera gets is about 0.6 units (diving into the screen), so the near plane can sit
	// at 0.05; any closer wastes depth precision and small details start to flicker.
	const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.05, 120);
	let view = startView(camera.aspect);
	camera.fov = view.fov;
	camera.updateProjectionMatrix();
	camera.position.copy(view.eye);
	camera.lookAt(view.target);

	const screenCanvas = document.createElement('canvas');
	screenCanvas.width = 960;
	screenCanvas.height = 640;
	const screenCtx = screenCanvas.getContext('2d')!;
	const screenTexture = new THREE.CanvasTexture(screenCanvas);
	screenTexture.colorSpace = THREE.SRGBColorSpace;
	screenTexture.flipY = false;
	const screenMaterial = new THREE.MeshBasicMaterial({ color: '#1d201d', toneMapped: false });
	const screenFade = { value: 0 };

	// The clock radio shows the visitor's own time.
	const clockCanvas = document.createElement('canvas');
	clockCanvas.width = 512;
	clockCanvas.height = 156;
	const clockCtx = clockCanvas.getContext('2d')!;
	const clockTexture = new THREE.CanvasTexture(clockCanvas);
	clockTexture.colorSpace = THREE.SRGBColorSpace;
	clockTexture.flipY = false;
	const clockMaterial = new THREE.MeshBasicMaterial({ map: clockTexture, toneMapped: false });
	let clockTick = -1;

	// Animated values, all driven by GSAP.
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
	const hover = { sp: 0 };
	const lantern = { level: 1, color: new THREE.Color().copy(LANTERN_BAKED) };
	const focusBlend = { value: 0 };
	const focusView = { eye: new THREE.Vector3(), target: new THREE.Vector3() };
	let focused: Thing | null = null;
	let screenOff = false;
	const lampTint = { value: new THREE.Color(1, 1, 1) };
	const pointer = new THREE.Vector2();
	const parallax = new THREE.Vector2();
	const nearQuat = new THREE.Quaternion();
	const finalPos = new THREE.Vector3();
	const finalQuat = new THREE.Quaternion();
	let mode: RoomMode = options.startIn;
	let timeline: gsap.core.Timeline | undefined;
	let hovered: Thing | null = null;
	let disposed = false;

	// Load everything up front, so nothing stutters once it's moving.
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
			lampTint
		);
	}
	draco.dispose();
	scene.add(gltf.scene);

	const sp = gltf.scene.getObjectByName('SP')!;
	const lid = gltf.scene.getObjectByName('Lid')!;
	const screen = gltf.scene.getObjectByName('Screen') as THREE.Mesh;
	const cart = gltf.scene.getObjectByName('Cartridge')!;
	sp.rotation.order = 'YXZ';
	// Set down casually: forward on the table, a little off centre, turned a bit.
	const rest = sp.position.clone().add(new THREE.Vector3(0.18, 0, 0.55));
	const REST_YAW = THREE.MathUtils.degToRad(-16);
	const cartRest = cart.position.clone();
	const yaw = Math.atan2(CAMERA_NEAR.x - FLOAT.x, CAMERA_NEAR.z - FLOAT.z);
	let ledMaterial: THREE.MeshStandardMaterial | undefined;
	const paperMaterials: THREE.MeshBasicMaterial[] = [];
	const live: THREE.MeshStandardMaterial[] = [];

	const baked: Record<string, THREE.Material> = {};
	gltf.scene.traverse((object) => {
		if (!(object instanceof THREE.Mesh)) return;
		// glTF splits multi-material objects into child meshes, so the tag can sit on the parent.
		const group = object.userData.lightmap ?? object.parent?.userData.lightmap;
		const name = object.material.name as string;
		if (group && /glass/i.test(name)) {
			// Glass can't be baked (light passes through it), so it's drawn as a faint clear layer.
			object.material = new THREE.MeshBasicMaterial({
				color: '#ffffff',
				transparent: true,
				opacity: 0.08,
				depthWrite: false
			});
		} else if (group) {
			const key = `${object.material.uuid}:${group}`;
			baked[key] ??= bakedMaterial(object.material, lighting[group], { sway: group === 'foliage' });
			object.material = baked[key];
		} else if (object.name === 'Sky') {
			object.material = new THREE.MeshBasicMaterial({
				map: (object.material as THREE.MeshStandardMaterial).map
			});
		} else if (name === 'ShellRed') {
			// The SP's pearlescent plastic: a little metallic, under a clear coat.
			object.material = new THREE.MeshPhysicalMaterial({
				name,
				color: (object.material as THREE.MeshStandardMaterial).color,
				roughness: 0.35,
				metalness: 0.15,
				clearcoat: 0.5,
				clearcoatRoughness: 0.15
			});
		} else if (name === 'ScreenCover') {
			object.material = new THREE.MeshPhysicalMaterial({
				name,
				color: '#060608',
				roughness: 0.05,
				clearcoat: 1
			});
		} else if (object.name === 'PowerLed') {
			object.material = object.material.clone();
			ledMaterial = object.material;
		} else if (name === 'Chrome') {
			// Polished steel (the tumbler's base band) is lit by reflections.
			object.material = new THREE.MeshStandardMaterial({
				color: '#d4d6da',
				metalness: 1,
				roughness: 0.25
			});
		} else if (name === 'LanternPaper') {
			// The kumiko lantern's washi paper, lit from inside.
			object.material = new THREE.MeshBasicMaterial({ color: LANTERN_PAPER.clone() });
			paperMaterials.push(object.material);
		} else if (object.name === 'ClockDisplay') {
			object.material = clockMaterial;
		} else if (object.name === 'ClockDigits') {
			// Only there for Blender previews; the site draws the display itself.
			object.visible = false;
		}
		if (/^Cube(White|Green|Blue|Red|Orange)$/.test(object.material.name)) {
			// The stickers sit a hair off the cube's body; always draw them in front of it.
			object.material.polygonOffset = true;
			object.material.polygonOffsetFactor = -2;
			object.material.polygonOffsetUnits = -2;
		}
		// The cube rests exactly on the tabletop; lift it a hair so its underside doesn't flicker
		// through the table.
		if (/^Cube/.test(object.name)) object.position.y += 0.003;
		if (object.material instanceof THREE.MeshStandardMaterial) live.push(object.material);
	});
	screen.material = screenMaterial;
	screen.geometry.computeBoundingBox();

	// A soft contact shadow under the console while it rests on the nightstand.
	const contact = new THREE.Mesh(
		new THREE.PlaneGeometry(1.25, 1.2),
		new THREE.MeshBasicMaterial({ map: softDot('0,0,0'), transparent: true, depthWrite: false })
	);
	contact.rotation.set(-Math.PI / 2, 0, REST_YAW);
	contact.position.set(rest.x, rest.y - 0.145, rest.z);
	scene.add(contact);

	// Things that move (the console, the cube) are lit live, from a capture of the baked room. Only
	// the visible corner of the room is modelled, so a warm colour stands in for the rest of it.
	sp.visible = false;
	const pmrem = new THREE.PMREMGenerator(renderer);
	scene.background = new THREE.Color(0.66, 0.52, 0.42);
	const envMap = pmrem.fromScene(scene, 0.02, 0.05, 100, { position: FLOAT }).texture;
	scene.background = new THREE.Color('#120f0c');
	pmrem.dispose();
	sp.visible = true;
	for (const material of live) {
		material.envMap = envMap;
		// Matched by eye to the baked props beside it.
		material.envMapIntensity = 1.6;
	}

	const key = new THREE.DirectionalLight('#ffe2c4', 1.5);
	key.position.set(2.5, 5, 10);
	scene.add(key);
	const fill = new THREE.DirectionalLight('#ffd0a0', 0.5);
	fill.position.set(-6, 2, 6);
	scene.add(fill);

	// Dust drifting in the light.
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
		size: 0.03,
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

	const raycaster = new THREE.Raycaster();
	addEventListener('resize', resize);
	document.addEventListener('visibilitychange', updateLoop);
	canvas.addEventListener('pointermove', pointermove);
	canvas.addEventListener('pointerleave', pointerleave);
	canvas.addEventListener('click', click);
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
		sp.position.y += s.bob * 0.05 * Math.sin(t * 2.2) - s.dip * 0.05 + hover.sp * 0.06;
		sp.rotation.set(
			s.pitch * PITCH,
			THREE.MathUtils.lerp(REST_YAW, Math.PI * 2 + yaw, s.spin),
			hover.sp * 0.04
		);
		lid.rotation.x = -s.open * OPEN;
		cart.position.copy(cartRest);
		cart.position.z += s.cartOut * 0.45;
		cart.position.y += s.cartOut * s.bob * 0.04 * Math.sin(t * 2.2 + 1.4);
	}

	// Where the camera must sit for the screen to exactly fill the viewport.
	function computeFinalCamera() {
		const saved = { ...s };
		const savedHover = hover.sp;
		hover.sp = 0;
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
		hover.sp = savedHover;
	}

	function power(on: boolean) {
		ledMaterial?.emissive.set(on ? '#3dff6a' : '#000000');
		if (ledMaterial) ledMaterial.emissiveIntensity = on ? 2 : 0;
		screenMaterial.color.set(on ? '#ffffff' : '#1d201d');
		screenMaterial.map = on ? screenTexture : null;
		screenMaterial.needsUpdate = true;
	}

	// Tints the lantern's baked light (and its glowing paper) towards a colour, at a brightness.
	function applyLantern() {
		const { color, level } = lantern;
		lampTint.value
			.setRGB(color.r / LANTERN_BAKED.r, color.g / LANTERN_BAKED.g, color.b / LANTERN_BAKED.b)
			.multiplyScalar(level);
		const paper = new THREE.Color().copy(color);
		paper.multiplyScalar(1.6 / Math.max(paper.r, paper.g, paper.b));
		for (const material of paperMaterials)
			material.color.copy(paper).multiplyScalar(0.18 + 0.6 * level);
	}

	function setLantern(css: string, level: number) {
		const target = new THREE.Color(css);
		gsap.to(lantern.color, {
			r: target.r,
			g: target.g,
			b: target.b,
			duration: 0.5,
			ease: 'power2.out',
			onUpdate: applyLantern
		});
		gsap.to(lantern, { level, duration: 0.5, ease: 'power2.out', onUpdate: applyLantern });
	}

	// Where the camera goes to look at an object up close, leaving room on the right for its panel.
	// The direction each object is looked at from when focused (towards the camera), chosen so nothing
	// stands in front of it; the default is from the front, slightly right and above.
	const FOCUS_FROM: Partial<Record<Thing, THREE.Vector3>> = {
		lantern: new THREE.Vector3(-0.62, 0.22, 0.75)
	};

	function viewOf(thing: Thing) {
		const parts: THREE.Object3D[] = [];
		gltf.scene.traverse((o) => {
			if (o instanceof THREE.Mesh && thingOf(o) === thing) parts.push(o);
		});
		const box = new THREE.Box3();
		for (const o of parts) box.expandByObject(o);
		const centre = box.getCenter(new THREE.Vector3());
		const size = box.getSize(new THREE.Vector3()).length();
		const dir = (FOCUS_FROM[thing] ?? new THREE.Vector3(0.12, 0.22, 1)).clone().normalize();
		const eye = centre.clone().addScaledVector(dir, size * 2.1);
		// Aim a little right of the object, so it sits left of centre with the panel beside it.
		const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
		const target = centre.clone().addScaledVector(right, size * (camera.aspect > 1 ? 0.22 : 0));
		if (camera.aspect <= 1) target.y -= size * 0.35;
		return { eye, target };
	}

	function focus(thing: Thing) {
		if (mode !== 'room' || focused) return;
		focused = thing;
		setHovered(null);
		const v = viewOf(thing);
		focusView.eye.copy(v.eye);
		focusView.target.copy(v.target);
		gsap.to(focusBlend, { value: 1, duration: 1.1, ease: 'power3.inOut' });
		onFocus(thing);
	}

	function unfocus() {
		if (!focused) return;
		focused = null;
		gsap.to(focusBlend, { value: 0, duration: 1.0, ease: 'power3.inOut' });
		onFocus(null);
	}

	function render(time: number) {
		const t = time / 1000;
		swayTime.value = t;
		pose(t);

		contact.material.opacity = 0.75 * (1 - Math.min(1, s.rise * 1.6));
		moteMaterial.opacity = (0.35 + 0.45 * s.rise) * (1 - s.dive);
		motes.rotation.y = t * 0.03;
		motes.position.y = Math.sin(t * 0.4) * 0.08;

		// In the room the camera drifts gently with the pointer.
		const calm = (1 - s.drift) * (1 - s.dive);
		parallax.lerp(pointer, 0.05);
		if (s.dive > 0) {
			camera.position.lerpVectors(CAMERA_NEAR, finalPos, s.dive);
			camera.quaternion.slerpQuaternions(nearQuat, finalQuat, s.dive);
		} else {
			const f = focusBlend.value;
			const look = new THREE.Vector3().lerpVectors(view.target, FLOAT, s.drift);
			camera.position.lerpVectors(view.eye, CAMERA_NEAR, s.drift);
			camera.position.x += parallax.x * 0.35 * calm * (1 - f * 0.8);
			camera.position.y += parallax.y * 0.2 * calm * (1 - f * 0.8);
			if (f > 0) {
				camera.position.lerp(focusView.eye, f);
				look.lerp(focusView.target, f);
			}
			camera.lookAt(look);
		}

		const tick = Math.floor(Date.now() / 500);
		if (tick !== clockTick) {
			clockTick = tick;
			drawClockLED(clockCtx, new Date());
			clockTexture.needsUpdate = true;
		}

		if (s.boot >= 0 && !screenOff) {
			if (mode === 'returning') {
				// The lit screen (in the page's colour) fading to black as it switches off.
				screenCtx.fillStyle = background;
				screenCtx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
				screenCtx.fillStyle = `rgba(0, 0, 0, ${screenFade.value})`;
				screenCtx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
			} else drawBootScreen(screenCtx, s.boot, background);
			screenTexture.needsUpdate = true;
		}
		renderer.render(scene, camera);
	}

	function resize() {
		renderer.setSize(innerWidth, innerHeight, false);
		camera.aspect = innerWidth / innerHeight;
		camera.updateProjectionMatrix();
		view = startView(camera.aspect);
		camera.fov = view.fov;
		camera.updateProjectionMatrix();
		computeFinalCamera();
	}

	function thingAt(event: PointerEvent | MouseEvent): Thing | null {
		const rect = canvas.getBoundingClientRect();
		const ndc = new THREE.Vector2(
			((event.clientX - rect.left) / rect.width) * 2 - 1,
			-((event.clientY - rect.top) / rect.height) * 2 + 1
		);
		raycaster.setFromCamera(ndc, camera);
		const hit = raycaster.intersectObject(gltf.scene, true)[0];
		// The first thing hit blocks anything behind it.
		return hit ? thingOf(hit.object) : null;
	}

	function thingOf(object: THREE.Object3D): Thing | null {
		for (let o: THREE.Object3D | null = object; o; o = o.parent) {
			if (o === sp) return 'sp';
			if (/^Cube/.test(o.name)) return 'cube';
			if (/^Clock/.test(o.name)) return 'clock';
			if (/^(Kumiko|LanternPaper)/.test(o.name)) return 'lantern';
			if (/^Bonsai/.test(o.name)) return 'bonsai';
		}
		return null;
	}

	function pointermove(event: PointerEvent) {
		const rect = canvas.getBoundingClientRect();
		pointer.set(
			((event.clientX - rect.left) / rect.width) * 2 - 1,
			-((event.clientY - rect.top) / rect.height) * 2 + 1
		);
		if (mode !== 'room' || focused) return;
		const thing = event.pointerType === 'mouse' ? thingAt(event) : null;
		setHovered(thing, event);
	}

	function pointerleave() {
		pointer.set(0, 0);
		setHovered(null);
	}

	function setHovered(thing: Thing | null, event?: PointerEvent | MouseEvent) {
		if (thing !== hovered) {
			hovered = thing;
			gsap.to(hover, { sp: thing === 'sp' ? 1 : 0, duration: 0.45, ease: 'back.out(2)' });
			canvas.style.cursor = thing ? 'pointer' : '';
		}
		onHover(thing && event ? { label: LABELS[thing], x: event.clientX, y: event.clientY } : null);
	}

	function click(event: MouseEvent) {
		if (mode !== 'room' || focused) return;
		const thing = thingAt(event);
		if (thing === 'sp') return enterSite();
		if (thing === 'lantern') return focus('lantern');
		// Touch has no hover, so a tap shows the label instead.
		if (thing) onHover({ label: LABELS[thing], x: event.clientX, y: event.clientY });
	}

	// The tweens record their start values when the timeline is built, so it's always built from the
	// resting pose (the SP closed on the table).
	const RESTING = { ...s };

	function timelineFor() {
		Object.assign(s, RESTING);
		const tl = gsap.timeline({ paused: true });
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
			.call(() => power(true), [], 2.8)
			.fromTo(s, { boot: 0 }, { boot: BOOT_DURATION, duration: BOOT_DURATION, ease: 'none' }, 2.8)
			.call(() => sound.chime(), [], 2.8)
			.to(s, { bob: 0, duration: 1.4 }, 3.3)
			// A slow push while the logo plays, then one glide into the screen that slows to a stop
			// as the screen fills, so there's no jolt when the page takes over.
			.to(s, { dive: 0.25, duration: BOOT_DURATION - 0.9, ease: 'sine.inOut' }, 2.8)
			.to(s, { dive: 1, duration: 1.1, ease: 'power2.inOut' }, 2.8 + BOOT_DURATION - 0.9)
			// Once the screen fills the view, the whole layer fades, so nothing dark shows between the
			// screen and the page.
			.to(layer, { opacity: 0, duration: 0.3 }, 2.8 + BOOT_DURATION + 0.2);
		return tl;
	}

	// Rendering runs only while the room is on screen: not behind the page, not in a hidden tab.
	function updateLoop() {
		renderer.setAnimationLoop(mode === 'site' || document.hidden ? null : render);
	}

	function setMode(next: RoomMode) {
		mode = next;
		updateLoop();
		if (import.meta.env.DEV) Object.assign(window, { __boot: { s, timeline, scene, mode } });
		onMode(next);
	}

	async function enterSite() {
		if (mode !== 'room') return;
		screenOff = false;
		unfocus();
		setHovered(null);
		// Never wait on audio: the animation starts right away, sound joins in when the browser allows it.
		void sound.resume();
		timeline?.kill();
		timeline = timelineFor();
		timeline.eventCallback('onComplete', () => setMode('site'));
		setMode('booting');
		timeline.play();
	}

	function skipToSite() {
		if (mode === 'site') return;
		timeline?.kill();
		timeline = timelineFor();
		timeline.progress(1, true);
		power(true);
		setMode('site');
	}

	// Going back is its own, shorter animation rather than the boot in reverse: the page fades into
	// the screen, the screen switches off, the camera pulls out, and the console folds shut and lands on
	// the table. (The cartridge only pops out and clicks in on the way in, when it's switched on.)
	async function returnToRoom() {
		if (mode !== 'site') return;
		// Never wait on audio: the animation starts right away, sound joins in when the browser allows it.
		void sound.resume();
		timeline?.kill();
		Object.assign(s, {
			drift: 1,
			rise: 1,
			spin: 1,
			pitch: 1,
			open: 1,
			cartOut: 0,
			bob: 0,
			dip: 0,
			boot: BOOT_DURATION,
			dive: 1
		});
		screenOff = false;
		power(true);
		// The page fades out to the lit screen, the camera pulls out, then the screen switches off.
		screenFade.value = 0;
		const tl = gsap.timeline({ onComplete: () => setMode('room') });
		tl.fromTo(layer, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power1.inOut' }, 0)
			.call(
				() => {
					screenOff = true;
					power(false);
				},
				[],
				1.15
			)
			.to(screenFade, { value: 1, duration: 0.3, ease: 'power2.in' }, 0.85)
			.to(s, { dive: 0, duration: 1.0, ease: 'power2.inOut' }, 0.45)
			.to(s, { bob: 1, duration: 0.4 }, 0.9)
			.to(s, { bob: 0, duration: 0.3 }, 2.0)
			.to(s, { pitch: 0, duration: 0.6, ease: 'power2.inOut' }, 2.0)
			.to(s, { open: 0, duration: 0.6, ease: 'power2.in' }, 2.1)
			.to(s, { spin: 0, duration: 0.9, ease: 'power2.inOut' }, 2.0)
			.to(s, { rise: 0, duration: 0.7, ease: 'bounce.out' }, 2.45)
			.to(s, { drift: 0, duration: 1.4, ease: 'power2.inOut' }, 1.75);
		timeline = tl;
		setMode('returning');
	}

	function dispose() {
		if (disposed) return;
		disposed = true;
		timeline?.kill();
		removeEventListener('resize', resize);
		document.removeEventListener('visibilitychange', updateLoop);
		canvas.removeEventListener('pointermove', pointermove);
		canvas.removeEventListener('pointerleave', pointerleave);
		canvas.removeEventListener('click', click);
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
		clockTexture.dispose();
		renderer.dispose();
		renderer.forceContextLoss();
		setTimeout(() => sound.close(), 4000);
	}

	setMode(mode);
	return {
		enterSite,
		skipToSite,
		returnToRoom,
		unfocus,
		setLantern,
		setMuted: (muted) => sound.setMuted(muted),
		dispose
	};
}
