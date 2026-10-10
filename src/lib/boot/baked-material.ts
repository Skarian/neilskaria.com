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

// A group's lighting, to build materials with straight away; its pictures are filled in as they
// arrive (see fillLightmap), before anything is drawn.
export function bakedLighting(
	group: string,
	scales: Record<string, Record<string, number>>,
	lampTint: { value: THREE.Color }
) {
	const texture = () => {
		const t = new THREE.Texture();
		t.flipY = false;
		t.channel = 1;
		t.colorSpace = THREE.SRGBColorSpace;
		return t;
	};
	return {
		base: texture(),
		lamp: scales[group].lamp !== undefined ? texture() : NO_LAMP,
		baseScale: scales[group].day,
		lampScale: scales[group].lamp ?? 0,
		lampTint
	} satisfies BakedLighting;
}

// A lightmap's picture from its file, decoded off the main thread.
export async function fillLightmap(texture: THREE.Texture, file: Promise<Blob>) {
	texture.image = await createImageBitmap(await file, {
		premultiplyAlpha: 'none',
		colorSpaceConversion: 'none'
	});
	texture.needsUpdate = true;
}
