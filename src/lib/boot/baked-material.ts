import * as THREE from 'three';

// Room surfaces aren't lit in real time. Blender bakes their lighting into two lightmaps: the sun and
// sky ("day"), and the kumiko lantern on its own ("lamp"). This material adds them, with the lantern's
// layer multiplied by a colour, so the lantern can be tinted and dimmed live at no cost per frame.

export type BakedLighting = {
	base: THREE.Texture;
	lamp: THREE.Texture;
	baseScale: number;
	lampScale: number;
	// Shared by every baked material: the lantern's colour times its brightness.
	lampTint: { value: THREE.Color };
};

// Shared clock for the foliage's sway.
export const swayTime = { value: 0 };

// How long each of the bonsai's tufts is (see bonsai.ts): one texel per tuft, 1 being its neat length.
const NEAT_EVERYWHERE = new THREE.DataTexture(
	new Float32Array([1]),
	1,
	1,
	THREE.RedFormat,
	THREE.FloatType
);
NEAT_EVERYWHERE.needsUpdate = true;
export const tuftLengths: { value: THREE.Texture } = { value: NEAT_EVERYWHERE };

export function bakedMaterial(
	source: THREE.MeshStandardMaterial,
	lighting: BakedLighting,
	options: { glow?: THREE.Color; sway?: boolean } = {}
) {
	const material = new THREE.MeshBasicMaterial({
		map: source.map,
		color: source.color,
		side: source.side,
		alphaTest: source.alphaTest,
		transparent: source.transparent,
		opacity: source.opacity,
		lightMap: lighting.base,
		lightMapIntensity: lighting.baseScale * Math.PI
	});
	material.onBeforeCompile = (shader) => {
		shader.uniforms.lampMap = { value: lighting.lamp };
		shader.uniforms.lampScale = { value: lighting.lampScale * Math.PI };
		shader.uniforms.lampTint = lighting.lampTint;
		shader.uniforms.glow = { value: options.glow ?? new THREE.Color(0, 0, 0) };
		// Foliage gets a soft fill on the side facing the camera: the lantern lights it from behind,
		// which on its own leaves the leaves we see in shadow.
		shader.uniforms.fill = {
			value: options.sway
				? new THREE.Color('#ffd9a8').multiplyScalar(0.55)
				: new THREE.Color(0, 0, 0)
		};
		shader.fragmentShader = shader.fragmentShader
			.replace(
				'#include <lightmap_pars_fragment>',
				`#include <lightmap_pars_fragment>
				uniform sampler2D lampMap;
				uniform float lampScale;
				uniform vec3 lampTint;
				uniform vec3 glow;
				uniform vec3 fill;`
			)
			.replace(
				'reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;',
				`vec3 lampTexel = texture2D( lampMap, vLightMapUv ).rgb;
				reflectedLight.indirectDiffuse += ( lightMapTexel.rgb * lightMapIntensity + lampTexel * lampScale * lampTint ) * RECIPROCAL_PI;`
			)
			.replace(
				'vec3 outgoingLight = reflectedLight.indirectDiffuse;',
				'vec3 outgoingLight = reflectedLight.indirectDiffuse + diffuseColor.rgb * ( glow * lampTint + fill );'
			);
		if (options.sway) {
			// A very gentle sway: whole pads drift slowly, more towards the top of the tree, with a
			// faint flutter in the needles.
			shader.uniforms.swayTime = swayTime;
			shader.uniforms.tuftLengths = tuftLengths;
			shader.vertexShader = shader.vertexShader
				.replace(
					'#include <common>',
					`#include <common>
					uniform float swayTime;
					uniform sampler2D tuftLengths;
					attribute vec3 needleRoot;
					attribute vec3 needleAxis;
					attribute float tuftId;
					attribute float needleTip;`
				)
				.replace(
					'#include <begin_vertex>',
					`#include <begin_vertex>
					// Trimmed, a needle's tip slides back along it; overgrown, the whole needle reaches out
					// past the pad and its tip lengthens, so the pad's outline turns shaggy. (The pads' cores
					// have no needles, so no axis: nothing moves.)
					if ( dot( needleAxis, needleAxis ) > 0.0 ) {
						int id = int( tuftId + 0.5 );
						int width = textureSize( tuftLengths, 0 ).x;
						float grow = texelFetch( tuftLengths, ivec2( id % width, id / width ), 0 ).r;
						if ( needleTip > 0.5 ) transformed = needleRoot + ( transformed - needleRoot ) * min( grow, 1.0 );
						transformed += needleAxis * max( grow - 1.0, 0.0 ) * ( needleTip > 0.5 ? 2.4 : 1.2 );
					}
					float reach = smoothstep( 1.2, 2.4, position.y );
					float drift = sin( swayTime * 0.9 + position.x * 2.5 ) + 0.5 * sin( swayTime * 1.7 + position.z * 3.1 );
					float flutter = sin( swayTime * 3.1 + dot( position, vec3( 61.0, 47.0, 53.0 ) ) );
					transformed.x += reach * ( drift * 0.012 + flutter * 0.0015 );
					transformed.z += reach * ( cos( swayTime * 0.7 + position.x * 2.1 ) * 0.008 );`
				);
		}
	};
	// three.js caches compiled shaders by the source of onBeforeCompile, which is the same for every
	// baked material; the foliage's version (sway and growth) has to be told apart from the rest.
	material.customProgramCacheKey = () => (options.sway ? 'baked-foliage' : 'baked');
	return material;
}

const NO_LAMP = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
NO_LAMP.needsUpdate = true;

export async function loadBakedLighting(
	group: string,
	scales: Record<string, Record<string, number>>,
	urls: Record<string, string>,
	lampTint: { value: THREE.Color }
) {
	const loader = new THREE.TextureLoader();
	const load = async (state: string) => {
		const texture = await loader.loadAsync(urls[`${group}-${state}`]);
		texture.flipY = false;
		texture.channel = 1;
		texture.colorSpace = THREE.SRGBColorSpace;
		return texture;
	};
	const hasLamp = scales[group].lamp !== undefined;
	const [base, lamp] = await Promise.all([load('day'), hasLamp ? load('lamp') : NO_LAMP]);
	return {
		base,
		lamp,
		baseScale: scales[group].day,
		lampScale: scales[group].lamp ?? 0,
		lampTint
	} satisfies BakedLighting;
}
