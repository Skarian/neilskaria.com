(()=>{
const o=window.__glMap={sources:[],links:[],queries:[],extensions:[],frames:[],slow:[],inputs:[],panels:[],drops:0,active:false,label:'startup'};
const ids=new WeakMap();let next=0;const id=x=>x?(ids.get(x)||((ids.set(x,++next)),next)):0,contexts=new WeakMap();let frame={t:performance.now(),overhead:0,draws:{},uploads:0};const cap=(a,v,n=20000)=>{if(a.length<n)a.push(v);else o.drops++};
function raf(t){cap(o.frames,{...frame,t},12000);frame={t,overhead:0,draws:{},uploads:0};requestAnimationFrame(raf)}requestAnimationFrame(raf);
const names=['shaderSource','attachShader','linkProgram','getProgramParameter','getShaderParameter','getProgramInfoLog','getShaderInfoLog','getActiveUniform','getActiveAttrib','getUniformLocation','getAttribLocation','getExtension','bindFramebuffer','useProgram','drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced','texImage2D','texSubImage2D','bufferData','bufferSubData'];
for(const proto of [WebGLRenderingContext.prototype,WebGL2RenderingContext.prototype])for(const name of names){const native=proto[name];if(typeof native!=='function')continue;proto[name]=function(...args){let a=performance.now(),c=contexts.get(this);if(!c){c={id:id(this),program:0,fb:0};contexts.set(this,c)}const before=performance.now(),value=native.apply(this,args),after=performance.now(),duration=after-before;
if(name==='shaderSource')cap(o.sources,{context:c.id,shader:id(args[0]),text:args[1],t:before});
else if(name==='attachShader')cap(o.links,{api:name,context:c.id,program:id(args[0]),shader:id(args[1]),t:before});
else if(name==='linkProgram')cap(o.links,{api:name,context:c.id,program:id(args[0]),t:before,duration});
else if(name==='useProgram')c.program=id(args[0]);else if(name==='bindFramebuffer')c.fb=id(args[1]);
else if(name==='getExtension'){if(args[0]==='KHR_parallel_shader_compile')cap(o.extensions,{context:c.id,name:args[0],available:!!value,t:before})}
else if(name.startsWith('get'))cap(o.queries,{api:name,context:c.id,object:id(args[0]),enum:typeof args[1]==='number'?args[1]:null,t:before,end:after,duration,value:typeof value==='object'?value&&{name:value.name,size:value.size,type:value.type}:value,stack:duration>1||name.includes('InfoLog')?new Error().stack:null,label:o.label});
else if(name.startsWith('draw')){if(o.active){let key=c.id+':'+c.program+':'+c.fb;frame.draws[key]=(frame.draws[key]||0)+1}if(duration>1)cap(o.slow,{api:name,context:c.id,program:c.program,fb:c.fb,t:before,end:after,duration,label:o.label})}
else {if(o.active)frame.uploads++;if(duration>1)cap(o.slow,{api:name,context:c.id,program:c.program,fb:c.fb,t:before,end:after,duration,label:o.label})}
frame.overhead+=before-a+performance.now()-after;return value}}
for(const type of ['pointermove','pointerdown','pointerup','click'])document.addEventListener(type,e=>{let t=performance.now();cap(o.inputs,{type,t,trusted:e.isTrusted,pointerType:e.pointerType||null,x:e.clientX,y:e.clientY,text:e.target.textContent?.trim().slice(0,70),label:o.label});if(e.isTrusted)performance.mark('map-input-'+type+'-'+o.inputs.length)},true);
let panel='';new MutationObserver(()=>{let p=document.querySelector('.panel')?.getAttribute('aria-label')||'';if(p!==panel){cap(o.panels,{t:performance.now(),panel:p,label:o.label});panel=p}}).observe(document,{subtree:true,childList:true});
document.addEventListener('transitionend',e=>{if(e.target.closest?.('.panel'))cap(o.panels,{t:performance.now(),transition:e.propertyName,label:o.label,panel:document.querySelector('.panel')?.getAttribute('aria-label')})},true);
})();
