import {
  SCENE_HEIGHT,
  SCENE_WIDTH,
  type Transform,
} from "../../project/model/project";

export interface SnapOptions {
  gridEnabled: boolean;
  gridSize: number;
  snappingEnabled: boolean;
  threshold?: number;
}

function nearest(value: number, targets: number[], threshold: number) {
  const target = targets.reduce((best, item) =>
    Math.abs(item - value) < Math.abs(best - value) ? item : best,
  );
  return Math.abs(target - value) <= threshold ? target : value;
}

export function snapDraggedTransform(
  transform: Transform,
  options: SnapOptions,
): Transform {
  let { x, y } = transform;
  if (options.gridEnabled) {
    x = Math.round(x / options.gridSize) * options.gridSize;
    y = Math.round(y / options.gridSize) * options.gridSize;
  }
  if (options.snappingEnabled) {
    const threshold = options.threshold ?? 12;
    x = nearest(
      x,
      [0, (SCENE_WIDTH - transform.width) / 2, SCENE_WIDTH - transform.width],
      threshold,
    );
    y = nearest(
      y,
      [
        0,
        (SCENE_HEIGHT - transform.height) / 2,
        SCENE_HEIGHT - transform.height,
      ],
      threshold,
    );
  }
  return { ...transform, x, y };
}
