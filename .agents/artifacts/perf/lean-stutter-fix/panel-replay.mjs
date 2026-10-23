import fs from 'node:fs';
const p='lean-stutter-work.tmp/panel-candidate-Intro.bin';let s=fs.readFileSync(p,'utf8');
s=s.replace('   active = selected;\n',"   active = selected;\n   const replaying = active && node.style.visibility === 'visible';\n");
s=s.replace('   animation?.cancel();\n   to = active ? 1 : 0;',"   animation?.cancel();\n   if (replaying) for (const child of node.getAnimations({ subtree: true })) {\n    if (child instanceof CSSAnimation) child.currentTime = 0;\n   }\n   to = active ? 1 : 0;");
s=s.replace('const duration = (active ? 520 : 220) * Math.abs(to - from);','const duration = active ? 520 : 220;');
fs.writeFileSync(p,s);
