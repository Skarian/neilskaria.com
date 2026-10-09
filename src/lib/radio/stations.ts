// The radio's stations. Most are live YouTube streams, tracked by channel: each has the streams it's
// known to play (in order of preference) and the channel to fall back on, whose current live stream
// is used if none of those are on air. The server works out which stream is live for each station
// (see routes/api/stations), and the browser plays it in a hidden player. One station is local: a
// little tune played right here, at the far end of the dial, that needs no internet at all.

export type Station = {
	name: string;
	freq: number;
	// A YouTube live stream, or the local tune.
	kind: 'stream' | 'local';
};

export type StreamStation = Station & {
	kind: 'stream';
	channel: string;
	known: string[];
};

export const FM_MIN = 87.5;
export const FM_MAX = 108;

export const STREAMS: StreamStation[] = [
	{
		name: 'Study Beats',
		freq: 88.5,
		kind: 'stream',
		channel: 'UCOxqgCwgOqC2lMqC5PYz_Dg', // Chillhop Music
		known: ['7NOSDKb0HlU', '5yx6BWlEVcY', '1-LpQekNa9g']
	},
	{
		name: 'Café Jazz',
		freq: 91.3,
		kind: 'stream',
		channel: 'UCsIg9WMfxjZZvwROleiVsQg', // Coffee Shop Radio
		known: ['blAFxjhg62k']
	},
	{
		name: 'Pixel FM',
		freq: 94.7,
		kind: 'stream',
		channel: 'UCNRFAB4ffkPODZd_PZQvgrw', // Radio Cutman
		known: ['lkcjlTqmoDY']
	},
	{
		name: 'Night Drive',
		freq: 98.1,
		kind: 'stream',
		channel: 'UCJ80_CMnIOrKtMyFbIFIQ7A', // Nightride FM
		known: ['UedTcufyrHc', '4xDzrJKXOOY']
	},
	{
		name: 'Midnight',
		freq: 101.9,
		kind: 'stream',
		channel: 'UCOxqgCwgOqC2lMqC5PYz_Dg', // Chillhop Music
		known: ['i6WzngxTnBA', 'FWjZ0x2M8og']
	},
	{
		name: 'Deep Space',
		freq: 105.5,
		kind: 'stream',
		channel: 'UCSFB7Xy5Fa1pVVKP_CajIrw', // Space Relax Music
		known: ['BLIKwfIJIyo']
	}
];

// Not on the presets: found by tuning all the way over.
export const GROVE: Station = { name: 'Grove', freq: 107.3, kind: 'local' };

export const STATIONS: Station[] = [...STREAMS, GROVE];

// How clearly a station comes in at a frequency: fully within 0.1 MHz, gone by 0.45.
export function reception(freq: number, station: number) {
	const d = Math.abs(freq - station);
	const t = Math.min(1, Math.max(0, (0.45 - d) / 0.35));
	return t * t * (3 - 2 * t);
}

// The station a frequency is tuned to, if it's coming in clearly.
export function stationAt(freq: number) {
	return STATIONS.find((s) => reception(freq, s.freq) > 0.5) ?? null;
}
