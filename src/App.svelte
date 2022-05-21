<script lang="ts">
	import NavBar from './NavBar.svelte';
	let name = 'world';
	console.log(`Hello ${name}!`);
</script>

<div class="main">
	<h1>Hello {name}!</h1>	
</div>


<style>
	.main {
		color: white;
		background-color: #292929;
		height: 100%;
		width: 100%;
		justify-content: center;
		display: flex;
		font-family: 'Inconsolata', monospace;
	}
</style>