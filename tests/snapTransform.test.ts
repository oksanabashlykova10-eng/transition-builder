import { describe, expect, it } from "vitest";
import { snapDraggedTransform } from "../src/editor/scene/snapTransform";

const base = { x: 117, y: 83, width: 400, height: 200, rotation: 0 };

describe("scene snapping", () => {
  it("snaps position to the chosen grid", () => {
    expect(
      snapDraggedTransform(base, {
        gridEnabled: true,
        gridSize: 20,
        snappingEnabled: false,
      }),
    ).toMatchObject({ x: 120, y: 80 });
  });

  it("snaps object centers to the scene center", () => {
    expect(
      snapDraggedTransform(
        { ...base, x: 755, y: 437 },
        { gridEnabled: false, gridSize: 20, snappingEnabled: true },
      ),
    ).toMatchObject({ x: 760, y: 440 });
  });

  it("does not alter a distant free position", () => {
    expect(
      snapDraggedTransform(base, {
        gridEnabled: false,
        gridSize: 20,
        snappingEnabled: true,
      }),
    ).toEqual(base);
  });
});
