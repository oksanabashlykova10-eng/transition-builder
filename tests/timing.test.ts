import { describe, expect, it } from "vitest";
import { createProject } from "../src/project/defaults/createProject";
import { exportHtml } from "../src/export/htmlExporter";
import {
  layerTimingAnimationCss,
  sceneTimingCss,
} from "../src/renderer/timing/sceneTiming";
import { useEditorStore } from "../src/project/store/editorStore";

describe("scene and layer timing", () => {
  it("builds a finite scene cycle with configured blur strength", () => {
    const timing = createProject().timing;
    timing.mode = "fixed";
    timing.sceneAnimation = {
      enter: "blur",
      exit: "zoom",
      enterDuration: 1,
      exitDuration: 2,
      strength: 24,
      easing: "ease-out",
    };
    const result = sceneTimingCss(timing);
    expect(result.css).toContain("blur(24px)");
    expect(result.style.animationIterationCount).toBe("1");
    expect(result.style.animationTimingFunction).toBe("ease-out");
  });

  it("exports the selected end animation of a layer", async () => {
    useEditorStore.getState().newProject();
    useEditorStore.getState().addTextLayer();
    const layer = useEditorStore.getState().project.layers[0];
    useEditorStore.getState().updateLayer(layer.id, {
      timing: { ...layer.timing, endAnimation: "blur" },
    });
    const html = await exportHtml(useEditorStore.getState().project);
    expect(html).toContain("blur(18px)");
    expect(html).toContain("animation-iteration-count:infinite");
    expect(html).toContain("tb-scene-cycle");
  });

  it("synchronizes every layer with the global infinite cycle", () => {
    const project = createProject();
    project.timing.duration = 8;
    project.timing.mode = "infinite";
    const result = layerTimingAnimationCss(
      { startDelay: 2, duration: 4, endAnimation: "fade" },
      project.timing,
      "test-life",
    );
    expect(result.style.animationDuration).toBe("8s");
    expect(result.style.animationIterationCount).toBe("infinite");
    expect(result.css).toContain("25%");
    expect(result.css).toContain("75%");
  });
});
