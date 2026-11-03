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
} from "react";
import * as THREE from "three";
import { alphabet, spreadCount } from "@/lib/alphabet";

const PAGE_WIDTH = 1.48;
const PAGE_HEIGHT = 2.05;

function createPageTexture(index: number, handwritingReady: boolean) {
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
  context.fillText("МОЯТА ВЪЛШЕБНА КНИЖКА", 384, 86);
  context.strokeStyle = "#e8e0d3";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(76, 120);
  context.lineTo(692, 120);
  context.stroke();

  // Both typefaces are rendered locally; handwriting waits for the bundled font.
  context.fillStyle = "#968c9e";
  context.font = "24px Arial, sans-serif";
  context.fillText("ПЕЧАТНИ БУКВИ", 384, 176);
  context.fillStyle = index % 2 ? "#e3eee4" : "#eee6f8";
  context.beginPath();
  context.arc(384, 290, 125, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = accent;
  context.font = "bold 180px Arial, sans-serif";
  context.fillText(letter + letter.toLocaleLowerCase("bg"), 384, 355);

  context.fillStyle = "#968c9e";
  context.font = "24px Arial, sans-serif";
  context.fillText("РЪКОПИСНИ БУКВИ", 384, 452);
  for (const [line, y] of [490, 570, 670, 730].entries()) {
    context.strokeStyle = line === 2 ? "#b6a7ce" : "#e5dcee";
    context.setLineDash(line === 1 ? [8, 8] : []);
    context.beginPath();
    context.moveTo(100, y);
    context.lineTo(668, y);
    context.stroke();
  }
  context.setLineDash([]);
  context.fillStyle = accent;
  if (handwritingReady) {
    context.font = '220px "Malki Handwriting"';
    context.fillText(letter + letter.toLocaleLowerCase("bg"), 384, 670);
  } else {
    context.font = "24px Arial, sans-serif";
    context.fillText("Зареждане на ръкописните букви…", 384, 610);
  }

  context.fillStyle = "#453d57";
  context.font = "bold 50px Arial, sans-serif";
  context.fillText(word, 384, 825);
  context.fillStyle = "#8e8194";
  context.font = "29px Arial, sans-serif";
  context.fillText(`${letter} като ${word.toLocaleLowerCase("bg")}`, 384, 880);

  for (let dot = 0; dot < 5; dot++) {
    context.fillStyle = [accent, "#dba67c", "#b5c79a", "#d7c6e9", "#9fc6bb"][
      dot
    ];
    context.beginPath();
    context.arc(
      284 + dot * 50,
      920,
      dot === index % 5 ? 12 : 6,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.fillStyle = "#a79aa9";
  context.font = "24px Arial, sans-serif";
  context.fillText(String(index + 1).padStart(2, "0"), 384, 981);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function PageSurface({
  index,
  side = "right",
  back = false,
  handwritingReady,
}: {
  index: number;
  side?: "left" | "right" | "turning";
  back?: boolean;
  handwritingReady: boolean;
}) {
  const texture = useMemo(
    () => createPageTexture(index, handwritingReady),
    [index, handwritingReady],
  );
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
  handwritingReady,
}: {
  spread: number;
  flip: Flip;
  onComplete: () => void;
  handwritingReady: boolean;
}) {
  const page = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const completed = useRef(false);
  useFrame((_, delta) => {
    if (!page.current || completed.current) return;
    elapsed.current += delta;
    const progress = Math.min(elapsed.current / 0.9, 1);
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
      <PageSurface
        index={front}
        side="turning"
        handwritingReady={handwritingReady}
      />
      <PageSurface
        index={back}
        side="turning"
        back
        handwritingReady={handwritingReady}
      />
    </group>
  );
}

function BookModel({
  spread,
  flip,
  onComplete,
  reduced,
  pointer,
  handwritingReady,
}: {
  spread: number;
  flip: Flip | null;
  onComplete: () => void;
  reduced: boolean;
  pointer: MutableRefObject<{ x: number; y: number }>;
  handwritingReady: boolean;
}) {
  const book = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!book.current) return;
    const x = 0.28 + pointer.current.y * 0.18;
    const y = -0.24 + pointer.current.x * 0.4;
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
    <group ref={book} rotation={[0.28, -0.24, -0.06]}>
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <RoundedBox
            args={[1.64, 2.24, 0.16]}
            radius={0.045}
            smoothness={3}
            position={[side * 0.78, 0, -0.14]}
          >
            <meshStandardMaterial
              color={side === -1 ? "#91bba6" : "#9b81c3"}
              roughness={0.65}
            />
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
        <meshStandardMaterial color="#d3a172" />
      </RoundedBox>
      <mesh position={[0.62, -1.15, -0.085]}>
        <boxGeometry args={[0.16, 0.5, 0.012]} />
        <meshStandardMaterial color="#6ca891" />
      </mesh>
      <PageSurface
        index={left}
        side="left"
        handwritingReady={handwritingReady}
      />
      <PageSurface index={right} handwritingReady={handwritingReady} />
      {flip && (
        <TurningPage
          key={`${spread}-${flip.direction}`}
          spread={spread}
          flip={flip}
          onComplete={onComplete}
          handwritingReady={handwritingReady}
        />
      )}
    </group>
  );
}

export default function Sculpture() {
  const [reduced, setReduced] = useState(false);
  const [spread, setSpread] = useState(0);
  const [flip, setFlip] = useState<Flip | null>(null);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [fontState, setFontState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [fontAttempt, setFontAttempt] = useState(0);
  const pointer = useRef({ x: 0, y: 0 });
  const widget = useRef<HTMLDivElement>(null);
  const direction = useRef<1 | -1>(1);
  const automatic =
    visible && tabVisible && !reduced && !paused && fontState === "ready";

  useEffect(() => {
    let active = true;
    setFontState("loading");
    const font = new FontFace(
      "Malki Handwriting",
      'url("/fonts/MarckScript-Regular.ttf")',
      { style: "normal", weight: "400" },
    );
    font
      .load()
      .then((loaded) => {
        if (!active) return;
        document.fonts.add(loaded);
        setFontState("ready");
      })
      .catch(() => {
        if (active) setFontState("error");
      });
    return () => {
      active = false;
      document.fonts.delete(font);
    };
  }, [fontAttempt]);

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
    const syncTab = () => setTabVisible(!document.hidden);
    syncTab();
    window.addEventListener("pointermove", follow, { passive: true });
    document.addEventListener("visibilitychange", syncTab);
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    if (widget.current) observer.observe(widget.current);
    return () => {
      query.removeEventListener("change", sync);
      window.removeEventListener("pointermove", follow);
      document.removeEventListener("visibilitychange", syncTab);
      observer.disconnect();
    };
  }, []);

  const finishFlip = useCallback(() => {
    if (!flip) return;
    setSpread(flip.target);
    setFlip(null);
  }, [flip]);

  useEffect(() => {
    if (flip) {
      if (!automatic) {
        finishFlip();
        return;
      }
      // Also complete the turn when WebGL is unavailable and the text fallback is shown.
      const timer = window.setTimeout(finishFlip, 950);
      return () => window.clearTimeout(timer);
    }
    if (!automatic) return;
    const timer = window.setTimeout(() => {
      const nextDirection =
        spread === 0 ? 1 : spread === spreadCount - 1 ? -1 : direction.current;
      direction.current = nextDirection;
      setFlip({ direction: nextDirection, target: spread + nextDirection });
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [automatic, spread, flip, finishFlip]);

  return (
    <div
      ref={widget}
      className="book-widget"
      role="group"
      aria-label="Жива книжка с печатни и ръкописни букви"
      data-handwriting={fontState}
      data-animation={automatic ? "playing" : "paused"}
    >
      <div
        className="book-canvas"
        role="img"
        aria-label={`Отворена книга с печатни и ръкописни главни и малки букви: ${alphabet[spread * 2][0]} като ${alphabet[spread * 2][1]}, ${alphabet[spread * 2 + 1][0]} като ${alphabet[spread * 2 + 1][1]}. Страниците се разлистват сами, а движението на мишката накланя книгата.`}
      >
        <Canvas
          camera={{ position: [0, 0, 5.2], fov: 43 }}
          dpr={[1, 1.5]}
          frameloop={visible && tabVisible ? "always" : "demand"}
          gl={{ antialias: true, powerPreference: "low-power" }}
          fallback={
            <div className="book-fallback">
              <strong>
                {alphabet[spread * 2][0]} · {alphabet[spread * 2 + 1][0]}
              </strong>
              {fontState === "ready" && (
                <span className="handwriting-preview">
                  {alphabet[spread * 2][0]}
                  {alphabet[spread * 2][0].toLocaleLowerCase("bg")} ·{" "}
                  {alphabet[spread * 2 + 1][0]}
                  {alphabet[spread * 2 + 1][0].toLocaleLowerCase("bg")}
                </span>
              )}
              <span>
                {alphabet[spread * 2][1]} · {alphabet[spread * 2 + 1][1]}
              </span>
            </div>
          }
        >
          <ambientLight intensity={1.8} />
          <directionalLight position={[-3, 4, 5]} intensity={2.5} />
          <Float
            enabled={automatic}
            speed={1}
            rotationIntensity={0.03}
            floatIntensity={0.13}
          >
            <BookModel
              spread={spread}
              flip={flip}
              onComplete={finishFlip}
              reduced={reduced || paused}
              pointer={pointer}
              handwritingReady={fontState === "ready"}
            />
          </Float>
        </Canvas>
      </div>
      <div className="book-controls">
        <div className="book-page-label">
          <strong>
            {alphabet[spread * 2][0]}
            {alphabet[spread * 2][0].toLocaleLowerCase("bg")} ·{" "}
            {alphabet[spread * 2 + 1][0]}
            {alphabet[spread * 2 + 1][0].toLocaleLowerCase("bg")}
          </strong>
          <span>Печатни и ръкописни букви</span>
        </div>
        {!reduced && (
          <button
            className="book-pause"
            type="button"
            aria-label={
              paused ? "Продължи разлистването" : "Спри разлистването"
            }
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? "Продължи" : "Пауза"}
          </button>
        )}
      </div>
      {fontState === "error" ? (
        <div className="book-font-error" role="alert">
          Ръкописните букви не се заредиха.
          <button onClick={() => setFontAttempt((attempt) => attempt + 1)}>
            Опитай отново
          </button>
        </div>
      ) : (
        <p className="book-writing-note" aria-live="polite">
          {fontState === "loading"
            ? "Зареждаме ръкописните букви…"
            : reduced
              ? "Разгледай буквите спокойно."
              : "Страниците оживяват сами. Просто погледай."}
        </p>
      )}
      <p className="book-hint">Движи мишката и книжката ще те последва.</p>
    </div>
  );
}
