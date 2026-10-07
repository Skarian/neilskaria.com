<script lang="ts">
	import { Badge } from '#lib/components/ui/badge/index.js';
</script>

<svelte:head>
	<title>Neil Skaria</title>
	<meta
		name="description"
		content="Neil Skaria's personal website. Projects, writing, and ideas."
	/>
</svelte:head>

<div class="mx-auto flex min-h-svh max-w-5xl flex-col px-6 sm:px-10">
	<header class="py-8">
		<p class="text-sm font-medium tracking-tight">neilskaria.com</p>
	</header>

	<main class="flex flex-1 flex-col justify-center gap-6 py-24 sm:pb-40">
		<Badge variant="outline">Personal website</Badge>
		<h1 class="text-6xl font-semibold tracking-tight text-balance sm:text-8xl">Neil Skaria</h1>
		<p class="max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-2xl">
			A home for my projects, writing, and ideas.
		</p>
	</main>
</div>
