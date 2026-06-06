"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere, Float, Environment } from "@react-three/drei";
import type { Mesh } from "three";

/**
 * AnimatedFoodOrb — a slow-rotating distorted basil sphere with a warm
 * carrot-orange rim light. The visual signature for AI Chef while it's
 * thinking. Pure R3F + drei, no shaders authored by hand here.
 *
 * The component renders directly inside an existing layout box; the
 * caller decides size via `className`. The Canvas autosizes via
 * `dpr={[1, 1.5]}` so retina screens stay sharp without burning fps.
 *
 * Reduced motion + WebGL-missing fallbacks live in the wrapper
 * `LazyFoodOrb` — this file only renders the 3D scene.
 */
function OrbMesh({ speed = 0.4 }: { speed?: number }) {
  const ref = useRef<Mesh>(null!);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * speed * 0.5;
    ref.current.rotation.y += delta * speed * 0.8;
  });
  return (
    <Float speed={1.3} rotationIntensity={0.4} floatIntensity={1.4}>
      <Sphere ref={ref} args={[1.1, 64, 64]}>
        <MeshDistortMaterial
          color="#2FBF71"
          emissive="#16834A"
          emissiveIntensity={0.25}
          roughness={0.25}
          metalness={0.15}
          distort={0.42}
          speed={1.6}
        />
      </Sphere>
    </Float>
  );
}

export function AnimatedFoodOrb({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 3.2], fov: 45 }}
      >
        <ambientLight intensity={0.6} />
        {/* Warm carrot rim light — gives the orb the "food glow" feel. */}
        <directionalLight position={[3, 3, 5]} intensity={1.4} color="#FFD166" />
        {/* Cool grape backlight — adds depth without competing for hue. */}
        <directionalLight position={[-4, -2, -3]} intensity={0.9} color="#7C5CFF" />
        <Suspense fallback={null}>
          <OrbMesh />
          <Environment preset="apartment" />
        </Suspense>
      </Canvas>
    </div>
  );
}
