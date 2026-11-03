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
import {
  pencilLessons,
  WRITING_SECONDS,
  PICTURE_SECONDS,
  LESSON_SECONDS,
  type DrawingPhase,
  type PencilLesson,
} from "@/lib/pencil-lessons";

interface Point {
  x: number;
  y: number;
}
interface Stroke {
  points: Point[];
  length: number;
}

function samplePaths(paths: string[]): Stroke[] {
  return paths.map((definition) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", definition);
    const length = path.getTotalLength();
    const steps = Math.max(2, Math.ceil(length / 2));
    return {
      length,
      points: Array.from({ length: steps + 1 }, (_, index) => {
        const point = path.getPointAtLength((index / steps) * length);
        return { x: point.x, y: point.y };
      }),
    };
  });
}

function trace(
  context: CanvasRenderingContext2D,
  strokes: Stroke[],
  progress: number,
  color: string,
  width: number,
): Point {
  let remaining =
    strokes.reduce((sum, stroke) => sum + stroke.length, 0) *
    THREE.MathUtils.clamp(progress, 0, 1);
  let tip = strokes[0].points[0];
  context.strokeStyle = color;
  context.lineWidth = width;
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const stroke of strokes) {
    if (remaining <= 0) break;
    const fraction = Math.min(remaining / stroke.length, 1);
    const position = fraction * (stroke.points.length - 1);
    const whole = Math.floor(position);
    context.beginPath();
    context.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let index = 1; index <= whole; index++)
      context.lineTo(stroke.points[index].x, stroke.points[index].y);
    tip = stroke.points[whole];
    if (whole < stroke.points.length - 1) {
      const next = stroke.points[whole + 1];
      tip = {
        x: THREE.MathUtils.lerp(tip.x, next.x, position - whole),
        y: THREE.MathUtils.lerp(tip.y, next.y, position - whole),
      };
      context.lineTo(tip.x, tip.y);
    }
    context.stroke();
    remaining -= stroke.length;
  }
  return tip;
}

function makeDrawing(lesson: PencilLesson) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 576;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return {
    canvas,
    context: canvas.getContext("2d")!,
    texture,
    handwriting: samplePaths(lesson.handwriting),
    picture: samplePaths(lesson.picture),
  };
}

function paintDrawing(
  drawing: ReturnType<typeof makeDrawing>,
  lesson: PencilLesson,
  elapsed: number,
) {
  const { context } = drawing;
  const writing = Math.min(elapsed / WRITING_SECONDS, 1);
  const picture = THREE.MathUtils.clamp(
    (elapsed - WRITING_SECONDS) / PICTURE_SECONDS,
    0,
    1,
  );
  context.fillStyle = "#fffdf5";
  context.fillRect(0, 0, 768, 576);
  context.textAlign = "center";
  context.fillStyle = "#8b7a9e";
  context.font = "bold 15px Arial, sans-serif";
  context.fillText("ЕДНА БУКВА. ЕДНО ОТКРИТИЕ.", 384, 47);
  context.font = "14px Arial, sans-serif";
  context.fillStyle = "#8e809b";
  context.fillText("РЪКОПИСНО", 235, 106);
  context.lineWidth = 1;
  for (const y of [170, 257, 346, 374]) {
    context.strokeStyle = y === 346 ? "#bba8d4" : "#e8dfef";
    context.setLineDash(y === 257 ? [5, 6] : []);
    context.beginPath();
    context.moveTo(72, y);
    context.lineTo(410, y);
    context.stroke();
  }
  context.setLineDash([]);
  const letterTip = trace(context, drawing.handwriting, writing, "#7860b3", 5);
  if (writing === 1) {
    context.fillStyle = "#eee7f8";
    context.beginPath();
    context.roundRect(495, 83, 155, 124, 20);
    context.fill();
    context.fillStyle = "#867494";
    context.font = "12px Arial, sans-serif";
    context.fillText("ПЕЧАТНО", 572, 109);
    context.fillStyle = "#7760b3";
    context.font = "bold 66px Arial, sans-serif";
    context.fillText(
      lesson.letter + lesson.letter.toLocaleLowerCase("bg"),
      572,
      179,
    );
  }
  if (picture === 1) {
    context.fillStyle = lesson.pictureKind === "bus" ? "#dfeee2" : "#f8dfc7";
    context.fill(new Path2D(lesson.picture[0]));
    if (lesson.pictureKind === "bus") {
      context.fillStyle = "#fffdf5";
      for (const windowPath of lesson.picture.slice(1, 4))
        context.fill(new Path2D(windowPath));
    }
  }
  const pictureTip = trace(
    context,
    drawing.picture,
    picture,
    lesson.pictureKind === "bus" ? "#548c76" : "#bd8456",
    4,
  );
  if (writing === 1) {
    context.fillStyle = "#63566f";
    context.font = "bold 25px Arial, sans-serif";
    context.fillText(`${lesson.letter} като ${lesson.word}`, 384, 495);
    context.font = "14px Arial, sans-serif";
    context.fillStyle = "#96889f";
    context.fillText("С малки линии започват големите открития.", 384, 530);
  }
  drawing.texture.needsUpdate = true;
  return {
    tip:
      writing < 1 ? letterTip : picture < 1 ? pictureTip : { x: 635, y: 230 },
    phase: (writing < 1
      ? "writing"
      : picture < 1
        ? "picture"
        : "complete") as DrawingPhase,
  };
}

function Pencil() {
  return (
    <group rotation={[0.58, 0, -0.43]}>
      <mesh position={[0, 0.055, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.034, 0.11, 10]} />
        <meshStandardMaterial color="#43404d" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.23, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.105, 0.36, 12]} />
        <meshStandardMaterial color="#dbb58c" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.98, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 1.18, 6]} />
        <meshStandardMaterial color="#efc46c" roughness={0.48} flatShading />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.111, 0.111, 0.16, 12]} />
        <meshStandardMaterial
          color="#b8c6c6"
          metalness={0.6}
          roughness={0.32}
        />
      </mesh>
      <mesh position={[0, 1.77, 0]}>
        <capsuleGeometry args={[0.105, 0.17, 5, 12]} />
        <meshStandardMaterial color="#c5b1df" roughness={0.75} />
      </mesh>
    </group>
  );
}

function DrawingScene({
  lesson,
  automatic,
  reduced,
  pointer,
  onPhase,
  onNext,
}: {
  lesson: PencilLesson;
  automatic: boolean;
  reduced: boolean;
  pointer: MutableRefObject<Point>;
  onPhase: (phase: DrawingPhase) => void;
  onNext: () => void;
}) {
  const scene = useRef<THREE.Group>(null);
  const pencil = useRef<THREE.Group>(null);
  const drawing = useMemo(() => makeDrawing(lesson), [lesson]);
  const current = useRef<typeof drawing | null>(null);
  const elapsed = useRef(0);
  const lastPaint = useRef(-1);
  const lastPhase = useRef<DrawingPhase | null>(null);
  const finished = useRef(false);
  const lastTick = useRef<number | null>(null);
  useEffect(() => () => drawing.texture.dispose(), [drawing]);
  useEffect(() => {
    lastTick.current = null;
  }, [automatic]);

  useFrame((_, delta) => {
    if (!scene.current || !pencil.current) return;
    if (current.current !== drawing) {
      current.current = drawing;
      elapsed.current = 0;
      lastPaint.current = -1;
      lastPhase.current = null;
      finished.current = false;
      lastTick.current = null;
    }
    const x = -0.08 + pointer.current.y * 0.14;
    const y = -0.1 + pointer.current.x * 0.24;
    if (!automatic) scene.current.rotation.set(x, y, -0.025);
    else {
      scene.current.rotation.x = THREE.MathUtils.damp(
        scene.current.rotation.x,
        x,
        6,
        delta,
      );
      scene.current.rotation.y = THREE.MathUtils.damp(
        scene.current.rotation.y,
        y,
        6,
        delta,
      );
    }
    if (automatic) {
      const now = performance.now();
      if (lastTick.current !== null)
        elapsed.current += (now - lastTick.current) / 1000;
      lastTick.current = now;
    } else lastTick.current = null;
    const time = reduced ? LESSON_SECONDS : elapsed.current;
    // Limit texture uploads to 24 fps on mobile, while the 3D pencil remains lightweight.
    if (lastPaint.current < 0 || Math.abs(time - lastPaint.current) >= 1 / 24) {
      const { tip, phase } = paintDrawing(drawing, lesson, time);
      pencil.current.position.set(
        (tip.x / 768 - 0.5) * 4,
        (0.5 - tip.y / 576) * 3,
        0.045,
      );
      if (phase !== lastPhase.current) {
        lastPhase.current = phase;
        onPhase(phase);
      }
      lastPaint.current = time;
    }
    if (automatic && elapsed.current >= LESSON_SECONDS && !finished.current) {
      finished.current = true;
      onNext();
    }
  });

  return (
    <group
      ref={scene}
      position={[0, -0.17, 0]}
      rotation={[-0.08, -0.1, -0.025]}
    >
      <RoundedBox
        args={[4.18, 3.18, 0.12]}
        radius={0.12}
        smoothness={3}
        position={[0, 0, -0.11]}
      >
        <meshStandardMaterial color="#dfcfb5" roughness={0.8} />
      </RoundedBox>
      <RoundedBox
        args={[4.04, 3.04, 0.055]}
        radius={0.07}
        smoothness={3}
        position={[0, 0, -0.025]}
      >
        <meshStandardMaterial color="#fffcf0" roughness={0.9} />
      </RoundedBox>
      <mesh position={[0, 0, 0.008]}>
        <planeGeometry args={[4, 3]} />
        <meshBasicMaterial map={drawing.texture} toneMapped={false} />
      </mesh>
      <group ref={pencil}>
        <Pencil />
      </group>
      <RoundedBox
        args={[0.52, 0.28, 0.2]}
        radius={0.045}
        smoothness={3}
        position={[-1.55, -1.68, 0.11]}
        rotation={[0, 0, 0.18]}
      >
        <meshStandardMaterial color="#b5cdbb" roughness={0.8} />
      </RoundedBox>
    </group>
  );
}

function DrawingFallback({
  lesson,
  automatic,
  onNext,
  onPhase,
}: {
  lesson: PencilLesson;
  automatic: boolean;
  onNext: () => void;
  onPhase: (phase: DrawingPhase) => void;
}) {
  useEffect(() => {
    onPhase("complete");
    if (!automatic) return;
    const timer = window.setTimeout(onNext, LESSON_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [lesson, automatic, onNext, onPhase]);
  return (
    <svg
      className="pencil-fallback"
      viewBox="0 0 768 576"
      aria-label={`${lesson.letter} като ${lesson.word}`}
    >
      <rect width="768" height="576" rx="24" fill="#fffdf5" />
      {lesson.handwriting.map((path, index) => (
        <path
          key={`letter-${index}`}
          d={path}
          fill="none"
          stroke="#7860b3"
          strokeWidth="5"
          strokeLinecap="round"
        />
      ))}
      {lesson.picture.map((path, index) => (
        <path
          key={`picture-${index}`}
          d={path}
          fill="none"
          stroke="#548c76"
          strokeWidth="4"
        />
      ))}
      <text
        x="572"
        y="175"
        textAnchor="middle"
        fill="#7860b3"
        fontSize="64"
        fontWeight="bold"
      >
        {lesson.letter}
        {lesson.letter.toLocaleLowerCase("bg")}
      </text>
      <text x="384" y="500" textAnchor="middle" fill="#63566f" fontSize="28">
        {lesson.letter} като {lesson.word}
      </text>
    </svg>
  );
}

export default function Sculpture() {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [phase, setPhase] = useState<DrawingPhase>("writing");
  const [reduced, setReduced] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const widget = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const lesson = pencilLessons[lessonIndex];
  const automatic = visible && tabVisible && !reduced && !paused;
  const next = useCallback(() => {
    setPhase("writing");
    setLessonIndex((index) => (index + 1) % pencilLessons.length);
  }, []);

  useEffect(() => {
    const probe = document.createElement("canvas");
    try {
      const context = probe.getContext("webgl2");
      setWebgl(!!context);
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      setWebgl(false);
    }
  }, []);

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
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    if (widget.current) observer.observe(widget.current);
    window.addEventListener("pointermove", follow, { passive: true });
    document.addEventListener("visibilitychange", syncTab);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", sync);
      window.removeEventListener("pointermove", follow);
      document.removeEventListener("visibilitychange", syncTab);
    };
  }, []);

  return (
    <div
      ref={widget}
      className="pencil-widget"
      role="group"
      aria-label="Вълшебен молив - букви и рисунки"
      data-animation={automatic ? "playing" : "paused"}
      data-lesson={lesson.letter}
      data-phase={phase}
      data-renderer={webgl === null ? "loading" : webgl ? "3d" : "svg"}
    >
      <div
        className="pencil-canvas"
        role="img"
        aria-label={`3D молив изписва ръкописни ${lesson.letter}${lesson.letter.toLocaleLowerCase("bg")} и рисува ${lesson.word}. Печатният вариант се появява до ръкописния. Анимацията тръгва сама.`}
      >
        {webgl === false ? (
          <DrawingFallback
            lesson={lesson}
            automatic={automatic}
            onNext={next}
            onPhase={setPhase}
          />
        ) : webgl === true ? (
          <Canvas
            camera={{ position: [0, 0, 6.4], fov: 43 }}
            dpr={[1, 1.5]}
            frameloop={visible && tabVisible ? "always" : "demand"}
            gl={{ antialias: true, powerPreference: "low-power" }}
          >
            <ambientLight intensity={1.8} />
            <directionalLight position={[-3, 4, 5]} intensity={2.8} />
            <Float
              enabled={automatic}
              speed={0.8}
              rotationIntensity={0.015}
              floatIntensity={0.06}
            >
              <DrawingScene
                lesson={lesson}
                automatic={automatic}
                reduced={reduced}
                pointer={pointer}
                onPhase={setPhase}
                onNext={next}
              />
            </Float>
          </Canvas>
        ) : null}
      </div>
      <div className="pencil-controls">
        <div className="pencil-label">
          <strong>
            {lesson.letter} като {lesson.word}
          </strong>
          <span>
            {phase === "writing"
              ? "От една линия започва буквата…"
              : phase === "picture"
                ? "А от буквата - цяла рисунка!"
                : "Печатно и ръкописно. Откритие след откритие."}
          </span>
        </div>
        {!reduced && (
          <button
            className="pencil-pause"
            type="button"
            aria-label={paused ? "Продължи рисуването" : "Спри рисуването"}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? "Продължи" : "Пауза"}
          </button>
        )}
      </div>
      <p className="pencil-hint">
        Моливът рисува сам. Ти само следвай въображението си.
      </p>
    </div>
  );
}
