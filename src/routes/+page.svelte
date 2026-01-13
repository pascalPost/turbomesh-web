<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	// import MonacoEditor from '$lib/components/MonacoEditor.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import Play from '@lucide/svelte/icons/play';
	import MonacoEditor from '$lib/components/monaco-editor.svelte';
</script>

<div class="[--header-height:calc(--spacing(14))]">
	<Sidebar.Provider style="--sidebar-width: 30%" class="flex flex-col">
		<SiteHeader />
		<Sidebar.Root
			variant="floating"
			class=" top-(--header-height) h-[calc(100svh-var(--header-height))]!"
		>
			<Sidebar.Content>
				<MonacoEditor />
			</Sidebar.Content>
			<Sidebar.Footer>
				<Button><Play />Generate Grid</Button>
			</Sidebar.Footer>
		</Sidebar.Root>
	</Sidebar.Provider>
</div>
