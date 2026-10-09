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
		shader.fragmentShader = shader.fragmentShader
			.replace(
				'#include <lightmap_pars_fragment>',
				`#include <lightmap_pars_fragment>
				uniform sampler2D lampMap;
				uniform float lampScale;
				uniform vec3 lampTint;
				uniform vec3 glow;`
			)
			.replace(
				'reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;',
				`vec3 lampTexel = texture2D( lampMap, vLightMapUv ).rgb;
				reflectedLight.indirectDiffuse += ( lightMapTexel.rgb * lightMapIntensity + lampTexel * lampScale * lampTint ) * RECIPROCAL_PI;`
			)
			.replace(
				'vec3 outgoingLight = reflectedLight.indirectDiffuse;',
				'vec3 outgoingLight = reflectedLight.indirectDiffuse + diffuseColor.rgb * glow * lampTint;'
			);
		if (options.sway) {
			// A very gentle sway: whole pads drift slowly, more towards the top of the tree, with a
			// faint flutter in the needles.
			shader.uniforms.swayTime = swayTime;
			shader.vertexShader = shader.vertexShader
				.replace('#include <common>', '#include <common>\nuniform float swayTime;')
				.replace(
					'#include <begin_vertex>',
					`#include <begin_vertex>
					float reach = smoothstep( 1.2, 2.4, position.y );
					float drift = sin( swayTime * 0.9 + position.x * 2.5 ) + 0.5 * sin( swayTime * 1.7 + position.z * 3.1 );
					float flutter = sin( swayTime * 3.1 + dot( position, vec3( 61.0, 47.0, 53.0 ) ) );
					transformed.x += reach * ( drift * 0.012 + flutter * 0.0015 );
					transformed.z += reach * ( cos( swayTime * 0.7 + position.x * 2.1 ) * 0.008 );`
				);
		}
	};
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
