"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
import * as THREE from "three";
import { alphabet, spreadCount } from "@/lib/alphabet";

const PAGE_WIDTH = 1.48;
const PAGE_HEIGHT = 2.05;

function createPageTexture(index: number) {
  const [letter, word] = alphabet[index];
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 1024;
  const context = canvas.getContext("2d")!;
  const accent = index % 2 === 0 ? "#7760b4" : "#4e8a75";
  context.fillStyle = "#fffdf4";
  context.fillRect(0, 0, 768, 1024);
  const shadow = context.createLinearGradient(0, 0, 768, 0);
  shadow.addColorStop(0, index % 2 ? "#ded5c655" : "#ffffff00");
  shadow.addColorStop(1, index % 2 ? "#ffffff00" : "#ded5c655");
  context.fillStyle = shadow;
  context.fillRect(0, 0, 768, 1024);
  context.textAlign = "center";
  context.fillStyle = "#968c9e";
  context.font = "24px Arial, sans-serif";
  context.fillText("МОЯТА ПЪРВА АЗБУКА", 384, 86);
  context.strokeStyle = "#e8e0d3";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(76, 120);
  context.lineTo(692, 120);
  context.stroke();

  // All artwork is drawn locally, including the Cyrillic text. No font/CDN request.
  context.fillStyle = index % 2 ? "#e3eee4" : "#eee6f8";
  context.beginPath();
  context.arc(384, 383, 215, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = accent;
  context.font = "bold 260px Arial, sans-serif";
  context.fillText(letter + letter.toLocaleLowerCase("bg"), 384, 468);

  context.fillStyle = "#453d57";
  context.font = "bold 55px Arial, sans-serif";
  context.fillText(word, 384, 692);
  context.fillStyle = "#8e8194";
  context.font = "29px Arial, sans-serif";
  context.fillText(
    letter === "Ь"
      ? "Ь е знак за мекост"
      : `${letter} като ${word.toLocaleLowerCase("bg")}`,
    384,
    748,
  );

  for (let dot = 0; dot < 5; dot++) {
    context.fillStyle = [accent, "#dba67c", "#b5c79a", "#d7c6e9", "#9fc6bb"][
      dot
    ];
    context.beginPath();
    context.arc(
      284 + dot * 50,
      845,
      dot === index % 5 ? 12 : 6,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.fillStyle = "#a79aa9";
  context.font = "24px Arial, sans-serif";
  context.fillText(String(index + 1).padStart(2, "0"), 384, 949);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function PageSurface({
  index,
  side = "right",
  back = false,
}: {
  index: number;
  side?: "left" | "right" | "turning";
  back?: boolean;
}) {
  const texture = useMemo(() => createPageTexture(index), [index]);
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_HEIGHT, 24, 1);
    const positions = plane.attributes.position;
    const uv = plane.attributes.uv;
    for (let point = 0; point < positions.count; point++) {
      const u = uv.getX(point);
      positions.setZ(point, Math.sin(u * Math.PI) * 0.035);
      if (back) uv.setX(point, 1 - u);
    }
    if (side === "turning") plane.translate(PAGE_WIDTH / 2, 0, 0);
    plane.computeVertexNormals();
    return plane;
  }, [side, back]);
  useEffect(() => () => texture.dispose(), [texture]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh
      geometry={geometry}
      position={
        side === "turning"
          ? [0, 0, 0]
          : [side === "left" ? -0.76 : 0.76, 0, 0.09]
      }
    >
      <meshBasicMaterial
        map={texture}
        toneMapped={false}
        side={back ? THREE.BackSide : THREE.FrontSide}
      />
    </mesh>
  );
}

type Flip = { direction: 1 | -1; target: number };

function TurningPage({
  spread,
  flip,
  onComplete,
}: {
  spread: number;
  flip: Flip;
  onComplete: () => void;
}) {
  const page = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const completed = useRef(false);
  useFrame((_, delta) => {
    if (!page.current || completed.current) return;
    elapsed.current += delta;
    const progress = Math.min(elapsed.current / 0.7, 1);
    const eased = progress * progress * (3 - 2 * progress);
    page.current.rotation.y =
      flip.direction === 1 ? -Math.PI * eased : -Math.PI * (1 - eased);
    if (progress === 1) {
      completed.current = true;
      onComplete();
    }
  });
  const front = flip.direction === 1 ? spread * 2 + 1 : flip.target * 2 + 1;
  const back = flip.direction === 1 ? flip.target * 2 : spread * 2;
  return (
    <group
      ref={page}
      position={[0, 0, 0.15]}
      rotation={[0, flip.direction === 1 ? 0 : -Math.PI, 0]}
    >
      <PageSurface index={front} side="turning" />
      <PageSurface index={back} side="turning" back />
    </group>
  );
}

function BookModel({
  spread,
  flip,
  onComplete,
  reduced,
  pointer,
}: {
  spread: number;
  flip: Flip | null;
  onComplete: () => void;
  reduced: boolean;
  pointer: MutableRefObject<{ x: number; y: number }>;
}) {
  const book = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!book.current) return;
    const x = 0.12 + pointer.current.y * 0.22;
    const y = -0.12 + pointer.current.x * 0.48;
    if (reduced) book.current.rotation.set(x, y, -0.06);
    else {
      book.current.rotation.x = THREE.MathUtils.damp(
        book.current.rotation.x,
        x,
        6,
        delta,
      );
      book.current.rotation.y = THREE.MathUtils.damp(
        book.current.rotation.y,
        y,
        6,
        delta,
      );
    }
  });
  const left = flip?.direction === -1 ? flip.target * 2 : spread * 2;
  const right = flip?.direction === 1 ? flip.target * 2 + 1 : spread * 2 + 1;
  return (
    <group ref={book} rotation={[0.12, -0.12, -0.06]}>
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <RoundedBox
            args={[1.64, 2.24, 0.1]}
            radius={0.045}
            smoothness={3}
            position={[side * 0.78, 0, -0.11]}
          >
            <meshStandardMaterial color="#8670b6" roughness={0.65} />
          </RoundedBox>
          {[0, 1, 2, 3].map((layer) => (
            <mesh
              key={layer}
              position={[side * 0.76, 0, -0.037 + layer * 0.025]}
            >
              <boxGeometry args={[1.49, 2.065, 0.018]} />
              <meshStandardMaterial
                color={layer % 2 ? "#eee5d4" : "#fff9e9"}
                roughness={1}
              />
            </mesh>
          ))}
        </group>
      ))}
      <RoundedBox
        args={[0.13, 2.25, 0.18]}
        position={[0, 0, -0.08]}
        radius={0.04}
        smoothness={3}
      >
        <meshStandardMaterial color="#69518f" />
      </RoundedBox>
      <mesh position={[0.62, -1.15, -0.085]}>
        <boxGeometry args={[0.16, 0.5, 0.012]} />
        <meshStandardMaterial color="#6ca891" />
      </mesh>
      <PageSurface index={left} side="left" />
      <PageSurface index={right} />
      {flip && (
        <TurningPage
          key={`${spread}-${flip.direction}`}
          spread={spread}
          flip={flip}
          onComplete={onComplete}
        />
      )}
    </group>
  );
}

export default function Sculpture() {
  const [reduced, setReduced] = useState(false);
  const [spread, setSpread] = useState(0);
  const [flip, setFlip] = useState<Flip | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const start = useRef<{ x: number; y: number; id: number } | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    const follow = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.buttons !== 0) return;
      pointer.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      };
    };
    window.addEventListener("pointermove", follow, { passive: true });
    return () => {
      query.removeEventListener("change", sync);
      window.removeEventListener("pointermove", follow);
    };
  }, []);

  const finishFlip = useCallback(() => {
    if (!flip) return;
    setSpread(flip.target);
    setFlip(null);
  }, [flip]);
  function turn(direction: 1 | -1) {
    const target = spread + direction;
    if (flip || target < 0 || target >= spreadCount) return;
    if (reduced) setSpread(target);
    else setFlip({ direction, target });
  }
  function release(event: ReactPointerEvent<HTMLDivElement>) {
    const origin = start.current;
    start.current = null;
    if (!origin || origin.id !== event.pointerId) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3)
      turn(dx < 0 ? 1 : -1);
    else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const bounds = event.currentTarget.getBoundingClientRect();
      turn(event.clientX > bounds.left + bounds.width / 2 ? 1 : -1);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return (
    <div
      className="book-widget"
      role="group"
      aria-label="Моята първа азбука - интерактивна 3D книга"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          turn(event.key === "ArrowRight" ? 1 : -1);
        }
      }}
    >
      <div
        className="book-canvas"
        role="img"
        aria-label={`Отворена книга: ${alphabet[spread * 2][0]} като ${alphabet[spread * 2][1]}, ${alphabet[spread * 2 + 1][0]}${alphabet[spread * 2 + 1][0] === "Ь" ? " - знак за мекост" : ` като ${alphabet[spread * 2 + 1][1]}`}. Движи мишката, за да завъртиш книгата.`}
        onPointerDown={(event) => {
          start.current = {
            x: event.clientX,
            y: event.clientY,
            id: event.pointerId,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerUp={release}
        onPointerCancel={() => {
          start.current = null;
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 5.2], fov: 43 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: "low-power" }}
          fallback={
            <div className="book-fallback">
              <strong>
                {alphabet[spread * 2][0]} · {alphabet[spread * 2 + 1][0]}
              </strong>
              <span>
                {alphabet[spread * 2][1]} · {alphabet[spread * 2 + 1][1]}
              </span>
            </div>
          }
        >
          <ambientLight intensity={1.8} />
          <directionalLight position={[-3, 4, 5]} intensity={2.5} />
          <Float
            enabled={!reduced}
            speed={1}
            rotationIntensity={0.02}
            floatIntensity={0.1}
          >
            <BookModel
              spread={spread}
              flip={flip}
              onComplete={finishFlip}
              reduced={reduced}
              pointer={pointer}
            />
          </Float>
        </Canvas>
      </div>
      <div className="book-controls">
        <button
          type="button"
          aria-label="Предишни букви"
          disabled={spread === 0 || !!flip}
          onClick={() => turn(-1)}
        >
          ←
        </button>
        <div className="book-page-label" role="status" aria-live="polite">
          <strong>
            {alphabet[spread * 2][0]}
            {alphabet[spread * 2][0].toLocaleLowerCase("bg")} ·{" "}
            {alphabet[spread * 2 + 1][0]}
            {alphabet[spread * 2 + 1][0].toLocaleLowerCase("bg")}
          </strong>
          <span>
            {spread + 1} / {spreadCount}
          </span>
        </div>
        <button
          type="button"
          aria-label="Следващи букви"
          disabled={spread === spreadCount - 1 || !!flip}
          onClick={() => turn(1)}
        >
          →
        </button>
      </div>
      <p className="book-hint">
        Движи мишката · Разлиствай с бутоните или с плъзгане
      </p>
    </div>
  );
}
