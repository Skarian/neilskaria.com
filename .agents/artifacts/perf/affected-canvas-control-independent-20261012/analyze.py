"""Independent stdlib-only analysis. Output is restricted to this script's directory."""
import csv, difflib, hashlib, json, math, statistics
from pathlib import Path
OUT=Path(__file__).resolve().parent
PERF=OUT.parent
CONTROL=Path('C:/Users/Neil Skaria/.t3/userdata/attachments/fab6e615-3ee1-4b06-99e4-bbf3bda6d6af-33bef0bb-21fa-48d2-bcf7-97c586a35a17-json.json')
DEFAULT=PERF/'affected-capture-analysis-20261012/capture.json'
STAGE=PERF/'canvas-context-control-20261012/source-stage'
BASE=PERF/'affected-browser-firstboot/source-stage'
PHASES=['camera-before-power','activation','arrival','drop','colour-glint','fade']
def read(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def write(n,v): (OUT/n).write_text(json.dumps(v,indent=2,allow_nan=False)+'\n',encoding='utf-8')
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def validate(v,s,p='$'):
 known={'$schema','title','type','required','properties','const','enum','oneOf','allOf','if','then','else','additionalProperties','items','maxItems','maxLength'}
 assert not(set(s)-known),set(s)-known
 e=[]; typ=s.get('type',[]);typ=[typ] if isinstance(typ,str) else typ
 types={'object':isinstance(v,dict),'array':isinstance(v,list),'string':isinstance(v,str),'number':type(v) in (int,float) and math.isfinite(v),'integer':type(v)==int,'boolean':type(v)==bool,'null':v is None}
 if typ and not any(types[t] for t in typ):e.append(p+':type')
 if 'const' in s and (type(v)!=type(s['const']) or v!=s['const']):e.append(p+':const')
 if 'enum' in s and v not in s['enum']:e.append(p+':enum')
 if 'oneOf' in s and sum(not validate(v,x,p) for x in s['oneOf'])!=1:e.append(p+':oneOf')
 for x in s.get('allOf',[]):e+=validate(v,x,p)
 if 'if' in s:e+=validate(v,s.get('then' if not validate(v,s['if'],p) else 'else',{}),p)
 if isinstance(v,dict):
  e += [p+':missing '+k for k in s.get('required',[]) if k not in v]
  for k,x in s.get('properties',{}).items():
   if k in v:e+=validate(v[k],x,p+'.'+k)
  if s.get('additionalProperties') is False:e += [p+':extra '+k for k in v if k not in s.get('properties',{})]
 if isinstance(v,list):
  if len(v)>s.get('maxItems',math.inf):e.append(p+':maxItems')
  for i,x in enumerate(v):e+=validate(x,s.get('items',{}),p+f'[{i}]')
 if isinstance(v,str) and len(v)>s.get('maxLength',math.inf):e.append(p+':maxLength')
 return e
def pct(x,p):
 x=sorted(x);z=(len(x)-1)*p;lo=math.floor(z);hi=math.ceil(z)
 return x[lo]+(x[hi]-x[lo])*(z-lo)
def stats(vals):
 x=[v for v in vals if v is not None]
 if not x:return {'n':0}
 return dict(n=len(x),mean=statistics.fmean(x),p50=pct(x,.5),p95=pct(x,.95),max=max(x),ge42=sum(v>=42 for v in x),ge42_pct=100*sum(v>=42 for v in x)/len(x),gt50=sum(v>50 for v in x),gt50_pct=100*sum(v>50 for v in x)/len(x))
def group(frames,sel):
 ids={f['index'] for f in sel};pairs=[f for f in sel if f['previousIndex'] is not None]
 prev=[frames[f['previousIndex']] for f in pairs];internal=[f for f in pairs if f['previousIndex'] in ids]
 keys=['paintMs','submitMs','totalMs','recorderMs']
 return dict(frames=len(sel),engine=stats(f['gapMs'] for f in sel),raf=stats(f['rafDeltaMs'] for f in sel),
 internal_engine=stats(f['gapMs'] for f in internal),internal_raf=stats(f['rafDeltaMs'] for f in internal),
 current_callback={k:stats(f[k] for f in sel) for k in keys},previous_callback={k:stats(f[k] for f in prev) for k in keys},
 outside_previous_total=stats(f['gapMs']-frames[f['previousIndex']]['totalMs'] for f in pairs))
def ev(d,k,r=0,**fields):
 return next(e for e in d['events'] if e['kind']==k and e['run']==r and all(e.get(k)==v for k,v in fields.items()))
def analyze(name,d):
 frames=[];prev=None
 power={r:ev(d,'screen-material-power',r,on=True,mode='booting')['t'] for r in [1,2]}
 off={r:ev(d,'screen-material-power',r,on=False,mode='returning')['t'] for r in [1,2]}
 for i,raw in enumerate(d['frames']):
  f=dict(raw,index=i);valid=prev is not None and (prev['run'],prev['mode'])==(f['run'],f['mode'])
  assert valid==(f['gapMs'] is not None)
  f['previousIndex']=prev['index'] if valid else None;f['rafDeltaMs']=f['raf']-prev['raf'] if valid else None
  if valid:
   assert abs(f['gapMs']-(f['t']-prev['t']))<1e-6
   assert f['rafDeltaMs']>0 and f['gapMs']>0
  assert f['paintMs']<=f['totalMs']+1e-6 and f['submitMs']<=f['totalMs']+1e-6
  if f['mode']=='returning':expected='return'
  elif f['t']<power[f['run']]:expected='camera-before-power'
  else:expected=next(p for p,b in [('activation',.35),('arrival',1.1),('drop',1.9),('colour-glint',3.5),('fade',math.inf)] if f['boot']<b)
  assert f['phase']==expected,(name,i,f['phase'],expected)
  frames.append(f);prev=f
 result={}
 for r in [1,2]:
  boot=[f for f in frames if f['run']==r and f['mode']=='booting'];ret=[f for f in frames if f['run']==r and f['mode']=='returning']
  groups={'all_boot':boot,**{p:[f for f in boot if f['phase']==p] for p in PHASES},
   'text_0.35_to_3.5':[f for f in boot if .35<=f['boot']<3.5],
   'text_0.35_to_4':[f for f in boot if .35<=f['boot']<4],
   'settled_1.6_to_3.5':[f for f in boot if 1.6<=f['boot']<3.5],
   'all_return':ret,'powered_return':[f for f in ret if f['t']<off[r]],'unpowered_return':[f for f in ret if f['t']>=off[r]]}
  result[str(r)]={k:group(frames,fs) for k,fs in groups.items()}
  result[str(r)]['first_callback']=boot[0];result[str(r)]['first_powered_callback']=next(f for f in boot if f['phase']=='activation')
  worst={}
  for metric in ['gapMs','rafDeltaMs']:
   ranked=sorted([f for f in boot if f[metric] is not None],key=lambda f:f[metric],reverse=True)[:10]
   worst[metric]=[{'incoming':f,'previous':frames[f['previousIndex']],'outsidePreviousTotalMs':f['gapMs']-frames[f['previousIndex']]['totalMs'],
     'events_between_starts':[e for e in d['events'] if frames[f['previousIndex']]['t']<=e['t']<=f['t']]} for f in ranked]
  result[str(r)]['worst']=worst
 m={e['kind']:e['t'] for e in d['events'] if e['run']==0};nav=d['navigation'][0]
 pairs=[('create-room','screen-texture-created'),('screen-texture-created','model-parsed'),('model-parsed','assets-prepared'),('assets-prepared','compile-wait-start'),('compile-wait-start','compile-wait-end'),('compile-wait-end','font-wait-start'),('font-wait-start','fonts-ready'),('fonts-ready','room-ready'),('room-ready','START-DOM'),('START-DOM','START-animation-start'),('START-animation-start','START-animation-complete')]
 seg={a+' -> '+b:m[b]-m[a] for a,b in pairs}
 seg.update({'navigation -> responseEnd':nav['responseEnd'],'responseEnd -> diagnostic':m['diagnostic-initialized']-nav['responseEnd'],'diagnostic -> create-room':m['create-room']-m['diagnostic-initialized']})
 startup={'navigation':nav,'markers':m,'segments':seg,'create_room_to_ready':m['room-ready']-m['create-room'],
 'responseEnd_to_START_DOM':m['START-DOM']-nav['responseEnd'],'diagnostic_to_START_DOM':m['START-DOM']-m['diagnostic-initialized'],
 'START_DOM_to_entry_complete':m['START-animation-complete']-m['START-DOM'],'longtasks':d['longtasks'],
 'pre_model_tasks':stats(x['duration'] for x in d['longtasks'] if x['t']<m['model-parsed']),
 'pre_START_tasks':stats(x['duration'] for x in d['longtasks'] if x['t']<m['START-gesture']),
 'animation_overlapping_tasks':[],'run_timings':{}}
 for r in [1,2]:
  start=ev(d,'mode',r,to='booting')['t'];end=ev(d,'boot-animation-complete',r)['t'];gesture=ev(d,'START-gesture',r-1)['t']
  startup['run_timings'][str(r)]={'gesture_to_mode':start-gesture,'mode_to_first_callback':result[str(r)]['first_callback']['t']-start,'mode_to_completion':end-start,'gesture_to_completion':end-gesture}
  for mode in ['booting','returning']:
   a=ev(d,'mode',r,to=mode)['t'];b=ev(d,'boot-animation-complete' if mode=='booting' else 'return-animation-complete',r)['t']
   startup['animation_overlapping_tasks'] += [x for x in d['longtasks'] if x['t']<b and x['t']+x['duration']>a]
 resources=[]
 for raw in d['resources']:
  rr=dict(raw,endTime=raw['startTime']+raw['duration'])
  rr['cacheEvidence']='zero transfer, nonzero body' if rr['transferSize']==0 and rr['encodedBodySize']>0 else 'nonzero transfer' if rr['transferSize'] else 'unknown (both zero)'
  resources.append(rr)
 net={'count':len(resources),'transferBytes':sum(r['transferSize'] for r in resources),'encodedBytes':sum(r['encodedBodySize'] for r in resources),
 'zeroTransferNonzeroBodyCount':sum(r['cacheEvidence']=='zero transfer, nonzero body' for r in resources),
 'bothZeroCount':sum(r['transferSize']==r['encodedBodySize']==0 for r in resources),
 'afterFirstSTART':[r for r in resources if r['startTime']>=m['START-gesture']],
 'notFinishedByFirstSTART':[r for r in resources if r['endTime']>m['START-gesture']],'resources':resources}
 return {'runs':result,'startup':startup,'network':net},frames
def main():
 sources={};diff=[]
 for p in sorted(STAGE.rglob('*')):
  if not p.is_file():continue
  rel=p.relative_to(STAGE);q=BASE/rel;same=q.exists() and p.read_bytes()==q.read_bytes()
  sources[str(rel)]={'control':sha(p),'baseline':sha(q) if q.exists() else None,'identical':same}
  if not same and p.suffix in ['.ts','.svelte','.json','.html']:
   diff+=difflib.unified_diff(q.read_text(encoding='utf-8-sig').splitlines(True) if q.exists() else [],p.read_text(encoding='utf-8-sig').splitlines(True),fromfile='old/'+str(rel),tofile='control/'+str(rel))
 (OUT/'source-differences.diff').write_text(''.join(diff),encoding='utf-8');write('source-alignment.json',sources)
 schemas={'original':read(PERF/'affected-browser-firstboot/capture.schema.json'),'control':read(PERF/'canvas-context-control-20261012/capture.schema.json')}
 hashes={'control':'9dcea10df91c2e53cad44b0723be40a2e7a9bcd7d20bbc666a6236b8d336e9d1','default':'5282fb0224e1e3dbf13fafc0bd386c053e3f2c25fa1e4bb4e22dd43dac81b179'}
 summary={};validation={};table=[]
 for name,path in [('control',CONTROL),('default',DEFAULT)]:
  d=read(path);assert sha(path)==hashes[name]
  errors={k:validate(d,s) for k,s in schemas.items() if k=='original' or name=='control'};assert not any(errors.values()),errors
  expected=['domain-painted','screen-texture-upload-submitted','boot-animation-complete']+[f'glyph-painted-{i}' for i in range(11) if i!=4]
  missing={r:[k for k in expected if not any(e['run']==r and e['kind']==k for e in d['events'])] for r in [1,2]};assert not any(missing.values())
  validation[name]={'file':str(path),'bytes':path.stat().st_size,'sha256':sha(path),'schemaErrors':errors,'completion':d['completion'],'missingMarkers':missing,'droppedCounts':d['counts'],
   'arrayLengths':{k:len(d[k]) for k in ['frames','events','longtasks','errors','resources']},'visibilityEvents':[e for e in d['events'] if e['kind']=='visibility'],
   'errors':d['errors'],'metadata':d['metadata'],'experiment':d.get('experiment'),'sessionId':d['sessionId'],'timeOrigin':d['timeOrigin'],'reference':d['reference'],'cameraFix':d['cameraFix']}
  summary[name],frames=analyze(name,d)
  with (OUT/(name+'-derived-frames.csv')).open('w',newline='',encoding='utf-8') as f:
   w=csv.DictWriter(f,fieldnames=list(frames[0]));w.writeheader();w.writerows(frames)
  for r in ['1','2']:
   for label,g in summary[name]['runs'][r].items():
    if 'engine' not in g:continue
    for metric in ['engine','raf']:table.append({'capture':name,'run':r,'window':label,'metric':metric,**g[metric]})
 write('validation.json',validation);write('metrics.json',summary)
 with (OUT/'cadence.csv').open('w',newline='',encoding='utf-8') as f:
  w=csv.DictWriter(f,fieldnames=list(table[0]));w.writeheader();w.writerows(table)
 print('Hashes, schemas, source-phase reconstruction, complete markers, and gap alignment passed.')
 print('Source differences:',[p for p,v in sources.items() if not v['identical']])
 print('Durations: ms. Percentiles: linear interpolation. Exact >=42 and >50 comparisons.')
 for name,s in summary.items():
  print('\n',name.upper())
  for r in ['1','2']:
   print('RUN',r)
   for label in PHASES+['text_0.35_to_3.5','powered_return','unpowered_return']:
    g=s['runs'][r][label]
    print(label,'engine',{k:round(v,2) for k,v in g['engine'].items()},'raf',{k:round(v,2) for k,v in g['raf'].items()})
  print('STARTUP',json.dumps(s['startup']))
  print('NETWORK',{k:v for k,v in s['network'].items() if k not in ['resources','afterFirstSTART','notFinishedByFirstSTART']})
if __name__=='__main__':main()

