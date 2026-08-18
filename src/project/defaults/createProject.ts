import {
  CURRENT_SCHEMA_VERSION,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  type TransitionProject,
} from "../model/project";

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ?? `project-${Date.now()}`;

export function createProject(name = "Новый переход"): TransitionProject {
  const timestamp = new Date().toISOString();

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    metadata: {
      id: makeId(),
      name,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    scene: {
      width: SCENE_WIDTH,
      height: SCENE_HEIGHT,
      background: {
        mode: "transparent",
        color: "#000000",
        opacity: 1,
        gradient: {
          color1: "#241052",
          color2: "#07152f",
          angle: 135,
          type: "linear",
        },
        fit: "cover",
        filters: { brightness: 1, contrast: 1, saturation: 1, blur: 0 },
      },
    },
    layers: [],
    assets: [],
    timing: {
      mode: "infinite",
      duration: 6,
      sceneAnimation: {
        enter: "fade",
        exit: "fade",
        enterDuration: 0.7,
        exitDuration: 0.7,
        strength: 18,
        easing: "ease-in-out",
      },
    },
  };
}
