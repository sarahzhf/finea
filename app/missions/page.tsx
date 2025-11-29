"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Float, Text, Billboard, Image } from "@react-three/drei";
import React, { Suspense, useEffect, useState, useRef } from "react";
import * as THREE from "three";

type MiniGameId = "budget-run" | "expense-quiz" | "savings-lab";

type MiniGame = {
  id: MiniGameId;
  title: string;
  description: string;
  position: [number, number, number];
  accentColor: string;
  shortLabel: string;
};

type Vec3 = { x: number; y: number; z: number };

const MINI_GAMES: MiniGame[] = [
  {
    id: "budget-run",
    title: "Budget Run",
    shortLabel: "Budget",
    description:
      "Apprends à équilibrer ton budget en évitant les dépenses inutiles et en gardant ton solde dans le vert.",
    position: [-3, 1.4, -5],
    accentColor: "#38bdf8",
  },
  {
    id: "expense-quiz",
    title: "Quiz Dépenses",
    shortLabel: "Quiz",
    description:
      "Réponds à des questions rapides sur les dépenses, les abonnements et les bonnes pratiques financières.",
    position: [0, 1.4, -5],
    accentColor: "#facc15",
  },
  {
    id: "savings-lab",
    title: "Laboratoire d'Épargne",
    shortLabel: "Épargne",
    description:
      "Simule différents scénarios d’épargne et découvre comment faire travailler ton argent pour toi.",
    position: [3, 1.4, -5],
    accentColor: "#22c55e",
  },
];

function distance3D(a: Vec3, b: [number, number, number]) {
  const dx = a.x - b[0];
  const dy = a.y - b[1];
  const dz = a.z - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function Player({
  onMove,
}: {
  onMove?: (position: Vec3) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const [showBubble, setShowBubble] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // mouvement simple en vue du dessus (WASD / flèches)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const useFrame = (require("@react-three/fiber") as any).useFrame;

  useFrame((state: any, delta: number) => {
    const mesh = ref.current;
    if (!mesh) return;

    const SPEED = 0.08;

    // Animation de saut / rebond (bobbing) sur l'axe Y
    const t = state.clock.getElapsedTime();
    const baseY = 0.6;
    const amplitude = 0.08; // hauteur du saut
    mesh.position.y = baseY + Math.sin(t * 3) * amplitude;

    const moveX =
      (keys.current["KeyD"] || keys.current["ArrowRight"] ? 1 : 0) -
      (keys.current["KeyA"] || keys.current["ArrowLeft"] ? 1 : 0);
    const moveZ =
      (keys.current["KeyS"] || keys.current["ArrowDown"] ? 1 : 0) -
      (keys.current["KeyW"] || keys.current["ArrowUp"] ? 1 : 0);

    if (moveX !== 0 || moveZ !== 0) {
      const dir = new THREE.Vector3(moveX, 0, moveZ)
        .normalize()
        .multiplyScalar(SPEED);
      mesh.position.add(dir);
      mesh.position.x = THREE.MathUtils.clamp(mesh.position.x, -4.2, 4.2);
      mesh.position.z = THREE.MathUtils.clamp(mesh.position.z, -1.5, 0.5);

      mesh.rotation.y = Math.atan2(dir.x, dir.z);
    }

    onMove?.({
      x: mesh.position.x,
      y: mesh.position.y,
      z: mesh.position.z,
    });
  });

  return (
    <group ref={ref} position={[0, 0.6, 0]}>
      {/* Mascotte Finéa en 2D animée (léger flottement) */}
      <Float speed={2} floatIntensity={0.5} rotationIntensity={0.2}>
        <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
          <group>
            <Image
              // ⚠️ Mets ici les bons chemins :
              // - image normale : "/icons/fineamascotte.png"
              // - image yeux fermés (blink) : "/icons/fineamascotte-blink.png"
              url={isBlinking ? "/icons/fineatalk.png" : "/icons/fineamascotte.png"}
              transparent
              toneMapped={false}
              scale={1.1}
              onClick={() => {
                setShowBubble((prev) => !prev);
                setIsBlinking(true);
                setTimeout(() => setIsBlinking(false), 150);
              }}
            />
            {showBubble && (
              <Html position={[0.08, 0.87, 0]}>
                <div
                  className="rounded-lg bg-black/80 border border-white/20 px-3 py-[3px] text-[10px] leading-tight text-slate-100 shadow-sm whitespace-nowrap"
                >
                  Quel mini-jeu je démarre ?
                </div>
              </Html>
            )}
          </group>
        </Billboard>
      </Float>

      {/* petit halo lumineux au sol */}
      <mesh position={[0, -0.55, 0]} receiveShadow rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.6, 32]} />
        <meshStandardMaterial
          color="#f97316"
          opacity={0.3}
          transparent
        />
      </mesh>
    </group>
  );
}

function FloorAndWalls() {
  return (
    <group>
      {/* Sol */}
      <mesh
        rotation-x={-Math.PI / 2}
        receiveShadow
        position={[0, 0, 0]}
      >
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial
          color="#020617"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* Mur du fond */}
      <mesh position={[0, 2, -5]} receiveShadow>
        <boxGeometry args={[12, 4, 0.2]} />
        <meshStandardMaterial
          color="#020617"
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* léger dégradé lumineux sur le mur */}
      <mesh position={[0, 2, -4.9]}>
        <planeGeometry args={[8, 3]} />
        <meshBasicMaterial
          color="#0f172a"
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}

function GamePortal({
  game,
  isNearby,
}: {
  game: MiniGame;
  isNearby: boolean;
}) {
  return (
    <group position={game.position}>
      {/* panneau principal */}
      <mesh castShadow>
        <boxGeometry args={[2.2, 1.4, 0.2]} />
        <meshStandardMaterial
          color="#020617"
          metalness={0.6}
          roughness={0.15}
        />
      </mesh>

      {/* bord lumineux */}
      <mesh position={[0, 0, 0.12]}>
        <planeGeometry args={[2.1, 1.3]} />
        <meshBasicMaterial
          color={game.accentColor}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* texte du jeu */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
        <Text
          position={[0, 0.25, 0.16]}
          fontSize={0.24}
          color="#e5e7eb"
          anchorX="center"
          anchorY="middle"
        >
          {game.shortLabel}
        </Text>
      </Float>

      {/* petit bouton "E" quand le joueur est proche */}
      {isNearby && (
        <Html center distanceFactor={10}>
          <div className="mt-2 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-slate-100 shadow-lg border border-white/10 backdrop-blur">
            Appuie sur <span className="text-emerald-300 font-semibold">E</span> pour jouer
          </div>
        </Html>
      )}
    </group>
  );
}

function Scene3D({
  onGameSelect,
  setNearestGame,
}: {
  onGameSelect: (gameId: MiniGameId) => void;
  setNearestGame: React.Dispatch<React.SetStateAction<MiniGameId | null>>;
}) {
  const [playerPos, setPlayerPos] = useState<Vec3>({ x: 0, y: 0.6, z: 0 });

  useEffect(() => {
    let closest: { id: MiniGameId; distance: number } | null = null;
    for (const g of MINI_GAMES) {
      const d = distance3D(playerPos, g.position);
      if (!closest || d < closest.distance) {
        closest = { id: g.id, distance: d };
      }
    }
    if (closest && closest.distance < 1.7) {
      setNearestGame(closest.id);
    } else {
      setNearestGame(null);
    }
  }, [playerPos, setNearestGame]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e") {
        setNearestGame((current: MiniGameId | null) => {
          if (current) {
            onGameSelect(current);
          }
          return current;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onGameSelect, setNearestGame]);

  return (
    <>
      <color attach="background" args={["#020617"]} />
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={1.4}
        castShadow
      />
      <spotLight
        position={[0, 5.5, -1]}
        angle={0.8}
        penumbra={0.9}
        intensity={1.2}
        color={"#38bdf8"}
      />

      <FloorAndWalls />

      <Player onMove={setPlayerPos} />

      {MINI_GAMES.map((game) => (
        <GamePortal
          key={game.id}
          game={game}
          isNearby={distance3D(playerPos, game.position) < 1.7}
        />
      ))}

      {/* petit titre lumineux sur le mur */}
      <Float speed={1.2} floatIntensity={0.4} rotationIntensity={0.1}>
        <Text
          position={[0, 2.4, -4.7]}
          fontSize={0.5}
          color="#f9fafb"
          anchorX="center"
          anchorY="middle"
        >
          Finéa Missions Hub
        </Text>
      </Float>

      <OrbitControls
        target={[0, 1, -2]}
        enablePan={false}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={9}
      />
    </>
  );
}

export default function MissionsPage() {
  const [selectedGame, setSelectedGame] = useState<MiniGame | null>(null);
  const [nearestGame, setNearestGame] = useState<MiniGameId | null>(null);

  const currentGame = selectedGame;
  const hintGame = nearestGame
    ? MINI_GAMES.find((g) => g.id === nearestGame) ?? null
    : null;

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-b from-[#020617] via-[#020617] to-[#0b1120] text-slate-50 px-3 py-4">
      <div className="relative w-full max-w-[420px] aspect-[9/16] rounded-[40px] border border-white/10 bg-black/40 shadow-[0_0_60px_rgba(15,23,42,0.9)] overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Missions
            </p>
            <h1 className="text-lg font-semibold text-slate-50">
              Monde 3D interactif
            </h1>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-slate-200">
            Bêta
          </div>
        </div>

        {/* Instructions overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col gap-2 text-[10px] text-slate-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <span className="rounded-md bg-black/60 px-1.5 py-0.5 border border-white/10">
                ZQSD / ←↑↓→
              </span>
              <span>Déplace ton personnage</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="rounded-md bg-black/60 px-1.5 py-0.5 border border-white/10">
                E
              </span>
              <span>Interagir</span>
            </div>
          </div>

          {hintGame && (
            <div className="rounded-2xl bg-black/60 border border-white/10 px-3 py-2">
              <p className="text-[10px] text-slate-300">
                Tu es proche de{" "}
                <span className="font-semibold text-slate-50">
                  {hintGame.title}
                </span>
                . Appuie sur{" "}
                <span className="font-semibold text-emerald-300">E</span> pour
                lancer le mini‑jeu.
              </p>
            </div>
          )}
        </div>

        {/* 3D Canvas */}
        <div className="absolute inset-[56px_8px_72px] rounded-[32px] overflow-hidden border border-white/10 bg-[#020617]">
          <Canvas
            shadows
            camera={{ position: [0, 3.5, 6.5], fov: 50 }}
          >
            <Suspense fallback={null}>
              <Scene3D
                onGameSelect={(id) => {
                  const game = MINI_GAMES.find((g) => g.id === id) ?? null;
                  setSelectedGame(game);
                }}
                setNearestGame={setNearestGame}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Fiche du mini-jeu sélectionné */}
        {currentGame && (
          <div className="absolute left-4 right-4 top-[64px] z-30 rounded-3xl border border-white/15 bg-black/80 px-4 py-3 text-xs shadow-[0_18px_45px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Mini‑jeu sélectionné
                </p>
                <h2 className="text-sm font-semibold mt-1 text-slate-50">
                  {currentGame.title}
                </h2>
                <p className="mt-1 text-[11px] leading-snug text-slate-200">
                  {currentGame.description}
                </p>
              </div>
              <button
                onClick={() => setSelectedGame(null)}
                className="ml-2 rounded-full bg-white/5 border border-white/10 w-6 h-6 flex items-center justify-center text-[10px] text-slate-300 hover:bg-white/10 transition"
                aria-label="Fermer la fiche du mini-jeu"
              >
                ✕
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-[10px] text-slate-400">
                Cette zone pourra ouvrir le vrai jeu (quiz, runner, etc.) ou une
                nouvelle page Next.js.
              </p>
              <button
                className="whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-semibold text-slate-900"
                style={{ backgroundColor: currentGame.accentColor }}
              >
                Jouer (bientôt)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}