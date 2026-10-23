# Clock radio over YouTube streams, lofi.cafe-style

Researched 2026-10-09. Goal: play YouTube live streams through the clock radio and footer player that already exist, with the video kept offscreen the way [lofi.cafe](https://www.lofi.cafe/) does it. The UI stays as it is. Only the sound source changes.

This uses YouTube's embedded player through the [IFrame Player API](https://developers.google.com/youtube/iframe_api_reference). With a fixed list of video IDs, it needs no Data API key, no search requests, no Data API quota and no custom backend.

## Verified: what lofi.cafe ships

Read from the public production bundle [`main.3c32342a.js`](https://www.lofi.cafe/static/js/main.3c32342a.js), which the current index page references. This comes from reading the source. Playback was not tested in a live browser because no preview host was available.

- **Player.** ReactPlayer wraps the YouTube iframe player and loads `https://www.youtube.com/iframe_api`. Props: `controls: false`, a `playing` boolean, `url` set to `https://www.youtube.com/watch?v=` + `station.id`, `volume` from 0 to 1, and `playsinline: true`. It uses the callbacks `onReady`, `onError`, `onPlay`, `onPause`, `onBuffer`, `onBufferEnd`, `onStart` and `onEnded`.
- **Offscreen placement.** The outer wrapper's style is exactly `{pointerEvents: "none", userSelect: "none", position: "fixed", top: "100%", left: "100%"}`. Inside it, a wrapper at 100% width and height with `overflow: hidden` holds a player sized `100vw` × `200vw`. An optional visible mode swaps in a fixed, full-screen black wrapper. Player visibility defaults to off.
- **Delivery.** The video plays offscreen. The code shows no audio extraction, proxy or audio-only stream.
- **Stations.** There is a fixed list of ten IDs. Each station card links to its original YouTube watch URL, and the remembered volume defaults to 0.7.
- **History.** The creator described it in 2021 as Create React App plus the YouTube player running lofi channels ([HN](https://news.ycombinator.com/item?id=26805702)). The bundle above is the current evidence.

### Reference station candidates (from the bundle)

These are listed for reference only. They are not confirmed live today and the user has not picked any of them.

- [5yx6BWlEVcY](https://www.youtube.com/watch?v=5yx6BWlEVcY): Chillhop Radio - jazzy & lofi hip hop beats
- [7NOSDKb0HlU](https://www.youtube.com/watch?v=7NOSDKb0HlU): lofi hip hop radio - beats to study/relax to
- [blAFxjhg62k](https://www.youtube.com/watch?v=blAFxjhg62k): Coffee Shop Radio - 24/7 Chill Lo-Fi & Jazzy Beats
- [TfmECBzmOn4](https://www.youtube.com/watch?v=TfmECBzmOn4): Lofi Hip Hop Radio - Relaxing Beats to Study, Sleep, Chill to
- [lkcjlTqmoDY](https://www.youtube.com/watch?v=lkcjlTqmoDY): videogame lofi & chill beats
- [i6WzngxTnBA](https://www.youtube.com/watch?v=i6WzngxTnBA): late night vibes radio - calm lofi / dreamy beats
- [UedTcufyrHc](https://www.youtube.com/watch?v=UedTcufyrHc): ChillSynth FM - lofi synthwave radio for retro dreaming
- [FWjZ0x2M8og](https://www.youtube.com/watch?v=FWjZ0x2M8og): lofi hip hop radio - sad & sleepy beats
- [qH3fETPsqXU](https://www.youtube.com/watch?v=qH3fETPsqXU): 24/7 CHILL LOFI HIP HOP RADIO - beats to sleep/relax/study to
- [BLIKwfIJIyo](https://www.youtube.com/watch?v=BLIKwfIJIyo): Space Ambient Music LIVE 24/7

## Verified: what this repo has now

Read from the current `redesign` checkout.

- `src/lib/radio/radio.ts` defines `Station = { name, freq }`, an FM band from `FM_MIN` 87.5 to `FM_MAX` 108, and `STATIONS` built from the synthesized `PROGRAMS`: Lo-fi Lounge at 88.5, Chip FM at 92.7, Night Drive at 98.1 and Tide Pool at 104.9. `reception()` fades a station in fully within 0.1 MHz and out by 0.45. `stationAt(freq)` returns a station once reception is above 0.5, or `null` otherwise. `createRadio` mixes the stations with static and plays them through a small-speaker filter chain.
- `src/lib/radio/player.svelte.ts` exports one shared `radio` `$state` (`on`, `freq`, `volume` default 0.7, `muted`) and a `player` with `load`, `station`, `setOn`, `tune`, `sweep`, `skip`, `setVolume`, `setMuted` and `duck`. The `AudioContext` is created on first power-on and feeds the synth through a `duck` GainNode. Station and volume are saved under the `radio` storage key and mute under `boot-muted`. Power always starts off on each visit. During a sweep, `apply()` runs on every animation frame.
- `src/lib/boot/BootIntro.svelte` imports the same `player`/`radio`. Focusing the clock powers it on. If the radio was off and the frequency sits between stations, focus first tunes to the nearest station; otherwise it keeps the current frequency. Leaving the clock while it's on static powers off. On/freq are mirrored to `engine.setRadio`, SOUND ON/OFF toggles `radio.muted`, and `onChime` calls `player.duck`.
- `src/lib/boot/engine.ts` only draws the clock radio (pointer, wheel, power switch, LED) from `setRadio({ on, freq })`. It knows nothing about the audio.
- `src/lib/radio/RadioPlayer.svelte` is the footer control on the same state. Powering it on unmutes the sound if the room had muted it.
- `src/routes/lab/boot/+page.svelte` hosts `BootIntro` and the page whose footer holds `RadioPlayer`, with the room ↔ page handoff. `src/routes/+layout.svelte` only renders its children. It has no player host yet.

## Suggested integration (not implemented)

Keep `radio` and the `player` interface as they are, so the clock, panel, footer and engine don't change. Swap what `apply()` drives.

1. **Station data.** Add `videoId`, `channel` and a watch URL to each curated station in `radio.ts`, keeping `name`/`freq`. The ID list has to be maintained by hand, because live streams end and IDs change.
2. **Direct IFrame API, no React.** Load `https://www.youtube.com/iframe_api` lazily, only in the browser and only on first power-on. Don't touch `window` during SSR. Use a singleton promise that resolves from `onYouTubeIframeAPIReady` and guards against loading twice. Create one `YT.Player` with [player parameters](https://developers.google.com/youtube/player_parameters) `controls: 0` and `playsinline: 1`, plus `origin`. Put it in a fixed offscreen element modeled on lofi.cafe's wrapper.
3. **One persistent owner.** Mount the player once in a browser-only host that outlives clock focus, the panel and the scene teardown. Then the room → page handoff in `lab/boot` keeps playing with no second embed and no restart. Destroy it only when that owner is torn down. `+layout.svelte` could host it later, but it doesn't today.
4. **Map controls to the API.** Use `playVideo`, `pauseVideo`, `loadVideoById`, `setVolume` (an integer from 0 to 100, so `Math.round(volume * 100)` clamped to that range; the saved 0–1 `radio.volume` stays as it is), `mute` and `unMute`. Keep `radio.on` as the user's intent. Track a separate status (loading, buffering, playing, blocked, error) from `onReady`, `onStateChange`, `onAutoplayBlocked` and `onError`, and show that status, not the intent, when reporting what is playing.
5. **Tuning.** Reception and static can stay local. When `stationAt(freq)` is a station, play its stream. Off station, pause or turn it down and play the local static. A sweep must not call `loadVideoById` on every frame: wait until the frequency settles, dedupe so a station that's already loaded isn't loaded again, and ignore events from a load that has since been superseded. Only one stream plays at a time, so the current synth's blend of neighbouring stations goes away.
6. **Duck.** Apply `duck` to the player's effective volume (user volume × duck factor, or 0 when muted) without changing the saved `radio.volume`/`muted`. The cross-origin iframe's sound can't be routed into the Web Audio `duck` gain or the small-speaker filters, so the boxy-speaker colour applies only to the local static.
7. **Autoplay.** Call play from the click handler. Even then, the first `playVideo` after a slow SDK load may land outside the user's gesture and get blocked ([MDN autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)). Handle the API's `onAutoplayBlocked` event explicitly as the blocked status, alongside `onReady` and `onStateChange`. `onReady` only means the player can take commands; treat playback as started only when `onStateChange` reports playing. If playback is blocked or never starts, retry `playVideo` on the next click. On some mobile browsers, `setVolume` may have no effect.
8. **Errors.** Check the meanings against the [IFrame API reference](https://developers.google.com/youtube/iframe_api_reference): 100 means removed or private, 101/150 mean embedding is disabled, and 153 means the request is missing a referrer or client identification. Map 100, 101 and 150 to a "station unavailable" state and let the visitor skip to another station. Treat 153 as a player configuration problem, not a dead station: fix the referrer and client identification (page `Referrer-Policy`, the `origin` parameter). Handle network drops and blocked autoplay separately from both.
9. **Credit.** Link each station to its YouTube watch URL, as lofi.cafe does next to its station titles. Showing the channel name too is our own proposed addition; lofi.cafe wasn't observed doing it. Don't promise anything about monetization or view counts.

## Checks not performed

None of these have been run. Run them once the player is built:

- Desktop and mobile: first power-on from the clock and from the footer plays sound, and power off pauses it.
- Station switching with skip and the panel buttons; dragging the dial quickly loads at most one stream once it settles; static plays between stations.
- Mute, unmute and the chime duck return to the saved volume; volume behaviour on iOS and Android.
- Room → page → room keeps playing without a restart, and there's only one iframe in the DOM.
- Failure and retry: an ID that is dead or blocked from embedding, a network drop mid-stream, autoplay blocked after a slow SDK load, and a stale event arriving after a quick retune.
