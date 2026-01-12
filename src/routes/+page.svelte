<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import MonacoEditor from '$lib/components/MonacoEditor.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import { Play } from '@lucide/svelte/icons';
</script>

<Sidebar.Provider class="flex flex-col">
	<SiteHeader />
	<Resizable.PaneGroup direction="horizontal" class="h-full">
		<Resizable.Pane class="flex flex-col">
			<Sidebar.Root class="static! w-full!">
				<MonacoEditor language="json" />
				<Button><Play />Generate Grid</Button>
			</Sidebar.Root>
		</Resizable.Pane>
		<Resizable.Handle />
		<Resizable.Pane>Two</Resizable.Pane>
	</Resizable.PaneGroup>
</Sidebar.Provider>
