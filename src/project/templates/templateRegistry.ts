import { createProject } from "../defaults/createProject";
import type {
  BuiltInEffectLayer,
  TextLayer,
  TransitionProject,
} from "../model/project";
import { createAnimation } from "../../renderer/animations/animationRegistry";
import {
  effectDefinition,
  type BuiltInEffectType,
} from "../../renderer/effects/effectRegistry";

const id = () => globalThis.crypto.randomUUID();

function text(
  content: string,
  color: string,
  fontFamily: string,
  fontSize = 96,
): TextLayer {
  return {
    id: id(),
    type: "text",
    name: "Главная надпись",
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 410, y: 390, width: 1100, height: 220, rotation: 0 },
    timing: { startDelay: 0.2, duration: 5.4, endAnimation: "fade" },
    animations: [],
    content,
    fontFamily,
    fontSize,
    color,
    align: "center",
    fontWeight: 700,
    italic: false,
    letterSpacing: 1,
    lineHeight: 1.1,
    textTransform: "none",
    stroke: { enabled: false, color: "#000000", width: 2, opacity: 1 },
    shadow: {
      enabled: true,
      color: "#000000",
      x: 0,
      y: 7,
      blur: 18,
      opacity: 0.55,
    },
    glows: [
      { enabled: true, color, radius: 18, opacity: 0.8 },
      { enabled: true, color, radius: 38, opacity: 0.45 },
    ],
  };
}

function effect(
  type: BuiltInEffectType,
  overrides: Record<string, number | string | boolean> = {},
): BuiltInEffectLayer {
  const definition = effectDefinition(type)!;
  return {
    id: id(),
    type: "built-in-effect",
    name: definition.title,
    visible: true,
    locked: false,
    opacity: 1,
    effectType: type,
    settings: { ...definition.defaults, ...overrides },
    transform: { x: 260, y: 190, width: 1400, height: 700, rotation: 0 },
    timing: { startDelay: 0, duration: 6, endAnimation: "fade" },
    animations: [],
  };
}

function project(
  name: string,
  colors: [string, string],
  layers: TransitionProject["layers"],
) {
  const result = createProject(name);
  result.scene.background = {
    ...result.scene.background,
    mode: "gradient",
    gradient: {
      color1: colors[0],
      color2: colors[1],
      angle: 135,
      type: "linear",
    },
  };
  result.layers = layers;
  result.timing.mode = "infinite";
  result.timing.duration = 6;
  return result;
}

export const templates = [
  {
    id: "minimal",
    title: "Minimal",
    description: "Чистый загрузчик с точками",
    colors: ["#111827", "#58eaff"],
    create: () =>
      project(
        "Minimal",
        ["#111827", "#030712"],
        [
          text("Loading...", "#ffffff", "Montserrat", 76),
          effect("dots-loader"),
        ],
      ),
  },
  {
    id: "fairy-tale",
    title: "Fairy Tale",
    description: "Золотая надпись и волшебная пыль",
    colors: ["#3d155f", "#ffd76a"],
    create: () =>
      project(
        "Fairy Tale",
        ["#35104f", "#080414"],
        [
          effect("magic-dust", {
            primaryColor: "#ffe69a",
            secondaryColor: "#ad6bff",
          }),
          text("Next morning...", "#ffe8a3", "Cinzel"),
        ],
      ),
  },
  {
    id: "neon",
    title: "Neon",
    description: "Неоновый текст и spinner",
    colors: ["#07142d", "#55e8ff"],
    create: () => {
      const title = text("READY", "#59eaff", "Unbounded", 100);
      title.animations = [createAnimation("neon-pulse")];
      return project(
        "Neon",
        ["#07142d", "#02040b"],
        [effect("neon-spinner"), title],
      );
    },
  },
  {
    id: "space",
    title: "Space",
    description: "Звёзды и космическое свечение",
    colors: ["#070b32", "#9674ff"],
    create: () =>
      project(
        "Space",
        ["#090d35", "#02030c"],
        [
          effect("neon-sparks", {
            primaryColor: "#ffffff",
            secondaryColor: "#7668ff",
            count: 55,
          }),
          text("TO THE STARS", "#cbd7ff", "Russo One", 82),
        ],
      ),
  },
  {
    id: "magic-forest",
    title: "Magic Forest",
    description: "Светлячки в изумрудном лесу",
    colors: ["#062b24", "#baff69"],
    create: () =>
      project(
        "Magic Forest",
        ["#062b24", "#020c0a"],
        [
          effect("fireflies"),
          effect("magic-dust", {
            primaryColor: "#dfff82",
            secondaryColor: "#45db9b",
            count: 24,
          }),
          text("The enchanted forest", "#e8ffc0", "Cormorant Garamond", 94),
        ],
      ),
  },
  {
    id: "treasure",
    title: "Treasure",
    description: "Золотое сияние и падающие кристаллы",
    colors: ["#4a2609", "#ffc94d"],
    create: () =>
      project(
        "Treasure",
        ["#402008", "#0e0702"],
        [
          effect("falling-objects", {
            primaryColor: "#ffd64d",
            secondaryColor: "#ff7b22",
          }),
          text("TREASURE FOUND!", "#ffe49a", "Cinzel", 86),
        ],
      ),
  },
  {
    id: "winter",
    title: "Winter",
    description: "Снежное падение и холодный свет",
    colors: ["#0b3b68", "#b9efff"],
    create: () =>
      project(
        "Winter",
        ["#0b355f", "#03101e"],
        [
          effect("falling-objects", {
            primaryColor: "#ffffff",
            secondaryColor: "#88dcff",
            size: 9,
            count: 50,
          }),
          text("Winter magic", "#dff8ff", "Playfair Display", 92),
        ],
      ),
  },
  {
    id: "arcade",
    title: "Arcade",
    description: "Glitch и яркий кибер-неон",
    colors: ["#25063b", "#ff42d0"],
    create: () => {
      const title = text("LEVEL UP", "#ff53da", "Russo One", 108);
      title.animations = [createAnimation("scanline-glitch")];
      return project(
        "Arcade",
        ["#210636", "#04020a"],
        [effect("neon-sparks"), title],
      );
    },
  },
] as const;
