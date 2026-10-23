import fs from'node:fs';const p='C:/projects/neilskaria.com-tbt2/src/lib/boot/engine.ts';let s=fs.readFileSync(p,'utf8');s=s.replace('\t// Shader diagnostics make synchronous driver calls on first use; keep them in development.\n\trenderer.debug.checkShaderErrors = import.meta.env.DEV;\n','');s=s.replace('\tconst renderer = new THREE.WebGLRenderer({ canvas, antialias: true });',`// Let the engine's module evaluation finish before creating the graphics context.
	await breathe();
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });`);fs.writeFileSync(p,s);
