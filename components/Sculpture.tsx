"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Lightformer } from "@react-three/drei";
import {
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
import * as THREE from "three";

interface Rotation {
  x: number;
  y: number;
}
interface Drag {
  id: number;
  x: number;
  y: number;
}

function PlayfulFigure({
  rotation,
  dragging,
  automatic,
}: {
  rotation: MutableRefObject<Rotation>;
  dragging: MutableRefObject<Drag | null>;
  automatic: boolean;
}) {
  const figure = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!figure.current) return;
    if (automatic && !dragging.current)
      rotation.current.y += Math.min(delta, 0.05) * 0.1;
    if (!automatic)
      figure.current.rotation.set(rotation.current.x, rotation.current.y, 0);
    else {
      figure.current.rotation.x = THREE.MathUtils.damp(
        figure.current.rotation.x,
        rotation.current.x,
        7,
        delta,
      );
      figure.current.rotation.y = THREE.MathUtils.damp(
        figure.current.rotation.y,
        rotation.current.y,
        7,
        delta,
      );
    }
  });
  return (
    <group ref={figure} rotation={[0.15, 0, 0]}>
      <mesh rotation={[0.28, 0.2, 0.2]}>
        <torusKnotGeometry args={[1.04, 0.14, 220, 14, 2, 3]} />
        <meshPhysicalMaterial
          color="#a491d5"
          metalness={0.45}
          roughness={0.24}
          clearcoat={1}
          clearcoatRoughness={0.12}
          envMapIntensity={1.4}
        />
      </mesh>
      <mesh rotation={[1.1, 0.65, 0.7]} scale={0.82}>
        <torusKnotGeometry args={[1.1, 0.075, 180, 12, 3, 4]} />
        <meshPhysicalMaterial
          color="#86c8b1"
          metalness={0.4}
          roughness={0.25}
          clearcoat={1}
          envMapIntensity={1.4}
        />
      </mesh>
      <mesh rotation={[0.85, -0.55, 0.3]}>
        <torusGeometry args={[1.5, 0.025, 10, 160]} />
        <meshPhysicalMaterial
          color="#e8b27f"
          metalness={0.5}
          roughness={0.22}
          clearcoat={1}
          envMapIntensity={1.5}
        />
      </mesh>
    </group>
  );
}

export default function Sculpture() {
  const [reduced, setReduced] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const rotation = useRef<Rotation>({ x: 0.15, y: 0 });
  const dragging = useRef<Drag | null>(null);
  const widget = useRef<HTMLDivElement>(null);
  const fallback = useRef<SVGSVGElement>(null);
  const automatic =
    visible && tabVisible && !reduced && !paused && webgl === true;

  function syncFallback() {
    if (fallback.current)
      fallback.current.style.transform = `perspective(600px) rotateX(${rotation.current.x * 25}deg) rotateY(${rotation.current.y * 35}deg)`;
  }

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    const follow = (event: PointerEvent) => {
      if (
        event.pointerType !== "mouse" ||
        event.buttons !== 0 ||
        dragging.current
      )
        return;
      rotation.current.y += event.movementX * 0.006;
      rotation.current.x = THREE.MathUtils.clamp(
        rotation.current.x + event.movementY * 0.003,
        -1,
        1,
      );
      syncFallback();
    };
    const syncTab = () => setTabVisible(!document.hidden);
    syncTab();
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    if (widget.current) observer.observe(widget.current);
    const probe = document.createElement("canvas");
    try {
      const context = probe.getContext("webgl2");
      setWebgl(!!context);
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      setWebgl(false);
    }
    window.addEventListener("pointermove", follow, { passive: true });
    document.addEventListener("visibilitychange", syncTab);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", sync);
      window.removeEventListener("pointermove", follow);
      document.removeEventListener("visibilitychange", syncTab);
    };
  }, []);

  function move(event: ReactPointerEvent<HTMLDivElement>) {
    const previous = dragging.current;
    if (!previous || previous.id !== event.pointerId) return;
    rotation.current.y += (event.clientX - previous.x) * 0.012;
    rotation.current.x = THREE.MathUtils.clamp(
      rotation.current.x + (event.clientY - previous.y) * 0.008,
      -1,
      1,
    );
    dragging.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    syncFallback();
  }
  function release(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragging.current?.id !== event.pointerId) return;
    dragging.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div
      ref={widget}
      className="figure-widget"
      role="group"
      aria-label="Цветна 3D фигура от преплетени форми"
      aria-describedby="figure-hint"
      tabIndex={0}
      data-renderer={webgl === null ? "loading" : webgl ? "3d" : "svg"}
      data-animation={automatic ? "playing" : "paused"}
      onKeyDown={(event) => {
        if (
          ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(
            event.key,
          )
        ) {
          event.preventDefault();
          if (event.key === "Home") rotation.current = { x: 0.15, y: 0 };
          else if (event.key === "ArrowLeft" || event.key === "ArrowRight")
            rotation.current.y += event.key === "ArrowRight" ? 0.25 : -0.25;
          else
            rotation.current.x = THREE.MathUtils.clamp(
              rotation.current.x + (event.key === "ArrowDown" ? 0.15 : -0.15),
              -1,
              1,
            );
          syncFallback();
        }
      }}
    >
      <div
        className="figure-canvas"
        role="img"
        aria-label="Обемна лавандулова и ментова скулптура с тънък прасковен обръч. Завърта се с движение на мишката, плъзгане на пръст или стрелките на клавиатурата."
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return;
          dragging.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={move}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={() => {
          dragging.current = null;
        }}
      >
        {webgl === true ? (
          <Canvas
            camera={{ position: [0, 0, 5.4], fov: 44 }}
            dpr={[1, 1.5]}
            frameloop={visible && tabVisible ? "always" : "demand"}
            gl={{ antialias: true, powerPreference: "low-power" }}
          >
            <ambientLight intensity={1.2} />
            <directionalLight position={[4, 5, 6]} intensity={2.3} />
            <directionalLight
              position={[-4, -2, 3]}
              intensity={1.2}
              color="#ffe0bb"
            />
            <Float
              enabled={automatic}
              speed={0.8}
              rotationIntensity={0.025}
              floatIntensity={0.1}
            >
              <PlayfulFigure
                rotation={rotation}
                dragging={dragging}
                automatic={automatic}
              />
            </Float>
            <Environment resolution={64} frames={1}>
              <Lightformer
                intensity={3}
                position={[0, 5, -5]}
                rotation={[Math.PI / 2, 0, 0]}
                scale={[10, 10, 1]}
              />
              <Lightformer
                intensity={2}
                position={[-5, 0, 2]}
                rotation={[0, Math.PI / 2, 0]}
                scale={[6, 10, 1]}
              />
              <Lightformer
                intensity={2}
                position={[5, 2, 3]}
                rotation={[0, -Math.PI / 2, 0]}
                scale={[6, 10, 1]}
              />
            </Environment>
          </Canvas>
        ) : webgl === false ? (
          <svg
            ref={fallback}
            className="figure-fallback"
            viewBox="0 0 400 360"
            aria-hidden="true"
          >
            <g fill="none" strokeLinecap="round">
              <ellipse
                cx="200"
                cy="180"
                rx="85"
                ry="120"
                stroke="#a491d5"
                strokeWidth="22"
                transform="rotate(45 200 180)"
              />
              <ellipse
                cx="200"
                cy="180"
                rx="85"
                ry="120"
                stroke="#86c8b1"
                strokeWidth="12"
                transform="rotate(-45 200 180)"
              />
              <ellipse
                cx="200"
                cy="180"
                rx="155"
                ry="65"
                stroke="#e8b27f"
                strokeWidth="3"
                transform="rotate(-20 200 180)"
              />
            </g>
          </svg>
        ) : null}
      </div>
      <div className="figure-controls">
        <p id="figure-hint">
          Движи мишката или завърти с пръст.
          <span>Можеш да използваш и стрелките на клавиатурата.</span>
        </p>
        {!reduced && webgl === true && (
          <button
            className="figure-pause"
            type="button"
            aria-label={paused ? "Продължи движението" : "Спри движението"}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? "Продължи" : "Пауза"}
          </button>
        )}
      </div>
    </div>
  );
}
