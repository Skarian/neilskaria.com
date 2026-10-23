import * as THREE from 'three';
import metrics from './boot-atlas-metrics.json';
import { diagnostic as diag } from './diagnostic';

// Fixed boot artwork only. Compositing remains in sRGB, as in the original Canvas2D texture.
export function createBootAtlas(endColor: string) {
	const texture = new THREE.Texture();
	texture.flipY = false;
	texture.generateMipmaps = true;
	texture.minFilter = THREE.LinearMipmapLinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.onUpdate = () => diag?.textureSubmission('atlas');
	const glyphs = [...'NEIL SKARIA'].map((ch, i) => ({ ch, i })).filter((g) => g.ch !== ' ');
	const masks = [
		...glyphs.map((g) => metrics.masks.find((m) => m.ch === g.ch)!),
		metrics.masks.at(-1)!
	];
	const rects = masks.map(
		(m) =>
			new THREE.Vector4(
				m.bounds[0] - 2 / m.scale,
				m.bounds[1] - 2 / m.scale,
				m.bounds[2] + 4 / m.scale,
				m.bounds[3] + 4 / m.scale
			)
	);
	const regions = masks.map(
		(m) =>
			new THREE.Vector4(
				(m.region[0] - 2) / metrics.width,
				(m.region[1] - 2) / metrics.height,
				(m.region[2] + 4) / metrics.width,
				(m.region[3] + 4) / metrics.height
			)
	);
	const transforms = masks.map(() => new THREE.Vector4());
	const colours = masks.map(() => new THREE.Vector4());
	const end = new THREE.Color(endColor).convertLinearToSRGB();
	const uniforms = {
		atlas: { value: texture },
		rects: { value: rects },
		regions: { value: regions },
		transforms: { value: transforms },
		colours: { value: colours },
		powered: { value: 0 },
		returning: { value: 0 },
		fade: { value: 0 },
		end: { value: end },
		glint: { value: 0 }
	};
	const material = new THREE.ShaderMaterial({
		toneMapped: false,
		uniforms,
		vertexShader: `varying vec2 screenUv; void main(){screenUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
		fragmentShader: `
   varying vec2 screenUv;
   uniform sampler2D atlas;
   uniform vec4 rects[11], regions[11], transforms[11], colours[11];
   uniform float powered, returning, fade, glint;
   uniform vec3 end;
   float maskAt(int i, vec2 p){
    vec2 q=(p-transforms[i].xy)/transforms[i].z;
    vec2 uv=(q-rects[i].xy)/rects[i].zw;
    // Derivatives must precede the per-fragment clipping branch.
    vec2 atlasUv=regions[i].xy+uv*regions[i].zw;
    vec2 dx=dFdx(atlasUv),dy=dFdy(atlasUv);
    if(any(lessThan(uv,vec2(0.0)))||any(greaterThan(uv,vec2(1.0))))return 0.0;
    return textureGrad(atlas,atlasUv,dx,dy).a;
   }
   vec3 linearColour(vec3 c){return mix(c/12.92,pow((c+0.055)/1.055,vec3(2.4)),step(vec3(0.04045),c));}
   void main(){
    vec3 paper=vec3(248.0,250.0,248.0)/255.0;
    vec3 c=paper;vec2 p=screenUv*vec2(960.0,640.0);
    if(powered<0.5)c=vec3(29.0,32.0,29.0)/255.0;
    else if(returning>0.5)c=end*(1.0-fade);
    else{
     c=mix(c,colours[10].rgb,maskAt(10,p)*colours[10].a);
     if(glint>0.0&&glint<1.0){
      float width=${metrics.lineWidth};float x=(960.0-width)*0.5;
      float gx=mix(x-width*0.1,x+width*1.1,glint);
      if(p.x>=x-width*0.1&&p.x<=x+width*1.1&&abs(p.y-473.6)<=${metrics.lineSize})c=mix(c,paper,max(0.0,1.0-abs(p.x-gx)/(width*0.08)));
     }
     for(int i=0;i<10;i++){if(colours[i].a>0.0)c=mix(c,colours[i].rgb,maskAt(i,p)*colours[i].a);}
     c=mix(c,end,fade);
    }
    gl_FragColor=vec4(linearColour(c),1.0);
    #include <colorspace_fragment>
   }`
	});
	diag?.mark('atlas-fetch-start', {
		asset: '/boot-atlas.png',
		sha256: metrics.assetSha256,
		width: metrics.width,
		height: metrics.height
	});
	let disposed = false;
	const abort = new AbortController();
	const ready = fetch('/boot-atlas.png', { signal: abort.signal }).then(async (r) => {
		if (!r.ok) throw Error('Boot atlas HTTP ' + r.status);
		const blob = await r.blob();
		diag?.mark('atlas-fetch-end', { bytes: blob.size });
		diag?.mark('atlas-decode-start');
		const bitmap = await createImageBitmap(blob, {
			premultiplyAlpha: 'none',
			colorSpaceConversion: 'none'
		});
		if (disposed) {
			bitmap.close();
			throw Error('Boot atlas disposed before readiness');
		}
		texture.image = bitmap;
		diag?.mark('atlas-decode-end');
		texture.needsUpdate = true;
		diag?.textureRequest('atlas');
		diag?.mark('atlas-ready');
	});
	// Own rejection immediately. Readiness still rejects at the asset boundary.
	void ready.catch((error: unknown) => {
		diag?.mark('atlas-readiness-failed', { error: String(error), disposed });
	});
	function prepare(t: number, returning: boolean, fade: number) {
		uniforms.returning.value = Number(returning);
		uniforms.fade.value = returning ? fade : clamp((t - 3.5) / 0.45);
		uniforms.glint.value = clamp((t - 2.4) / 0.45);
		if (returning) return;
		transforms[10].set((960 - metrics.lineWidth) / 2, 473.6, 1, 0);
		colours[10].set(224 / 255, 16 / 255, 224 / 255, clamp(t / 0.25));
		const drop = easeInOut(clamp((t - 1.1) / 0.5));
		const wx = lerp(422.4, 480, drop),
			wy = lerp(128, 249.6, drop),
			ws = lerp(1.15, 1, drop);
		for (const [seed, g] of glyphs.entries()) {
			const p = clamp((t - (0.35 + (seed / 10) * 0.7)) / 0.42),
				e = 1 - (1 - p) ** 3;
			const angle = seed * 2.4 + 0.6,
				slot = wx + metrics.slots[g.i] * ws;
			transforms[seed].set(
				lerp(480 + Math.cos(angle) * 336, slot, e),
				lerp(288 + Math.sin(angle) * 224, wy, e),
				lerp(4.2, 1, e) * ws,
				0
			);
			const hue = (seed * 67 + t * 520) % 360;
			const k = (n: number) => (n + hue / 30) % 12;
			const f = (n: number) =>
				(0.5 - 0.5 * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))) * 255;
			const colour = [f(0), f(8), f(4)],
				blue = [7, 0, 229],
				magenta = [224, 16, 224];
			const settle = clamp((t - 1.25) / 0.35),
				wave = clamp((t - 1.85) / 0.9);
			const strength =
				wave > 0 && wave < 1 ? Math.exp(-(((slot / 960 - lerp(-0.3, 1.3, wave)) / 0.3) ** 2)) : 0;
			const c = colour.map(
				(v, i) => (lerp(lerp(v, blue[i], settle), magenta[i], strength) | 0) / 255
			);
			colours[seed].set(c[0], c[1], c[2], clamp(p * 6));
		}
	}
	return {
		material,
		texture,
		ready,
		prepare,
		power(on: boolean) {
			uniforms.powered.value = Number(on);
		},
		submitted(t: number, returning: boolean) {
			if (returning) {
				diag?.once('solid-return-draw-submitted', { boot: t });
				return;
			}
			if (t > 0) diag?.once('domain-draw-submitted', { boot: t });
			for (const [seed, g] of glyphs.entries())
				if (t > 0.35 + (seed / 10) * 0.7)
					diag?.once('glyph-draw-submitted-' + g.i, { boot: t, glyph: g.ch, index: g.i });
		},
		dispose() {
			if (disposed) return;
			disposed = true;
			abort.abort();
			texture.dispose();
			(texture.image as ImageBitmap | undefined)?.close();
			material.dispose();
			diag?.mark('atlas-disposed');
		}
	};
}
function clamp(v: number) {
	return Math.min(1, Math.max(0, v));
}
function lerp(a: number, b: number, k: number) {
	return a + (b - a) * k;
}
function easeInOut(p: number) {
	return p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
}
