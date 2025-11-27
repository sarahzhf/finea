"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export default function CardMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Load front and back textures
  const front = useTexture("/texture/visacard.jpg");
  const back = useTexture("/texture/visacard2.jpg");

  // Flip state
  const [flip, setFlip] = useState(false);
  const [angle, setAngle] = useState(0);

  // Mouse parallax
  const mouse = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Parallax rotation
    const targetX = mouse.current.x * 0.15;
    const targetY = mouse.current.y * 0.15;

    meshRef.current.rotation.x += (targetY - meshRef.current.rotation.x) * 0.08;
    meshRef.current.rotation.z += (targetX - meshRef.current.rotation.z) * 0.08;

    // Flip animation
    if (flip) {
      const newAngle = angle + delta * 4;
      setAngle(newAngle);
      meshRef.current.rotation.y = newAngle;

      if (newAngle >= Math.PI * 2) {
        setFlip(false);
        setAngle(0);
        meshRef.current.rotation.y = 0;
      }
    }
  });

  return (
    <>
      <mesh
        ref={meshRef}
        scale={[1, 1, 1]}
        onClick={() => setFlip(true)}
        onPointerMove={(e) => {
          mouse.current.x = (e.pointer.x - 0.5) * 2;
          mouse.current.y = (e.pointer.y - 0.5) * 2;
        }}
        castShadow
      >
        <boxGeometry args={[3.5, 2.2, 0.05]} />

        {/* RIGHT EDGE */}
        <meshStandardMaterial attach="material-0" color="#111" />
        {/* LEFT EDGE */}
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

      {/* Halo light effect */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]}>
        <circleGeometry args={[2.2, 64]} />
        <meshBasicMaterial color={"#F5D657"} transparent opacity={0.25} />
      </mesh>

      {/* Glow ring behind the card */}
      <mesh position={[0, 0, -0.2]}>
        <ringGeometry args={[2.4, 3.2, 64]} />
        <meshBasicMaterial color="#F5D657" transparent opacity={0.15} />
      </mesh>
    </>
  );
}