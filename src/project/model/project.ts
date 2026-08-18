export const CURRENT_SCHEMA_VERSION = 1;
export const SCENE_WIDTH = 1920;
export const SCENE_HEIGHT = 1080;

export type LayerType = "text" | "image" | "image-sequence" | "built-in-effect";
export type BackgroundMode = "transparent" | "color" | "gradient" | "image";
export type PlaybackMode = "infinite" | "fixed";

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface LayerTiming {
  startDelay: number;
  duration: number;
  endAnimation: "none" | "fade" | "blur" | "zoom";
}

export interface AnimationConfig {
  id: string;
  type: string;
  enabled: boolean;
  settings: Record<string, number | string | boolean>;
}

export interface BaseLayer {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  transform: Transform;
  timing: LayerTiming;
  animations: AnimationConfig[];
}

export interface TextLayer extends BaseLayer {
  type: "text";
  content: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
  fontWeight: number;
  italic: boolean;
  letterSpacing: number;
  lineHeight: number;
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
  stroke: { enabled: boolean; color: string; width: number; opacity: number };
  shadow: {
    enabled: boolean;
    color: string;
    x: number;
    y: number;
    blur: number;
    opacity: number;
  };
  glows: Array<{
    enabled: boolean;
    color: string;
    radius: number;
    opacity: number;
  }>;
  customFontAssetId?: string;
}

export interface ImageLayer extends BaseLayer {
  type: "image";
  assetId: string;
  preserveAspectRatio: boolean;
}

export interface ImageSequenceLayer extends BaseLayer {
  type: "image-sequence";
  assetIds: string[];
  repeatCount: number;
  spacing: number;
  imageSize: number;
  pathType:
    "line" | "vertical" | "zigzag" | "wave" | "arc" | "circle" | "custom";
  pathSettings: {
    amplitude: number;
    frequency: number;
    arcHeight: number;
    customPoints: Array<{ x: number; y: number }>;
    smooth: number;
    reverse: boolean;
    closed: boolean;
    showPath: boolean;
  };
  wave: {
    type:
      | "light-wave"
      | "fade-wave"
      | "pop"
      | "bounce-wave"
      | "spin-wave"
      | "neon-wave"
      | "golden-wave"
      | "color-wave"
      | "blur-focus"
      | "flip"
      | "random-wave";
    duration: number;
    delay: number;
    inactiveOpacity: number;
    activeScale: number;
    glowColor: string;
    rotation: number;
    blur: number;
    activeBrightness: number;
    randomSeed: number;
  };
}

export interface BuiltInEffectLayer extends BaseLayer {
  type: "built-in-effect";
  effectType: string;
  settings: Record<string, number | string | boolean>;
}

export type Layer =
  TextLayer | ImageLayer | ImageSequenceLayer | BuiltInEffectLayer;

export interface AssetReference {
  id: string;
  kind: "image" | "font" | "audio";
  source: "local" | "url";
  name: string;
  mimeType: string;
  size: number | null;
  url?: string;
  editorOnly?: boolean;
}

export interface SceneSettings {
  width: 1920;
  height: 1080;
  background: {
    mode: BackgroundMode;
    color: string;
    opacity: number;
    gradient: {
      color1: string;
      color2: string;
      angle: number;
      type: "linear" | "radial";
    };
    assetId?: string;
    fit: "cover" | "contain" | "stretch" | "original";
    filters: {
      brightness: number;
      contrast: number;
      saturation: number;
      blur: number;
    };
  };
}

export interface TransitionProject {
  schemaVersion: number;
  metadata: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  };
  scene: SceneSettings;
  layers: Layer[];
  assets: AssetReference[];
  timing: {
    mode: PlaybackMode;
    duration: number;
    sceneAnimation?: {
      enter: "none" | "fade" | "blur" | "zoom";
      exit: "none" | "fade" | "blur" | "zoom";
      enterDuration: number;
      exitDuration: number;
      strength: number;
      easing: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear";
    };
  };
}
