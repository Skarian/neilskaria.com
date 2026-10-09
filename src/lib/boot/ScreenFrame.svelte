<script lang="ts">
	import type { Snippet } from 'svelte';

	// Keeps the site feeling like it's on a screen after the camera dives in: a CRT-style finish
	// (colour fringing and a soft bloom on the content, scanlines, vignette, glare, grain). The
	// content stays ordinary, selectable HTML; the effects are filters and overlays on top of it.
	let { children }: { children: Snippet } = $props();
</script>

<svg class="defs" aria-hidden="true">
	<filter id="crt" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
		<!-- Split the colour channels and nudge red and blue apart for fringing. -->
		<feColorMatrix
			in="SourceGraphic"
			values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
			result="red"
		/>
		<feOffset in="red" dx="-0.7" result="redShift" />
		<feColorMatrix
			in="SourceGraphic"
			values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
			result="green"
		/>
		<feColorMatrix
			in="SourceGraphic"
			values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
			result="blue"
		/>
		<feOffset in="blue" dx="0.7" result="blueShift" />
		<feBlend in="redShift" in2="green" mode="screen" result="redGreen" />
		<feBlend in="redGreen" in2="blueShift" mode="screen" result="fringed" />
		<!-- A soft bloom: a blurred copy, dimmed, screened back over the top. -->
		<feGaussianBlur in="fringed" stdDeviation="3" result="blur" />
		<feComponentTransfer in="blur" result="bloom">
			<feFuncR type="linear" slope="0.35" />
			<feFuncG type="linear" slope="0.35" />
			<feFuncB type="linear" slope="0.35" />
		</feComponentTransfer>
		<feBlend in="fringed" in2="bloom" mode="screen" />
	</filter>
</svg>

<div class="crt-content">
	{@render children()}
</div>

<div class="screen-frame" aria-hidden="true">
	<div class="scanlines"></div>
	<div class="glass"></div>
</div>

<style>
	.defs {
		position: absolute;
		width: 0;
		height: 0;
	}

	.crt-content {
		filter: url(#crt);
	}

	.screen-frame {
		position: fixed;
		inset: 0;
		/* Above the intro too, so the finish is constant from the first frame to the page. */
		z-index: 60;
		pointer-events: none;
	}

	.scanlines {
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(0deg, rgb(20 12 40 / 0.07) 0 1px, transparent 1px 3px);
		mix-blend-mode: multiply;
		animation: roll 8s linear infinite;
	}

	.glass {
		position: absolute;
		inset: 0;
		background:
			/* Glare from the glass, strongest at the top-left. */
			linear-gradient(135deg, rgb(255 255 255 / 0.14), transparent 35%),
			/* Darker towards the curved edges. */
			radial-gradient(ellipse at center, transparent 60%, rgb(20 10 30 / 0.28) 100%);
	}

	.glass::after {
		content: '';
		position: absolute;
		inset: -50%;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
		opacity: 0.08;
		mix-blend-mode: overlay;
		animation: grain 0.5s steps(3) infinite;
	}

	@keyframes roll {
		to {
			background-position: 0 3px;
		}
	}

	@keyframes grain {
		33% {
			transform: translate(-3%, 2%);
		}
		66% {
			transform: translate(2%, -3%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.scanlines,
		.glass::after {
			animation: none;
		}
	}
</style>
