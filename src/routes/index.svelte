<script context="module" lang="ts">
	export async function preload(page, session) {
		console.log('preload!', page, session)
	}
</script>

<script lang="ts">
</script>

<svelte:head>
	<title>Typed Sappy and Sassy Svelte Template</title>
</svelte:head>

<div class="page">
	<h1 class="title">Typed Sappy and Sassy Svelte Template.</h1>
</div>

<style lang="scss">
	@import 'styles/_sassy';

	.page {
		@include flex(column, center, center);
		width: 100%;
		height: 100%;
		.title {
			font-size: 3em;
		}
	}
</style>
