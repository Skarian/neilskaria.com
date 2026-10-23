import fs from'node:fs';import{execFileSync}from'node:child_process';const repo='C:/projects/neilskaria.com-tbt2',p=repo+'/src/lib/boot/fetches.ts';let s=execFileSync('git',['show','c9be94d:src/lib/boot/fetches.ts'],{cwd:repo,encoding:'utf8'});s=s.replace('function download() {',`function download() {
	// Start the audio service while files arrive, so its first context does less setup.
	void navigator.mediaDevices?.enumerateDevices().catch(() => {});
`);fs.writeFileSync(p,s);
