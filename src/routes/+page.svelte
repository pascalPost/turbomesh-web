<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	// import MonacoEditor from '$lib/components/MonacoEditor.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import Play from '@lucide/svelte/icons/play';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import MonacoEditor from '$lib/components/monaco-editor.svelte';

	let monacoEditor: MonacoEditor | null = null;
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
				<Button><Play />Generate Grid</Button>
				<Button onclick={monacoEditor?.reset}><RotateCcw />Reset</Button>
			</Sidebar.Footer>
		</Sidebar.Root>
	</Sidebar.Provider>
</div>
