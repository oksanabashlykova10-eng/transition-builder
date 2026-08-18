import { beforeEach, describe, expect, it } from "vitest";
import { createProject } from "../src/project/defaults/createProject";
import { useEditorStore } from "../src/project/store/editorStore";
import { validateAsset } from "../src/assets/AssetRepository";

describe("scene background", () => {
  beforeEach(() =>
    useEditorStore.setState({
      project: createProject(),
      selectedLayerId: null,
      past: [],
      future: [],
      transactionStart: null,
      pathDrawingLayerId: null,
    }),
  );
  it("starts transparent with export-safe defaults", () =>
    expect(useEditorStore.getState().project.scene.background).toMatchObject({
      mode: "transparent",
      opacity: 1,
      fit: "cover",
      filters: { brightness: 1, contrast: 1, saturation: 1, blur: 0 },
    }));
  it("updates gradients through undoable project history", () => {
    useEditorStore
      .getState()
      .updateBackground({
        mode: "gradient",
        gradient: {
          color1: "#ff0000",
          color2: "#0000ff",
          angle: 45,
          type: "linear",
        },
      });
    expect(useEditorStore.getState().project.scene.background.mode).toBe(
      "gradient",
    );
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().project.scene.background.mode).toBe(
      "transparent",
    );
  });
  it("enforces the 5 MB background limit", () => {
    const allowed = new File(
        [new Uint8Array(5 * 1024 * 1024)],
        "background.webp",
        { type: "image/webp" },
      ),
      large = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.webp", {
        type: "image/webp",
      });
    expect(() => validateAsset(allowed, "background-image")).not.toThrow();
    expect(() => validateAsset(large, "background-image")).toThrow(/5.0 МБ/);
  });
});
