<script lang="ts">
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
</script>

<div class="h-dvh">
	<Resizable.PaneGroup direction="horizontal" class="min-h-50 max-w-md rounded-lg border">
		<Resizable.Pane defaultSize={25}>
			<Sidebar.Provider>
				<Sidebar.Root class="static!" />
			</Sidebar.Provider>
		</Resizable.Pane>
		<Resizable.Handle withHandle />
		<Resizable.Pane defaultSize={75}>Two</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
