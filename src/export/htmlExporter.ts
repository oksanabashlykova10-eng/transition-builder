import { getAssetBlob } from "../assets/AssetRepository";
import {
  SCENE_HEIGHT,
  SCENE_WIDTH,
  type AnimationConfig,
  type BuiltInEffectLayer,
  type ImageSequenceLayer,
  type Layer,
  type TextLayer,
  type TransitionProject,
} from "../project/model/project";
import { sequencePoints } from "../renderer/sequences/sequenceGeometry";
import advancedCss from "../renderer/animations/advancedAnimations.css?inline";
import basicCss from "../renderer/animations/animations.css?inline";
import sequenceCss from "../renderer/sequences/sequences.css?inline";
import effectCss from "../renderer/effects/effects.css?inline";
import { effectSeeds } from "../renderer/effects/effectRegistry";
import { builtInFontFiles } from "./builtInFonts";
import {
  layerTimingAnimationCss,
  layerTimingCss,
  sceneTimingCss,
} from "../renderer/timing/sceneTiming";

const escapeHtml = (value: unknown) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const cssValue = (value: unknown) => String(value ?? "").replace(/[;}]/g, "");
const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

function selectCss(source: string, include: (prelude: string) => boolean) {
  let cursor = 0;
  const blocks: string[] = [];
  while (cursor < source.length) {
    const open = source.indexOf("{", cursor);
    if (open < 0) break;
    let depth = 1;
    let end = open + 1;
    while (end < source.length && depth) {
      if (source[end] === "{") depth++;
      if (source[end] === "}") depth--;
      end++;
    }
    const prelude = source.slice(cursor, open).trim();
    if (include(prelude)) blocks.push(source.slice(cursor, end));
    cursor = end;
  }
  return blocks.join("");
}

async function assetUrls(project: TransitionProject) {
  const result = new Map<string, string>();
  await Promise.all(
    project.assets.map(async (asset) => {
      if (asset.source === "url" && asset.url) result.set(asset.id, asset.url);
      else {
        const blob = await getAssetBlob(asset.id);
        if (blob) result.set(asset.id, await blobToDataUrl(blob));
      }
    }),
  );
  return result;
}

async function builtInFontCss(project: TransitionProject) {
  if (import.meta.env.MODE === "test") return "";
  const requests = new Map<
    string,
    { family: string; weight: number; url: string }
  >();
  for (const layer of project.layers) {
    if (layer.type !== "text" || layer.customFontAssetId) continue;
    const files = builtInFontFiles[layer.fontFamily];
    if (!files) continue;
    requests.set(`${layer.fontFamily}-${layer.fontWeight}`, {
      family: layer.fontFamily,
      weight: layer.fontWeight,
      url: layer.fontWeight >= 600 && files.bold ? files.bold : files.regular,
    });
  }
  const rules = await Promise.all(
    [...requests.values()].map(async ({ family, weight, url }) => {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`Не удалось встроить шрифт «${family}».`);
      const data = await blobToDataUrl(await response.blob());
      return `@font-face{font-family:'${family.replaceAll("'", "")}';src:url(${JSON.stringify(data)}) format('woff2');font-weight:${weight};font-style:normal;font-display:block}`;
    }),
  );
  return rules.join("");
}

function animationWrapper(
  animation: AnimationConfig,
  delay: number,
  child: string,
) {
  const s = animation.settings;
  const advanced = ["light-sweep", "scanline-glitch", "neon-pulse"].includes(
    animation.type,
  );
  const direction =
    s.direction === "right-to-left"
      ? "tb-sweep-rtl"
      : s.direction === "top-to-bottom"
        ? "tb-sweep-ttb"
        : s.direction === "bottom-to-top"
          ? "tb-sweep-btt"
          : s.direction === "diagonal"
            ? "tb-sweep-diagonal"
            : "tb-sweep-ltr";
  const classes = [
    advanced ? `tb-effect-${animation.type}` : "tb-animated",
    animation.type === "light-sweep" ? direction : "",
    s.pingPong ? "tb-sweep-pingpong" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const vars = [
    ["animation-name", advanced ? "" : `tb-${animation.type}`],
    ["animation-duration", `${s.duration ?? 1.5}s`],
    ["animation-delay", `${delay}s`],
    ["--tb-strength", s.strength ?? 0],
    ["--tb-min-opacity", s.strength ?? 0.35],
    ["--sweep-speed", `${s.duration ?? 2.4}s`],
    ["--sweep-width", `${s.sweepWidth ?? 24}%`],
    ["--sweep-color", s.color],
    ["--sweep-opacity", s.opacity],
    ["--sweep-glow", s.glowIntensity],
    ["--sweep-softness", `${Math.max(1, Number(s.softness ?? 35)) / 2}%`],
    ["--sweep-angle", `${90 + Number(s.angle ?? 18)}deg`],
    ["--scan-intensity", s.intensity],
    ["--scan-frequency", s.frequency],
    ["--scan-height", s.scanlineHeight],
    ["--scan-speed", `${s.scanlineSpeed ?? 1.3}s`],
    ["--rgb-split", s.rgbSplit],
    ["--glitch-x", s.horizontalDisplacement],
    ["--glitch-y", s.verticalDisplacement],
    ["--glitch-duration", `${s.glitchDuration ?? 0.32}s`],
    ["--neon-primary", s.primaryColor],
    ["--neon-secondary", s.secondaryColor],
    ["--neon-radius", s.glowRadius],
    ["--neon-min-glow", s.minGlowIntensity],
    ["--neon-max-glow", s.maxGlowIntensity],
    ["--neon-speed", `${s.pulseSpeed ?? 2}s`],
    ["--neon-min-brightness", s.minBrightness],
    ["--neon-max-brightness", s.maxBrightness],
    ["--neon-opacity", s.opacity],
    ["--neon-scale", s.scalePulse ? 1 + Number(s.scaleAmount ?? 0.04) : 1],
  ]
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${key}:${cssValue(value)}`)
    .join(";");
  return `<div class="content ${classes}" style="${vars}">${child}</div>`;
}

function textHtml(layer: TextLayer) {
  const shadows: string[] = [];
  if (layer.shadow.enabled)
    shadows.push(
      `${layer.shadow.x}px ${layer.shadow.y}px ${layer.shadow.blur}px ${layer.shadow.color}`,
    );
  layer.glows
    .filter((g) => g.enabled)
    .forEach((g) => shadows.push(`0 0 ${g.radius}px ${g.color}`));
  const family = layer.customFontAssetId
    ? `custom-${layer.customFontAssetId}`
    : `'${layer.fontFamily.replaceAll("'", "")}'`;
  const style = `color:${layer.color};font-family:${family};font-size:${(layer.fontSize / SCENE_WIDTH) * 100}cqw;text-align:${layer.align};font-weight:${layer.fontWeight};font-style:${layer.italic ? "italic" : "normal"};letter-spacing:${layer.letterSpacing}px;line-height:${layer.lineHeight};text-transform:${layer.textTransform};-webkit-text-stroke:${layer.stroke.enabled ? `${layer.stroke.width}px ${layer.stroke.color}` : "0"};text-shadow:${shadows.join(",") || "none"}`;
  return `<div class="text" style="${style}">${escapeHtml(layer.content).replaceAll("\n", "<br>")}</div>`;
}

function sequenceHtml(layer: ImageSequenceLayer, urls: Map<string, string>) {
  const ids =
    layer.assetIds.length === 1
      ? Array.from({ length: layer.repeatCount }, () => layer.assetIds[0])
      : layer.assetIds.slice(0, 20);
  const points = sequencePoints(layer, ids.length);
  return ids
    .map((id, index) => {
      const point = points[index],
        randomPhase = ((layer.wave.randomSeed * (index + 3) * 17) % 100) / 100;
      const style = `left:${point.x}%;top:${point.y}%;width:${(layer.imageSize / layer.transform.width) * 100}%;height:${(layer.imageSize / layer.transform.height) * 100}%;animation-name:tb-${layer.wave.type};animation-duration:${layer.wave.duration}s;animation-delay:${index * layer.wave.delay - randomPhase * 0.08}s;--inactive-opacity:${layer.wave.inactiveOpacity};--active-scale:${layer.wave.activeScale};--glow-color:${layer.wave.glowColor};--wave-rotation:${layer.wave.rotation}deg;--wave-blur:${layer.wave.blur}px;--active-brightness:${layer.wave.activeBrightness};--random-x:${Math.round(randomPhase * 12 - 6)}px;--random-rotation:${Math.round(randomPhase * 30 - 15)}deg`;
      return `<img class="sequence-item" src="${escapeHtml(urls.get(id) ?? "")}" alt="" style="${style}">`;
    })
    .join("");
}

function builtInEffectHtml(layer: BuiltInEffectLayer) {
  const settings = layer.settings;
  const seeds = effectSeeds(Number(settings.count ?? 20));
  const items = seeds
    .map(
      (seed, index) =>
        `<i style="--x:${seed.x}%;--y:${seed.y}%;--delay:${seed.delay};--scale:${seed.scale};--drift:${seed.drift}px;--index:${index}"></i>`,
    )
    .join("");
  return `<div class="tb-built-effect tb-effect-${layer.effectType}" style="--effect-primary:${cssValue(settings.primaryColor)};--effect-secondary:${cssValue(settings.secondaryColor)};--effect-speed:${cssValue(settings.speed ?? 2)}s;--effect-size:${cssValue(settings.size ?? 10)}px;--effect-intensity:${cssValue(settings.intensity ?? 1)};--effect-count:${seeds.length}">${items}</div>`;
}

function layerHtml(
  layer: Layer,
  urls: Map<string, string>,
  index: number,
  projectTiming: TransitionProject["timing"],
) {
  let child =
    layer.type === "text"
      ? textHtml(layer)
      : layer.type === "image"
        ? `<img class="image" src="${escapeHtml(urls.get(layer.assetId) ?? "")}" alt="">`
        : layer.type === "image-sequence"
          ? sequenceHtml(layer, urls)
          : builtInEffectHtml(layer);
  layer.animations
    .filter((a) => a.enabled)
    .slice()
    .reverse()
    .forEach((a) => {
      child = animationWrapper(a, layer.timing.startDelay, child);
    });
  const life = layerTimingAnimationCss(
    layer.timing,
    projectTiming,
    `tb-life-${layer.id.replace(/[^a-z0-9]/gi, "")}`,
  );
  const lifeStyle = Object.entries(life.style)
    .map(
      ([key, value]) =>
        `${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${value}`,
    )
    .join(";");
  child = `<style>${life.css}</style><div class="tb-layer-life" style="${lifeStyle}">${child}</div>`;
  const t = layer.transform;
  return `<div class="layer" style="left:${(t.x / SCENE_WIDTH) * 100}%;top:${(t.y / SCENE_HEIGHT) * 100}%;width:${(t.width / SCENE_WIDTH) * 100}%;height:${(t.height / SCENE_HEIGHT) * 100}%;transform:rotate(${t.rotation}deg);opacity:${layer.opacity};z-index:${index + 1}">${child}</div>`;
}

export async function exportHtml(project: TransitionProject) {
  const urls = await assetUrls(project),
    bg = project.scene.background;
  const bundledFontCss = await builtInFontCss(project);
  const background =
    bg.mode === "color"
      ? bg.color
      : bg.mode === "gradient"
        ? `${bg.gradient.type === "radial" ? "radial-gradient(circle" : `linear-gradient(${bg.gradient.angle}deg`},${bg.gradient.color1},${bg.gradient.color2})`
        : bg.mode === "image"
          ? `url(${JSON.stringify(urls.get(bg.assetId ?? "") ?? "")}) center/${bg.fit === "stretch" ? "100% 100%" : bg.fit} no-repeat`
          : "transparent";
  const localFonts =
    bundledFontCss +
    project.assets
      .filter((a) => a.kind === "font" && urls.has(a.id))
      .map(
        (a) =>
          `@font-face{font-family:custom-${a.id};src:url(${JSON.stringify(urls.get(a.id))})}`,
      )
      .join("");
  const backgroundFilter = `brightness(${bg.filters.brightness}) contrast(${bg.filters.contrast}) saturate(${bg.filters.saturation}) blur(${bg.filters.blur}px)`;
  const animations = project.layers
    .flatMap((l) => l.animations)
    .filter((a) => a.enabled);
  const advancedTypes = new Set(
    animations
      .map((a) => a.type)
      .filter((type) =>
        ["light-sweep", "scanline-glitch", "neon-pulse"].includes(type),
      ),
  );
  const basicTypes = new Set(
    animations.map((a) => a.type).filter((type) => !advancedTypes.has(type)),
  );
  const waveTypes = new Set(
    project.layers
      .filter(
        (layer): layer is ImageSequenceLayer => layer.type === "image-sequence",
      )
      .map((layer) => layer.wave.type),
  );
  const selectedBasicCss = selectCss(
    basicCss,
    (prelude) =>
      prelude.includes(".tb-animated") ||
      [...basicTypes].some((type) => prelude.includes(`tb-${type}`)),
  );
  const advancedTokens = [...advancedTypes].flatMap((type) =>
    type === "light-sweep"
      ? ["light-sweep", "sweep-"]
      : type === "scanline-glitch"
        ? ["scanline", "scan-", "scanline-glitch"]
        : ["neon-pulse"],
  );
  const selectedAdvancedCss = selectCss(advancedCss, (prelude) =>
    advancedTokens.some((token) => prelude.includes(token)),
  );
  const selectedSequenceCss = selectCss(
    sequenceCss,
    (prelude) =>
      prelude.includes(".sequence-item") ||
      [...waveTypes].some((type) => prelude.includes(`tb-${type}`)),
  );
  const effectTypes = new Set(
    project.layers
      .filter(
        (layer): layer is BuiltInEffectLayer =>
          layer.type === "built-in-effect",
      )
      .map((layer) => layer.effectType),
  );
  const effectTokens: Record<string, string> = {
    "neon-spinner": "spinner",
    "neon-sparks": "sparks",
    "flying-spark": "flying",
    "magic-dust": "dust",
    "falling-objects": "fall",
    fireflies: "firefly",
    "dots-loader": "dots",
  };
  const selectedEffectCss = selectCss(
    effectCss,
    (prelude) =>
      prelude.includes(".tb-built-effect") ||
      [...effectTypes].some(
        (type) =>
          prelude.includes(`tb-effect-${type}`) ||
          prelude.includes(`tb-fx-${effectTokens[type]}`),
      ),
  );
  const sceneTiming = sceneTimingCss(project.timing);
  const sceneAnimationStyle = Object.entries(sceneTiming.style)
    .map(
      ([key, value]) =>
        `${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${value}`,
    )
    .join(";");
  const layers = project.layers
    .filter((l) => l.visible)
    .map((l, i) => layerHtml(l, urls, i, project.timing))
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${localFonts}*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}body{display:grid;place-items:center}.stage{container-type:inline-size;position:relative;width:min(100vw,177.7778vh);aspect-ratio:16/9;overflow:hidden}.scene-bg{position:absolute;inset:-2%;background:${background};opacity:${bg.opacity};filter:${backgroundFilter}}.layer{position:absolute;display:grid;place-items:center;transform-origin:center}.content{position:relative;width:100%;height:100%;display:grid;place-items:center;transform-origin:center}.text{width:100%;min-height:100%;overflow:visible;white-space:pre-wrap;overflow-wrap:anywhere}.image{display:block;width:100%;height:100%;object-fit:contain}${sceneTiming.css}${layerTimingCss}${selectedBasicCss}${selectedAdvancedCss}${selectedSequenceCss}${selectedEffectCss}</style></head><body><div class="stage" style="${sceneAnimationStyle}"><div class="scene-bg"></div>${layers}</div></body></html>`;
}

export const iframeCode = (html: string) =>
  `<iframe srcdoc="${escapeHtml(html)}" style="width:100%;aspect-ratio:16/9;border:0;background:transparent" allow="autoplay" loading="eager"></iframe>`;
export const exportSize = (content: string) => new Blob([content]).size;
