// Which YouTube stream each radio station is playing right now. For each station, the first of its
// known streams that's live and can be embedded wins; failing those, its channel's current live
// stream. The answer is cached by the CDN for a while and shared by every visitor, so YouTube is
// only asked a few times an hour however busy the site is.

import { json } from '@sveltejs/kit';
import { STREAMS } from '#lib/radio/stations.js';

const HEADERS = {
	'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36',
	'accept-language': 'en-US,en;q=0.9'
};

// The last answer that worked, for when YouTube can't be reached (per server instance).
let lastGood: Record<string, string> = {};

async function page(url: string) {
	const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(6000) });
	return res.ok ? res.text() : '';
}

const playable = (html: string) =>
	html.includes('"isLiveNow":true') &&
	html.includes('"playableInEmbed":true') &&
	/"playabilityStatus":\{"status":"OK"/.test(html);

async function liveStream(id: string) {
	return playable(await page(`https://www.youtube.com/watch?v=${id}`)) ? id : null;
}

async function channelStream(channel: string) {
	const html = await page(`https://www.youtube.com/channel/${channel}/live`);
	const id = /<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/.exec(
		html
	)?.[1];
	return id && playable(html) ? id : null;
}

async function resolve(station: (typeof STREAMS)[number]) {
	try {
		for (const id of station.known) if (await liveStream(id)) return id;
		return await channelStream(station.channel);
	} catch {
		return null;
	}
}

export async function GET() {
	const found = await Promise.all(STREAMS.map(resolve));
	const stations: Record<string, string> = {};
	STREAMS.forEach((station, i) => {
		const key = station.freq.toFixed(1);
		// Not found now: what worked last time, or the station's first known stream.
		stations[key] = found[i] ?? lastGood[key] ?? station.known[0];
	});
	if (found.some(Boolean)) lastGood = stations;
	return json(
		{ stations, at: Date.now() },
		{
			headers: {
				// Shared: fresh for 15 minutes, then served while it refreshes (and if refreshing fails).
				'cache-control':
					'public, max-age=300, s-maxage=900, stale-while-revalidate=86400, stale-if-error=86400'
			}
		}
	);
}
