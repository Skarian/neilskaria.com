import fs from'node:fs';const p='C:/projects/neilskaria.com-tbt2/src/lib/boot/engine.ts';let s=fs.readFileSync(p,'utf8');s=s.replace('const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });',`const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	// Shader diagnostics make synchronous driver calls on first use; keep them in development.
	renderer.debug.checkShaderErrors = import.meta.env.DEV;`);fs.writeFileSync(p,s);
