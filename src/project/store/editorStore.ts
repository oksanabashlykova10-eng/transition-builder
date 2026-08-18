import { create } from "zustand";
import { createProject } from "../defaults/createProject";
import type {
  Layer,
  TextLayer,
  TransitionProject,
  Transform,
} from "../model/project";
import { SCENE_HEIGHT, SCENE_WIDTH } from "../model/project";
import {
  effectDefinition,
  type BuiltInEffectType,
} from "../../renderer/effects/effectRegistry";

type Snapshot = TransitionProject;
interface EditorState {
  project: TransitionProject;
  selectedLayerId: string | null;
  past: Snapshot[];
  future: Snapshot[];
  transactionStart: Snapshot | null;
  pathDrawingLayerId: string | null;
  gridEnabled: boolean;
  gridSize: 10 | 20 | 50;
  showSafeArea: boolean;
  snappingEnabled: boolean;
  addTextLayer(): void;
  addImageLayer(): void;
  addImageSequenceLayer(): void;
  addBuiltInEffect(type: BuiltInEffectType): void;
  selectLayer(id: string | null): void;
  updateLayer(id: string, patch: Partial<Layer>): void;
  updateTransformLive(id: string, transform: Transform): void;
  beginTransaction(): void;
  commitTransaction(): void;
  deleteSelected(): void;
  duplicateSelected(): void;
  toggleVisible(id: string): void;
  toggleLocked(id: string): void;
  moveLayer(id: string, direction: "up" | "down"): void;
  nudgeSelected(dx: number, dy: number): void;
  undo(): void;
  redo(): void;
  addAsset(asset: import("../model/project").AssetReference): void;
  updateTiming(patch: Partial<TransitionProject["timing"]>): void;
  updateLayerLive(id: string, patch: Partial<Layer>): void;
  setPathDrawing(id: string | null): void;
  updateBackground(
    patch: Partial<TransitionProject["scene"]["background"]>,
  ): void;
  setGrid(enabled: boolean): void;
  setGridSize(size: 10 | 20 | 50): void;
  setSafeArea(enabled: boolean): void;
  setSnapping(enabled: boolean): void;
  alignSelected(
    action: "horizontal" | "vertical" | "reset-size" | "reset-rotation",
  ): void;
  loadProject(project: TransitionProject): void;
  newProject(): void;
}
const clone = (project: TransitionProject) => structuredClone(project);
const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `layer-${Date.now()}-${Math.random()}`;
const touched = (project: TransitionProject) => ({
  ...project,
  metadata: { ...project.metadata, updatedAt: new Date().toISOString() },
});
const newText = (index: number): TextLayer => ({
  id: newId(),
  type: "text",
  name: `Надпись ${index + 1}`,
  visible: true,
  locked: false,
  opacity: 1,
  transform: { x: 610, y: 390, width: 700, height: 180, rotation: 0 },
  timing: { startDelay: 0, duration: 6, endAnimation: "none" },
  animations: [],
  content: "Next morning...",
  fontFamily: "Cinzel",
  fontSize: 92,
  color: "#ffffff",
  align: "center",
  fontWeight: 700,
  italic: false,
  letterSpacing: 0,
  lineHeight: 1.08,
  textTransform: "none",
  stroke: { enabled: false, color: "#000000", width: 2, opacity: 1 },
  shadow: {
    enabled: true,
    color: "#000000",
    x: 0,
    y: 8,
    blur: 18,
    opacity: 0.55,
  },
  glows: [
    { enabled: false, color: "#a66cff", radius: 18, opacity: 0.8 },
    { enabled: false, color: "#56ddff", radius: 35, opacity: 0.5 },
  ],
});
const history = (state: EditorState, project: TransitionProject) => ({
  project: touched(project),
  past: [...state.past.slice(-49), clone(state.project)],
  future: [],
});

export const useEditorStore = create<EditorState>((set, get) => ({
  project: createProject(),
  selectedLayerId: null,
  past: [],
  future: [],
  transactionStart: null,
  pathDrawingLayerId: null,
  gridEnabled: false,
  gridSize: 20,
  showSafeArea: true,
  snappingEnabled: true,
  addTextLayer: () =>
    set((state) => {
      const layer = newText(state.project.layers.length);
      return {
        ...history(state, {
          ...state.project,
          layers: [...state.project.layers, layer],
        }),
        selectedLayerId: layer.id,
      };
    }),
  addImageLayer: () =>
    set((state) => {
      const layer: Layer = {
        id: newId(),
        type: "image",
        name: `Картинка ${state.project.layers.length + 1}`,
        visible: true,
        locked: false,
        opacity: 1,
        assetId: "",
        preserveAspectRatio: true,
        transform: { x: 760, y: 340, width: 400, height: 400, rotation: 0 },
        timing: { startDelay: 0, duration: 6, endAnimation: "none" },
        animations: [],
      };
      return {
        ...history(state, {
          ...state.project,
          layers: [...state.project.layers, layer],
        }),
        selectedLayerId: layer.id,
      };
    }),
  addImageSequenceLayer: () =>
    set((state) => {
      const layer: Layer = {
        id: newId(),
        type: "image-sequence",
        name: `Бегущие картинки ${state.project.layers.length + 1}`,
        visible: true,
        locked: false,
        opacity: 1,
        assetIds: [],
        repeatCount: 7,
        spacing: 38,
        imageSize: 110,
        pathType: "line",
        pathSettings: {
          amplitude: 130,
          frequency: 2,
          arcHeight: 180,
          customPoints: [],
          smooth: 45,
          reverse: false,
          closed: false,
          showPath: true,
        },
        wave: {
          type: "light-wave",
          duration: 3.3,
          delay: 0.18,
          inactiveOpacity: 0.15,
          activeScale: 1.12,
          glowColor: "#ffbe28",
          rotation: 25,
          blur: 8,
          activeBrightness: 1.15,
          randomSeed: 37,
        },
        transform: { x: 260, y: 390, width: 1400, height: 300, rotation: 0 },
        timing: { startDelay: 0, duration: 6, endAnimation: "none" },
        animations: [],
      };
      return {
        ...history(state, {
          ...state.project,
          layers: [...state.project.layers, layer],
        }),
        selectedLayerId: layer.id,
      };
    }),
  addBuiltInEffect: (type) =>
    set((state) => {
      const definition = effectDefinition(type);
      if (!definition) return state;
      const layer: Layer = {
        id: newId(),
        type: "built-in-effect",
        name: definition.title,
        visible: true,
        locked: false,
        opacity: 1,
        effectType: type,
        settings: { ...definition.defaults },
        transform: { x: 610, y: 290, width: 700, height: 500, rotation: 0 },
        timing: { startDelay: 0, duration: 6, endAnimation: "none" },
        animations: [],
      };
      return {
        ...history(state, {
          ...state.project,
          layers: [...state.project.layers, layer],
        }),
        selectedLayerId: layer.id,
      };
    }),
  selectLayer: (id) => set({ selectedLayerId: id }),
  updateLayer: (id, patch) =>
    set((state) =>
      history(state, {
        ...state.project,
        layers: state.project.layers.map((layer) =>
          layer.id === id ? ({ ...layer, ...patch } as Layer) : layer,
        ),
      }),
    ),
  updateTransformLive: (id, transform) =>
    set((state) => ({
      project: {
        ...state.project,
        layers: state.project.layers.map((layer) =>
          layer.id === id ? { ...layer, transform } : layer,
        ),
      },
    })),
  updateLayerLive: (id, patch) =>
    set((state) => ({
      project: {
        ...state.project,
        layers: state.project.layers.map((layer) =>
          layer.id === id ? ({ ...layer, ...patch } as Layer) : layer,
        ),
      },
    })),
  setPathDrawing: (id) => set({ pathDrawingLayerId: id }),
  beginTransaction: () =>
    set((state) =>
      state.transactionStart
        ? state
        : { transactionStart: clone(state.project) },
    ),
  commitTransaction: () =>
    set((state) => {
      if (!state.transactionStart) return state;
      if (
        JSON.stringify(state.transactionStart.layers) ===
        JSON.stringify(state.project.layers)
      )
        return { transactionStart: null };
      return {
        project: touched(state.project),
        past: [...state.past.slice(-49), state.transactionStart],
        future: [],
        transactionStart: null,
      };
    }),
  deleteSelected: () =>
    set((state) => {
      if (!state.selectedLayerId) return state;
      const selected = state.project.layers.find(
        (layer) => layer.id === state.selectedLayerId,
      );
      if (selected?.locked) return state;
      return {
        ...history(state, {
          ...state.project,
          layers: state.project.layers.filter(
            (layer) => layer.id !== state.selectedLayerId,
          ),
        }),
        selectedLayerId: null,
      };
    }),
  duplicateSelected: () =>
    set((state) => {
      const source = state.project.layers.find(
        (layer) => layer.id === state.selectedLayerId,
      );
      if (!source) return state;
      const copy = clone({ ...state.project, layers: [source] }).layers[0];
      copy.id = newId();
      copy.name = `${source.name} — копия`;
      copy.transform = {
        ...copy.transform,
        x: copy.transform.x + 30,
        y: copy.transform.y + 30,
      };
      return {
        ...history(state, {
          ...state.project,
          layers: [...state.project.layers, copy],
        }),
        selectedLayerId: copy.id,
      };
    }),
  toggleVisible: (id) => {
    const layer = get().project.layers.find((item) => item.id === id);
    if (layer) get().updateLayer(id, { visible: !layer.visible });
  },
  toggleLocked: (id) => {
    const layer = get().project.layers.find((item) => item.id === id);
    if (layer) get().updateLayer(id, { locked: !layer.locked });
  },
  moveLayer: (id, direction) =>
    set((state) => {
      const layers = [...state.project.layers],
        index = layers.findIndex((layer) => layer.id === id),
        target = direction === "up" ? index + 1 : index - 1;
      if (index < 0 || target < 0 || target >= layers.length) return state;
      [layers[index], layers[target]] = [layers[target], layers[index]];
      return history(state, { ...state.project, layers });
    }),
  nudgeSelected: (dx, dy) =>
    set((state) => {
      const id = state.selectedLayerId,
        layer = state.project.layers.find((item) => item.id === id);
      if (!id || !layer || layer.locked) return state;
      const transform = {
        ...layer.transform,
        x: layer.transform.x + dx,
        y: layer.transform.y + dy,
      };
      return history(state, {
        ...state.project,
        layers: state.project.layers.map((item) =>
          item.id === id ? { ...item, transform } : item,
        ),
      });
    }),
  undo: () =>
    set((state) => {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return {
        project: previous,
        past: state.past.slice(0, -1),
        future: [clone(state.project), ...state.future],
        transactionStart: null,
      };
    }),
  redo: () =>
    set((state) => {
      const next = state.future[0];
      if (!next) return state;
      return {
        project: next,
        past: [...state.past.slice(-49), clone(state.project)],
        future: state.future.slice(1),
        transactionStart: null,
      };
    }),
  addAsset: (asset) =>
    set((state) =>
      history(state, {
        ...state.project,
        assets: [
          ...state.project.assets.filter((item) => item.id !== asset.id),
          asset,
        ],
      }),
    ),
  updateTiming: (patch) =>
    set((state) =>
      history(state, {
        ...state.project,
        timing: { ...state.project.timing, ...patch },
      }),
    ),
  updateBackground: (patch) =>
    set((state) =>
      history(state, {
        ...state.project,
        scene: {
          ...state.project.scene,
          background: { ...state.project.scene.background, ...patch },
        },
      }),
    ),
  setGrid: (gridEnabled) => set({ gridEnabled }),
  setGridSize: (gridSize) => set({ gridSize }),
  setSafeArea: (showSafeArea) => set({ showSafeArea }),
  setSnapping: (snappingEnabled) => set({ snappingEnabled }),
  alignSelected: (action) =>
    set((state) => {
      const layer = state.project.layers.find(
        (item) => item.id === state.selectedLayerId,
      );
      if (!layer) return state;
      const transform = { ...layer.transform };
      if (action === "horizontal")
        transform.x = (SCENE_WIDTH - transform.width) / 2;
      if (action === "vertical")
        transform.y = (SCENE_HEIGHT - transform.height) / 2;
      if (action === "reset-rotation") transform.rotation = 0;
      if (action === "reset-size") {
        const size =
          layer.type === "text"
            ? { width: 700, height: 180 }
            : layer.type === "image-sequence"
              ? { width: 1400, height: 300 }
              : { width: 400, height: 400 };
        Object.assign(transform, size);
      }
      return history(state, {
        ...state.project,
        layers: state.project.layers.map((item) =>
          item.id === layer.id ? { ...item, transform } : item,
        ),
      });
    }),
  loadProject: (project) =>
    set({
      project: clone(project),
      selectedLayerId: null,
      past: [],
      future: [],
      transactionStart: null,
      pathDrawingLayerId: null,
    }),
  newProject: () =>
    set({
      project: createProject(),
      selectedLayerId: null,
      past: [],
      future: [],
      transactionStart: null,
      pathDrawingLayerId: null,
    }),
}));
