import { bootCanvasMode, bootCanvasOptions } from './context-control';
import atlasMetrics from './boot-atlas-metrics.json';
type EventRecord = { kind: string; t: number; run: number; [key: string]: unknown };
type Frame = {
	t: number;
	raf: number;
	boot: number;
	mode: string;
	run: number;
	phase: string;
	gapMs: number | null;
	paintMs: number;
	gpuPrepareMs: number;
	submitMs: number;
	totalMs: number;
	recorderMs: number;
};
function createDiagnostic() {
	const events: EventRecord[] = [],
		frames: Frame[] = [],
		longtasks: { t: number; duration: number }[] = [],
		errors: { t: number; message: string }[] = [];
	const seen = new Set<string>();
	const dropped = { events: 0, frames: 0, longtasks: 0, errors: 0 };
	let run = 0,
		currentMode = 'loading',
		lastFrame: number | null = null,
		activation = false;
	const textureCounts = {
		canvas: { requests: 0, submissions: 0 },
		atlas: { requests: 0, submissions: 0 }
	};
	let glMetadata: Record<string, unknown> = {};
	let bootCanvasAttributes: CanvasRenderingContext2DSettings | null = null;
	let bootCanvasAttributesStatus: 'not-created' | 'supported' | 'unsupported' | 'failed' =
		'not-created';
	let panel: HTMLDetailsElement | undefined;
	const sessionId = new Date().toISOString().replace(/[:.]/g, '-');
	const push = <T>(a: T[], value: T, limit: number, key: keyof typeof dropped) => {
		if (a.length < limit) a.push(value);
		else dropped[key]++;
	};
	const mark = (kind: string, extra: Record<string, unknown> = {}) => {
		if (kind === 'screen-material-power' && extra.on === true && currentMode === 'booting')
			activation = true;
		push(events, { kind, t: performance.now(), run, ...extra }, 1000, 'events');
	};
	const once = (kind: string, extra: Record<string, unknown> = {}) => {
		if (run > 2) return;
		const key = run + ':' + kind;
		if (seen.has(key)) return;
		seen.add(key);
		mark(kind, extra);
	};
	const supported = {
		longtask:
			typeof PerformanceObserver !== 'undefined' &&
			PerformanceObserver.supportedEntryTypes.includes('longtask'),
		fonts: 'fonts' in document,
		resourceTiming: typeof performance.getEntriesByType === 'function'
	};
	if (supported.longtask)
		new PerformanceObserver((list) => {
			for (const e of list.getEntries())
				push(longtasks, { t: e.startTime, duration: e.duration }, 500, 'longtasks');
		}).observe({ type: 'longtask', buffered: true });
	const recordError = (message: string) =>
		push(errors, { t: performance.now(), message: message.slice(0, 400) }, 100, 'errors');
	addEventListener('error', (e) => recordError(e.message || 'Resource error'), true);
	addEventListener('unhandledrejection', (e) => recordError(String(e.reason)));
	document.addEventListener('visibilitychange', () =>
		mark('visibility', { state: document.visibilityState })
	);
	document.addEventListener(
		'click',
		(e) => {
			const n = e.target instanceof Element ? e.target.closest('button') : null;
			if (n?.hasAttribute('data-start')) mark('START-gesture', { trusted: e.isTrusted });
			else if (n?.textContent?.includes('BACK TO THE ROOM'))
				mark('BACK-gesture', { trusted: e.isTrusted });
		},
		true
	);
	document.addEventListener(
		'animationend',
		(e) => {
			if (e.target instanceof Element && e.target.matches('[data-start]'))
				mark('START-css-animation-complete');
		},
		true
	);
	const observer = new MutationObserver(() => {
		const start = document.querySelector('[data-start]');
		if (start) once('START-DOM');
	});
	observer.observe(document, { childList: true, subtree: true });
	mark('diagnostic-initialized');
	const limits = [
		'Engine submission and rAF timestamps do not establish displayed frames.',
		'Texture onUpdate records upload submission. It does not measure GPU completion or native texture initialization.',
		'Paint markers follow direct fillText calls. They do not establish glyph cache readiness or display presentation.',
		'GPU draw markers follow screen.onAfterRender for its atlas material. They establish renderer draw submission only, not GPU completion or physical display.',
		'GPU mode paintMs stays zero. gpuPrepareMs measures CPU uniform preparation only. submitMs retains whole-scene submission timing.',
		'Atlas fetch, decode, readiness and onUpdate timestamps use performance.now. No GPU timer queries or synchronous readbacks are used.',
		'The resolved glyph font and physical refresh rate are unmeasured.',
		'A webpage cannot collect a full GPU or native browser trace.',
		'A reload restarts the session but does not clear OS, font, browser, or driver caches.',
		'Detailed frames cover only the first two full boots and their return windows. Arrays are bounded.',
		'Navigation and resources use browser timing buffers. Entries can be missing. Resource paths exclude query strings.'
	];
	function snapshot(deviceName = '') {
		const canvasExpected = [
			'domain-painted',
			...Array.from({ length: 11 }, (_, i) => i)
				.filter((i) => i !== 4)
				.map((i) => 'glyph-painted-' + i),
			'screen-texture-upload-submitted',
			'boot-animation-complete'
		];
		const expected =
			bootCanvasMode === 'gpu-atlas'
				? [
						'domain-draw-submitted',
						...Array.from({ length: 11 }, (_, i) => i)
							.filter((i) => i !== 4)
							.map((i) => 'glyph-draw-submitted-' + i),
						'boot-animation-complete'
					]
				: canvasExpected;
		return {
			schemaVersion: 1,
			schemaRevision: 'gpu-boot-atlas-1',
			experiment: {
				mode: bootCanvasMode,
				sourceId: 'canvas-control-93+gpu-atlas-prototype-20261012-mip-grad',
				atlas:
					bootCanvasMode === 'gpu-atlas'
						? {
								path: '/boot-atlas.png',
								sha256: atlasMetrics.assetSha256,
								minFilter: 'LinearMipmapLinearFilter',
								generateMipmaps: true,
								width: atlasMetrics.width,
								height: atlasMetrics.height
							}
						: null,
				textureCounts,
				markerSemantics:
					bootCanvasMode === 'gpu-atlas'
						? 'Atlas upload required once per session. Glyph/domain draw submissions required per full boot. No canvas paint/upload markers required. Completion is animation completion, not GPU completion.'
						: 'Canvas paint/upload submissions required per full boot. Completion is animation completion, not GPU completion.',
				atlasUploadObserved:
					bootCanvasMode === 'gpu-atlas' ? textureCounts.atlas.submissions > 0 : null,
				requestedContextOptions: bootCanvasOptions ?? null,
				requestedContextOptionsOmitted: bootCanvasOptions === undefined,
				contextAttributes: bootCanvasAttributes,
				contextAttributesStatus: bootCanvasAttributesStatus
			},
			label: 'FIRST-BOOT DIAGNOSTIC',
			reference: 'a796e9aea60def6e0849cb75a151fd6570942339',
			cameraFix: '042dc805',
			sessionId,
			timeOrigin: performance.timeOrigin,
			capturedAt: new Date().toISOString(),
			deviceName: deviceName.trim().slice(0, 80),
			metadata: {
				browser: navigator.userAgent,
				platform: navigator.platform,
				viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
				reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
				visibility: document.visibilityState,
				fonts: {
					status: document.fonts?.status,
					word: 'italic 900 "Arial Black", "Helvetica Neue", Arial, sans-serif',
					domain: '900 "Arial Rounded MT Bold", "Helvetica Neue", Arial, sans-serif',
					atlasProvenance:
						bootCanvasMode === 'gpu-atlas'
							? 'Offline Windows Chrome, platform spans report Arial Black. Android reference fallback may differ.'
							: 'not-applicable',
					resolvedGlyphFont: 'unmeasured'
				},
				renderer: glMetadata
			},
			supported,
			limits,
			counts: { runs: run, ...dropped },
			completion: {
				first: events.some((e) => e.run === 1 && e.kind === 'boot-animation-complete'),
				return: events.some((e) => e.run === 1 && e.kind === 'return-animation-complete'),
				replay: events.some((e) => e.run === 2 && e.kind === 'boot-animation-complete')
			},
			sessionUnobserved:
				bootCanvasMode === 'gpu-atlas'
					? [
							'atlas-fetch-start',
							'atlas-fetch-end',
							'atlas-decode-start',
							'atlas-decode-end',
							'atlas-ready',
							'atlas-upload-requested',
							'atlas-upload-submitted'
						].filter((k) => !events.some((e) => e.kind === k))
					: [],
			unobserved: [1, 2].map((id) => ({
				run: id,
				markers: expected.filter((k) => !events.some((e) => e.run === id && e.kind === k))
			})),
			events,
			frames,
			longtasks,
			errors,
			navigation: performance.getEntriesByType('navigation').map((e) => ({
				type: (e as PerformanceNavigationTiming).type,
				startTime: e.startTime,
				duration: e.duration,
				domContentLoaded: (e as PerformanceNavigationTiming).domContentLoadedEventEnd,
				load: (e as PerformanceNavigationTiming).loadEventEnd,
				responseEnd: (e as PerformanceNavigationTiming).responseEnd
			})),
			resources: performance
				.getEntriesByType('resource')
				.slice(0, 200)
				.map((e) => {
					const r = e as PerformanceResourceTiming;
					return {
						path: new URL(r.name).pathname,
						startTime: r.startTime,
						duration: r.duration,
						transferSize: r.transferSize,
						encodedBodySize: r.encodedBodySize,
						initiatorType: r.initiatorType
					};
				})
		};
	}
	function download() {
		mark('download-requested');
		const data = snapshot(
			document.querySelector<HTMLInputElement>('#diagnostic-device')?.value || ''
		);
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob),
			a = document.createElement('a');
		a.href = url;
		a.download = 'first-boot-diagnostic-' + bootCanvasMode + '-' + sessionId + '.json';
		a.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}
	function mount() {
		panel = document.createElement('details');
		panel.id = 'firstboot-diagnostic';
		panel.open = true;
		panel.innerHTML =
			'<summary>FIRST-BOOT DIAGNOSTIC: ' +
			bootCanvasMode +
			'</summary><div><ol><li>Wait for START. Press START. Wait for the site.</li><li>Press BACK TO THE ROOM. Wait for START.</li><li>Press START again. Wait for the site.</li><li>Download the diagnostic file.</li></ol><p>Keep this tab open between boots. Data stays in this browser. No automatic upload.</p><label>Device name (optional) <input id="diagnostic-device" maxlength="80"></label><p><button id="diagnostic-download" type="button">Download JSON</button> <button id="diagnostic-restart" type="button">Restart by reload</button></p><p id="diagnostic-status">Waiting for first START.</p><p>Submission timestamps do not prove displayed frames. This preview measures behavior. It does not improve stutter.</p><p>Optional Chrome trace: Open DevTools → Performance. Record the same sequence. Stop and save the trace. Android does not need remote debugging for this JSON file.</p></div>';
		const style = document.createElement('style');
		style.textContent =
			'#firstboot-diagnostic{position:fixed;left:8px;top:8px;z-index:2147483646;max-width:min(320px,calc(100vw - 16px));max-height:38vh;overflow:auto;padding:8px;background:#fff;color:#111;border:1px solid #777;border-radius:6px;font:12px/1.4 Arial,sans-serif;box-sizing:border-box}#firstboot-diagnostic summary{cursor:pointer;font-weight:bold}#firstboot-diagnostic ol{padding-left:20px}#firstboot-diagnostic button,#firstboot-diagnostic input{font:inherit;color:#111;background:#fff;border:1px solid #777;border-radius:3px;padding:5px}#firstboot-diagnostic p{margin:8px 0}#firstboot-diagnostic[data-moving],#firstboot-diagnostic[data-focused]{display:none}';
		document.head.append(style);
		document.body.append(panel);
		panel.querySelector('#diagnostic-download')!.addEventListener('click', download);
		panel.querySelector('#diagnostic-restart')!.addEventListener('click', () => {
			if (
				confirm('Restart this diagnostic session by reload? Existing measurements will be lost.')
			) {
				sessionStorage.setItem('room-place', 'room');
				location.reload();
			}
		});
	}
	if (document.readyState === 'loading')
		document.addEventListener('DOMContentLoaded', mount, { once: true });
	else mount();
	return {
		mark,
		once,
		snapshot,
		download,
		textureRequest(kind: 'canvas' | 'atlas') {
			textureCounts[kind].requests++;
			if (kind === 'atlas') once('atlas-upload-requested');
		},
		textureSubmission(kind: 'canvas' | 'atlas') {
			textureCounts[kind].submissions++;
			if (kind === 'atlas') once('atlas-upload-submitted');
		},
		bootCanvas(ctx: CanvasRenderingContext2D) {
			if (typeof ctx.getContextAttributes === 'function') {
				try {
					bootCanvasAttributes = ctx.getContextAttributes();
					bootCanvasAttributesStatus = 'supported';
				} catch {
					bootCanvasAttributesStatus = 'failed';
				}
			} else bootCanvasAttributesStatus = 'unsupported';
			mark('boot-canvas-context-created', { mode: bootCanvasMode });
		},
		focus(value: boolean) {
			panel?.toggleAttribute('data-focused', value);
		},
		mode(next: string) {
			if (next === 'booting' && currentMode === 'room') {
				run++;
				activation = false;
			}
			mark('mode', { from: currentMode, to: next });
			currentMode = next;
			if (next === 'site' || next === 'room') lastFrame = null;
			if (panel) {
				panel.toggleAttribute('data-moving', next === 'booting' || next === 'returning');
				if (next === 'booting') panel.open = false;
				panel.querySelector('#diagnostic-status')!.textContent =
					next === 'site'
						? run === 2
							? 'Replay complete. Download JSON.'
							: 'First boot complete. Use BACK TO THE ROOM.'
						: next === 'room'
							? run === 1
								? 'Return complete. Press START again.'
								: 'Wait for START.'
							: next;
			}
		},
		renderer(gl: WebGLRenderingContext | WebGL2RenderingContext) {
			const ext = gl.getExtension('WEBGL_debug_renderer_info');
			glMetadata = {
				vendor: gl.getParameter(gl.VENDOR),
				renderer: gl.getParameter(gl.RENDERER),
				version: gl.getParameter(gl.VERSION),
				unmaskedRenderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unsupported',
				drawingBuffer: { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight }
			};
		},
		frameStart(raf: number, boot: number, mode: string): Frame | undefined {
			if (run < 1 || run > 2 || (mode !== 'booting' && mode !== 'returning')) return;
			const a = performance.now();
			const phase =
				mode === 'returning'
					? 'return'
					: !activation
						? 'camera-before-power'
						: boot < 0.35
							? 'activation'
							: boot < 1.1
								? 'arrival'
								: boot < 1.9
									? 'drop'
									: boot < 3.5
										? 'colour-glint'
										: 'fade';
			const f = {
				t: a,
				raf,
				boot,
				mode,
				run,
				phase,
				gapMs: lastFrame === null ? null : a - lastFrame,
				paintMs: 0,
				gpuPrepareMs: 0,
				submitMs: 0,
				totalMs: 0,
				recorderMs: 0
			};
			lastFrame = a;
			push(frames, f, 3000, 'frames');
			f.recorderMs = performance.now() - a;
			return f;
		},
		frameEnd(f: Frame | undefined) {
			if (f) f.totalMs = performance.now() - f.t;
		}
	};
}
export const diagnostic =
	typeof window !== 'undefined' && new URLSearchParams(location.search).get('diagnostic') !== 'off'
		? createDiagnostic()
		: undefined;
if (typeof window !== 'undefined') Object.assign(window, { __firstbootDiagnostic: diagnostic });
