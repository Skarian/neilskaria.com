"""Offline, stdlib-only capture comparison. Writes only beside this script."""
import json, math, hashlib, re
from pathlib import Path
R=Path(__file__).resolve().parent
PERF=R.parent
CONTROL=PERF/'canvas-context-control-20261012'
OLD=PERF/'affected-capture-analysis-20261012/capture.json'
ATT=Path('C:/Users/Neil Skaria/.t3/userdata/attachments/fab6e615-3ee1-4b06-99e4-bbf3bda6d6af-33bef0bb-21fa-48d2-bcf7-97c586a35a17-json.json')
EXPECTED='9dcea10df91c2e53cad44b0723be40a2e7a9bcd7d20bbc666a6236b8d336e9d1'
OLDHASH='5282fb0224e1e3dbf13fafc0bd386c053e3f2c25fa1e4bb4e22dd43dac81b179'
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def load(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def save(name,data): (R/name).write_text(json.dumps(data,indent=2,allow_nan=False)+'\n',encoding='utf-8')
assert digest(R/'capture.json')==digest(ATT)==EXPECTED
assert digest(OLD)==OLDHASH
# Implements every keyword present in the supplied schemas, and rejects unknown keywords.
KEYS={'$schema','title','type','required','properties','const','enum','maxLength','maxItems','items','oneOf','allOf','if','then','else','additionalProperties'}
def validate(v,s,p='$'):
    assert not set(s)-KEYS, (p,set(s)-KEYS)
    errors=[]
    types={'object':isinstance(v,dict),'array':isinstance(v,list),'string':isinstance(v,str),
           'number':type(v) in (int,float) and math.isfinite(v),'integer':type(v)==int,
           'boolean':type(v)==bool,'null':v is None}
    ts=s.get('type',[]); ts=[ts] if isinstance(ts,str) else ts
    if ts and not any(types[x] for x in ts): errors.append(p+':type')
    if 'const' in s and (type(v)!=type(s['const']) or v!=s['const']): errors.append(p+':const')
    if 'enum' in s and not any(type(v)==type(x) and v==x for x in s['enum']): errors.append(p+':enum')
    if 'oneOf' in s and sum(not validate(v,x,p) for x in s['oneOf'])!=1: errors.append(p+':oneOf')
    for x in s.get('allOf',[]): errors+=validate(v,x,p)
    if 'if' in s: errors+=validate(v,s.get('then' if not validate(v,s['if'],p) else 'else',{}),p)
    if isinstance(v,dict):
        errors += [p+':missing '+k for k in s.get('required',[]) if k not in v]
        for k,x in s.get('properties',{}).items():
            if k in v: errors+=validate(v[k],x,p+'.'+k)
        if s.get('additionalProperties') is False:
            errors += [p+':extra '+k for k in v if k not in s.get('properties',{})]
    if isinstance(v,list):
        if len(v)>s.get('maxItems',math.inf): errors.append(p+':maxItems')
        for i,x in enumerate(v): errors+=validate(x,s.get('items',{}),p+f'[{i}]')
    if isinstance(v,str) and len(v)>s.get('maxLength',math.inf): errors.append(p+':maxLength')
    return errors
def stats(a):
    a=sorted(x for x in a if x is not None)
    def q(p):
        if not a: return None
        i=(len(a)-1)*p; l=math.floor(i); h=math.ceil(i)
        return round(a[l]+(a[h]-a[l])*(i-l),6)
    return {'n':len(a),'mean':round(sum(a)/len(a),6) if a else None,
            'p50':q(.5),'p95':q(.95),'max':round(a[-1],6) if a else None,
            'ge42':sum(x>=42 for x in a),'gt50':sum(x>50 for x in a),
            'ge42Rate':round(sum(x>=42 for x in a)/len(a),6) if a else None,
            'gt50Rate':round(sum(x>50 for x in a)/len(a),6) if a else None}
PHASES=['camera-before-power','activation','arrival','drop','colour-glint','fade']
METRICS=['gapMs','rafDeltaMs','paintMs','submitMs','totalMs','recorderMs','rafToEngineMs',
         'previousPaintMs','previousSubmitMs','previousTotalMs','outsidePreviousCallbackMs']
def group(fs): return {k:stats([f[k] for f in fs]) for k in METRICS}
def event(d,k,r=None):
    return next(e for e in d['events'] if e['kind']==k and (r is None or e['run']==r))
def analysis(d,schema):
    failures=validate(d,schema); timing=[]; warnings=[]
    fs=[]; seenmode={}
    for i,x in enumerate(d['frames']):
        f=dict(x,index=i); p=fs[-1] if fs and fs[-1]['run']==f['run'] and fs[-1]['mode']==f['mode'] else None
        f['rafDeltaMs']=f['raf']-p['raf'] if p else None
        f['rafToEngineMs']=f['t']-f['raf']
        for k in ['paintMs','submitMs','totalMs']: f['previous'+k[0].upper()+k[1:]]=p[k] if p else None
        f['outsidePreviousCallbackMs']=f['gapMs']-p['totalMs'] if p else None
        if p and abs(f['gapMs']-(f['t']-p['t']))>1e-5: timing.append(f'{i}:gap mismatch')
        if not p and f['gapMs'] is not None: timing.append(f'{i}:unexpected first gap')
        if p and (f['t']<=p['t'] or f['raf']<=p['raf'] or f['boot']<p['boot']): timing.append(f'{i}:nonmonotonic')
        if f['t']<f['raf'] or min(f[k] for k in ['paintMs','submitMs','totalMs','recorderMs'])<0: timing.append(f'{i}:negative timing')
        if f['paintMs']+f['submitMs']>f['totalMs']+1e-5: timing.append(f'{i}:nested duration mismatch')
        if f['recorderMs']>f['totalMs']+1e-5: timing.append(f'{i}:recorder exceeds total')
        power=next(e['t'] for e in d['events'] if e['kind']=='screen-material-power' and e['run']==f['run'] and e.get('mode')=='booting' and e.get('on'))
        phase='return' if f['mode']=='returning' else 'camera-before-power' if f['t']<power else 'activation' if f['boot']<.35 else 'arrival' if f['boot']<1.1 else 'drop' if f['boot']<1.9 else 'colour-glint' if f['boot']<3.5 else 'fade'
        if phase!=f['phase']: timing.append(f'{i}:phase mismatch')
        if not 0<=f['boot']<=4: timing.append(f'{i}:boot out of range')
        fs.append(f)
    if any(a['t']>b['t'] for a,b in zip(d['events'],d['events'][1:])): timing.append('event order')
    required=['domain-painted','screen-texture-upload-submitted','boot-animation-complete']+['glyph-painted-'+str(i) for i in range(11) if i!=4]
    semantics={}
    windows=[]
    align=[]
    for run in [1,2]:
        semantics[f'run{run}RequiredMarkersOnce']=all(sum(e['run']==run and e['kind']==k for e in d['events'])==1 for k in required)
        for mode,finish in [('booting','boot-animation-complete'),('returning','return-animation-complete')]:
            start=next(e['t'] for e in d['events'] if e['run']==run and e['kind']=='mode' and e.get('to')==mode)
            end=event(d,finish,run)['t']; selected=[f for f in fs if f['run']==run and f['mode']==mode]
            semantics[f'run{run}{mode}FramesWithinWindow']=all(start<=f['t']<=end for f in selected)
            windows.append({'run':run,'mode':mode,'start':start,'end':end,'durationMs':end-start,'longtasks':[t for t in d['longtasks'] if t['t']<end and t['t']+t['duration']>start]})
        for e in d['events']:
            if e['run']==run and (e['kind'].startswith('glyph-painted') or e['kind'] in ['domain-painted','screen-texture-upload-submitted']):
                f=next((f for f in fs if f['run']==run and f['t']<=e['t']<=f['t']+f['totalMs']+1e-5),None)
                semantics[f'run{run}{e["kind"]}CallbackAligned']=f is not None
                align.append({'event':e,'callback':f,'followingCallback':fs[f['index']+1] if f and f['index']+1<len(fs) else None})
    semantics['twoTrustedStarts']=sum(e['kind']=='START-gesture' and e.get('trusted') is True for e in d['events'])==2
    semantics['twoTrustedBacks']=sum(e['kind']=='BACK-gesture' and e.get('trusted') is True for e in d['events'])==2
    semantics['completion']=all(d['completion'].values())
    semantics['unobservedEmpty']=d['unobserved']==[{'run':1,'markers':[]},{'run':2,'markers':[]}]
    semantics['noDrops']=d['counts']=={'runs':2,'events':0,'frames':0,'longtasks':0,'errors':0}
    semantics['visibleNoChanges']=d['metadata']['visibility']=='visible' and not any(e['kind']=='visibility' for e in d['events'])
    semantics['noErrors']=not d['errors']
    semantics['fontsLoaded']=d['metadata']['fonts']['status']=='loaded' and event(d,'fonts-ready')['status']=='loaded'
    semantics['fullMotion']=d['metadata']['reducedMotion'] is False
    semantics['screen960x640']=all(event(d,'screen-texture-created')[k]==v for k,v in [('width',960),('height',640)])
    semantics['noCandidateMarkers']=not any('prepared' in e['kind'] and e['kind']!='assets-prepared' for e in d['events'])
    resources=d['resources']
    negative=[x for x in resources if x['duration']<0]
    if negative: warnings.append('Negative worker resource duration retained and excluded from elapsed resource calculations.')
    if event(d,'screen-texture-created').get('context')=='default Canvas2D' and 'experiment' in d: warnings.append('Legacy texture context label is stale. Explicit experiment and context attributes identify mode.')
    for x in resources:
        if x['startTime']<0 or min(x['transferSize'],x['encodedBodySize'])<0: timing.append('invalid resource value')
    for x in d['longtasks']:
        if x['t']<0 or x['duration']<0: timing.append('invalid longtask')
    boots={}
    worst={}
    for run in [1,2]:
        a=[f for f in fs if f['run']==run and f['mode']=='booting']
        ret=[f for f in fs if f['run']==run and f['mode']=='returning']
        off=next(e['t'] for e in d['events'] if e['run']==run and e['kind']=='screen-material-power' and e.get('on') is False)
        boots[str(run)]={'all':group(a),'phases':{p:group([f for f in a if f['phase']==p]) for p in PHASES},
                        'text':group([f for f in a if .35<=f['boot']<3.5]),
                        'fadeBefore4':group([f for f in a if 3.5<=f['boot']<4]),
                        'cameraTailAt4':group([f for f in a if f['boot']==4]),
                        'return':group(ret),'poweredReturn':group([f for f in ret if f['t']<off]),
                        'firstCallback':a[0],'firstPoweredCallback':next(f for f in a if f['phase']!='camera-before-power')}
        worst[str(run)]={}
        for p in PHASES+['all','text','poweredReturn']:
            selected=a if p=='all' else [f for f in a if .35<=f['boot']<3.5] if p=='text' else [f for f in ret if f['t']<off] if p=='poweredReturn' else [f for f in a if f['phase']==p]
            f=max((f for f in selected if f['gapMs'] is not None),key=lambda f:f['gapMs']); prev=fs[f['index']-1]
            worst[str(run)][p]={'incoming':f,'previous':prev,'eventsInGap':[e for e in d['events'] if prev['t']<=e['t']<=f['t']],
                               'longtasksInGap':[t for t in d['longtasks'] if t['t']<f['t'] and t['t']+t['duration']>prev['t']]}
        # Previous-callback distributions specifically for slow incoming gaps.
        boots[str(run)]['incomingGe42']=group([f for f in a if f['gapMs'] is not None and f['gapMs']>=42])
        boots[str(run)]['incomingGt50']=group([f for f in a if f['gapMs'] is not None and f['gapMs']>50])
    startupKinds=['diagnostic-initialized','create-room','boot-canvas-context-created','screen-texture-created','model-parsed','assets-prepared','compile-wait-start','compile-wait-end','font-wait-start','fonts-ready','room-ready','START-DOM','START-animation-start','START-animation-complete','START-gesture']
    startup={k:event(d,k)['t'] for k in startupKinds if any(e['kind']==k for e in d['events'])}
    nav=d['navigation'][0]
    points=[('navigation',0),('responseEnd',nav['responseEnd']),('DOMContentLoaded',nav['domContentLoaded']),
            ('diagnostic-initialized',startup['diagnostic-initialized']),('create-room',startup['create-room']),
            ('screen-texture-created',startup['screen-texture-created']),('model-parsed',startup['model-parsed']),
            ('assets-prepared',startup['assets-prepared']),('compile-wait-start',startup['compile-wait-start']),
            ('compile-wait-end',startup['compile-wait-end']),('font-wait-start',startup['font-wait-start']),
            ('fonts-ready',startup['fonts-ready']),('room-ready',startup['room-ready']),('START-DOM',startup['START-DOM']),
            ('START-animation-start',startup['START-animation-start']),('START-animation-complete',startup['START-animation-complete'])]
    segments=[]
    for (a,t),(b,u) in zip(points,points[1:]):
        segments.append({'from':a,'to':b,'durationMs':u-t,'overlappingLongtasks':[x for x in d['longtasks'] if x['t']<u and x['t']+x['duration']>t]})
    startupTasks={name:[x for x in d['longtasks'] if x['t']<cut] for name,cut in [('preModel',startup['model-parsed']),('preStartDOM',startup['START-DOM']),('preStartGesture',startup['START-gesture'])]}
    gesture=[]
    starts=[e for e in d['events'] if e['kind']=='START-gesture']
    for run,e in zip([1,2],starts):
        boot=next(w for w in windows if w['run']==run and w['mode']=='booting')
        power=next(x for x in d['events'] if x['run']==run and x['kind']=='screen-material-power' and x.get('mode')=='booting' and x.get('on'))
        gesture.append({'run':run,'gestureToModeMs':boot['start']-e['t'],'modeToFirstCallbackMs':boots[str(run)]['firstCallback']['t']-boot['start'],'modeToPowerMs':power['t']-boot['start']})
    cache={'entryCount':len(resources),'transferBytes':sum(x['transferSize'] for x in resources),
           'positiveTransferCount':sum(x['transferSize']>0 for x in resources),
           'zeroTransferPositiveBody':[x for x in resources if x['transferSize']==0 and x['encodedBodySize']>0],
           'zeroTransferZeroBody':[x for x in resources if x['transferSize']==0 and x['encodedBodySize']==0],
           'negativeDurations':negative,'model':[x for x in resources if '.glb' in x['path']],
           'fonts':[x for x in resources if '.woff' in x['path']],
           'latestValidResourceEnd':max(x['startTime']+x['duration'] for x in resources if x['duration']>=0),
           'resourcesAfterFirstStart':[x for x in resources if x['startTime']>=startup['START-gesture']]}
    return {'validation':{'schemaFailures':failures,'frameEventTimingFailures':timing,'semanticChecks':semantics,'warnings':warnings,
            'arrayLengths':{k:len(d[k]) for k in ['events','frames','longtasks','errors','resources']},'counts':d['counts'],
            'metadata':d['metadata'],'supported':d['supported'],'experiment':d.get('experiment')},
            'boots':boots,'worst':worst,'markerAlignment':align,'windows':windows,'startup':{'markersMs':startup,'navigation':nav,'segments':segments,'tasks':startupTasks,'allLongtasks':d['longtasks'],'gesture':gesture},'resourceEvidence':cache}
d=load(R/'capture.json'); old=load(OLD)
s={'control':analysis(d,load(CONTROL/'capture.schema.json')),'oldDefault':analysis(old,load(PERF/'affected-browser-firstboot/capture.schema.json'))}
manifest=load(CONTROL/'source-manifest.json')
manifestFailures=[x['path'] for x in manifest['files'] if digest(CONTROL/'source-stage'/x['path'])!=x['sha256']]
s['provenance']={'controlAttachment':str(ATT),'controlSha256':EXPECTED,'controlBytes':len((R/'capture.json').read_bytes()),'oldDefaultSha256':OLDHASH,
                 'oldDefaultPath':str(OLD),'controlSchemaSha256':digest(CONTROL/'capture.schema.json'),'sourceManifestFailures':manifestFailures,
                 'sourceHashes':{x:digest(CONTROL/'source-stage/src/lib/boot'/x) for x in ['engine.ts','diagnostic.ts','context-control.ts']},
                 'controlCompatibilityWithOriginalSchema':validate(d,load(PERF/'affected-browser-firstboot/capture.schema.json')),
                 'reference':d['reference'],'cameraFix':d['cameraFix'],'sessionIds':{'control':d['sessionId'],'oldDefault':old['sessionId']}}
s['method']={'quantiles':'Linear interpolation at (n-1)*p. Thresholds >=42 and >50 ms are descriptive.',
             'incomingAssignment':'Current recorded source phase. Previous frame remains across phases, but not runs or modes.',
             'textWindow':'booting, 0.35 <= boot < 3.5 in both files.',
             'previousCallback':'paint/submit/total from the preceding callback, paired to current incoming gap.',
             'durationAccounting':'Total contains paint and submit. Do not sum nested durations.',
             'raf':'Intervals between recorded renderer rAF timestamps. Not all browser callbacks or displayed frames.',
             'return':'Powered return samples precede power(false). Solid-fill paint is not separately timed.',
             'crossSession':'Different deployment/time, cache state, order/thermal state, and extra once-only context-attribute marker limit causality.'}
def delta(a,b):
    return {k:round(a[k]-b[k],6) if a[k] is not None and b[k] is not None else None for k in a}
s['controlFirstMinusReplay']={}
s['controlMinusOldDefault']={}
for p in PHASES+['text','poweredReturn','all']:
    def get(c,r): return s[c]['boots'][r]['phases'][p] if p in PHASES else s[c]['boots'][r][p]
    s['controlFirstMinusReplay'][p]={m:delta(get('control','1')[m],get('control','2')[m]) for m in METRICS}
    s['controlMinusOldDefault'][p]={r:{m:delta(get('control',r)[m],get('oldDefault',r)[m]) for m in METRICS} for r in ['1','2']}
s['conclusion']={'visualReport':'User reports clearly smoother. This is subjective display evidence, separate from captured timing.',
                 'reliability':'One control session and one older default session do not establish reliability.',
                 'nativeAttribution':'No CPU/GPU backing or exclusive raster/GPU/compositor attribution. Native trace required.',
                 'nextStep':'One same-preview counterbalanced default/control capture experiment on the affected device. Use default/control then control/default, with similar temperature. Preserve full first/return/replay and startup evidence in each fresh page.',
                 'status':'Diagnostic evidence only. No accepted fix. Main HEAD d82230a remains rejected.'}
save('summary.json',s)
assert not manifestFailures
for name in ['control','oldDefault']:
    v=s[name]['validation']
    assert not v['schemaFailures'] and not v['frameEventTimingFailures'],v
    assert all(v['semanticChecks'].values()),v
assert not s['provenance']['controlCompatibilityWithOriginalSchema']
print('VALIDATION: schemas, frame/event timing, semantic checks and 93 source manifest hashes pass. Resource warnings retained.')
for name in ['control','oldDefault']:
    print(name)
    for p in PHASES+['text','poweredReturn']:
        def g(r): return s[name]['boots'][r]['phases'][p] if p in PHASES else s[name]['boots'][r][p]
        print(p,'gap',[(r,g(r)['gapMs']) for r in ['1','2']],'raf',[(r,g(r)['rafDeltaMs']) for r in ['1','2']])
    print('STARTUP',s[name]['startup'])
    print('TEXT COST',[{m:s[name]['boots'][r]['text'][m] for m in ['paintMs','submitMs','totalMs']} for r in ['1','2']])
    print('WORST',[(r,s[name]['worst'][r]['all']) for r in ['1','2']])

