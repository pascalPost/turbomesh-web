<script lang="ts">
  import { onMount } from "svelte";
  import { TurboMeshSDK } from "../lib/turbomesh";

  let blocksCount: number | null = null;
  let errorMessage = "";
  let loading = true;

  onMount(async () => {
    try {
      const sdk = await TurboMeshSDK.load({ wasmUrl: "/turbomesh.wasm", autoInit: false });
      sdk.run();
      blocksCount = sdk.blocksCount();
      sdk.free();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errorMessage = `Failed to run turbomesh: ${message}`;
    } finally {
      loading = false;
    }
  });
</script>

<main>
  <h1>TurboMesh WASM demo</h1>

  {#if loading}
    <p>Loading turbomesh.wasm and running mesh...</p>
  {:else if errorMessage}
    <p>{errorMessage}</p>
  {:else if blocksCount !== null}
    <p>The mesh contains {blocksCount} blocks.</p>
  {/if}
</main>
