"""Offline capture analysis. Standard library only. Output remains beside this file."""
import json,math,hashlib
from pathlib import Path
R=Path(__file__).resolve().parent
raw=(R/'capture.json').read_bytes()
d=json.loads(raw)
schema=json.loads((R.parent/'affected-browser-firstboot/capture.schema.json').read_text())
fail=[]
def validate(v,s,p='$'):
 t=s.get('type',[]); t=[t] if isinstance(t,str) else t
 ok={'object':isinstance(v,dict),'array':isinstance(v,list),'string':isinstance(v,str),'number':type(v) in [int,float],'integer':type(v)==int,'boolean':type(v)==bool,'null':v is None}
 if t and not any(ok[x] for x in t): fail.append(p+':type')
 if 'const' in s and v!=s['const']: fail.append(p+':const')
 if 'enum' in s and v not in s['enum']: fail.append(p+':enum')
 if isinstance(v,dict):
  for k in s.get('required',[]):
   if k not in v: fail.append(p+':missing '+k)
  for k,x in s.get('properties',{}).items():
   if k in v: validate(v[k],x,p+'.'+k)
 if isinstance(v,list):
  if len(v)>s.get('maxItems',math.inf): fail.append(p+':maxItems')
  for i,x in enumerate(v): validate(x,s.get('items',{}),p+f'[{i}]')
 if isinstance(v,str) and len(v)>s.get('maxLength',math.inf): fail.append(p+':maxLength')
validate(d,schema)
def stats(a):
 a=sorted(x for x in a if x is not None)
 def q(p):
  if not a:return None
  i=(len(a)-1)*p;l=math.floor(i);h=math.ceil(i)
  return round(a[l]+(a[h]-a[l])*(i-l),6)
 return dict(n=len(a),mean=round(sum(a)/len(a),6) if a else None,atLeast42=sum(x>=42 for x in a),p50=q(.5),p95=q(.95),max=round(max(a),6) if a else None,above25=sum(x>25 for x in a),above34=sum(x>34 for x in a),above50=sum(x>50 for x in a))
F=[]
for i,x in enumerate(d['frames']):
 f=dict(x,index=i);p=d['frames'][i-1] if i and d['frames'][i-1]['run']==f['run'] and d['frames'][i-1]['mode']==f['mode'] else None
 f['rafDeltaMs']=f['raf']-p['raf'] if p else None
 f['rafToEngineMs']=f['t']-f['raf']
 f['outsidePreviousCallbackMs']=f['gapMs']-p['totalMs'] if p and f['gapMs'] is not None else None
 if p and abs(f['gapMs']-(f['t']-p['t']))>1e-5:fail.append(f'frame {i}:gap mismatch')
 if p and (f['t']<p['t'] or f['raf']<p['raf']):fail.append(f'frame {i}:nonmonotonic')
 if min(f[k] for k in ['paintMs','submitMs','totalMs','recorderMs'])<0:fail.append(f'frame {i}:negative duration')
 if f['paintMs']+f['submitMs']>f['totalMs']+1e-5:fail.append(f'frame {i}:stages exceed total')
 power=next(e['t'] for e in d['events'] if e['run']==f['run'] and e['kind']=='screen-material-power' and e.get('mode')=='booting' and e.get('on'))
 phase='return' if f['mode']=='returning' else 'camera-before-power' if f['t']<power else 'activation' if f['boot']<.35 else 'arrival' if f['boot']<1.1 else 'drop' if f['boot']<1.9 else 'colour-glint' if f['boot']<3.5 else 'fade'
 if f['phase']!=phase:fail.append(f'frame {i}:phase mismatch')
 F.append(f)
M=['gapMs','rafDeltaMs','paintMs','submitMs','totalMs','rafToEngineMs','outsidePreviousCallbackMs','recorderMs']
P=['camera-before-power','activation','arrival','drop','colour-glint','fade']
def group(fs):return {k:stats([f[k] for f in fs]) for k in M}
B={str(r):{'all':group([f for f in F if f['run']==r and f['mode']=='booting']),'phases':{p:group([f for f in F if f['run']==r and f['mode']=='booting' and f['phase']==p]) for p in P},'text':group([f for f in F if f['run']==r and f['mode']=='booting' and .35<=f['boot']<3.5])} for r in [1,2]}
returns={str(r):group([f for f in F if f['run']==r and f['mode']=='returning']) for r in [1,2]}
def near(f):
 i=f['index'];p=F[i-1] if i and F[i-1]['run']==f['run'] and F[i-1]['mode']==f['mode'] else None
 lo=p['t'] if p else f['t'];hi=f['t']
 return {'frame':f,'predecessor':p,'frames':F[max(0,i-3):i+4],'eventsInGap':[e for e in d['events'] if lo<=e['t']<=hi],'eventsNearby':[e for e in d['events'] if lo-100<=e['t']<=hi+100],'longtasksOverlappingGap':[e for e in d['longtasks'] if e['t']<hi and e['t']+e['duration']>lo]}
worst={str(r):{p:near(max([f for f in F if f['run']==r and f['phase']==p and f['gapMs'] is not None],key=lambda f:f['gapMs'])) for p in P+['return']} for r in [1,2]}
bad=[near(f) for f in F if f['gapMs'] is not None and (f['gapMs']>25 or f['rafDeltaMs']>25)]
align=[]
for e in d['events']:
 if e['kind'].startswith('glyph-painted') or e['kind'] in ['domain-painted','screen-texture-upload-submitted','screen-material-power']:
  f=next((f for f in F if f['t']<=e['t']<=f['t']+f['totalMs']),None)
  nxt=F[f['index']+1] if f and f['index']+1<len(F) else None
  align.append({'event':e,'containingFrame':f,'followingFrame':nxt})
windows=[]
for r in [1,2]:
 for mode,finish in [('booting','boot-animation-complete'),('returning','return-animation-complete')]:
  start=next(e['t'] for e in d['events'] if e['run']==r and e['kind']=='mode' and e.get('to')==mode)
  end=next(e['t'] for e in d['events'] if e['run']==r and e['kind']==finish)
  fs=[f for f in F if f['run']==r and f['mode']==mode]
  windows.append(dict(run=r,mode=mode,start=start,end=end,durationMs=end-start,firstFrame=fs[0]['t'],lastFrame=fs[-1]['t'],longtasks=[x for x in d['longtasks'] if x['t']<end and x['t']+x['duration']>start]))
delta={p:{m:{k:round(B['1']['phases'][p][m][k]-B['2']['phases'][p][m][k],6) for k in ['mean','p50','p95','max','above25','above34','above50','atLeast42']} for m in M} for p in P}
s={'attachmentSha256':hashlib.sha256(raw).hexdigest(),'attachmentBytes':len(raw),'validation':{'schemaAndTimingFailures':fail,'droppedCounts':d['counts'],'completion':d['completion'],'unobserved':d['unobserved'],'arrayLengths':{k:len(d[k]) for k in ['events','frames','longtasks','errors','resources']},'errors':d['errors'],'visibilityEvents':[e for e in d['events'] if e['kind']=='visibility'],'contextEvents':[e for e in d['events'] if 'context' in e['kind']],'metadata':d['metadata'],'supported':d['supported']},'method':{'quantiles':'Linear interpolation at (n-1)*p. Strict thresholds >25, >34, >50 ms. Descriptive only.','gapAssignment':'Current source phase. Predecessor retained across phase boundaries, not modes.','durationAccounting':'totalMs contains paintMs and submitMs. Do not add nested durations or longtask durations.','outsidePreviousCallbackMs':'Engine gap minus predecessor total. Includes unmeasured app, browser work and waiting. Not idle time.','rafDeltaMs':'Differences of recorded render callback rAF timestamps. Not all browser rAF callbacks or display presents.'},'boots':B,'returns':returns,'firstMinusReplayByPhase':delta,'windows':windows,'events':d['events'],'longtasks':d['longtasks'],'worstPerPhase':worst,'firstPaintAndUploadAlignment':align}
s['poweredReturns']={str(r):group([f for f in F if f['run']==r and f['mode']=='returning' and f['t']<next(e['t'] for e in d['events'] if e['run']==r and e['kind']=='screen-material-power' and e.get('on') is False)]) for r in [1,2]}
(R/'summary.json').write_text(json.dumps(s,indent=2)+'\n')
(R/'worst-frame-neighborhoods.json').write_text(json.dumps({'allGapsAbove25EitherClock':bad,'worstPerPhase':worst},indent=2)+'\n')
print('Validation',json.dumps(s['validation']))
for r in B:
 print('BOOT',r,'ALL',json.dumps(B[r]['all']),'TEXT',json.dumps(B[r]['text']))
 for p in P:
  w=worst[r][p]; print(p,json.dumps(B[r]['phases'][p]),'WORST',json.dumps({'frame':w['frame'],'predecessor':w['predecessor'],'eventsInGap':w['eventsInGap']}))
print('RETURNS',json.dumps(returns))

