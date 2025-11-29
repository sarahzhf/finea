"use client";

import { Canvas } from "@react-three/fiber";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";

function CardMesh() {
  const ref = useRef<any>(null);
  const front = useTexture("/texture/visacard.jpg");
  const back = useTexture("/texture/visacard2.jpg");
  const [flip, setFlip] = useState(false);
  const [angle, setAngle] = useState(0);
  const mouse = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    // Parallax based on mouse
    const targetX = mouse.current.x * 0.2;
    const targetY = mouse.current.y * 0.2;
    ref.current.rotation.x += (targetY - ref.current.rotation.x) * 0.1;
    ref.current.rotation.z += (targetX - ref.current.rotation.z) * 0.1;

    // Flip animation
    if (flip) {
      const newAngle = angle + delta * 4;
      setAngle(newAngle);
      ref.current.rotation.y = newAngle;

      if (newAngle >= Math.PI * 2) {
        setFlip(false);
        setAngle(0);
        ref.current.rotation.y = 0;
      }
    }
  });

  return (
    <>
      <mesh
        ref={ref}
        castShadow
        onClick={() => setFlip(true)}
        onPointerMove={(e) => {
          mouse.current.x = (e.pointer.x - 0.5) * 2;
          mouse.current.y = (e.pointer.y - 0.5) * 2;
        }}
      >
        <boxGeometry args={[3.5, 2.2, 0.05]} />
        {/* RIGHT */}
        <meshStandardMaterial attach="material-0" color="#111" />

        {/* LEFT */}
        <meshStandardMaterial attach="material-1" color="#111" />

        {/* TOP */}
        <meshStandardMaterial attach="material-2" color="#111" />

        {/* BOTTOM */}
        <meshStandardMaterial attach="material-3" color="#111" />

        {/* FRONT */}
        <meshStandardMaterial attach="material-4" map={front} />

        {/* BACK */}
        <meshStandardMaterial attach="material-5" map={back} />
      </mesh>
      {/* Ground shadow plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.3, 0]}
        receiveShadow
      >
        <planeGeometry args={[10, 10]} />
        <shadowMaterial opacity={0.35} />
      </mesh>
    </>
  );
}

export default function Card3D() {
  return (
    <div className="w-full h-[200px]">
      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 40 }}
        gl={{ failIfMajorPerformanceCaveat: false }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight
          position={[3, 3, 5]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <CardMesh />
      </Canvas>
    </div>
  );
}