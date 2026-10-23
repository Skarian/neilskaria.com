from pathlib import Path
import json, hashlib, math, statistics
HERE=Path(__file__).resolve().parent
BASE=HERE.parent/'gpu-boot-atlas-preview-20261012'
ATT=Path('C:/Users/Neil Skaria/.t3/userdata/attachments')
INPUTS={'gpu-atlas':('25e54b0e-c022-4b29-ab24-05e635151c5f',432078,'c4f3302d9fcad2b76c29fbc28eb74eecc81c8961d965c83b6ac82cd83f6a085c'),'will-read-frequently':('f3059ffc-9fe5-4f7f-951e-b14f59126223',438791,'ad6ae6a7a72147f8607fb838b6e1a25b04f620e93ed3527443f86121a5e2f2af'),'default':('21d901d3-81dd-49ec-afd7-49eb5c4b4cb4',336233,'b7b2c2a049ee271e628a3645bd7818c3622175364867ff504e9db80b22f2cb4b')}
def stats(values):
 v=sorted(x for x in values if x is not None)
 if not v:return {'n':0}
 def q(p):
  a=(len(v)-1)*p;i=int(a);return v[i]+(v[min(i+1,len(v)-1)]-v[i])*(a-i)
 return dict(n=len(v),mean=statistics.mean(v),p50=q(.5),p95=q(.95),max=max(v),ge42=sum(x>=42 for x in v),gt50=sum(x>50 for x in v),ge42Rate=sum(x>=42 for x in v)/len(v),gt50Rate=sum(x>50 for x in v)/len(v))
def check(v,s,path='$'):
 errors=[]
 def err(x):errors.append(path+': '+x)
 typ=s.get('type');types=typ if isinstance(typ,list) else [typ] if typ else []
 tests={'object':isinstance(v,dict),'array':isinstance(v,list),'string':isinstance(v,str),'number':isinstance(v,(int,float)) and not isinstance(v,bool),'integer':isinstance(v,int) and not isinstance(v,bool),'boolean':isinstance(v,bool),'null':v is None}
 if types and not any(tests[t] for t in types):return [path+': type']
 if 'const' in s and v!=s['const']:err('const')
 if 'enum' in s and v not in s['enum']:err('enum')
 if isinstance(v,dict):
  for k in s.get('required',[]):
   if k not in v:err('missing '+k)
  for k,w in v.items():
   if k in s.get('properties',{}):errors+=check(w,s['properties'][k],path+'.'+k)
   elif s.get('additionalProperties') is False:err('extra '+k)
 if isinstance(v,list):
  if len(v)>s.get('maxItems',math.inf):err('maxItems')
  for i,w in enumerate(v):errors+=check(w,s.get('items',{}),path+f'[{i}]')
 if isinstance(v,str) and len(v)>s.get('maxLength',math.inf):err('maxLength')
 if isinstance(v,(int,float)) and v<s.get('minimum',-math.inf):err('minimum')
 for x in s.get('allOf',[]):errors+=check(v,x,path)
 if 'oneOf' in s and sum(not check(v,x,path) for x in s['oneOf'])!=1:err('oneOf')
 if 'if' in s and not check(v,s['if'],path):errors+=check(v,s.get('then',{}),path)
 return errors
schema=json.loads((BASE/'capture.schema.json').read_text(encoding='utf-8-sig'))
summary={'method':{'quantiles':'linear interpolation at (n-1)*p','gapOwnership':'Interval belongs to destination frame. Previous callback is source frame in same contiguous run/mode. Idle/site intervals excluded.','windows':{'camera-before-power':'booting before power marker','activation':'powered, boot<0.35','arrival':'0.35<=boot<1.1','drop':'1.1<=boot<1.9','colour-glint':'1.9<=boot<3.5','active-fade':'3.5<=boot<4','camera-tail':'boot=4, booting','text':'0.35<=boot<3.5, booting','full-boot':'all booting, includes camera-before-power and tail','powered-return':'returning before power-off timestamp','post-power-off-return':'returning at/after power-off timestamp'},'rates':'Descriptive >=42 and >50ms. No acceptance threshold.','remainder':'gap minus previous total. All time outside previous instrumented callback, not GPU time.','nested':'paint,prepare,submit,recorder are inside total; never add total to them.'},'qualitative':{'default':'Original canvas. Confirmed slower than the other 2 visually.','gpuVsControl':'About the same','gpuText':'Looks consistent','startupAccepted':False,'productionAccepted':False},'captures':{}}
for mode,(suffix,size,sha) in INPUTS.items():
 src=ATT/f'fab6e615-3ee1-4b06-99e4-bbf3bda6d6af-{suffix}-json.json';raw=src.read_bytes();actual=hashlib.sha256(raw).hexdigest()
 assert (len(raw),actual)==(size,sha)
 cp=HERE/(mode+'.json');cp.write_bytes(raw);assert cp.read_bytes()==raw
 d=json.loads(raw);es=d['events'];fs=d['frames'];issues=check(d,schema)
 def ev(k,r=0):return next((e['t'] for e in es if e['kind']==k and e['run']==r),None)
 assert d['experiment']['mode']==mode and d['experiment']['sourceId']=='canvas-control-93+gpu-atlas-failure-correction-20261012'
 assert all(d['completion'].values()) and not d['errors'] and not d['sessionUnobserved'] and not any(u['markers'] for u in d['unobserved'])
 assert d['counts']==dict(runs=2,events=0,frames=0,longtasks=0,errors=0)
 for i,f in enumerate(fs):
  p=fs[i-1] if i and (fs[i-1]['run'],fs[i-1]['mode'])==(f['run'],f['mode']) else None
  f['rafGapMs']=f['raf']-p['raf'] if p else None
  f['previous']={k:p[k] for k in ['t','boot','phase','paintMs','gpuPrepareMs','submitMs','totalMs','recorderMs']} if p else None
  f['outsidePreviousMs']=f['gapMs']-p['totalMs'] if p and f['gapMs'] is not None else None
  if p and abs(f['gapMs']-(f['t']-p['t']))>1e-5:issues.append('gap reconstruction')
  if p and (f['t']<=p['t'] or f['raf']<=p['raf']):issues.append('monotonicity')
  power=next(e['t'] for e in es if e['kind']=='screen-material-power' and e['run']==f['run'] and e.get('on') and e.get('mode')=='booting')
  phase='return' if f['mode']=='returning' else 'camera-before-power' if f['t']<power else 'activation' if f['boot']<.35 else 'arrival' if f['boot']<1.1 else 'drop' if f['boot']<1.9 else 'colour-glint' if f['boot']<3.5 else 'fade'
  if phase!=f['phase']:issues.append('phase reconstruction')
  if not 0<=f['boot']<=4:issues.append('boot bounds')
  if p and f['boot']<p['boot'] and f['mode']=='booting':issues.append('boot reversal')
 out={'provenance':{'original':str(src),'bytes':size,'sha256':actual,'copiedBytesIdentical':True},'validation':{'issues':issues,'metadata':d['metadata'],'experiment':d['experiment'],'completion':d['completion'],'counts':d['counts'],'frameCount':len(fs),'sessionUnobserved':d['sessionUnobserved'],'unobserved':d['unobserved'],'trustedStartCount':sum(e['kind']=='START-gesture' and e.get('trusted') is True for e in es),'trustedBackCount':sum(e['kind']=='BACK-gesture' and e.get('trusted') is True for e in es),'visibilityEvents':[e for e in es if e['kind']=='visibility'],'sessionId':d['sessionId'],'timeOrigin':d['timeOrigin'],'capturedAt':d['capturedAt']},'runs':{},'startup':{},'longtasks':d['longtasks'],'resources':d['resources']}
 for run in [1,2]:
  b=[f for f in fs if f['run']==run and f['mode']=='booting'];rt=[f for f in fs if f['run']==run and f['mode']=='returning'];off=next(e['t'] for e in es if e['kind']=='screen-material-power' and e['run']==run and e.get('on') is False and e.get('mode')=='returning')
  ws={p:[f for f in b if f['phase']==p] for p in ['camera-before-power','activation','arrival','drop','colour-glint']}
  ws.update({'active-fade':[f for f in b if 3.5<=f['boot']<4],'camera-tail':[f for f in b if f['boot']==4],'text':[f for f in b if .35<=f['boot']<3.5],'full-boot':b,'powered-return':[f for f in rt if f['t']<off],'post-power-off-return':[f for f in rt if f['t']>=off]})
  def metrics(ff):
   result={k:stats(f[k] for f in ff) for k in ['gapMs','rafGapMs','paintMs','gpuPrepareMs','submitMs','totalMs','recorderMs','outsidePreviousMs']}
   result['previousCallback']={k:stats(f['previous'][k] for f in ff if f['previous']) for k in ['paintMs','gpuPrepareMs','submitMs','totalMs','recorderMs']}
   result['frameCount']=len(ff);result['tBounds']=[ff[0]['t'],ff[-1]['t']] if ff else [];result['bootBounds']=[ff[0]['boot'],ff[-1]['boot']] if ff else []
   result['worst']=[]
   for f in sorted(ff,key=lambda x:x['gapMs'] or 0,reverse=True)[:3]:
    lo=f['previous']['t'] if f['previous'] else f['t'];hi=f['t']
    result['worst'].append({'frame':f,'events':[e for e in es if lo<=e['t']<=hi],'nearEventsWithin100ms':[e for e in es if lo-100<=e['t']<=hi+100],'overlappingLongtasks':[x for x in d['longtasks'] if x['t']<=hi and x['t']+x['duration']>=lo],'overlappingResources':[x for x in d['resources'] if x['startTime']<=hi and x['startTime']+max(0,x['duration'])>=lo]})
   return result
  out['runs'][str(run)]={'windows':{k:metrics(v) for k,v in ws.items()},'events':[e for e in es if e['run']==run]}
 st=out['startup'];nav=d['navigation'][0];st['navigation']=nav;st['events']=[e for e in es if e['run']==0]
 st['milestones']={k:ev(k) for k in ['diagnostic-initialized','create-room','model-parsed','assets-prepared','compile-wait-start','compile-wait-end','font-wait-start','fonts-ready','room-ready','START-DOM','START-animation-start','START-animation-complete','atlas-fetch-start','atlas-fetch-end','atlas-decode-start','atlas-decode-end','atlas-ready','atlas-upload-submitted']}
 m=st['milestones'];st['segments']={a+' to '+z:None if m[a] is None or m[z] is None else m[z]-m[a] for a,z in [('diagnostic-initialized','create-room'),('create-room','model-parsed'),('model-parsed','assets-prepared'),('assets-prepared','compile-wait-start'),('compile-wait-start','compile-wait-end'),('font-wait-start','fonts-ready'),('fonts-ready','room-ready'),('create-room','room-ready'),('room-ready','START-DOM'),('START-DOM','START-animation-start'),('START-animation-start','START-animation-complete'),('atlas-fetch-start','atlas-fetch-end'),('atlas-decode-start','atlas-decode-end'),('atlas-ready','atlas-upload-submitted')]}
 st['responseEndToRoomReady']=m['room-ready']-nav['responseEnd'];st['initialMode']=next(e['to'] for e in es if e['kind']=='mode')
 st['resourceIssues']=[r for r in d['resources'] if r['duration']<0]
 st['cacheEvidence']={'zeroTransferPositiveBody':[r['path'] for r in d['resources'] if r['transferSize']==0 and r['encodedBodySize']>0],'positiveTransferPositiveBodyCount':sum(r['transferSize']>0 and r['encodedBodySize']>0 for r in d['resources']),'zeroTransferZeroBody':[r['path'] for r in d['resources'] if r['transferSize']==0 and r['encodedBodySize']==0]}
 summary['captures'][mode]=out
(HERE/'summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
for mode,c in summary['captures'].items():
 print(mode,'text',[(r,{k:round(v,3) for k,v in c['runs'][str(r)]['windows']['text']['gapMs'].items()}) for r in [1,2]],'startup',c['startup']['segments'],'issues',c['validation']['issues'])

