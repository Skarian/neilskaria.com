import * as THREE from '/three/three.module.js';
const metrics = {
    "width": 2048,
    "height": 1024,
    "assetSha256": "e7eb731d0e0ddeaa44e3d5cf0c700e05211bd2a595a908c3eade1c36b2fafc6e",
    "size": 116.96527852893455,
    "total": 844.7617797851562,
    "slots": [
        -373.6665954589844, -282.7199172973633, -217.72945404052734, -155.9656753540039,
        -97.4571304321289, -35.721900939941406, 55.22477722167969, 149.42668914794922,
        240.40192413330078, 308.64762115478516, 376.89331817626953
    ],
    "lineSize": 70.4,
    "lineWidth": 567.1185913085938,
    "masks": [
        {
            "ch": "N",
            "scale": 4,
            "width": 97.4285888671875,
            "font": "italic 900 116.96527852893455px \"Arial Black\", \"Helvetica Neue\", Arial, sans-serif",
            "originX": 1024,
            "originY": 1024,
            "region": [8, 8, 404, 336],
            "bounds": [-39.96429443359375, -52, 101, 84]
        },
        {
            "ch": "E",
            "scale": 4,
            "width": 84.46476745605469,
            "font": "italic 900 116.96527852893455px \"Arial Black\", \"Helvetica Neue\", Arial, sans-serif",
            "originX": 1024,
            "originY": 1024,
            "region": [428, 8, 361, 336],
            "bounds": [-33.732383728027344, -52, 90.25, 84]
        },
        {
            "ch": "I",
            "scale": 4,
            "width": 45.51615905761719,
            "font": "italic 900 116.96527852893455px \"Arial Black\", \"Helvetica Neue\", Arial, sans-serif",
            "originX": 1024,
            "originY": 1024,
            "region": [805, 8, 188, 336],
            "bounds": [-13.258079528808594, -52, 47, 84]
        },
        {
            "ch": "L",
            "scale": 4,
            "width": 78.01139831542969,
            "font": "italic 900 116.96527852893455px \"Arial Black\", \"Helvetica Neue\", Arial, sans-serif",
            "originX": 1024,
            "originY": 1024,
            "region": [1009, 8, 286, 336],
            "bounds": [-30.505699157714844, -52, 71.5, 84]
        },
        {
            "ch": "S",
            "scale": 4,
            "width": 84.46476745605469,
            "font": "italic 900 116.96527852893455px \"Arial Black\", \"Helvetica Neue\", Arial, sans-serif",
            "originX": 1024,
            "originY": 1024,
            "region": [1311, 8, 330, 347],
            "bounds": [-31.982383728027344, -53.5, 82.5, 86.75]
        },
        {
            "ch": "K",
            "scale": 4,
            "width": 97.4285888671875,
            "font": "italic 900 116.96527852893455px \"Arial Black\", \"Helvetica Neue\", Arial, sans-serif",
            "originX": 1024,
            "originY": 1024,
            "region": [8, 371, 432, 336],
            "bounds": [-39.96429443359375, -52, 108, 84]
        },
        {
            "ch": "A",
            "scale": 4,
            "width": 90.97523498535156,
            "font": "italic 900 116.96527852893455px \"Arial Black\", \"Helvetica Neue\", Arial, sans-serif",
            "originX": 1024,
            "originY": 1024,
            "region": [456, 371, 365, 336],
            "bounds": [-45.23761749267578, -52, 91.25, 84]
        },
        {
            "ch": "R",
            "scale": 4,
            "width": 90.97523498535156,
            "font": "italic 900 116.96527852893455px \"Arial Black\", \"Helvetica Neue\", Arial, sans-serif",
            "originX": 1024,
            "originY": 1024,
            "region": [837, 371, 367, 336],
            "bounds": [-36.73761749267578, -52, 91.75, 84]
        },
        {
            "ch": "neilskaria.com",
            "scale": 1,
            "width": 567.1185913085938,
            "font": "900 70.4px \"Arial Rounded MT Bold\", \"Helvetica Neue\", Arial, sans-serif",
            "originX": 196.44070434570312,
            "originY": 473.6,
            "region": [1220, 371, 560, 51],
            "bounds": [3.559295654296875, -30.600000000000023, 560, 51]
        }
    ],
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/154.0.0.0 Safari/537.36"
};
// Fixed boot artwork only. Compositing remains in sRGB, as in the original Canvas2D texture.
export function createBootAtlas(endColor) {
    const texture = new THREE.Texture();
    texture.flipY = false;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    const glyphs = [...'NEIL SKARIA'].map((ch, i) => ({ ch, i })).filter((g) => g.ch !== ' ');
    const masks = [
        ...glyphs.map((g) => metrics.masks.find((m) => m.ch === g.ch)),
        metrics.masks.at(-1)
    ];
    const rects = masks.map((m) => new THREE.Vector4(m.bounds[0] - 2 / m.scale, m.bounds[1] - 2 / m.scale, m.bounds[2] + 4 / m.scale, m.bounds[3] + 4 / m.scale));
    const regions = masks.map((m) => new THREE.Vector4((m.region[0] - 2) / metrics.width, (m.region[1] - 2) / metrics.height, (m.region[2] + 4) / metrics.width, (m.region[3] + 4) / metrics.height));
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
    let disposed = false;
    const abort = new AbortController();
    const ready = fetch('/boot-atlas.png', { signal: abort.signal }).then(async (r) => {
        if (!r.ok)
            throw Error('Boot atlas HTTP ' + r.status);
        const blob = await r.blob();
        const bitmap = await createImageBitmap(blob, {
            premultiplyAlpha: 'none',
            colorSpaceConversion: 'none'
        });
        if (disposed) {
            bitmap.close();
            throw Error('Boot atlas disposed before readiness');
        }
        texture.image = bitmap;
        texture.needsUpdate = true;
    });
    // Own rejection immediately. Readiness still rejects at the asset boundary.
    void ready.catch(() => { });
    function prepare(t, returning, fade) {
        uniforms.returning.value = Number(returning);
        uniforms.fade.value = returning ? fade : clamp((t - 3.5) / 0.45);
        uniforms.glint.value = clamp((t - 2.4) / 0.45);
        if (returning)
            return;
        transforms[10].set((960 - metrics.lineWidth) / 2, 473.6, 1, 0);
        colours[10].set(224 / 255, 16 / 255, 224 / 255, clamp(t / 0.25));
        const drop = easeInOut(clamp((t - 1.1) / 0.5));
        const wx = lerp(422.4, 480, drop), wy = lerp(128, 249.6, drop), ws = lerp(1.15, 1, drop);
        for (const [seed, g] of glyphs.entries()) {
            const p = clamp((t - (0.35 + (seed / 10) * 0.7)) / 0.42), e = 1 - (1 - p) ** 3;
            const angle = seed * 2.4 + 0.6, slot = wx + metrics.slots[g.i] * ws;
            transforms[seed].set(lerp(480 + Math.cos(angle) * 336, slot, e), lerp(288 + Math.sin(angle) * 224, wy, e), lerp(4.2, 1, e) * ws, 0);
            const hue = (seed * 67 + t * 520) % 360;
            const k = (n) => (n + hue / 30) % 12;
            const f = (n) => (0.5 - 0.5 * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))) * 255;
            const colour = [f(0), f(8), f(4)], blue = [7, 0, 229], magenta = [224, 16, 224];
            const settle = clamp((t - 1.25) / 0.35), wave = clamp((t - 1.85) / 0.9);
            const strength = wave > 0 && wave < 1 ? Math.exp(-(((slot / 960 - lerp(-0.3, 1.3, wave)) / 0.3) ** 2)) : 0;
            const c = colour.map((v, i) => (lerp(lerp(v, blue[i], settle), magenta[i], strength) | 0) / 255);
            colours[seed].set(c[0], c[1], c[2], clamp(p * 6));
        }
    }
    return {
        material,
        texture,
        ready,
        prepare,
        power(on) {
            uniforms.powered.value = Number(on);
        },
        dispose() {
            if (disposed)
                return;
            disposed = true;
            abort.abort();
            texture.dispose();
            texture.image?.close();
            material.dispose();
        }
    };
}
function clamp(v) {
    return Math.min(1, Math.max(0, v));
}
function lerp(a, b, k) {
    return a + (b - a) * k;
}
function easeInOut(p) {
    return p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
}
