import { beforeEach, describe, expect, it } from "vitest";
import { exportHtml } from "../src/export/htmlExporter";
import {
  effectDefinitions,
  effectSeeds,
} from "../src/renderer/effects/effectRegistry";
import { useEditorStore } from "../src/project/store/editorStore";

describe("built-in effects", () => {
  beforeEach(() => useEditorStore.getState().newProject());

  it("provides all seven effects required for the first version", () => {
    expect(effectDefinitions.map((effect) => effect.type)).toEqual([
      "neon-spinner",
      "neon-sparks",
      "flying-spark",
      "magic-dust",
      "falling-objects",
      "fireflies",
      "dots-loader",
    ]);
  });

  it("limits particle DOM size and exports effect settings", async () => {
    expect(effectSeeds(200)).toHaveLength(80);
    useEditorStore.getState().addBuiltInEffect("fireflies");
    const layer = useEditorStore.getState().project.layers[0];
    expect(layer.type).toBe("built-in-effect");
    const html = await exportHtml(useEditorStore.getState().project);
    expect(html).toContain("tb-effect-fireflies");
    expect(html).toContain("--effect-primary:#eaff74");
  });
});
