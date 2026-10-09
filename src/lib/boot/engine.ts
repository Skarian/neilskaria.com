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
import { createBonsai } from './bonsai';
import { BOOT_DURATION, drawBootScreen } from './boot-screen';
import { drawClockLED, drawFrequencyLED } from './clock-led';
import { FM_MIN } from '#lib/radio/radio.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import {
	createRubiks,
	decodeMove,
	encodeMove,
	scrambleMoves,
	type Axis,
	type Face,
	type Move
} from './rubiks';
import { createBootSound } from './sound';

export type RoomMode = 'room' | 'booting' | 'site' | 'returning';
export type Thing = 'sp' | 'cube' | 'clock' | 'lantern' | 'bonsai';

// The bonsai, as the panel shows it: its tufts' average length (0.3 trimmed, 1 neat, 1.6 shaggy).
export type BonsaiState = { shagginess: number };

// The Rubik's cube game, as the panel shows it.
export type CubeState = {
	// Not solved.
	scrambled: boolean;
	// The player has just solved it themselves (until their next turn or a scramble).
	solved: boolean;
	// Scrambling or solving on its own.
	busy: boolean;
};

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
	// An object's mini-game has opened (or closed, with null).
	onFocus: (thing: Thing | null) => void;
	onCube: (state: CubeState) => void;
	onBonsai: (state: BonsaiState) => void;
	// The boot chime is about to play (true), or the boot is over: music can dip under it.
	onChime: (playing: boolean) => void;
};

export type Room = {
	enterSite: () => void;
	skipToSite: () => void;
	returnToRoom: () => void;
	unfocus: () => void;
	// The lantern: a colour (any CSS colour) and a brightness from 0 to 1.5.
	setLantern: (color: string, level: number) => void;
	scrambleCube: () => void;
	solveCube: () => void;
	// The share of the screen above an open panel, on phones (where the panel sits at the bottom).
	setFreeAbove: (fraction: number) => void;
	waterBonsai: () => void;
	resetBonsai: () => void;
	// Turns the bonsai by an angle (as its wheel is dragged); let go, it coasts at the last turn's speed.
	turnBonsai: (by: number) => void;
	releaseBonsai: (by: number) => void;
	// Shows the site's radio on the clock radio: its power switch, dial and display.
	setRadio: (state: { on: boolean; freq: number }) => void;
	setMuted: (muted: boolean) => void;
	dispose: () => void;
};

const OPEN = THREE.MathUtils.degToRad(150);
const PITCH = OPEN - Math.PI / 2;
const FLOAT = new THREE.Vector3(0, 1.45, 0.9);
const CAMERA_NEAR = new THREE.Vector3(0.9, 1.9, 6);
const LANTERN_PAPER = new THREE.Color('#ffa24a').multiplyScalar(1.15);
// The colour the lantern's bulb was baked with (linear), so other colours can be expressed relative to it.
const LANTERN_BAKED = new THREE.Color(1.0, 0.62, 0.3);
const QUARTER = Math.PI / 2;
// The cube's turns since it was last solved, so it stays as the visitor left it.
const CUBE_KEY = 'cube-moves';
// Where the numbers sit on the clock radio's printed FM scale (MHz, millimetres along the clock), so
// the pointer lines up with them; the red pointer line is modelled at 70 mm.
const FM_SCALE: [number, number][] = [
	[88, 48.16],
	[92, 52.1],
	[96, 56.08],
	[100, 60.74],
	[104, 66.05],
	[108, 71.3]
];
const POINTER_AT = 70;

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
	const { canvas, layer, background, onProgress, onMode, onFocus, onCube, onBonsai, onChime } =
		options;

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
	// How highlighted each object is (0-1): it floats up a little and gets a thin white outline.
	const hover: Record<Thing, number> = { sp: 0, cube: 0, clock: 0, lantern: 0, bonsai: 0 };
	// Which object the outline is drawn around, and how strongly.
	const outline = { thing: null as Thing | null, opacity: 0 };
	// Each object's meshes (except the console, which moves as one) and where they rest.
	const floaters: { mesh: THREE.Object3D; thing: Thing; y: number }[] = [];
	const lantern = { level: 1, color: new THREE.Color().copy(LANTERN_BAKED) };
	const focusBlend = { value: 0 };
	// How much the pointer still sways the camera while an object is focused (none for the cube,
	// where the pointer is busy turning it).
	let focusSway = 0.2;
	// The cube: lifted off the table to play with, and a happy hop and spin when it's solved.
	const cubeLift = { value: 0 };
	const cubeJoy = { value: 0 };
	// The bonsai: the slash being drawn (in screen pixels), a turn of the turntable under way and how
	// fast it's still spinning after, and how long the watering has left to run.
	let slash: { last: { x: number; y: number }; moved: number } | null = null;
	let turning: { x: number } | null = null;
	// Fingers on the bonsai (two at once turn it, wherever they are).
	const fingers = new Map<number, number>();
	const fingersX = () => [...fingers.values()].reduce((a, b) => a + b, 0) / fingers.size;
	let spin = 0;
	let watering = 0;
	let bonsaiDirty = false;
	let snippedAt = 0;
	let bonsaiEmittedAt = 0;
	let lastFrame = 0;
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
	let dialPointer: THREE.Object3D | undefined;
	// The dial's printing and pointer: always readable, and lit up while the radio's on.
	const dialParts: THREE.Mesh[] = [];
	const dialMaterials = new Map<THREE.Mesh, { off: THREE.Material; on: THREE.Material }>();
	const paperMaterials: THREE.MeshBasicMaterial[] = [];
	const live: THREE.MeshStandardMaterial[] = [];

	const baked: Record<string, THREE.Material> = {};
	gltf.scene.traverse((object) => {
		if (!(object instanceof THREE.Mesh)) return;
		// glTF splits multi-material objects into child meshes, so the tag can sit on the parent.
		const group = object.userData.lightmap ?? object.parent?.userData.lightmap;
		const name = object.material.name as string;
		if (name === 'ClockPointer') dialPointer = object;
		if (name === 'ClockPrint' || name === 'ClockPointer') dialParts.push(object);
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

	// The Rubik's cube is rebuilt as a working puzzle where the modelled one sits, from its materials.
	const modelled: THREE.Mesh[] = [];
	gltf.scene.traverse((o) => {
		if (o instanceof THREE.Mesh && /^Cube/.test((o.material as THREE.Material).name))
			modelled.push(o);
	});
	const partOf = (name: string) =>
		modelled.find((m) => (m.material as THREE.Material).name === name)!;
	const bodyBox = new THREE.Box3().setFromObject(partOf('CubeBody'));
	const cubeCentre = bodyBox.getCenter(new THREE.Vector3());
	// The pieces' bodies stop just short of the cube's full size.
	const cubeSize = (bodyBox.max.y - bodyBox.min.y) * (57 / 56.7);
	// The modelled cube is turned on the table: by how much, from which way its red face points.
	const faceOffset = (name: string) =>
		new THREE.Box3().setFromObject(partOf(name)).getCenter(new THREE.Vector3()).sub(cubeCentre);
	const red = faceOffset('CubeRed');
	const redAngle = Math.atan2(-red.z, red.x);
	const cubeYaw = redAngle - Math.round(redAngle / QUARTER) * QUARTER;
	const stickerMaterials = {} as Record<Face, THREE.Material>;
	for (const colour of ['White', 'Yellow', 'Green', 'Blue', 'Red', 'Orange']) {
		const material = partOf(`Cube${colour}`).material as THREE.Material;
		const o = faceOffset(`Cube${colour}`).applyAxisAngle(new THREE.Vector3(0, 1, 0), -cubeYaw);
		const axis = dominantAxis(o);
		material.polygonOffset = true;
		material.polygonOffsetFactor = -2;
		material.polygonOffsetUnits = -2;
		stickerMaterials[`${o.getComponent(axis) > 0 ? '+' : '-'}${'xyz'[axis]}` as Face] = material;
	}
	const rubiks = createRubiks({
		size: cubeSize,
		body: partOf('CubeBody').material as THREE.Material,
		stickers: stickerMaterials
	});
	rubiks.root.position.copy(cubeCentre);
	rubiks.root.rotation.y = cubeYaw;
	gltf.scene.add(rubiks.root);
	for (const mesh of modelled) mesh.removeFromParent();
	// Picked up to play with: lifted towards the camera, so it hides its own (baked) shadow on the table.
	const CUBE_FROM = new THREE.Vector3(0.15, 0.55, 1).normalize();
	const CUBE_LIFT = CUBE_FROM.clone().multiplyScalar(cubeSize * 2.4);

	// The bonsai: its foliage grown here, on a turntable, lit live so it can turn (see bonsai.ts).
	const bonsai = createBonsai(gltf.scene, { value: new THREE.Texture() });
	bonsai.load();
	live.push(...bonsai.materials);
	// Cut clumps fall onto the slate (or the table) and shrink away; water drops fall through the tree.
	const slate = gltf.scene.getObjectByName('BonsaiSlate')!;
	const slateBox = new THREE.Box3().setFromObject(slate);
	const canopy = new THREE.Box3();
	for (const shoot of bonsai.shoots) for (const node of shoot.nodes) canopy.expandByPoint(node);
	canopy.applyMatrix4(bonsai.turntable.matrixWorld);
	const clumps: { mesh: THREE.Mesh; velocity: THREE.Vector3; spin: THREE.Vector3; life: number }[] =
		[];
	// The tabletop, so clumps that fall past its edge keep falling.
	const nightstandTop = new THREE.Box3().setFromObject(
		gltf.scene.getObjectByName('Nightstand') ?? slate
	);
	nightstandTop.min.y = slateBox.min.y;
	const BITS = 120;
	const bits = new THREE.InstancedMesh(
		new THREE.PlaneGeometry(0.01, 0.05),
		new THREE.MeshBasicMaterial({ color: '#a9d8ff', side: THREE.DoubleSide }),
		BITS
	);
	bits.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
	bits.frustumCulled = false;
	const bitState = Array.from({ length: BITS }, () => ({ life: 0, at: new THREE.Vector3() }));
	const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
	for (let i = 0; i < BITS; i++) bits.setMatrixAt(i, hidden);
	scene.add(bits);

	// The slash's trail, drawn over the room and fading as it goes.
	const trail = document.createElement('canvas');
	Object.assign(trail.style, {
		position: 'absolute',
		inset: '0',
		width: '100%',
		height: '100%',
		pointerEvents: 'none'
	});
	layer.appendChild(trail);
	const trailCtx = trail.getContext('2d')!;
	const trailPoints: { x: number; y: number; at: number }[] = [];
	function sizeTrail() {
		trail.width = innerWidth * Math.min(devicePixelRatio, 2);
		trail.height = innerHeight * Math.min(devicePixelRatio, 2);
	}
	sizeTrail();

	// Restore the cube as it was left.
	let cubeHistory: Move[] = [];
	try {
		cubeHistory = (localStorage.getItem(CUBE_KEY) ?? '')
			.split(' ')
			.map(decodeMove)
			.filter((m): m is Move => m !== null);
	} catch {
		cubeHistory = [];
	}
	for (const move of cubeHistory) rubiks.apply(move);
	// The clock radio: the pointer slides along the dial, the tuning wheel turns, and the first
	// slide switch is the power.
	const radio = { on: false, freq: 88.5 };
	for (const mesh of dialParts)
		dialMaterials.set(mesh, {
			off: new THREE.MeshBasicMaterial({
				color: mesh === dialPointer ? '#9a2216' : '#8f8370',
				polygonOffset: true,
				polygonOffsetFactor: -1
			}),
			on: new THREE.MeshBasicMaterial({
				color: mesh === dialPointer ? '#ff3a22' : '#ffe6bd',
				polygonOffset: true,
				polygonOffsetFactor: -1
			})
		});
	const radioSwitch = { value: 0 };
	// The display shows the frequency for a moment after it's tuned.
	let showFrequencyUntil = 0;
	const wheel = gltf.scene.getObjectByName('ClockWheel')!;
	const wheelRest = wheel.quaternion.clone();
	const wheelTurn = new THREE.Quaternion();
	const powerSwitch = gltf.scene.getObjectByName('ClockSwitch0')!;
	const switchRest = powerSwitch.position.clone();
	const switchSlide = new THREE.Vector3(0, 0, -0.08).applyQuaternion(powerSwitch.quaternion);
	// Millimetres in scene units, from the display (86 mm wide).
	const displayMesh = gltf.scene.getObjectByName('ClockDisplay') as THREE.Mesh;
	displayMesh.geometry.computeBoundingBox();
	const MM =
		(displayMesh.geometry.boundingBox!.max.x - displayMesh.geometry.boundingBox!.min.x) / 86;

	const cube: CubeState = {
		scrambled: !rubiks.isSolved(),
		solved: false,
		busy: false
	};

	// A thin white outline around whichever object is hovered, like a game's interact highlight. The
	// hovered object is drawn alone into a mask (on layer 1), and a full-screen pass draws a soft line
	// just outside the mask's edge, so the silhouette gets one clean outline whatever it's made of.
	const meshes: [THREE.Mesh, Thing][] = [];
	gltf.scene.traverse((object) => {
		const thing = object instanceof THREE.Mesh ? thingOf(object) : null;
		if (thing && !/ClockDigits/.test(object.name)) meshes.push([object as THREE.Mesh, thing]);
	});
	const centreOf = {} as Record<Thing, THREE.Vector3>;
	for (const thing of Object.keys(hover) as Thing[]) {
		const box = new THREE.Box3();
		for (const [mesh, of] of meshes) if (of === thing) box.expandByObject(mesh);
		centreOf[thing] = box.getCenter(new THREE.Vector3());
	}
	const mask = new THREE.WebGLRenderTarget(1, 1);
	// The mask's red channel is the hovered object; green marks objects nearer the camera, which the
	// outline must not be drawn over.
	const maskMaterial = new THREE.MeshBasicMaterial({ color: '#ff0000' });
	const occluderMaterial = new THREE.MeshBasicMaterial({
		color: '#00ff00',
		blending: THREE.AdditiveBlending,
		depthTest: false,
		depthWrite: false
	});
	const outlinePass = new THREE.Mesh(
		new THREE.PlaneGeometry(2, 2),
		new THREE.ShaderMaterial({
			uniforms: {
				mask: { value: mask.texture },
				texel: { value: new THREE.Vector2() },
				opacity: { value: 0 }
			},
			vertexShader:
				'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4( position.xy, 0.0, 1.0 ); }',
			fragmentShader: `
				uniform sampler2D mask; uniform vec2 texel; uniform float opacity; varying vec2 vUv;
				void main() {
					float inside = texture2D( mask, vUv ).r;
					float near = 0.0;
					for ( int i = 0; i < 12; i++ ) {
						float a = float( i ) * 0.5236;
						near = max( near, texture2D( mask, vUv + vec2( cos( a ), sin( a ) ) * texel * 2.5 ).r );
					}
					float edge = clamp( near - inside, 0.0, 1.0 ) * ( 1.0 - texture2D( mask, vUv ).g );
					gl_FragColor = vec4( 1.0, 0.98, 0.94, edge * opacity );
				}`,
			transparent: true,
			depthTest: false,
			depthWrite: false
		})
	);
	outlinePass.frustumCulled = false;
	const outlineScene = new THREE.Scene();
	outlineScene.add(outlinePass);
	const outlineCamera = new THREE.Camera();
	function sizeMask() {
		const size = renderer.getDrawingBufferSize(new THREE.Vector2());
		mask.setSize(size.x, size.y);
		(outlinePass.material as THREE.ShaderMaterial).uniforms.texel.value.set(
			renderer.getPixelRatio() / size.x,
			renderer.getPixelRatio() / size.y
		);
	}
	sizeMask();

	for (const [mesh, thing] of meshes) {
		// Top-level parts of each object float together (the console floats as a whole).
		if (thing !== 'sp' && mesh.parent === gltf.scene)
			floaters.push({ mesh, thing, y: mesh.position.y });
		else if (
			thing !== 'sp' &&
			mesh.parent &&
			mesh.parent.parent === gltf.scene &&
			!floaters.some((f) => f.mesh === mesh.parent)
		) {
			floaters.push({ mesh: mesh.parent, thing, y: mesh.parent.position.y });
		}
	}
	screen.geometry.computeBoundingBox();

	// What's under the pointer is decided against a simple stand-in for each object: its convex
	// outline, where it rests. Clicks don't fall through gaps (between the bonsai's leaves, say) to
	// whatever's behind, and a hovered object floating up doesn't slip out from under the pointer.
	const pickers: THREE.Mesh[] = [];
	// The bonsai is two shapes, so the space between its pot and canopy stays clear.
	const PICK_PARTS: Partial<Record<Thing, RegExp[]>> = {
		bonsai: [/^Bonsai(Slate|Pot|Foot|Soil|Moss)/, /^Bonsai(Wood|Shoots|Twigs)/]
	};
	pose(0);
	// The bonsai's shapes are made with the tree turned to the front, and turn with it.
	// (The tree always starts, and is put back, facing the front.)
	gltf.scene.updateMatrixWorld(true);
	const turntableRest = bonsai.turntable.matrixWorld.clone().invert();
	for (const thing of Object.keys(hover) as Thing[]) {
		// (Most objects are one shape, whatever their parts are called; the cube's pieces have no names.)
		for (const part of PICK_PARTS[thing] ?? [null]) {
			const parts = meshes.filter(([m, of]) => of === thing && (!part || part.test(m.name)));
			const count = parts.reduce((n, [m]) => n + m.geometry.attributes.position.count, 0);
			// A few thousand points are plenty for an outline.
			const every = Math.max(1, Math.floor(count / 4000));
			const points: THREE.Vector3[] = [];
			for (const [mesh] of parts) {
				const position = mesh.geometry.attributes.position;
				for (let i = 0; i < position.count; i += every)
					points.push(
						new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld)
					);
			}
			if (points.length < 4) continue;
			const picker = new THREE.Mesh(new ConvexGeometry(points));
			picker.userData.thing = thing;
			picker.matrixAutoUpdate = false;
			picker.updateMatrixWorld();
			pickers.push(picker);
		}
	}
	// Back to where the visitor left the tree turned.

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
		// Matched by eye to the baked props beside it (the bonsai, being rougher, takes less).
		material.envMapIntensity = bonsai.materials.includes(material) ? 0.9 : 1.6;
	}

	const key = new THREE.DirectionalLight('#ffe2c4', 1.5);
	key.position.set(2.5, 5, 10);
	scene.add(key);
	const fill = new THREE.DirectionalLight('#ffd0a0', 0.5);
	fill.position.set(-6, 2, 6);
	scene.add(fill);
	// The lantern as a light, for what's lit live (the bonsai most of all), tinted to match it.
	const lanternLight = new THREE.PointLight(LANTERN_BAKED, 0, 4, 2);
	new THREE.Box3()
		.setFromObject(gltf.scene.getObjectByName('KumikoFrame') ?? gltf.scene)
		.getCenter(lanternLight.position);
	scene.add(lanternLight);

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
	canvas.addEventListener('pointerdown', pointerdown);
	canvas.addEventListener('pointerup', pointerup);
	canvas.addEventListener('pointercancel', pointerup);
	// Touches turn the cube rather than scroll or zoom anything.
	canvas.style.touchAction = 'none';
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
		sp.position.y += s.bob * 0.05 * Math.sin(t * 2.2) - s.dip * 0.05 + hover.sp * 0.09;
		sp.rotation.set(
			s.pitch * PITCH,
			THREE.MathUtils.lerp(REST_YAW, Math.PI * 2 + yaw, s.spin),
			hover.sp * 0.03
		);
		for (const f of floaters) f.mesh.position.y = f.y + hover[f.thing] * 0.09;
		rubiks.root.position.copy(cubeCentre).addScaledVector(CUBE_LIFT, cubeLift.value);
		rubiks.root.position.y +=
			hover.cube * 0.09 +
			cubeLift.value * Math.sin(t * 1.6) * cubeSize * 0.04 +
			Math.sin(Math.PI * cubeJoy.value) * cubeSize * 0.6;
		rubiks.root.rotation.y = cubeYaw + cubeJoy.value * Math.PI * 2;
		if (dialPointer) dialPointer.position.x = (dialAt(radio.freq) - POINTER_AT) * MM;
		wheel.quaternion
			.copy(wheelRest)
			.multiply(wheelTurn.setFromAxisAngle(Y_AXIS, (radio.freq - FM_MIN) * 0.8));
		powerSwitch.position.x = switchRest.x + switchSlide.x * radioSwitch.value;
		powerSwitch.position.z = switchRest.z + switchSlide.z * radioSwitch.value;
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
		lanternLight.color.copy(color);
		lanternLight.intensity = 1.2 * level;
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
		lantern: new THREE.Vector3(-0.62, 0.22, 0.75),
		// From a little above, so the top face shows too.
		cube: CUBE_FROM,
		// From a little above, so the scissors can reach the tops of the pads.
		bonsai: new THREE.Vector3(0.15, 0.4, 1),
		// From the front and a little right, square on to the dial.
		clock: new THREE.Vector3(0.2, 0.32, 1)
	};

	function viewOf(thing: Thing) {
		const parts: THREE.Object3D[] = [];
		gltf.scene.traverse((o) => {
			if (o instanceof THREE.Mesh && thingOf(o) === thing) parts.push(o);
		});
		const box = new THREE.Box3();
		for (const o of parts) box.expandByObject(o);
		const centre = box.getCenter(new THREE.Vector3());
		let size = box.getSize(new THREE.Vector3()).length();
		// The cube is looked at where it's lifted to, whatever it's doing now.
		if (thing === 'cube') {
			centre.copy(cubeCentre).add(CUBE_LIFT);
			size = cubeSize * Math.sqrt(3);
		}
		const dir = (FOCUS_FROM[thing] ?? new THREE.Vector3(0.12, 0.22, 1)).clone().normalize();
		// The cube is small: further back, so there's room to turn it over.
		// The cube is small, so further back to leave room to turn it over; the clock radio is wide, so
		// closer in, to read its dial.
		const distance =
			{
				cube: camera.aspect > 1 ? 2.75 : 2.15,
				clock: camera.aspect > 1 ? 1.6 : 1.47,
				bonsai: camera.aspect > 1 ? 1.45 : 1.12
			}[thing as string] ?? (camera.aspect > 1 ? 2.1 : 1.85);
		// On phones the panel covers the bottom of the screen: the object is fitted into the space left
		// above it (further back when that's small) and centred there.
		const portrait = camera.aspect <= 1;
		let d = size * distance * (portrait ? THREE.MathUtils.clamp(0.5 / freeAbove, 0.8, 1.5) : 1);
		// And never wider than a narrow screen.
		if (portrait) {
			const extent = box.getSize(new THREE.Vector3());
			const across = thing === 'cube' ? size : Math.hypot(extent.x, extent.z);
			const halfWidth = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
			d = Math.max(d, (across * 0.52) / halfWidth);
		}
		const eye = centre.clone().addScaledVector(dir, d);
		// Aim a little right of the object, so it sits left of centre with the panel beside it.
		const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
		const aside = thing === 'clock' ? 0.33 : 0.22;
		const target = centre.clone().addScaledVector(right, size * (portrait ? 0 : aside));
		if (portrait) {
			const up = new THREE.Vector3(0, 1, 0).addScaledVector(dir, -dir.y).normalize();
			const halfHeight = d * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
			target.addScaledVector(up, -(1 - freeAbove) * halfHeight);
		}
		return { eye, target };
	}

	// How much of a phone's screen is left above an open panel (0-1), so the object is framed there.
	let freeAbove = 0.52;
	function setFreeAbove(fraction: number) {
		freeAbove = THREE.MathUtils.clamp(fraction, 0.3, 0.9);
		if (!focused) return;
		const v = viewOf(focused);
		gsap.to(focusView.eye, {
			x: v.eye.x,
			y: v.eye.y,
			z: v.eye.z,
			duration: 0.5,
			ease: 'power2.out'
		});
		gsap.to(focusView.target, {
			x: v.target.x,
			y: v.target.y,
			z: v.target.z,
			duration: 0.5,
			ease: 'power2.out'
		});
	}

	function focus(thing: Thing) {
		if (mode !== 'room' || focused) return;
		focused = thing;
		setHovered(null);
		focusSway = thing === 'cube' || thing === 'bonsai' ? 0 : 0.2;
		if (thing === 'bonsai') emitBonsai();
		if (thing === 'cube') {
			gsap.to(cubeLift, { value: 1, duration: 1.1, ease: 'power3.inOut', overwrite: true });
			emitCube();
		}
		const v = viewOf(thing);
		focusView.eye.copy(v.eye);
		focusView.target.copy(v.target);
		gsap.to(focusBlend, { value: 1, duration: 1.1, ease: 'power3.inOut' });
		onFocus(thing);
	}

	function unfocus() {
		if (!focused) return;
		if (focused === 'cube') putCubeDown();
		if (focused === 'bonsai') leaveTree();
		focused = null;
		gsap.to(focusBlend, { value: 0, duration: 1.0, ease: 'power3.inOut' });
		onFocus(null);
	}

	function render(time: number) {
		const t = time / 1000;
		const dt = Math.min(0.05, lastFrame ? t - lastFrame : 0);
		lastFrame = t;
		swayTime.value = t;
		pose(t);
		if (!turning && Math.abs(spin) > 0.0005) {
			turnTree(spin);
			spin *= Math.pow(0.04, dt);
		}
		if (watering > 0) water(dt);
		moveBits(dt);
		moveClumps(dt);
		drawTrail();

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
			camera.position.x += parallax.x * 0.35 * calm * (1 - f * (1 - focusSway));
			camera.position.y += parallax.y * 0.2 * calm * (1 - f * (1 - focusSway));
			if (f > 0) {
				camera.position.lerp(focusView.eye, f);
				look.lerp(focusView.target, f);
			}
			camera.lookAt(look);
		}

		// The visitor's time, or the frequency just after the radio is tuned.
		const tuning = radio.on && performance.now() < showFrequencyUntil;
		const tick = tuning ? -1 - Math.round(radio.freq * 10) : Math.floor(Date.now() / 500);
		if (tick !== clockTick) {
			clockTick = tick;
			if (tuning) drawFrequencyLED(clockCtx, radio.freq);
			else drawClockLED(clockCtx, new Date());
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
		if (outline.thing && outline.opacity > 0.001) {
			const background = scene.background;
			scene.background = null;
			scene.overrideMaterial = maskMaterial;
			camera.layers.set(1);
			renderer.setRenderTarget(mask);
			renderer.setClearColor(0x000000, 1);
			renderer.clear();
			renderer.autoClear = false;
			renderer.render(scene, camera);
			scene.overrideMaterial = occluderMaterial;
			camera.layers.set(2);
			renderer.render(scene, camera);
			renderer.autoClear = true;
			renderer.setRenderTarget(null);
			camera.layers.set(0);
			scene.overrideMaterial = null;
			scene.background = background;
			(outlinePass.material as THREE.ShaderMaterial).uniforms.opacity.value = outline.opacity;
			renderer.autoClear = false;
			renderer.render(outlineScene, outlineCamera);
			renderer.autoClear = true;
		}
	}

	function resize() {
		renderer.setSize(innerWidth, innerHeight, false);
		sizeMask();
		sizeTrail();
		camera.aspect = innerWidth / innerHeight;
		camera.updateProjectionMatrix();
		view = startView(camera.aspect);
		camera.fov = view.fov;
		camera.updateProjectionMatrix();
		computeFinalCamera();
	}

	function ndcOf(event: PointerEvent | MouseEvent) {
		const rect = canvas.getBoundingClientRect();
		return new THREE.Vector2(
			((event.clientX - rect.left) / rect.width) * 2 - 1,
			-((event.clientY - rect.top) / rect.height) * 2 + 1
		);
	}

	function thingAt(event: PointerEvent | MouseEvent): Thing | null {
		raycaster.setFromCamera(ndcOf(event), camera);
		// The first thing hit blocks anything behind it.
		const hit = raycaster.intersectObjects(pickers, false)[0];
		return hit ? (hit.object.userData.thing as Thing) : null;
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
		if (focused === 'cube') return dragCube(event);
		if (focused === 'bonsai') return dragTree(event);
		if (mode !== 'room' || focused) return;
		setHovered(event.pointerType === 'mouse' ? thingAt(event) : null);
	}

	function pointerleave() {
		pointer.set(0, 0);
		setHovered(null);
	}

	function setHovered(thing: Thing | null) {
		if (thing === hovered) return;
		hovered = thing;
		if (import.meta.env.DEV) Object.assign(window, { __hovered: thing });
		for (const key of Object.keys(hover) as Thing[]) {
			const on = key === thing;
			gsap.to(hover, {
				[key]: on ? 1 : 0,
				duration: on ? 0.45 : 0.3,
				ease: on ? 'back.out(2.2)' : 'power2.out',
				overwrite: 'auto'
			});
		}
		if (thing) {
			// Objects nearer the camera than the hovered one hide its outline where they overlap it.
			const distance = (t: Thing) => centreOf[t].distanceTo(camera.position);
			for (const [mesh, of] of meshes) {
				if (of === thing) mesh.layers.enable(1);
				else mesh.layers.disable(1);
				if (of !== thing && distance(of) < distance(thing)) mesh.layers.enable(2);
				else mesh.layers.disable(2);
			}
			outline.thing = thing;
			if (outline.opacity > 0.5) outline.opacity = 0.5;
		}
		gsap.to(outline, { opacity: thing ? 0.9 : 0, duration: thing ? 0.25 : 0.2, overwrite: true });
		canvas.style.cursor = thing ? 'pointer' : '';
	}

	function click(event: MouseEvent) {
		if (mode !== 'room' || focused) return;
		const thing = thingAt(event);
		if (thing === 'sp') return enterSite();
		if (thing) return focus(thing);
		// Not playable yet: a little hop says so.
		if (thing)
			gsap
				.timeline()
				.to(hover, { [thing]: 2.2, duration: 0.18, ease: 'power2.out' })
				.to(hover, { [thing]: hovered === thing ? 1 : 0, duration: 0.5, ease: 'bounce.out' });
	}

	// Playing with the cube. Pressing on it and dragging turns the layer under the pointer, in
	// whichever direction the drag runs along the face; dragging anywhere else turns the whole cube.
	type CubeDrag =
		| { kind: 'orbit'; x: number; y: number }
		| {
				kind: 'face';
				x: number;
				y: number;
				point: THREE.Vector3;
				normal: THREE.Vector3;
				at: THREE.Vector3;
		  }
		| {
				kind: 'layer';
				x: number;
				y: number;
				axis: Axis;
				layer: Move['layer'];
				// The drag's direction on screen that carries the face forwards, and how far is a quarter.
				along: THREE.Vector2;
				quarter: number;
				sign: 1 | -1;
				progress: number;
		  };
	let cubeDrag: CubeDrag | null = null;

	function emitCube() {
		onCube({ ...cube });
	}

	function saveCube() {
		try {
			localStorage.setItem(CUBE_KEY, cubeHistory.map(encodeMove).join(' '));
		} catch {
			// Private browsing, or storage is full: the cube just won't be remembered.
		}
	}

	// Records a turn, cancelling it against the last one if it undoes it.
	function remember(move: Move) {
		const last = cubeHistory.at(-1);
		if (last && last.axis === move.axis && last.layer === move.layer && last.dir === -move.dir)
			cubeHistory.pop();
		else cubeHistory.push(move);
		saveCube();
	}

	function toScreen(point: THREE.Vector3) {
		const p = point.clone().project(camera);
		return new THREE.Vector2(((p.x + 1) / 2) * innerWidth, ((1 - p.y) / 2) * innerHeight);
	}

	function pointerdown(event: PointerEvent) {
		if (focused === 'bonsai' && mode === 'room') {
			canvas.setPointerCapture(event.pointerId);
			fingers.set(event.pointerId, event.clientX);
			// A second finger turns the tree, whatever the first was doing.
			if (fingers.size > 1) {
				slash = null;
				turning = { x: fingersX() };
				spin = 0;
				return;
			}
			// With a mouse, like the cube: a drag starting on the foliage slashes, one anywhere else turns
			// the tree. On a touch screen every one-finger drag slashes; the panel's wheel (or two
			// fingers) turns it.
			if (event.pointerType === 'mouse' && !nearFoliage(event)) {
				turning = { x: event.clientX };
				spin = 0;
			} else {
				slash = { last: { x: event.clientX, y: event.clientY }, moved: 0 };
				trailPoints.push({ x: event.clientX, y: event.clientY, at: performance.now() });
			}
			return;
		}
		if (focused !== 'cube' || cube.busy || cubeDrag || mode !== 'room') return;
		canvas.setPointerCapture(event.pointerId);
		raycaster.setFromCamera(ndcOf(event), camera);
		const hit = raycaster.intersectObject(rubiks.root, true)[0];
		if (!hit?.face) {
			cubeDrag = { kind: 'orbit', x: event.clientX, y: event.clientY };
			return;
		}
		// The face pressed, in the cube's frame, and which piece it's on.
		const toCube = rubiks.orbit.getWorldQuaternion(new THREE.Quaternion()).invert();
		const n = hit.face.normal
			.clone()
			.transformDirection(hit.object.matrixWorld)
			.applyQuaternion(toCube);
		const axis = dominantAxis(n);
		const normal = new THREE.Vector3().setComponent(axis, Math.sign(n.getComponent(axis)));
		const at = hit.object.parent!.position.clone().divideScalar(rubiks.step).round();
		cubeDrag = { kind: 'face', x: event.clientX, y: event.clientY, point: hit.point, normal, at };
	}

	function dragCube(event: PointerEvent) {
		if (!cubeDrag) return;
		const dx = event.clientX - cubeDrag.x;
		const dy = event.clientY - cubeDrag.y;
		if (cubeDrag.kind === 'orbit') {
			// Turn the cube about the camera's own up and right, like turning it over in your hands.
			const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
			const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
			const turn = new THREE.Quaternion()
				.setFromAxisAngle(up, dx * 0.01)
				.multiply(new THREE.Quaternion().setFromAxisAngle(right, dy * 0.01));
			// The same turn, in the frame the cube's orientation is kept in.
			const frame = rubiks.root.getWorldQuaternion(new THREE.Quaternion());
			rubiks.orbit.quaternion.premultiply(frame.clone().invert().multiply(turn).multiply(frame));
			cubeDrag.x = event.clientX;
			cubeDrag.y = event.clientY;
			return;
		}
		if (cubeDrag.kind === 'face') {
			if (Math.hypot(dx, dy) < 8) return;
			// Of the two directions along the face, the one the drag follows best on screen.
			const toWorld = rubiks.orbit.getWorldQuaternion(new THREE.Quaternion());
			const from = toScreen(cubeDrag.point);
			let best: { axis: number; screen: THREE.Vector2; fit: number } | null = null;
			for (let axis = 0; axis < 3; axis++) {
				if (cubeDrag.normal.getComponent(axis) !== 0) continue;
				const step = new THREE.Vector3().setComponent(axis, rubiks.step).applyQuaternion(toWorld);
				const screen = toScreen(cubeDrag.point.clone().add(step)).sub(from);
				const fit = (screen.x * dx + screen.y * dy) / (screen.length() * Math.hypot(dx, dy) || 1);
				if (!best || Math.abs(fit) > Math.abs(best.fit)) best = { axis, screen, fit };
			}
			if (!best) return;
			const sign = Math.sign(best.fit) || 1;
			// Turning about (face normal x drag direction) carries the face along the drag.
			const r = new THREE.Vector3().crossVectors(
				cubeDrag.normal,
				new THREE.Vector3().setComponent(best.axis, sign)
			);
			const axis = dominantAxis(r) as Axis;
			const layer = cubeDrag.at.getComponent(axis) as Move['layer'];
			rubiks.grab(axis, layer);
			cubeDrag = {
				kind: 'layer',
				x: cubeDrag.x,
				y: cubeDrag.y,
				axis,
				layer,
				along: best.screen.clone().normalize().multiplyScalar(sign),
				quarter: Math.max(40, best.screen.length() * 2.2),
				sign: r.getComponent(axis) > 0 ? 1 : -1,
				progress: 0
			};
		}
		const progress = THREE.MathUtils.clamp(
			(dx * cubeDrag.along.x + dy * cubeDrag.along.y) / cubeDrag.quarter,
			-1,
			1
		);
		cubeDrag.progress = progress;
		rubiks.setAngle(cubeDrag.sign * progress * QUARTER);
	}

	async function pointerup(event: PointerEvent) {
		fingers.delete(event.pointerId);
		if (turning) {
			if (fingers.size) turning.x = fingersX();
			else turning = null;
			return;
		}
		if (slash) {
			// A tap, not a slash: a light snip of the tips under it.
			if (slash.moved < 8) snipTips(slash.last);
			slash = null;
			if (bonsaiDirty) bonsai.save();
			bonsaiDirty = false;
			emitBonsai();
			return;
		}
		const drag = cubeDrag;
		cubeDrag = null;
		if (drag?.kind !== 'layer') return;
		// Past about a third of the way, the turn completes.
		const dir = (Math.abs(drag.progress) > 0.3 ? Math.sign(drag.progress) * drag.sign : 0) as
			-1 | 0 | 1;
		cube.busy = true;
		await rubiks.settle(dir);
		cube.busy = false;
		if (dir) playerTurned({ axis: drag.axis, layer: drag.layer, dir });
		else emitCube();
	}

	function playerTurned(move: Move) {
		const wasScrambled = cube.scrambled;
		remember(move);
		sound.tick();
		cube.scrambled = !rubiks.isSolved();
		cube.solved = wasScrambled && !cube.scrambled;
		if (cube.solved) {
			cubeHistory = [];
			saveCube();
			sound.fanfare();
			hop();
		}
		emitCube();
	}

	function hop() {
		gsap.fromTo(cubeJoy, { value: 0 }, { value: 1, duration: 1.1, ease: 'power2.inOut' });
	}

	async function playMoves(moves: Move[], duration: number) {
		cube.busy = true;
		emitCube();
		for (const move of moves) {
			if (disposed) return;
			await rubiks.animate(move, duration, 'power1.inOut');
			remember(move);
			sound.tick(0.4);
		}
		cube.busy = false;
	}

	async function scrambleCube() {
		if (focused !== 'cube' || cube.busy) return;
		void sound.resume();
		await playMoves(scrambleMoves(20), 0.09);
		Object.assign(cube, { scrambled: !rubiks.isSolved(), solved: false });
		emitCube();
	}

	// Solving plays every turn since it was last solved backwards, quicker the more there are.
	async function solveCube() {
		if (focused !== 'cube' || cube.busy || !cubeHistory.length) return;
		void sound.resume();
		const moves = [...cubeHistory].reverse().map((m) => ({ ...m, dir: -m.dir }) as Move);
		await playMoves(moves, THREE.MathUtils.clamp(5 / moves.length, 0.06, 0.2));
		cubeHistory = [];
		saveCube();
		Object.assign(cube, { scrambled: false, solved: false });
		emitCube();
		hop();
	}

	// Back on the table: the right way up, and down with a little bounce.
	function putCubeDown() {
		if (cubeDrag?.kind === 'layer') void rubiks.settle(0);
		cubeDrag = null;
		const from = rubiks.orbit.quaternion.clone();
		const upright = { t: 0 };
		gsap.to(upright, {
			t: 1,
			duration: 0.8,
			ease: 'power2.inOut',
			onUpdate: () =>
				rubiks.orbit.quaternion.slerpQuaternions(from, new THREE.Quaternion(), upright.t)
		});
		gsap.to(cubeLift, {
			value: 0,
			duration: 0.9,
			delay: 0.15,
			ease: 'bounce.out',
			overwrite: true
		});
	}

	// The clock radio mirrors the site's radio: the power switch slides, the dial lights, and the
	// display shows the frequency for a moment whenever it's tuned or switched on.
	function setRadio(state: { on: boolean; freq: number }) {
		if (state.freq !== radio.freq || (state.on && !radio.on))
			showFrequencyUntil = performance.now() + 2500;
		if (state.on !== radio.on) {
			gsap.to(radioSwitch, { value: state.on ? 1 : 0, duration: 0.25, ease: 'back.out(2)' });
			if (mode === 'room') sound.click();
		}
		Object.assign(radio, state);
		for (const [mesh, materials] of dialMaterials)
			mesh.material = radio.on ? materials.on : materials.off;
	}

	// Trimming the bonsai: a slash is a line drawn over the tree, and like a blade passing along it, it
	// cuts every shoot it crosses (straight through the tree, front to back) where it crosses it.
	// Everything beyond the cut falls; the shoot grows back out from there.
	const SCISSORS =
		"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cg fill='none' stroke-linecap='round'%3E%3Cpath d='M11 21 22 4M21 21 10 4' stroke='%23fffaf0' stroke-width='5'/%3E%3Cpath d='M11 21 22 4M21 21 10 4' stroke='%233a2618' stroke-width='2.5'/%3E%3Ccircle cx='8' cy='24' r='4' fill='%23ff8f5a' stroke='%233a2618' stroke-width='2.5'/%3E%3Ccircle cx='24' cy='24' r='4' fill='%23ff8f5a' stroke='%233a2618' stroke-width='2.5'/%3E%3C/g%3E%3C/svg%3E\") 16 9, crosshair";
	const onScreen = new THREE.Vector3();
	function screenOf(point: THREE.Vector3, matrix: THREE.Matrix4) {
		onScreen.copy(point).applyMatrix4(matrix).project(camera);
		return { x: ((onScreen.x + 1) / 2) * innerWidth, y: ((1 - onScreen.y) / 2) * innerHeight };
	}

	// On the foliage, or just off its edge (so a slash can begin a little outside a pad).
	function nearFoliage(event: PointerEvent) {
		bonsai.turntable.updateMatrixWorld();
		const matrix = bonsai.turntable.matrixWorld;
		const margin = matchMedia('(pointer: coarse)').matches ? 14 : 22;
		for (let s = 0; s < bonsai.count; s++) {
			const reach = Math.ceil(bonsai.lengths[s]);
			const nodes = bonsai.shoots[s].nodes;
			for (let k = 0; k < reach; k += 2) {
				const p = screenOf(nodes[Math.min(k, nodes.length - 1)], matrix);
				if (Math.hypot(p.x - event.clientX, p.y - event.clientY) < margin) return true;
			}
		}
		return false;
	}

	function turnTree(by: number) {
		bonsai.turntable.rotation.y += by;
		bonsai.turntable.updateMatrixWorld();
		const turned = new THREE.Matrix4().multiplyMatrices(
			bonsai.turntable.matrixWorld,
			turntableRest
		);
		for (const picker of pickers)
			if (picker.userData.thing === 'bonsai') picker.matrixWorld.copy(turned);
	}

	// Where (0-1 along it) segment p0-p1 crosses segment q0-q1, if it does.
	function crossing(
		p0: { x: number; y: number },
		p1: { x: number; y: number },
		q0: { x: number; y: number },
		q1: { x: number; y: number }
	) {
		const rx = p1.x - p0.x;
		const ry = p1.y - p0.y;
		const sx = q1.x - q0.x;
		const sy = q1.y - q0.y;
		const d = rx * sy - ry * sx;
		if (Math.abs(d) < 1e-9) return null;
		const t = ((q0.x - p0.x) * sy - (q0.y - p0.y) * sx) / d;
		const u = ((q0.x - p0.x) * ry - (q0.y - p0.y) * rx) / d;
		return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null;
	}

	function cutShoot(s: number, reach: number) {
		const clump = bonsai.clump(s, Math.ceil(reach));
		bonsai.setReach(s, reach);
		bonsaiDirty = true;
		if (clump) dropClump(clump);
	}

	// Cuts every shoot the slash's latest stretch (a to b) crosses.
	function slashAcross(a: { x: number; y: number }, b: { x: number; y: number }) {
		bonsai.turntable.updateMatrixWorld();
		const matrix = bonsai.turntable.matrixWorld;
		let cuts = 0;
		for (let s = 0; s < bonsai.count; s++) {
			const reach = bonsai.lengths[s];
			if (reach <= 0.01) continue;
			const shoot = bonsai.shoots[s];
			let from = screenOf(shoot.hub, matrix);
			for (let k = 0; k < Math.ceil(reach); k++) {
				const to = screenOf(shoot.nodes[k], matrix);
				// The last node may only be part grown.
				const grown = Math.min(1, reach - k);
				const end = { x: from.x + (to.x - from.x) * grown, y: from.y + (to.y - from.y) * grown };
				const t = crossing(from, end, a, b);
				if (t !== null) {
					cutShoot(s, k + t * grown);
					cuts++;
					break;
				}
				from = to;
			}
		}
		if (cuts) {
			const t = performance.now() / 1000;
			if (t - snippedAt > 0.09) {
				snippedAt = t;
				sound.slash(Math.min(1, 0.4 + cuts / 20));
			}
			if (t - bonsaiEmittedAt > 0.15) {
				bonsaiEmittedAt = t;
				emitBonsai();
			}
		}
	}

	// A light snip: the tips of the shoots under a tap come off.
	function snipTips(at: { x: number; y: number }) {
		bonsai.turntable.updateMatrixWorld();
		const matrix = bonsai.turntable.matrixWorld;
		let cuts = 0;
		for (let s = 0; s < bonsai.count; s++) {
			const reach = bonsai.lengths[s];
			if (reach <= 0.01) continue;
			const tip = screenOf(bonsai.shoots[s].nodes[Math.max(0, Math.ceil(reach) - 1)], matrix);
			if (Math.hypot(tip.x - at.x, tip.y - at.y) > 26) continue;
			cutShoot(s, Math.max(0, reach - 1.5));
			cuts++;
		}
		if (cuts) sound.snip();
	}

	function dragTree(event: PointerEvent) {
		if (fingers.has(event.pointerId)) fingers.set(event.pointerId, event.clientX);
		if (turning) {
			const x = fingers.size ? fingersX() : event.clientX;
			const by = (x - turning.x) * 0.01;
			turnTree(by);
			spin = by;
			turning.x = x;
			return;
		}
		if (slash) {
			const to = { x: event.clientX, y: event.clientY };
			slash.moved += Math.hypot(to.x - slash.last.x, to.y - slash.last.y);
			slashAcross(slash.last, to);
			slash.last = to;
			trailPoints.push({ ...to, at: performance.now() });
			return;
		}
		if (event.pointerType === 'mouse') canvas.style.cursor = nearFoliage(event) ? SCISSORS : 'grab';
	}

	// The trail: a bright stroke that thins and fades from its tail.
	function drawTrail() {
		const now = performance.now();
		while (trailPoints.length && now - trailPoints[0].at > 260) trailPoints.shift();
		const scale = trail.width / innerWidth;
		trailCtx.clearRect(0, 0, trail.width, trail.height);
		if (trailPoints.length < 2) return;
		trailCtx.lineCap = 'round';
		for (let i = 1; i < trailPoints.length; i++) {
			const a = trailPoints[i - 1];
			const b = trailPoints[i];
			const fresh = 1 - (now - b.at) / 260;
			trailCtx.strokeStyle = `rgba(255, 250, 235, ${0.9 * fresh})`;
			trailCtx.shadowColor = 'rgba(255, 220, 160, 0.9)';
			trailCtx.shadowBlur = 10 * scale;
			trailCtx.lineWidth = (1.5 + 5 * fresh) * scale;
			trailCtx.beginPath();
			trailCtx.moveTo(a.x * scale, a.y * scale);
			trailCtx.lineTo(b.x * scale, b.y * scale);
			trailCtx.stroke();
		}
	}

	function dropClump(mesh: THREE.Mesh) {
		// Only so many falling at once: the oldest go first.
		if (clumps.length > 70) {
			const oldest = clumps.shift()!;
			oldest.mesh.removeFromParent();
			oldest.mesh.geometry.dispose();
		}
		scene.add(mesh);
		const outward = mesh.position
			.clone()
			.sub(canopy.getCenter(new THREE.Vector3()))
			.setY(0)
			.normalize();
		clumps.push({
			mesh,
			velocity: outward
				.multiplyScalar(0.15 + Math.random() * 0.2)
				.add(new THREE.Vector3(0, 0.15 + Math.random() * 0.25, 0)),
			spin: new THREE.Vector3(Math.random() * 6 - 3, Math.random() * 6 - 3, Math.random() * 6 - 3),
			life: 1
		});
	}

	function moveClumps(dt: number) {
		for (let i = clumps.length - 1; i >= 0; i--) {
			const c = clumps[i];
			const p = c.mesh.position;
			const onSlate =
				p.x > slateBox.min.x &&
				p.x < slateBox.max.x &&
				p.z > slateBox.min.z &&
				p.z < slateBox.max.z;
			const floor = (onSlate ? slateBox.max.y : slateBox.min.y) + 0.01;
			// Off the edge of the table, they just fall out of sight.
			if (p.y < slateBox.min.y - 1.5) c.life = 0;
			const offTable =
				!onSlate && !nightstandTop.containsPoint(new THREE.Vector3(p.x, nightstandTop.min.y, p.z));
			if (p.y > floor || (offTable && c.life > 0)) {
				c.velocity.y -= 3.2 * dt;
				p.addScaledVector(c.velocity, dt);
				c.mesh.rotation.x += c.spin.x * dt;
				c.mesh.rotation.y += c.spin.y * dt;
				c.mesh.rotation.z += c.spin.z * dt;
			} else {
				// Landed: settle, then shrink away.
				p.y = floor;
				c.life -= dt * 0.5;
				c.mesh.scale.setScalar(Math.max(0, Math.min(1, c.life * 2.5)));
				if (c.life <= 0) {
					c.mesh.removeFromParent();
					c.mesh.geometry.dispose();
					clumps.splice(i, 1);
				}
			}
		}
	}

	function dropBit(from: THREE.Vector3) {
		const bit = bitState.find((b) => b.life <= 0);
		if (!bit) return;
		bit.life = 1;
		bit.at.copy(from);
	}

	const bitMatrix = new THREE.Matrix4();
	function moveBits(dt: number) {
		let moved = false;
		for (let i = 0; i < BITS; i++) {
			const bit = bitState[i];
			if (bit.life <= 0) continue;
			moved = true;
			bit.at.y -= 1.6 * dt;
			if (bit.at.y < slateBox.max.y) bit.life = 0;
			bits.setMatrixAt(i, bit.life > 0 ? bitMatrix.makeTranslation(bit.at) : hidden);
		}
		if (moved) bits.instanceMatrix.needsUpdate = true;
	}

	// Watering grows the whole tree a couple of days' worth, as drops fall through it.
	function water(dt: number) {
		watering -= dt;
		bonsai.grow(dt * 2.2);
		bonsaiDirty = true;
		for (let k = 0; k < 2; k++)
			dropBit(
				new THREE.Vector3(
					THREE.MathUtils.lerp(canopy.min.x, canopy.max.x, Math.random()),
					canopy.max.y + 0.25 + Math.random() * 0.2,
					THREE.MathUtils.lerp(canopy.min.z, canopy.max.z, Math.random())
				)
			);
		if (watering <= 0) {
			bonsai.save();
			bonsaiDirty = false;
		}
		emitBonsai();
	}

	function waterBonsai() {
		if (focused !== 'bonsai' || watering > 0) return;
		void sound.resume();
		sound.pour();
		watering = 1.4;
	}

	// Back to its neat shape, all at once.
	function resetBonsai() {
		if (focused !== 'bonsai') return;
		const from = Float32Array.from(bonsai.lengths);
		const k = { t: 0 };
		gsap.to(k, {
			t: 1,
			duration: 0.9,
			ease: 'power2.inOut',
			onUpdate: () => {
				bonsai.setAll((id, _, shoot) => from[id] + (shoot.neat - from[id]) * k.t);
				emitBonsai();
			},
			onComplete: () => bonsai.save()
		});
	}

	function leaveTree() {
		slash = turning = null;
		fingers.clear();
		spin = 0;
		// Turned back to face the front, the short way round.
		const now = bonsai.turntable.rotation.y;
		const front = Math.round(now / (Math.PI * 2)) * Math.PI * 2;
		const turn = { y: now };
		gsap.to(turn, {
			y: front,
			duration: 0.9,
			ease: 'power2.inOut',
			onUpdate: () => turnTree(turn.y - bonsai.turntable.rotation.y),
			onComplete: () => turnTree(-bonsai.turntable.rotation.y)
		});
		if (bonsaiDirty) bonsai.save();
		bonsaiDirty = false;
		canvas.style.cursor = '';
	}

	function emitBonsai() {
		onBonsai({ shagginess: bonsai.shagginess() });
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
			.call(() => onChime(true), [], 2.5)
			.call(() => sound.chime(), [], 2.8)
			.call(() => onChime(false), [], 2.8 + BOOT_DURATION)
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
		if (import.meta.env.DEV)
			Object.assign(window, { __boot: { s, timeline, scene, mode, camera, THREE, bonsai } });
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
		canvas.removeEventListener('pointerdown', pointerdown);
		canvas.removeEventListener('pointerup', pointerup);
		canvas.removeEventListener('pointercancel', pointerup);
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
		mask.dispose();
		rubiks.dispose();
		if (bonsaiDirty) bonsai.save();
		bonsai.dispose();
		trail.remove();
		for (const picker of pickers) picker.geometry.dispose();
		screenTexture.dispose();
		clockTexture.dispose();
		renderer.dispose();
		renderer.forceContextLoss();
		setTimeout(() => sound.close(), 4000);
	}

	setMode(mode);
	emitCube();
	return {
		enterSite,
		skipToSite,
		returnToRoom,
		unfocus,
		setLantern,
		scrambleCube: () => void scrambleCube(),
		solveCube: () => void solveCube(),
		waterBonsai,
		resetBonsai,
		setFreeAbove,
		turnBonsai: (by) => {
			if (focused !== 'bonsai') return;
			spin = 0;
			turnTree(by);
		},
		releaseBonsai: (by) => {
			if (focused === 'bonsai') spin = by;
		},
		setRadio,
		setMuted: (muted) => sound.setMuted(muted),
		dispose
	};
}

// Which of x, y and z a vector points along most.
function dominantAxis(v: THREE.Vector3) {
	const a = [Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)];
	return a[0] >= a[1] && a[0] >= a[2] ? 0 : a[1] >= a[2] ? 1 : 2;
}

const Y_AXIS = new THREE.Vector3(0, 1, 0);

// Where a frequency sits along the clock radio's dial, in millimetres.
function dialAt(freq: number) {
	let i = 0;
	while (i < FM_SCALE.length - 2 && freq > FM_SCALE[i + 1][0]) i++;
	const [[f0, x0], [f1, x1]] = [FM_SCALE[i], FM_SCALE[i + 1]];
	return x0 + ((freq - f0) / (f1 - f0)) * (x1 - x0);
}
