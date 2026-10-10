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

export function bakedMaterial(source: THREE.MeshStandardMaterial, lighting: BakedLighting) {
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
		shader.fragmentShader = shader.fragmentShader
			.replace(
				'#include <lightmap_pars_fragment>',
				`#include <lightmap_pars_fragment>
				uniform sampler2D lampMap;
				uniform float lampScale;
				uniform vec3 lampTint;`
			)
			.replace(
				'reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;',
				`vec3 lampTexel = texture2D( lampMap, vLightMapUv ).rgb;
				reflectedLight.indirectDiffuse += ( lightMapTexel.rgb * lightMapIntensity + lampTexel * lampScale * lampTint ) * RECIPROCAL_PI;`
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
