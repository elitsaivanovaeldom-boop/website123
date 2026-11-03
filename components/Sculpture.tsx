"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
import * as THREE from "three";
import coastlines from "@/lib/earth-coastlines.json";
import {
  globePoint,
  globeLabels,
  arcPoints,
  GLOBE_RADIUS,
} from "@/lib/earth-globe";

function segmentGeometry(lines: [number, number, number][][]) {
  const positions: number[] = [];
  for (const line of lines)
    for (let index = 1; index < line.length; index++)
      positions.push(...line[index - 1], ...line[index]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  return geometry;
}

function GlobeSymbol({ label }: { label: (typeof globeLabels)[number] }) {
  const sprite = useRef<THREE.Sprite>(null);
  const vectors = useMemo(
    () => ({
      point: new THREE.Vector3(),
      center: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      view: new THREE.Vector3(),
    }),
    [],
  );
  useFrame(({ camera }) => {
    if (!sprite.current?.parent) return;
    sprite.current.getWorldPosition(vectors.point);
    sprite.current.parent.getWorldPosition(vectors.center);
    vectors.normal.copy(vectors.point).sub(vectors.center).normalize();
    camera.getWorldPosition(vectors.view);
    vectors.view.sub(vectors.point).normalize();
    sprite.current.visible = vectors.normal.dot(vectors.view) > 0.12;
  });
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 160;
    const context = canvas.getContext("2d")!;
    const north = label.hemisphere === "north";
    context.fillStyle = north ? "#f1ebfa" : "#e6f1e9";
    context.beginPath();
    context.roundRect(16, 20, 96, 120, 26);
    context.fill();
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "bold 92px Arial, sans-serif";
    context.fillStyle = north ? "#7764ab" : "#487e6b";
    context.fillText(label.text, 64, 84);
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    return result;
  }, [label]);
  useEffect(() => () => texture.dispose(), [texture]);
  const position = globePoint(
    label.longitude,
    label.latitude,
    GLOBE_RADIUS + 0.045,
  );
  return (
    <sprite
      ref={sprite}
      position={position}
      scale={[0.27, 0.34, 1]}
      renderOrder={2}
    >
      <spriteMaterial
        map={texture}
        transparent
        alphaTest={0.05}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );
}

function GlobeSurface() {
  const grid = useMemo(() => {
    const lines: [number, number, number][][] = [];
    for (let longitude = 0; longitude < 180; longitude += 15) {
      lines.push(
        Array.from({ length: 181 }, (_, index) => {
          const angle = (index * Math.PI) / 90;
          const lon = ((longitude - 20) * Math.PI) / 180;
          return [
            GLOBE_RADIUS * Math.sin(angle) * Math.sin(lon),
            GLOBE_RADIUS * Math.cos(angle),
            GLOBE_RADIUS * Math.sin(angle) * Math.cos(lon),
          ] as [number, number, number];
        }),
      );
    }
    for (let latitude = -75; latitude <= 75; latitude += 15)
      if (latitude !== 0)
        lines.push(
          Array.from({ length: 181 }, (_, index) =>
            globePoint(index * 2 - 180, latitude),
          ),
        );
    return segmentGeometry(lines);
  }, []);
  const land = useMemo(
    () =>
      segmentGeometry(
        coastlines.map((ring) => arcPoints(ring, GLOBE_RADIUS + 0.014)),
      ),
    [],
  );
  useEffect(
    () => () => {
      grid.dispose();
      land.dispose();
    },
    [grid, land],
  );
  return (
    <>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS - 0.015, 64, 40]} />
        <meshBasicMaterial color="#f9faf5" toneMapped={false} />
      </mesh>
      <lineSegments geometry={grid}>
        <lineBasicMaterial color="#b8accf" transparent opacity={0.42} />
      </lineSegments>
      <lineSegments geometry={land}>
        <lineBasicMaterial color="#73a694" transparent opacity={0.9} />
      </lineSegments>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[GLOBE_RADIUS + 0.01, 0.006, 6, 180]} />
        <meshBasicMaterial color="#dca272" toneMapped={false} />
      </mesh>
      {globeLabels.map((label) => (
        <GlobeSymbol key={label.hemisphere + label.text} label={label} />
      ))}
    </>
  );
}

function GlobeFallback({
  svgRef,
}: {
  svgRef: MutableRefObject<SVGSVGElement | null>;
}) {
  const paths = coastlines.map((ring) => {
    let path = "";
    let started = false;
    for (const [longitude, latitude] of ring) {
      const [x, y, z] = globePoint(longitude, latitude, 1);
      if (z < 0) {
        started = false;
        continue;
      }
      path += `${started ? "L" : "M"}${200 + x * 135},${180 - y * 135}`;
      started = true;
    }
    return path;
  });
  return (
    <svg
      ref={svgRef}
      className="figure-fallback"
      viewBox="0 0 400 360"
      aria-hidden="true"
    >
      <circle
        cx="200"
        cy="180"
        r="135"
        fill="#f9faf5"
        stroke="#b8accf"
        strokeWidth="0.7"
      />
      <g fill="none" stroke="#c3b8d6" strokeWidth="0.6">
        {[45, 90].map((radius) => (
          <ellipse key={radius} cx="200" cy="180" rx={radius} ry="135" />
        ))}
        {[-90, -45, 45, 90].map((offset) => (
          <ellipse
            key={offset}
            cx="200"
            cy={180 + offset}
            rx={Math.sqrt(135 ** 2 - offset ** 2)}
            ry="16"
          />
        ))}
      </g>
      <g fill="none" stroke="#73a694" strokeWidth="0.9">
        {paths.map((path, index) => (
          <path key={index} d={path} />
        ))}
      </g>
      <path d="M65 180H335" stroke="#dca272" strokeWidth="1.3" />
      {globeLabels.map((label) => {
        const [x, y, z] = globePoint(label.longitude, label.latitude, 1);
        return z > 0.2 ? (
          <text
            key={label.hemisphere + label.text}
            x={200 + x * 138}
            y={185 - y * 138}
            textAnchor="middle"
            fontSize="17"
            fontWeight="bold"
            fill={label.hemisphere === "north" ? "#7764ab" : "#487e6b"}
          >
            {label.text}
          </text>
        ) : null;
      })}
    </svg>
  );
}

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
  motion,
}: {
  rotation: MutableRefObject<Rotation>;
  dragging: MutableRefObject<Drag | null>;
  motion: MutableRefObject<boolean>;
}) {
  const figure = useRef<THREE.Group>(null);
  const floatTime = useRef(0);
  useFrame((_, delta) => {
    if (!figure.current) return;
    if (motion.current && !dragging.current) {
      const step = Math.min(delta, 0.05);
      rotation.current.y += step * 0.1;
      floatTime.current += step;
      figure.current.position.y = Math.sin(floatTime.current * 0.8) * 0.025;
    }
    if (!motion.current)
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
    <group ref={figure} rotation={[0, 0, 0]}>
      <GlobeSurface />
    </group>
  );
}

export default function Sculpture() {
  const [reduced, setReduced] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const rotation = useRef<Rotation>({ x: 0, y: 0 });
  const dragging = useRef<Drag | null>(null);
  const widget = useRef<HTMLDivElement>(null);
  const fallback = useRef<SVGSVGElement>(null);
  const automatic =
    visible && tabVisible && !reduced && !paused && webgl === true;
  const motion = useRef(automatic);
  motion.current = automatic;

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
      aria-label="Учебен глобус - числа над екватора и български букви под него"
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
          if (event.key === "Home") rotation.current = { x: 0, y: 0 };
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
        aria-label="Земно кълбо с фини меридиани, паралели и континенти. Над екватора са числата от 0 до 9, а под него са български букви. Завърта се с мишка, пръст или клавиатура."
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
            <PlayfulFigure
              rotation={rotation}
              dragging={dragging}
              motion={motion}
            />
          </Canvas>
        ) : webgl === false ? (
          <GlobeFallback svgRef={fallback} />
        ) : null}
      </div>
      <div className="figure-legend" role="group" aria-label="Двете полукълба">
        <span>
          <b className="north-mark">0-9</b> Числа над екватора
        </span>
        <span>
          <b className="south-mark">А Б В</b> Букви под екватора
        </span>
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
