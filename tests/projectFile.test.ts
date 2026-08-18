import { describe, expect, it } from "vitest";
import { createProject } from "../src/project/defaults/createProject";
import {
  deserializeProject,
  projectFileName,
  serializeProject,
} from "../src/project/persistence/projectFile";

describe("project JSON", () => {
  it("serializes and restores a project without local assets", async () => {
    const project = createProject("Fairy transition");
    const restored = await deserializeProject(await serializeProject(project));
    expect(restored).toEqual(project);
  });

  it("creates a safe readable file name", () => {
    expect(projectFileName("  Иван: утро!  ")).toBe("иван-утро.json");
    expect(projectFileName("***")).toBe("transition.json");
  });
});
