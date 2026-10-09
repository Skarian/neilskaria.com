<script lang="ts">
	import BootIntro from '#lib/boot/BootIntro.svelte';
	import ScreenFrame from '#lib/boot/ScreenFrame.svelte';

	// Placeholder "inside the screen" site so the intro has somewhere to land.
	const PAPER = '#f6f1e7';
	const menu = ['About', 'Projects', 'Bookmarks', 'Blog'];
	const recent = [
		{ kind: 'POST', title: 'A placeholder post about building things', date: '10.07.26' },
		{ kind: 'PROJECT', title: 'Something I made', date: '09.21.26' },
		{ kind: 'POST', title: 'Notes on handhelds and nostalgia', date: '08.30.26' }
	];
</script>

<svelte:head>
	<title>Boot intro prototype · Neil Skaria</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<BootIntro background={PAPER} />
<ScreenFrame>
	<div class="min-h-svh px-8 py-12 font-mono text-[#4c4f69] sm:px-14" style:background={PAPER}>
		<main class="mx-auto flex max-w-3xl flex-col gap-10">
			<header class="rounded-lg border-4 border-[#4c4f69] bg-white p-1">
				<div class="rounded border-2 border-[#acb0be] px-5 py-4">
					<h1 class="text-2xl font-bold tracking-wide">NEIL SKARIA</h1>
					<p class="mt-1 text-sm text-[#6c6f85]">Placeholder site inside the screen.</p>
				</div>
			</header>

			<nav aria-label="Main">
				<ul class="flex flex-col gap-2 text-lg">
					{#each menu as item, i (item)}
						<li class="group flex items-center gap-3">
							<span class="w-4 text-[#ea76cb] {i === 0 ? '' : 'opacity-0 group-hover:opacity-100'}"
								>▶</span
							>
							<a href="/lab/boot" class="hover:text-[#8839ef]">{item.toUpperCase()}</a>
						</li>
					{/each}
				</ul>
			</nav>

			<section class="flex flex-col gap-3">
				<h2 class="text-xs tracking-[0.3em] text-[#8c8fa1]">RECENT</h2>
				{#each recent as entry (entry.title)}
					<a
						href="/lab/boot"
						class="flex items-baseline gap-4 border-b-2 border-dashed border-[#ccd0da] pb-3"
					>
						<span class="w-16 text-xs text-[#1e66f5]">{entry.kind}</span>
						<span class="flex-1 font-sans text-base">{entry.title}</span>
						<span class="text-xs text-[#8c8fa1] tabular-nums">{entry.date}</span>
					</a>
				{/each}
			</section>

			<footer class="text-xs tracking-widest text-[#8c8fa1]">
				<button
					class="cursor-pointer hover:text-[#4c4f69]"
					onclick={() => dispatchEvent(new Event('intro:replay'))}
				>
					↺ REPLAY INTRO
				</button>
			</footer>
		</main>
	</div>
</ScreenFrame>
