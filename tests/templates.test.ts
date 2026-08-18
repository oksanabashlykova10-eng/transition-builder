import { describe, expect, it } from "vitest";
import { exportHtml } from "../src/export/htmlExporter";
import { validateProject } from "../src/project/validation/validateProject";
import { templates } from "../src/project/templates/templateRegistry";

describe("starter templates", () => {
  it("provides eight independently editable valid projects", () => {
    expect(templates).toHaveLength(8);
    for (const template of templates) {
      const project = template.create();
      expect(validateProject(project).valid).toBe(true);
      expect(project.layers.length).toBeGreaterThan(0);
      expect(new Set(project.layers.map((layer) => layer.id)).size).toBe(
        project.layers.length,
      );
    }
  });

  it("exports a composed neon template", async () => {
    const neon = templates.find((template) => template.id === "neon")!;
    const html = await exportHtml(neon.create());
    expect(html).toContain("READY");
    expect(html).toContain("tb-effect-neon-spinner");
    expect(html).toContain("tb-effect-neon-pulse");
  });
});
