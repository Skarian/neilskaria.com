import * as THREE from 'three';

// Room surfaces aren't lit in real time. Blender bakes their lighting into lightmaps: a base state
// (daylight) and optionally the bedside lamp on its own, which this material mixes in, so switching
// the lamp on costs nothing per frame.

export type BakedLighting = {
	base: THREE.Texture;
	lamp: THREE.Texture;
	baseScale: number;
	lampScale: number;
	// Shared by every baked material, so one value fades the lamp in across the whole room.
	lampMix: { value: number };
};

export function bakedMaterial(
	source: THREE.MeshStandardMaterial,
	lighting: BakedLighting,
	glow?: THREE.Color
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
		shader.uniforms.lampMix = lighting.lampMix;
		shader.uniforms.glow = { value: glow ?? new THREE.Color(0, 0, 0) };
		shader.fragmentShader = shader.fragmentShader
			.replace(
				'#include <lightmap_pars_fragment>',
				`#include <lightmap_pars_fragment>
				uniform sampler2D lampMap;
				uniform float lampScale;
				uniform float lampMix;
				uniform vec3 glow;`
			)
			.replace(
				'reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;',
				`vec3 lampTexel = texture2D( lampMap, vLightMapUv ).rgb;
				reflectedLight.indirectDiffuse += ( lightMapTexel.rgb * lightMapIntensity + lampTexel * lampScale * lampMix ) * RECIPROCAL_PI;`
			)
			.replace(
				'vec3 outgoingLight = reflectedLight.indirectDiffuse;',
				'vec3 outgoingLight = reflectedLight.indirectDiffuse + diffuseColor.rgb * glow * lampMix;'
			);
	};
	return material;
}

const NO_LAMP = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
NO_LAMP.needsUpdate = true;

export async function loadBakedLighting(
	group: string,
	scales: Record<string, Record<string, number>>,
	urls: Record<string, string>,
	lampMix: { value: number }
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
		lampMix
	} satisfies BakedLighting;
}
