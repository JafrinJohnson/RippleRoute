"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import * as THREE from "three";

/**
 * Procedural low-poly delivery truck built ONLY from primitive meshes
 */
function LowPolyDeliveryTruck() {
  const truckRef = useRef();

  // Subtle natural floating pitch/yaw
  useFrame((state, delta) => {
    if (truckRef.current) {
      truckRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.04;
    }
  });

  return (
    <group ref={truckRef} position={[0, 0.35, 0]}>
      {/* 1. Main Cargo Box (Rear) */}
      <mesh position={[0, 0.45, -0.3]}>
        <boxGeometry args={[1.3, 1.1, 1.9]} />
        <meshStandardMaterial
          color="#161828"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Cargo Neon Primary Side Stripe (Left & Right) */}
      <mesh position={[0.66, 0.45, -0.3]}>
        <boxGeometry args={[0.02, 0.08, 1.8]} />
        <meshStandardMaterial
          color="#7C5CFF"
          emissive="#7C5CFF"
          emissiveIntensity={2.5}
        />
      </mesh>
      <mesh position={[-0.66, 0.45, -0.3]}>
        <boxGeometry args={[0.02, 0.08, 1.8]} />
        <meshStandardMaterial
          color="#7C5CFF"
          emissive="#7C5CFF"
          emissiveIntensity={2.5}
        />
      </mesh>

      {/* 2. Driver Cabin (Front) */}
      <mesh position={[0, 0.25, 0.95]}>
        <boxGeometry args={[1.2, 0.85, 0.8]} />
        <meshStandardMaterial
          color="#1E2238"
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Windshield (Front Slanted Glass) */}
      <mesh position={[0, 0.42, 1.36]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[1.1, 0.4, 0.04]} />
        <meshStandardMaterial
          color="#00E5FF"
          emissive="#00E5FF"
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Side Windows */}
      <mesh position={[0.61, 0.42, 0.95]}>
        <boxGeometry args={[0.02, 0.35, 0.5]} />
        <meshStandardMaterial
          color="#00E5FF"
          emissive="#00E5FF"
          emissiveIntensity={0.5}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[-0.61, 0.42, 0.95]}>
        <boxGeometry args={[0.02, 0.35, 0.5]} />
        <meshStandardMaterial
          color="#00E5FF"
          emissive="#00E5FF"
          emissiveIntensity={0.5}
          roughness={0.1}
        />
      </mesh>

      {/* 3. Front Bumper */}
      <mesh position={[0, -0.08, 1.38]}>
        <boxGeometry args={[1.26, 0.2, 0.1]} />
        <meshStandardMaterial color="#0E101E" roughness={0.5} />
      </mesh>

      {/* 4. Glowing Cyan Headlights (Left & Right) */}
      <mesh position={[0.42, -0.05, 1.44]}>
        <boxGeometry args={[0.22, 0.12, 0.04]} />
        <meshStandardMaterial
          color="#00E5FF"
          emissive="#00E5FF"
          emissiveIntensity={3.5}
        />
      </mesh>
      <mesh position={[-0.42, -0.05, 1.44]}>
        <boxGeometry args={[0.22, 0.12, 0.04]} />
        <meshStandardMaterial
          color="#00E5FF"
          emissive="#00E5FF"
          emissiveIntensity={3.5}
        />
      </mesh>

      {/* 5. Glowing Red/Pink Taillights (Rear) */}
      <mesh position={[0.48, 0.1, -1.26]}>
        <boxGeometry args={[0.18, 0.1, 0.04]} />
        <meshStandardMaterial
          color="#FF3D8B"
          emissive="#FF3D8B"
          emissiveIntensity={3.0}
        />
      </mesh>
      <mesh position={[-0.48, 0.1, -1.26]}>
        <boxGeometry args={[0.18, 0.1, 0.04]} />
        <meshStandardMaterial
          color="#FF3D8B"
          emissive="#FF3D8B"
          emissiveIntensity={3.0}
        />
      </mesh>

      {/* 6. Wheels (4 Cylinders with Rim Accents) */}
      {/* Front Right */}
      <group position={[0.64, -0.12, 0.9]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.24, 0.24, 0.14, 20]} />
          <meshStandardMaterial color="#0A0B12" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.075, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.02, 16]} />
          <meshStandardMaterial color="#00E5FF" emissive="#00E5FF" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* Front Left */}
      <group position={[-0.64, -0.12, 0.9]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.24, 0.24, 0.14, 20]} />
          <meshStandardMaterial color="#0A0B12" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.075, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.02, 16]} />
          <meshStandardMaterial color="#00E5FF" emissive="#00E5FF" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* Rear Right */}
      <group position={[0.64, -0.12, -0.65]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.24, 0.24, 0.14, 20]} />
          <meshStandardMaterial color="#0A0B12" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.075, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.02, 16]} />
          <meshStandardMaterial color="#7C5CFF" emissive="#7C5CFF" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* Rear Left */}
      <group position={[-0.64, -0.12, -0.65]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.24, 0.24, 0.14, 20]} />
          <meshStandardMaterial color="#0A0B12" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.075, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.02, 16]} />
          <meshStandardMaterial color="#7C5CFF" emissive="#7C5CFF" emissiveIntensity={1.2} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * 3 Pulsating Neon Ripple Rings expanding outward underneath
 */
function RippleRings() {
  const ring1 = useRef();
  const ring2 = useRef();
  const ring3 = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    // Scale and opacity expansion cycles
    if (ring1.current) {
      const s1 = 1 + ((t * 0.4) % 1) * 1.4;
      ring1.current.scale.set(s1, s1, 1);
      ring1.current.material.opacity = Math.max(0, 0.7 - ((t * 0.4) % 1) * 0.7);
    }
    if (ring2.current) {
      const s2 = 1 + (((t * 0.4) + 0.33) % 1) * 1.4;
      ring2.current.scale.set(s2, s2, 1);
      ring2.current.material.opacity = Math.max(0, 0.7 - (((t * 0.4) + 0.33) % 1) * 0.7);
    }
    if (ring3.current) {
      const s3 = 1 + (((t * 0.4) + 0.66) % 1) * 1.4;
      ring3.current.scale.set(s3, s3, 1);
      ring3.current.material.opacity = Math.max(0, 0.7 - (((t * 0.4) + 0.66) % 1) * 0.7);
    }
  });

  return (
    <group position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={ring1}>
        <ringGeometry args={[1.5, 1.54, 48]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2}>
        <ringGeometry args={[1.5, 1.54, 48]} />
        <meshBasicMaterial color="#7C5CFF" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring3}>
        <ringGeometry args={[1.5, 1.54, 48]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/**
 * Glowing dark platform base
 */
function DarkPlatform() {
  return (
    <group position={[0, 0, 0]}>
      {/* Cylindrical Platform */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[2.2, 2.3, 0.1, 40]} />
        <meshStandardMaterial
          color="#0C0E1A"
          roughness={0.25}
          metalness={0.85}
        />
      </mesh>

      {/* Glowing Neon Edge Ring */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.14, 2.2, 40]} />
        <meshBasicMaterial color="#7C5CFF" />
      </mesh>
    </group>
  );
}

/**
 * CSS Fallback in case WebGL is disabled or unsupported
 */
function FallbackTruckGraphic() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative p-8">
      <div className="relative w-64 h-48 flex items-center justify-center">
        {/* Glowing animated concentric SVG rings */}
        <div className="absolute inset-0 rounded-full border border-cyan/40 animate-ping opacity-25" />
        <div className="absolute inset-4 rounded-full border border-primary/50 animate-pulse opacity-40" />
        
        {/* Stylized vector delivery truck */}
        <div className="relative z-10 p-6 rounded-3xl bg-glass border border-glass-border shadow-glow flex flex-col items-center gap-2">
          <div className="w-20 h-12 bg-primary/20 border border-primary rounded-xl flex items-center justify-center">
            <span className="text-xs font-bold text-cyan tracking-wider">KovaiSwift</span>
          </div>
          <div className="flex gap-4">
            <div className="w-4 h-4 rounded-full bg-cyan shadow-glow-cyan" />
            <div className="w-4 h-4 rounded-full bg-pink shadow-glow-pink" />
          </div>
        </div>
      </div>
      <span className="text-xs text-muted mt-2">
        KovaiSwift 3D Delivery Rover Simulation Active
      </span>
    </div>
  );
}

export default function DeliveryTruckScene() {
  const [hasWebGlError, setHasWebGlError] = useState(false);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setHasWebGlError(true);
      }
    } catch (e) {
      setHasWebGlError(true);
    }
  }, []);

  if (hasWebGlError) {
    return <FallbackTruckGraphic />;
  }

  return (
    <div className="relative w-full h-[400px] sm:h-[460px] lg:h-[520px]">
      <Canvas
        camera={{ position: [3.8, 2.6, 4.2], fov: 42 }}
        dpr={[1, 1.75]} // Good performance on low-end laptops
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onError={() => setHasWebGlError(true)}
      >
        {/* Soft Ambient & Directional Lighting */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-4, 3, -3]} intensity={0.8} color="#7C5CFF" />
        <pointLight position={[0, 1.5, 3]} intensity={1.5} color="#00E5FF" />

        {/* Orbit Controls with gentle continuous 360 autoRotate */}
        <OrbitControls
          autoRotate
          autoRotateSpeed={1.8}
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.1} // Prevent dipping below ground
          minPolarAngle={Math.PI / 4}
        />

        {/* 3D Elements */}
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
          <LowPolyDeliveryTruck />
        </Float>

        <DarkPlatform />
        <RippleRings />
      </Canvas>
    </div>
  );
}
