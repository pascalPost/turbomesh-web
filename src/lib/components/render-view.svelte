<script lang="ts">
	import { Canvas, T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import { BufferGeometry, MOUSE } from 'three';

	// Your 2D points (x,y)
	const pts: Array<[number, number]> = [
		[0, 0],
		[1, 2],
		[2, 1],
		[-1, 1]
	];

	const positions = new Float32Array(pts.length * 3);
	pts.forEach(([x, y], i) => {
		positions[i * 3 + 0] = x;
		positions[i * 3 + 1] = y;
		positions[i * 3 + 2] = 0;
	});
</script>

<Canvas>
	<T.OrthographicCamera makeDefault position={[0, 0, 10]} zoom={100}>
		<OrbitControls
			enableRotate={false}
			enableDamping={false}
			zoomToCursor={true}
			mouseButtons={{
				LEFT: MOUSE.PAN,
				MIDDLE: MOUSE.DOLLY,
				RIGHT: MOUSE.PAN
			}}
			minZoom={5}
			maxZoom={500}
		/>
	</T.OrthographicCamera>
	<T.Points>
		<T.BufferGeometry>
			<!-- attach the BufferAttribute as the geometry's "position" attribute -->
			<T.BufferAttribute
				args={[positions, 3]}
				attach={({ parent, ref }) => {
					(parent as BufferGeometry).setAttribute('position', ref);
				}}
			/>
		</T.BufferGeometry>

		<T.PointsMaterial size={10} />
	</T.Points>
	<T.AxesHelper args={[2]} />
</Canvas>
