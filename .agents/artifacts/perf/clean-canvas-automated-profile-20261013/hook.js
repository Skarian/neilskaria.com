window.__external={raf:[],letters:[],phases:[],clicks:[],run:0};
const o=window.__external;let last=0;
function mark(name){const t=performance.now();o.phases.push({name,t,run:o.run});performance.mark(name)}
document.addEventListener('click',e=>{o.clicks.push({t:performance.now(),trusted:e.isTrusted,text:e.target.textContent?.trim().slice(0,70),x:e.clientX,y:e.clientY});if(e.target.closest('[data-start]')){o.run++;mark('external-START-'+o.run)}},true);
const native=CanvasRenderingContext2D.prototype.fillText;
CanvasRenderingContext2D.prototype.fillText=function(...a){if(this.canvas.width===960&&this.canvas.height===640&&a[0]==='N'){const t=performance.now();if(t-last>1){o.letters.push({t,run:o.run});last=t}}return native.apply(this,a)};
let start=false,intro=true,panel='';
new MutationObserver(()=>{const s=!!document.querySelector('[data-start]');if(s&&!start)mark('external-start-DOM');start=s;const i=document.documentElement.dataset.intro==='play';if(!i&&intro)mark('external-site');intro=i;const p=document.querySelector('.panel')?.getAttribute('aria-label')||'';if(p!==panel){mark('external-panel-'+(p||'closed'));panel=p}}).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['data-intro','aria-hidden']});
function frame(t){o.raf.push(t);requestAnimationFrame(frame)}requestAnimationFrame(frame);
try{localStorage.setItem('boot-seen','1');sessionStorage.setItem('room-place','room')}catch{}
