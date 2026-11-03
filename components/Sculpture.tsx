"use client";

import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

function LearningPlanet({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const dragging = useRef(false);
  const previous = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: 0.15, y: 0 });

  useEffect(() => {
    const followMouse = (event: PointerEvent) => {
      if (
        event.pointerType !== "mouse" ||
        event.buttons !== 0 ||
        dragging.current
      )
        return;
      rotation.current.y += event.movementX * 0.006;
      rotation.current.x = THREE.MathUtils.clamp(
        rotation.current.x + event.movementY * 0.004,
        -0.8,
        0.8,
      );
    };
    window.addEventListener("pointermove", followMouse, { passive: true });
    return () => window.removeEventListener("pointermove", followMouse);
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;
    if (reduced) {
      group.current.rotation.set(rotation.current.x, rotation.current.y, 0);
      return;
    }
    if (!reduced && !dragging.current) rotation.current.y += delta * 0.1;
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      rotation.current.x,
      7,
      delta,
    );
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      rotation.current.y,
      7,
      delta,
    );
  });
  const down = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    dragging.current = true;
    previous.current = { x: event.clientX, y: event.clientY };
    (event.target as Element).setPointerCapture?.(event.pointerId);
  };
  const move = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return;
    rotation.current.y += (event.clientX - previous.current.x) * 0.008;
    rotation.current.x = THREE.MathUtils.clamp(
      rotation.current.x + (event.clientY - previous.current.y) * 0.006,
      -0.8,
      0.8,
    );
    previous.current = { x: event.clientX, y: event.clientY };
  };
  const up = (event: ThreeEvent<PointerEvent>) => {
    dragging.current = false;
    const target = event.target as Element;
    if (target.hasPointerCapture?.(event.pointerId))
      target.releasePointerCapture(event.pointerId);
  };

  return (
    <group ref={group}>
      {/* A transparent hit surface makes the fine lines easy to drag. */}
      <mesh
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onLostPointerCapture={() => {
          dragging.current = false;
        }}
      >
        <sphereGeometry args={[1.95, 24, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <group rotation={[0.15, 0, -0.28]}>
        {Array.from({ length: 18 }, (_, index) => (
          <mesh
            key={`meridian-${index}`}
            rotation={[0, (index * Math.PI) / 18, 0]}
          >
            <torusGeometry args={[1.25, 0.006, 5, 100]} />
            <meshBasicMaterial color="#7970ca" transparent opacity={0.5} />
          </mesh>
        ))}
        {Array.from({ length: 11 }, (_, index) => {
          const height = (index - 5) * 0.2;
          return (
            <mesh
              key={`latitude-${index}`}
              position={[0, height, 0]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <torusGeometry
                args={[Math.sqrt(1.25 ** 2 - height ** 2), 0.006, 5, 100]}
              />
              <meshBasicMaterial color="#7970ca" transparent opacity={0.5} />
            </mesh>
          );
        })}
      </group>
      <group rotation={[1.12, 0.2, 0.35]}>
        <mesh>
          <torusGeometry args={[1.8, 0.012, 8, 180]} />
          <meshBasicMaterial color="#5ba89c" />
        </mesh>
        <mesh position={[1.8, 0, 0]}>
          <sphereGeometry args={[0.115, 20, 16]} />
          <meshStandardMaterial color="#5ba89c" roughness={0.45} />
        </mesh>
      </group>
      <group rotation={[0.6, -0.55, -0.9]}>
        <mesh>
          <torusGeometry args={[1.65, 0.01, 8, 180]} />
          <meshBasicMaterial color="#eeb083" />
        </mesh>
        <mesh position={[-1.65, 0, 0]} rotation={[0.4, 0.5, 0.2]}>
          <octahedronGeometry args={[0.16]} />
          <meshStandardMaterial color="#eeb083" roughness={0.5} />
        </mesh>
      </group>
      <mesh rotation={[0.3, 0.5, 0.2]}>
        <octahedronGeometry args={[0.36]} />
        <meshStandardMaterial color="#d6d0f3" roughness={0.4} />
      </mesh>
    </group>
  );
}

export default function Sculpture() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return (
    <div
      className="planet-canvas"
      role="img"
      aria-label="Интерактивна планета на знанието, изтъкана от фини цветни линии. Движи мишката, за да я завъртиш, или плъзни с пръст."
    >
      <Canvas
        camera={{ position: [0, 0, 5.6], fov: 46 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "low-power" }}
        fallback={
          <div className="planet-fallback">
            А · Б · В<br />
            <span>Цяла вселена от знания те очаква!</span>
          </div>
        }
      >
        <ambientLight intensity={2} />
        <directionalLight position={[3, 4, 5]} intensity={3} />
        <Float
          enabled={!reduced}
          speed={1.2}
          rotationIntensity={0.06}
          floatIntensity={0.15}
        >
          <LearningPlanet reduced={reduced} />
        </Float>
      </Canvas>
    </div>
  );
}
