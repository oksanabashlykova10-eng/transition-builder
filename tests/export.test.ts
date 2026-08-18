import { beforeEach, describe, expect, it } from "vitest";
import { exportHtml, iframeCode } from "../src/export/htmlExporter";
import { useEditorStore } from "../src/project/store/editorStore";

describe("autonomous export", () => {
  beforeEach(() => useEditorStore.getState().newProject());

  it("creates a complete transparent standalone document", async () => {
    useEditorStore.getState().addTextLayer();
    const html = await exportHtml(useEditorStore.getState().project);
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("background:transparent");
    expect(html).toContain("Next morning...");
    expect(html).not.toContain("tb-light-sweep-position");
  });

  it("exports background filters independently from layer opacity", async () => {
    const project = useEditorStore.getState().project;
    project.scene.background.filters = {
      brightness: 0.8,
      contrast: 1.2,
      saturation: 0.7,
      blur: 6,
    };
    const html = await exportHtml(project);
    expect(html).toContain(
      "filter:brightness(0.8) contrast(1.2) saturate(0.7) blur(6px)",
    );
    expect(html).toContain('class="scene-bg"');
  });

  it("includes advanced CSS only when that animation is used", async () => {
    useEditorStore.getState().addTextLayer();
    const layer = useEditorStore.getState().project.layers[0];
    useEditorStore.getState().updateLayer(layer.id, {
      animations: [
        {
          id: "sweep",
          type: "light-sweep",
          enabled: true,
          settings: { duration: 2, direction: "left-to-right" },
        },
      ],
    });
    const html = await exportHtml(useEditorStore.getState().project);
    expect(html).toContain("tb-effect-light-sweep");
    expect(iframeCode(html)).toContain("charset=&quot;utf-8&quot;");
  });
});
