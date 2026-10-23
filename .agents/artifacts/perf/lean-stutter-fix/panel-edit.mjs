import fs from 'node:fs';
const root='lean-stutter-work.tmp';
const p='src/lib/boot/BootIntro.svelte';let s=fs.readFileSync(p,'utf8');fs.copyFileSync(p,root+'/before-panel.svelte');
function rep(a,b){if(!s.includes(a))throw Error('missing '+a);s=s.replace(a,b);}
rep('\t// Panels pop in',`\tfunction popFrame(t: number) {
  const spring = 1 - Math.pow(1 - t, 3) + Math.sin(t * Math.PI) * 0.12;
  return { opacity: Math.min(1, t * 2), transform: \`scale(\${0.6 + 0.4 * spring}) rotate(\${(1 - t) * -4}deg)\` };
 }

\t// Panels pop in`);
rep("\t\t\t\tconst spring = 1 - Math.pow(1 - t, 3) + Math.sin(t * Math.PI) * 0.12;\n\t\t\t\treturn `opacity: ${Math.min(1, t * 2)}; transform: scale(${0.6 + 0.4 * spring}) rotate(${(1 - t) * -4}deg);`;", "\t\t\t\tconst frame = popFrame(t);\n\t\t\t\treturn `opacity: ${frame.opacity}; transform: ${frame.transform};`;");
rep("\tlet focused = $state<Thing | null>(null);",`\tlet focused = $state<Thing | null>(null);
 let lanternPrepared = $state(false);
 let radioPrepared = $state(false);
 let lanternPanel = $state<HTMLElement>();
 let radioPanel = $state<HTMLElement>();
 let preparingPanels = false;
 let disposed = false;

 // Each panel is laid out in its own yielded task, without delaying room readiness or activating
 // its controls. A selection that arrives first mounts the same panel through the normal path.
 async function preparePanels() {
  if (preparingPanels) return;
  preparingPanels = true;
  const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  const breathe = () => scheduler?.yield ? scheduler.yield() : new Promise(resolve => setTimeout(resolve, 0));
  await breathe();
  if (disposed) return;
  lanternPrepared = true;
  await tick();
  lanternPanel?.getBoundingClientRect();
  await breathe();
  if (disposed) return;
  radioPrepared = true;
  await tick();
  radioPanel?.getBoundingClientRect();
 }

 // Persistent panels replay the same pop keyframes and child entries on every selection.
 function preparedPanel(node: HTMLElement, selected: boolean) {
  let animation: Animation | undefined;
  let from = 0;
  let to = 0;
  let active = false;
  node.style.visibility = 'hidden';
  node.dataset.panelHidden = '';
  function update(selected: boolean) {
   if (selected === active) return;
   active = selected;
   const progress = Number(animation?.effect?.getComputedTiming().progress ?? 0);
   from = animation ? from + (to - from) * progress : active ? 0 : 1;
   animation?.cancel();
   to = active ? 1 : 0;
   if (active) {
    node.style.visibility = 'visible';
    delete node.dataset.panelHidden;
   }
   const duration = (active ? 520 : 220) * Math.abs(to - from);
   const steps = Math.max(1, Math.ceil(duration / (1000 / 60)));
   const frames = Array.from({ length: steps + 1 }, (_, i) => popFrame(from + (to - from) * i / steps));
   const next = node.animate(frames, { delay: active ? 350 : 0, duration, fill: 'both' });
   animation = next;
   next.onfinish = () => {
    if (animation !== next) return;
    if (!active) {
     node.style.visibility = 'hidden';
     node.dataset.panelHidden = '';
    }
    next.cancel();
    animation = undefined;
   };
  }
  update(selected);
  return { update, destroy: () => animation?.cancel() };
 }`);
rep("\t\tif (!focused) return;\n\t\tlet observer", "\t\tif (!focused) return;\n const thing = focused;\n let alive = true;\n const selectedPanel = () => thing === 'lantern' ? lanternPanel : thing === 'clock' ? radioPanel : layer?.querySelector<HTMLElement>('.panel:not([inert])');\n\t\tlet observer");
s=s.replaceAll("const panel = layer?.querySelector<HTMLElement>('.panel');", "if (!alive || focused !== thing) return;\n const panel = selectedPanel();");
rep('\t\t\tobserver?.disconnect();','\t\t\talive = false;\n\t\t\tobserver?.disconnect();');
rep("\t\tfetchRoom();\n\t\tconst { createRoom }", "\t\tfetchRoom();\n void preparePanels();\n\t\tconst { createRoom }");
rep('\t\t\t\tfocused = thing;', "\t\t\t\tif (thing === 'lantern') lanternPrepared = true;\n if (thing === 'clock') radioPrepared = true;\n\t\t\t\tfocused = thing;");
rep('\t\t\tengine?.dispose();','\t\t\tdisposed = true;\n\t\t\tengine?.dispose();');
rep("{#if focused === 'lantern'}\n\t\t<aside class=\"panel\" aria-label=\"Lantern\" in:pop={{ delay: 350 }} out:pop={{ duration: 220 }}>",`{#if lanternPrepared || focused === 'lantern'}
  <aside class="panel" aria-label="Lantern" bind:this={lanternPanel}
   inert={focused !== 'lantern'} aria-hidden={focused !== 'lantern'}
   use:preparedPanel={focused === 'lantern'}>`);
rep("{#if focused === 'clock'}", "{#if radioPrepared || focused === 'clock'}");
rep('class="panel radio-panel"\n\t\t\taria-label="Clock radio"\n\t\t\tin:pop={{ delay: 350 }}\n\t\t\tout:pop={{ duration: 220 }}',`class="panel radio-panel"
   aria-label="Clock radio" bind:this={radioPanel}
   inert={focused !== 'clock'} aria-hidden={focused !== 'clock'}
   use:preparedPanel={focused === 'clock'}`);
rep('<style>',`<style>
 .panel[data-panel-hidden] .swatches button,
 .panel[data-panel-hidden] .gem,
 .panel[data-panel-hidden] .presets button { animation: none; }
 .panel[data-panel-hidden] :global(*),
 .panel[data-panel-hidden] :global(*::after) { animation-play-state: paused; }
`);
fs.writeFileSync(p,s);
const e='src/lib/boot/engine.ts';s=fs.readFileSync(e,'utf8');fs.copyFileSync(e,root+'/before-fitting.ts');
rep("\tlet freeLeft = 0.58;",`\tlet freeLeft = 0.58;
 const fittedProjection = new THREE.Matrix4();
 let fittedWidth = 0;
 let fittedHeight = 0;
 function rememberFit() {
  fittedProjection.copy(camera.projectionMatrix);
  fittedWidth = innerWidth;
  fittedHeight = innerHeight;
 }`);
rep("\t\tif (side === 'above') freeAbove = THREE.MathUtils.clamp(fraction, 0.3, 0.9);\n\t\telse freeLeft = THREE.MathUtils.clamp(fraction, 0.4, 0.9);", `  const next = THREE.MathUtils.clamp(fraction, side === 'above' ? 0.3 : 0.4, 0.9);
  const unchanged = next === (side === 'above' ? freeAbove : freeLeft);
  if (side === 'above') freeAbove = next;
  else freeLeft = next;
  if (unchanged && fittedProjection.equals(camera.projectionMatrix) && fittedWidth === innerWidth && fittedHeight === innerHeight) return;`);
rep('\t\tconst v = viewOf(focused);','\t\tconst v = viewOf(focused);\n rememberFit();');
rep('\t\tconst v = viewOf(thing);','\t\tconst v = viewOf(thing);\n rememberFit();');
fs.writeFileSync(e,s);
console.log('Prepared panel and duplicate fitting candidates.');
