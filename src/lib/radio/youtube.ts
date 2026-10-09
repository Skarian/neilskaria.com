// A hidden YouTube player for the radio's streams: offscreen and silent to the pointer, like
// lofi.cafe's. YouTube's player script is only fetched when it's first needed (to play, or to have a
// returning listener's station ready), through the privacy-enhanced embed.

type YTPlayer = {
	loadVideoById(id: string): void;
	cueVideoById(id: string): void;
	playVideo(): void;
	pauseVideo(): void;
	stopVideo(): void;
	setVolume(volume: number): void;
	getDuration(): number;
	mute(): void;
	unMute(): void;
	destroy(): void;
};

type YTNamespace = {
	Player: new (
		element: HTMLElement,
		options: {
			host?: string;
			width?: number;
			height?: number;
			playerVars?: Record<string, string | number>;
			events?: Record<string, (event: { data: number; target: YTPlayer }) => void>;
		}
	) => YTPlayer;
};

export type StreamStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'blocked' | 'error' | 'ad';

let api: Promise<YTNamespace> | undefined;

function loadApi() {
	api ??= new Promise((resolve) => {
		const w = window as unknown as {
			YT?: YTNamespace & { loaded?: number };
			onYouTubeIframeAPIReady?: () => void;
		};
		if (w.YT?.loaded) return resolve(w.YT);
		const previous = w.onYouTubeIframeAPIReady;
		w.onYouTubeIframeAPIReady = () => {
			previous?.();
			resolve(w.YT!);
		};
		const script = document.createElement('script');
		script.src = 'https://www.youtube.com/iframe_api';
		document.head.append(script);
	});
	return api;
}

export function createStreamPlayer(onStatus: (status: StreamStatus, id: string | null) => void) {
	let player: Promise<YTPlayer> | undefined;
	// The stream loaded, and whether it should be playing.
	let current: string | null = null;
	let wanted = false;
	let volume = 0.7;
	// An ad break: the stream's muted (and reported as an ad) until it's over.
	let inAd = false;
	let watching: ReturnType<typeof setInterval> | undefined;

	function applyVolume(p: YTPlayer) {
		const v = inAd ? 0 : volume;
		p.setVolume(Math.round(Math.min(1, Math.max(0, v)) * 100));
		if (v <= 0) p.mute();
		else p.unMute();
	}

	// A live stream's duration runs to hours; while an ad plays, the player reports the ad's instead
	// (seconds). That's the tell: mute until it's back.
	async function watchForAds() {
		clearInterval(watching);
		const p = await ensure();
		watching = setInterval(() => {
			if (!wanted) return clearInterval(watching);
			const duration = p.getDuration();
			const ad = duration > 0 && duration < 180;
			if (ad === inAd) return;
			inAd = ad;
			applyVolume(p);
			onStatus(ad ? 'ad' : 'playing', current);
		}, 1000);
	}

	function ensure() {
		player ??= loadApi().then(
			(YT) =>
				new Promise<YTPlayer>((resolve) => {
					// Offscreen, and never in the way.
					const host = document.createElement('div');
					Object.assign(host.style, {
						position: 'fixed',
						top: '100%',
						left: '100%',
						width: '320px',
						height: '180px',
						overflow: 'hidden',
						pointerEvents: 'none',
						userSelect: 'none'
					});
					host.setAttribute('aria-hidden', 'true');
					const target = document.createElement('div');
					host.append(target);
					document.body.append(host);
					new YT.Player(target, {
						host: 'https://www.youtube-nocookie.com',
						width: 320,
						height: 180,
						playerVars: {
							controls: 0,
							disablekb: 1,
							fs: 0,
							playsinline: 1,
							rel: 0,
							iv_load_policy: 3,
							origin: location.origin
						},
						events: {
							onReady: (event) => resolve(event.target),
							onStateChange: (event) => {
								// 1 playing, 3 buffering, 2 paused, 0 ended, 5 cued, -1 unstarted.
								if (event.data === 1) onStatus(inAd ? 'ad' : 'playing', current);
								else if (event.data === 3 || (event.data === -1 && wanted))
									onStatus('loading', current);
								else if (event.data === 2) onStatus(wanted ? 'loading' : 'paused', current);
								else if (event.data === 0) onStatus('error', current);
							},
							onError: () => onStatus('error', current),
							onAutoplayBlocked: () => onStatus('blocked', current)
						}
					});
				})
		);
		return player;
	}

	return {
		// Gets a stream ready (the player loaded, the stream cued) without playing it.
		async cue(id: string) {
			const p = await ensure();
			if (id === current) return;
			current = id;
			p.cueVideoById(id);
		},
		// Plays a stream, from the live edge.
		async play(id: string) {
			wanted = true;
			onStatus('loading', id);
			const p = await ensure();
			if (!wanted) return;
			current = id;
			inAd = false;
			applyVolume(p);
			p.loadVideoById(id);
			p.playVideo();
			void watchForAds();
		},
		async stop() {
			wanted = false;
			clearInterval(watching);
			if (!player) return;
			(await player).pauseVideo();
			onStatus('paused', current);
		},
		async setVolume(value: number) {
			volume = value;
			if (player) applyVolume(await player);
		}
	};
}
