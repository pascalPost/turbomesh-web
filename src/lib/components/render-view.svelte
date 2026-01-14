<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { Canvas, T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import * as three from 'three';
	import type { BlockPoints } from '$lib/turbomesh';

	const { blocks = [] } = $props<{ blocks?: BlockPoints[] }>();
	const positions = $derived(blocks.length ? toPosition(blocks) : new Float32Array());

	function toPosition(blocks: BlockPoints[]) {
		const totalPoints = blocks.reduce((sum, block) => sum + block.size.i * block.size.j, 0);
		const pos = new Float32Array(totalPoints * 3);

		let offset = 0;
		for (const block of blocks) {
			const data = block.values;
			for (let i = 0; i < data.length; i += 2) {
				pos[offset++] = data[i];
				pos[offset++] = data[i + 1];
				pos[offset++] = 0;
			}
		}

		return pos;
	}

	const initialPosition: [number, number, number] = [0, 0, 10];
	const initialZoom = 100;

	let camera: three.OrthographicCamera | undefined = $state(undefined);
	let controls: ComponentProps<typeof OrbitControls>['ref'] | undefined = $state(undefined);

	export function reset() {
		if (!camera || !controls) return;
		console.log('Resetting camera position');
		camera.position.set(...initialPosition);
		camera.zoom = initialZoom;
		camera.updateProjectionMatrix();
		controls.reset();
	}
</script>

<Canvas>
	<T.OrthographicCamera makeDefault position={initialPosition} zoom={initialZoom} bind:ref={camera}>
		<OrbitControls
			enableRotate={false}
			enableDamping={false}
			zoomToCursor={true}
			mouseButtons={{
				LEFT: three.MOUSE.PAN,
				MIDDLE: three.MOUSE.DOLLY,
				RIGHT: three.MOUSE.PAN
			}}
			minZoom={5}
			maxZoom={500}
			bind:ref={controls}
		/>
	</T.OrthographicCamera>
	<T.Points>
		<T.BufferGeometry>
			<T.BufferAttribute
				args={[positions, 3]}
				attach={({ parent, ref }) => {
					(parent as three.BufferGeometry).setAttribute('position', ref);
				}}
			/>
		</T.BufferGeometry>

		<T.PointsMaterial size={10} />
	</T.Points>
	<T.AxesHelper args={[2]} />
</Canvas>
