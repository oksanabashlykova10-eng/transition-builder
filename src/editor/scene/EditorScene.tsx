import {
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { useAssetUrl } from "../../assets/useAssetUrl";
import { useCustomFont } from "../../assets/useCustomFont";
import {
  SCENE_HEIGHT,
  SCENE_WIDTH,
  type ImageSequenceLayer,
  type Layer,
  type Transform,
} from "../../project/model/project";
import { useEditorStore } from "../../project/store/editorStore";
import { BuiltInEffect } from "../../renderer/effects/BuiltInEffect";
import {
  layerTimingCss,
  layerTimingAnimationCss,
  sceneTimingCss,
} from "../../renderer/timing/sceneTiming";
import { animationName } from "../../renderer/animations/animationRegistry";
import "../../renderer/animations/animations.css";
import "../../renderer/animations/advancedAnimations.css";
import {
  sequencePoints,
  smoothCustomPoints,
} from "../../renderer/sequences/sequenceGeometry";
import "../../renderer/sequences/sequences.css";
import styles from "./EditorScene.module.css";
import { snapDraggedTransform } from "./snapTransform";
type Interaction = "drag" | "resize" | "rotate";
interface PointerStart {
  pointerX: number;
  pointerY: number;
  transform: Transform;
  interaction: Interaction;
  centerX: number;
  centerY: number;
  startAngle: number;
}
interface EditorSceneProps {
  interactive?: boolean;
  restartKey?: number;
  previewBackdrop?: PreviewBackdrop;
}
export interface PreviewBackdrop {
  mode: "checkerboard" | "dark" | "white" | "custom" | "game";
  color: string;
  url?: string;
}

function SceneBackground({
  interactive,
  previewBackdrop,
}: {
  interactive: boolean;
  previewBackdrop?: PreviewBackdrop;
}) {
  const background = useEditorStore((state) => state.project.scene.background);
  const asset = useEditorStore((state) =>
    state.project.assets.find((item) => item.id === background.assetId),
  );
  const url = useAssetUrl(asset);
  const testStyle: CSSProperties = !interactive
    ? {}
    : previewBackdrop?.mode === "dark"
      ? { background: "#090b12" }
      : previewBackdrop?.mode === "white"
        ? { background: "#fff" }
        : previewBackdrop?.mode === "custom"
          ? { background: previewBackdrop.color }
          : previewBackdrop?.mode === "game" && previewBackdrop.url
            ? {
                backgroundImage: `url(${JSON.stringify(previewBackdrop.url)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {};
  const actualStyle: CSSProperties =
    background.mode === "color"
      ? { background: background.color }
      : background.mode === "gradient"
        ? {
            background:
              background.gradient.type === "radial"
                ? `radial-gradient(circle,${background.gradient.color1},${background.gradient.color2})`
                : `linear-gradient(${background.gradient.angle}deg,${background.gradient.color1},${background.gradient.color2})`,
          }
        : background.mode === "image" && url
          ? {
              backgroundImage: `url(${JSON.stringify(url)})`,
              backgroundSize:
                background.fit === "stretch"
                  ? "100% 100%"
                  : background.fit === "original"
                    ? "auto"
                    : background.fit,
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              filter: `brightness(${background.filters.brightness}) contrast(${background.filters.contrast}) saturate(${background.filters.saturation}) blur(${background.filters.blur}px)`,
            }
          : { background: "transparent" };
  return (
    <>
      <div className={styles.testBackground} style={testStyle} />
      <div
        className={styles.actualBackground}
        style={{ ...actualStyle, opacity: background.opacity }}
      />
    </>
  );
}

function SequenceItem({
  assetId,
  layer,
  index,
  point,
}: {
  assetId: string;
  layer: ImageSequenceLayer;
  index: number;
  point: { x: number; y: number };
}) {
  const asset = useEditorStore((s) =>
      s.project.assets.find((item) => item.id === assetId),
    ),
    url = useAssetUrl(asset),
    names = {
      "light-wave": "tb-light-wave",
      "fade-wave": "tb-fade-wave",
      pop: "tb-pop",
      "bounce-wave": "tb-bounce-wave",
      "spin-wave": "tb-spin-wave",
      "neon-wave": "tb-neon-wave",
      "golden-wave": "tb-golden-wave",
      "color-wave": "tb-color-wave",
      "blur-focus": "tb-blur-focus",
      flip: "tb-flip",
      "random-wave": "tb-random-wave",
    };
  if (!url)
    return (
      <div
        className="sequence-item"
        style={{
          left: `${point.x}%`,
          top: `${point.y}%`,
          width: `${(layer.imageSize / layer.transform.width) * 100}%`,
          height: `${(layer.imageSize / layer.transform.height) * 100}%`,
          border: "1px dashed #ff646d",
        }}
      />
    );
  const randomPhase = ((layer.wave.randomSeed * (index + 3) * 17) % 100) / 100;
  const style = {
    left: `${point.x}%`,
    top: `${point.y}%`,
    width: `${(layer.imageSize / layer.transform.width) * 100}%`,
    height: `${(layer.imageSize / layer.transform.height) * 100}%`,
    animationName: names[layer.wave.type],
    animationDuration: `${layer.wave.duration}s`,
    animationDelay: `${index * layer.wave.delay - randomPhase * 0.08}s`,
    "--inactive-opacity": layer.wave.inactiveOpacity,
    "--active-scale": layer.wave.activeScale,
    "--glow-color": layer.wave.glowColor,
    "--wave-rotation": `${layer.wave.rotation}deg`,
    "--wave-blur": `${layer.wave.blur}px`,
    "--active-brightness": layer.wave.activeBrightness,
    "--random-x": `${Math.round(randomPhase * 12 - 6)}px`,
    "--random-rotation": `${Math.round(randomPhase * 30 - 15)}deg`,
  } as CSSProperties;
  return <img className="sequence-item" src={url} alt="" style={style} />;
}

function SequenceContent({
  layer,
  interactive,
}: {
  layer: ImageSequenceLayer;
  interactive: boolean;
}) {
  const ids =
      layer.assetIds.length === 1
        ? Array.from({ length: layer.repeatCount }, () => layer.assetIds[0])
        : layer.assetIds.slice(0, 20),
    points = sequencePoints(layer, ids.length),
    path = smoothCustomPoints(layer);
  return (
    <>
      {interactive &&
        layer.pathType === "custom" &&
        layer.pathSettings.showPath &&
        path.length > 1 && (
          <svg
            className={styles.pathGuide}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polyline
              points={path.map((point) => `${point.x},${point.y}`).join(" ")}
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      {!ids.length ? (
        <div className={styles.placeholder}>
          <span>◇ ◇ ◇</span>
          <small>Добавьте изображения в Inspector</small>
        </div>
      ) : (
        ids.map((id, index) => (
          <SequenceItem
            key={`${id}-${index}`}
            assetId={id}
            layer={layer}
            index={index}
            point={points[index]}
          />
        ))
      )}
    </>
  );
}

function Content({
  layer,
  interactive,
}: {
  layer: Layer;
  interactive: boolean;
}) {
  const assets = useEditorStore((s) => s.project.assets),
    asset = assets.find(
      (item) =>
        item.id ===
        (layer.type === "image"
          ? layer.assetId
          : layer.type === "text"
            ? layer.customFontAssetId
            : undefined),
    ),
    url = useAssetUrl(layer.type === "image" ? asset : undefined);
  useCustomFont(layer.type === "text" ? asset : undefined);
  if (layer.type === "text") {
    const shadows: string[] = [];
    if (layer.shadow.enabled)
      shadows.push(
        `${layer.shadow.x}px ${layer.shadow.y}px ${layer.shadow.blur}px ${layer.shadow.color}`,
      );
    layer.glows
      .filter((g) => g.enabled)
      .forEach((g) => shadows.push(`0 0 ${g.radius}px ${g.color}`));
    return (
      <div
        className={styles.text}
        style={{
          color: layer.color,
          fontFamily: layer.customFontAssetId
            ? `custom-${layer.customFontAssetId}`
            : layer.fontFamily,
          fontSize: `${(layer.fontSize / SCENE_WIDTH) * 100}cqw`,
          textAlign: layer.align,
          fontWeight: layer.fontWeight,
          fontStyle: layer.italic ? "italic" : "normal",
          letterSpacing: `${layer.letterSpacing}px`,
          lineHeight: layer.lineHeight,
          textTransform: layer.textTransform,
          WebkitTextStroke: layer.stroke.enabled
            ? `${layer.stroke.width}px ${layer.stroke.color}`
            : undefined,
          textShadow: shadows.join(", ") || "none",
        }}
      >
        {layer.content}
      </div>
    );
  }
  if (layer.type === "image")
    return url ? (
      <img className={styles.image} src={url} alt={layer.name} />
    ) : (
      <div className={styles.placeholder}>
        <span>◇</span>
        <small>Загрузите картинку</small>
      </div>
    );
  if (layer.type === "image-sequence")
    return <SequenceContent layer={layer} interactive={interactive} />;
  return <BuiltInEffect layer={layer} />;
}

function AnimatedContent({
  layer,
  interactive,
}: {
  layer: Layer;
  interactive: boolean;
}) {
  const active = layer.animations.filter((animation) => animation.enabled);
  return active.reduceRight<ReactNode>(
    (child, animation) => {
      const settings = animation.settings,
        strength = settings.strength ?? 0,
        advanced =
          animation.type === "light-sweep" ||
          animation.type === "scanline-glitch" ||
          animation.type === "neon-pulse";
      const directionClass =
        settings.direction === "right-to-left"
          ? "tb-sweep-rtl"
          : settings.direction === "top-to-bottom"
            ? "tb-sweep-ttb"
            : settings.direction === "bottom-to-top"
              ? "tb-sweep-btt"
              : settings.direction === "diagonal"
                ? "tb-sweep-diagonal"
                : "tb-sweep-ltr";
      const classes = [
        styles.animatedContent,
        advanced ? `tb-effect-${animation.type}` : "tb-animated",
        animation.type === "light-sweep" ? directionClass : "",
        settings.pingPong ? "tb-sweep-pingpong" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const style = {
        animationName: advanced ? undefined : animationName(animation.type),
        animationDuration: `${settings.duration ?? 1.5}s`,
        animationDelay: `${layer.timing.startDelay}s`,
        "--tb-strength": strength,
        "--tb-min-opacity": strength,
        "--sweep-speed": `${settings.duration ?? 2.4}s`,
        "--sweep-width": `${settings.sweepWidth ?? 24}%`,
        "--sweep-color": settings.color,
        "--sweep-opacity": settings.opacity,
        "--sweep-glow": settings.glowIntensity,
        "--sweep-softness": `${Math.max(1, Number(settings.softness ?? 35)) / 2}%`,
        "--sweep-angle": `${90 + Number(settings.angle ?? 18)}deg`,
        "--scan-intensity": settings.intensity,
        "--scan-frequency": settings.frequency,
        "--scan-height": settings.scanlineHeight,
        "--scan-speed": `${settings.scanlineSpeed ?? 1.3}s`,
        "--rgb-split": settings.rgbSplit,
        "--glitch-x": settings.horizontalDisplacement,
        "--glitch-y": settings.verticalDisplacement,
        "--glitch-duration": `${settings.glitchDuration ?? 0.32}s`,
        "--neon-primary": settings.primaryColor,
        "--neon-secondary": settings.secondaryColor,
        "--neon-radius": settings.glowRadius,
        "--neon-min-glow": settings.minGlowIntensity,
        "--neon-max-glow": settings.maxGlowIntensity,
        "--neon-speed": `${settings.pulseSpeed ?? 2}s`,
        "--neon-min-brightness": settings.minBrightness,
        "--neon-max-brightness": settings.maxBrightness,
        "--neon-opacity": settings.opacity,
        "--neon-scale": settings.scalePulse
          ? 1 + Number(settings.scaleAmount ?? 0.04)
          : 1,
      } as CSSProperties;
      return (
        <div className={classes} style={style}>
          {child}
        </div>
      );
    },
    <Content layer={layer} interactive={interactive} />,
  ) as ReactElement;
}

function TimedContent({
  layer,
  projectTiming,
  restartKey,
}: {
  layer: Layer;
  projectTiming: import("../../project/model/project").TransitionProject["timing"];
  restartKey: number;
}) {
  const timing = layerTimingAnimationCss(
    layer.timing,
    projectTiming,
    `tb-life-${layer.id.replace(/[^a-z0-9]/gi, "")}-${restartKey}`,
  );
  return (
    <div className="tb-layer-life" style={timing.style as CSSProperties}>
      <style>{timing.css}</style>
      <AnimatedContent layer={layer} interactive={false} />
    </div>
  );
}

export function EditorScene({
  interactive = true,
  restartKey = 0,
  previewBackdrop,
}: EditorSceneProps) {
  const stageRef = useRef<HTMLDivElement>(null),
    origin = useRef<PointerStart | null>(null),
    drawing = useRef(false);
  const project = useEditorStore((s) => s.project),
    selectedId = useEditorStore((s) => s.selectedLayerId),
    drawingId = useEditorStore((s) => s.pathDrawingLayerId),
    gridEnabled = useEditorStore((s) => s.gridEnabled),
    gridSize = useEditorStore((s) => s.gridSize),
    showSafeArea = useEditorStore((s) => s.showSafeArea),
    snappingEnabled = useEditorStore((s) => s.snappingEnabled);
  const sceneTiming = sceneTimingCss(project.timing, `tb-scene-${restartKey}`);
  const point = (e: ReactPointerEvent) => {
    const r = stageRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * SCENE_WIDTH,
      y: ((e.clientY - r.top) / r.height) * SCENE_HEIGHT,
    };
  };
  const start = (
    e: ReactPointerEvent,
    layer: Layer,
    interaction: Interaction,
  ) => {
    if (!interactive || layer.locked) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const s = useEditorStore.getState();
    s.selectLayer(layer.id);
    s.beginTransaction();
    const p = point(e),
      t = layer.transform,
      cx = t.x + t.width / 2,
      cy = t.y + t.height / 2;
    origin.current = {
      pointerX: p.x,
      pointerY: p.y,
      transform: { ...t },
      interaction,
      centerX: cx,
      centerY: cy,
      startAngle: Math.atan2(p.y - cy, p.x - cx),
    };
  };
  const move = (e: ReactPointerEvent, layer: Layer) => {
    const o = origin.current;
    if (!interactive || !o || layer.locked) return;
    const p = point(e),
      dx = p.x - o.pointerX,
      dy = p.y - o.pointerY;
    let t = { ...o.transform };
    if (o.interaction === "drag")
      t = snapDraggedTransform(
        { ...t, x: o.transform.x + dx, y: o.transform.y + dy },
        { gridEnabled, gridSize, snappingEnabled },
      );
    if (o.interaction === "resize") {
      t = {
        ...t,
        width: Math.max(80, o.transform.width + dx),
        height: Math.max(50, o.transform.height + dy),
      };
      if (gridEnabled) {
        t.width = Math.round(t.width / gridSize) * gridSize;
        t.height = Math.round(t.height / gridSize) * gridSize;
      }
    }
    if (o.interaction === "rotate")
      t.rotation =
        o.transform.rotation +
        ((Math.atan2(p.y - o.centerY, p.x - o.centerX) - o.startAngle) * 180) /
          Math.PI;
    useEditorStore.getState().updateTransformLive(layer.id, t);
  };
  const end = () => {
    if (origin.current) {
      origin.current = null;
      useEditorStore.getState().commitTransaction();
    }
  };
  const drawPoint = (e: ReactPointerEvent, reset = false) => {
    const layer = project.layers.find((item) => item.id === drawingId);
    if (!layer || layer.type !== "image-sequence") return;
    const p = point(e),
      next = {
        x: Math.max(
          0,
          Math.min(
            100,
            ((p.x - layer.transform.x) / layer.transform.width) * 100,
          ),
        ),
        y: Math.max(
          0,
          Math.min(
            100,
            ((p.y - layer.transform.y) / layer.transform.height) * 100,
          ),
        ),
      },
      current = reset ? [] : layer.pathSettings.customPoints,
      last = current.at(-1);
    if (last && Math.hypot(last.x - next.x, last.y - next.y) < 0.7) return;
    useEditorStore.getState().updateLayerLive(layer.id, {
      pathSettings: {
        ...layer.pathSettings,
        customPoints: [...current, next],
      },
    });
  };
  const drawStart = (e: ReactPointerEvent) => {
    if (!drawingId) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    useEditorStore.getState().beginTransaction();
    drawPoint(e, true);
  };
  const drawMove = (e: ReactPointerEvent) => {
    if (drawing.current) drawPoint(e);
  };
  const drawEnd = () => {
    if (!drawing.current) return;
    drawing.current = false;
    useEditorStore.getState().commitTransaction();
  };
  return (
    <div
      key={restartKey}
      ref={stageRef}
      className={`${styles.stage} ${!interactive ? styles.previewStage : ""} ${drawingId ? styles.drawing : ""}`}
      style={!interactive ? (sceneTiming.style as CSSProperties) : undefined}
      onPointerDown={
        drawingId
          ? drawStart
          : () => interactive && useEditorStore.getState().selectLayer(null)
      }
      onPointerMove={drawMove}
      onPointerUp={drawEnd}
      onPointerCancel={drawEnd}
    >
      {!interactive && <style>{sceneTiming.css + layerTimingCss}</style>}
      <SceneBackground
        interactive={interactive}
        previewBackdrop={previewBackdrop}
      />
      {interactive && gridEnabled && (
        <div
          className={styles.grid}
          style={{
            backgroundSize: `${(gridSize / SCENE_WIDTH) * 100}% ${(gridSize / SCENE_HEIGHT) * 100}%`,
          }}
        />
      )}
      {interactive && (
        <div className={styles.guides}>
          <i className={styles.verticalGuide} />
          <i className={styles.horizontalGuide} />
          {showSafeArea && <i className={styles.safeArea} />}
        </div>
      )}
      {project.layers.length === 0 && (
        <div className={styles.empty}>
          <div>＋</div>
          <strong>Начните собирать переход</strong>
          <span>Добавьте надпись или картинку слева</span>
        </div>
      )}
      {project.layers.map(
        (layer, index) =>
          layer.visible && (
            <div
              key={layer.id}
              className={`${styles.layer} ${interactive && selectedId === layer.id ? styles.selected : ""} ${layer.locked ? styles.locked : ""}`}
              style={{
                left: `${(layer.transform.x / SCENE_WIDTH) * 100}%`,
                top: `${(layer.transform.y / SCENE_HEIGHT) * 100}%`,
                width: `${(layer.transform.width / SCENE_WIDTH) * 100}%`,
                height: `${(layer.transform.height / SCENE_HEIGHT) * 100}%`,
                transform: `rotate(${layer.transform.rotation}deg)`,
                opacity: layer.opacity,
                zIndex: index + 1,
              }}
              onPointerDown={(e) => start(e, layer, "drag")}
              onPointerMove={(e) => move(e, layer)}
              onPointerUp={end}
              onPointerCancel={end}
            >
              {interactive ? (
                <AnimatedContent layer={layer} interactive />
              ) : (
                <TimedContent
                  layer={layer}
                  projectTiming={project.timing}
                  restartKey={restartKey}
                />
              )}
              {interactive && selectedId === layer.id && !layer.locked && (
                <>
                  <button
                    aria-label="Изменить размер"
                    className={styles.resize}
                    onPointerDown={(e) => start(e, layer, "resize")}
                  />
                  <button
                    aria-label="Повернуть"
                    className={styles.rotate}
                    onPointerDown={(e) => start(e, layer, "rotate")}
                  />
                </>
              )}
            </div>
          ),
      )}
    </div>
  );
}
