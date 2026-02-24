import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage } from '@react-three/drei';

function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function CarViewer({ modelPath }) {
  return (
    <div style={{ height: '400px', width: '100%', background: '#eee', borderRadius: '8px' }}>
      <Canvas dpr={[1, 2]} shadows camera={{ fov: 45 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6}>
            <Model url={modelPath} />
          </Stage>
        </Suspense>
        <OrbitControls enableZoom={true} autoRotate />
      </Canvas>
    </div>
  );
}