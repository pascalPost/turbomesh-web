<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import SiteHeader from '$lib/components/site-header.svelte';
	import Play from '@lucide/svelte/icons/play';
	import * as Turbomesh from '$lib/turbomesh';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import MonacoEditor from '$lib/components/monaco-editor.svelte';
	import { onDestroy, onMount } from 'svelte';

	let monacoEditor: MonacoEditor | null = null;

	let turbomesh: Turbomesh.TurboMeshSDK | null = null;

	onMount(async () => {
		turbomesh = await Turbomesh.TurboMeshSDK.load({ wasmUrl: 'turbomesh.wasm', autoInit: false });
	});

	onDestroy(() => {
		turbomesh?.free();
	});
</script>

<div class="[--header-height:calc(--spacing(14))]">
	<Sidebar.Provider style="--sidebar-width: 30%" class="flex flex-col">
		<SiteHeader />
		<Sidebar.Root
			variant="floating"
			class=" top-(--header-height) h-[calc(100svh-var(--header-height))]!"
		>
			<Sidebar.Content>
				<MonacoEditor bind:this={monacoEditor} />
			</Sidebar.Content>
			<Sidebar.Footer>
				<Button onclick={() => turbomesh?.run()}><Play />Generate Grid</Button>
				<Button onclick={monacoEditor?.reset}><RotateCcw />Reset</Button>
			</Sidebar.Footer>
		</Sidebar.Root>
	</Sidebar.Provider>
</div>
